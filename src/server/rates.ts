import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

// Configuración por defecto (o mediante process.env)
const DEFAULT_SUPABASE_URL = process.env.SUPABASE_URL || 'https://jkzsajxrxcnrwaqsskcs.supabase.co';
const DEFAULT_SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_9aWH_-Kngvu75coxx59G9g_iV0BS4g2';
const COTIZAVE_API_URL = 'https://api.cotizave.com/v1/fx/rates';
const DEFAULT_COTIZAVE_KEY = process.env.COTIZAVE_API_KEY || '';

// Caché en memoria (1 minuto) para no saturar APIs ni créditos
let ratesCache: { timestamp: number; data: any } | null = null;
const CACHE_TTL_MS = 60 * 1000;

// Función para obtener BCV desde tu Supabase (tabla tasas_bcv)
async function getBcvFromSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;
  const supabaseKey = (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim() || DEFAULT_SUPABASE_KEY;

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('tasas_bcv')
      .select('id, moneda, tasa, fecha_valor, created_at')
      .order('id', { ascending: false })
      .limit(5);

    if (!error && Array.isArray(data) && data.length > 0) {
      const usdRow = data.find((r: any) => !r.moneda || r.moneda.toUpperCase() === 'USD') || data[0];
      const rateVal = parseFloat(usdRow.tasa);
      if (!isNaN(rateVal) && rateVal > 0) {
        return {
          rate: rateVal,
          effective_date: usdRow.fecha_valor || null,
          updated_at: usdRow.created_at || new Date().toISOString(),
          source: 'Supabase DB (tasas_bcv)',
          from_supabase: true
        };
      }
    } else if (error) {
      console.warn('Advertencia consultando tabla tasas_bcv en Supabase:', error.message);
    }
  } catch (err) {
    console.error('Error al consultar Supabase:', err);
  }
  return null;
}

// Función para obtener tasa de Binance P2P directamente
async function getBinanceP2pRate(): Promise<number | null> {
  try {
    const res = await fetch('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      body: JSON.stringify({
        page: 1,
        rows: 5,
        payTypes: [],
        countries: [],
        publisherType: null,
        asset: 'USDT',
        fiat: 'VES',
        tradeType: 'SELL'
      })
    });

    if (res.ok) {
      const data: any = await res.json();
      const ads = data?.data || [];
      const prices: number[] = ads
        .map((item: any) => parseFloat(item?.adv?.price))
        .filter((price: number) => !isNaN(price) && price > 0);

      if (prices.length > 0) {
        // Promedio de las primeras mejores ofertas
        const sum = prices.reduce((acc, p) => acc + p, 0);
        return parseFloat((sum / prices.length).toFixed(2));
      }
    }
  } catch (err) {
    console.warn('Error consultando Binance P2P directo:', err);
  }
  return null;
}

// Función de respaldo con DolarApi Venezuela
async function getDolarApiRates() {
  try {
    const res = await fetch('https://ve.dolarapi.com/v1/dolares');
    if (res.ok) {
      const list: any[] = await res.json();
      const oficial = list.find(d => d.fuente === 'oficial')?.promedio || 0;
      const paralelo = list.find(d => d.fuente === 'paralelo')?.promedio || 0;
      return { oficial, paralelo };
    }
  } catch (err) {
    console.warn('Error consultando DolarApi:', err);
  }
  return null;
}

// Endpoint unificado para el frontend
export function setupRatesRoutes(app: express.Express) {
  app.get('/api/rates', async (req: Request, res: Response) => {
    const forceRefresh = req.query.refresh === 'true';
    const now = Date.now();

    if (!forceRefresh && ratesCache && now - ratesCache.timestamp < CACHE_TTL_MS) {
      return res.json({ ...ratesCache.data, cached: true });
    }

    // 1. Prioridad: Supabase para BCV
    const supabaseBcv = await getBcvFromSupabase();

    // 2. Obtener Binance P2P directamente desde Binance
    const binanceDirectRate = await getBinanceP2pRate();

    // 3. Obtener Cotizave o DolarApi como respaldo
    let cotizaveBinance = 0;
    let cotizaveParalelo = 0;
    let cotizaveBcv = 0;

    const apiKey = process.env.COTIZAVE_API_KEY || DEFAULT_COTIZAVE_KEY;
    try {
      const response = await fetch(COTIZAVE_API_URL, {
        headers: { 'X-API-Key': apiKey, 'Accept': 'application/json' }
      });

      if (response.ok) {
        const rawData = await response.json();
        const ratesList: any[] = Array.isArray(rawData.rates) ? rawData.rates : [];
        const binanceRateObj = ratesList.find(r => r.market === 'binance');
        const parallelRateObj = ratesList.find(r => r.market === 'parallel');
        const bcvApiObj = ratesList.find(r => r.market === 'reference' && r.base === 'USD');

        cotizaveBinance = binanceRateObj?.mid || binanceRateObj?.ask || 0;
        cotizaveParalelo = parallelRateObj?.mid || 0;
        cotizaveBcv = bcvApiObj?.mid || 0;
      }
    } catch (e) {
      // Cotizave bloqueado por Cloudflare
    }

    // Si Cotizave falló para paralelo / respaldo, usar DolarApi
    let fallbackApi = null;
    if (!binanceDirectRate && !cotizaveBinance) {
      fallbackApi = await getDolarApiRates();
    }

    const finalBinance = binanceDirectRate || cotizaveBinance || fallbackApi?.paralelo || 0;
    const finalParalelo = cotizaveParalelo || fallbackApi?.paralelo || finalBinance;
    const finalBcvRate = supabaseBcv?.rate || cotizaveBcv || fallbackApi?.oficial || 0;

    const finalBcv = supabaseBcv || {
      rate: finalBcvRate,
      source: 'BCV Oficial',
      updated_at: new Date().toISOString(),
      effective_date: null,
      from_supabase: false
    };

    const combinedData = {
      success: true,
      source: supabaseBcv ? 'Supabase (BCV) + Binance P2P' : 'Binance P2P / DolarApi',
      supabase_connected: !!supabaseBcv,
      fetched_at: new Date().toISOString(),
      rates: {
        bcv: finalBcv,
        paralelo: { rate: finalParalelo, updated_at: new Date().toISOString() },
        binance: {
          rate: finalBinance,
          source: binanceDirectRate ? 'Binance P2P Oficial' : 'Cotizave / DolarApi',
          updated_at: new Date().toISOString()
        }
      }
    };

    ratesCache = { timestamp: now, data: combinedData };
    return res.json(combinedData);
  });
}
