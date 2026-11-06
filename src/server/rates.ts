import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

// Configuración por defecto (o mediante process.env)
const DEFAULT_SUPABASE_URL = process.env.SUPABASE_URL || 'https://jkzsajxrxcnrwaqsskcs.supabase.co';
const DEFAULT_SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
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

    // 2. Cotizave para P2P (Binance, Paralelo)
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

        const binanceRate = binanceRateObj?.mid || binanceRateObj?.ask || 0;
        const paraleloRate = parallelRateObj?.mid || 0;
        const bcvApiRate = bcvApiObj?.mid || 0;

        const combinedData = {
          success: true,
          source: supabaseBcv ? 'Supabase + Cotizave' : 'Cotizave',
          supabase_connected: !!supabaseBcv,
          fetched_at: new Date().toISOString(),
          rates: {
            bcv: supabaseBcv || {
              rate: bcvApiRate,
              source: 'BCV Oficial (Cotizave)',
              updated_at: bcvApiObj?.updated_at || new Date().toISOString(),
              effective_date: bcvApiObj?.effective_date || null,
              from_supabase: false
            },
            paralelo: { rate: paraleloRate, updated_at: parallelRateObj?.updated_at },
            binance: {
              rate: binanceRate,
              ask: binanceRateObj?.ask,
              bid: binanceRateObj?.bid,
              updated_at: binanceRateObj?.updated_at
            }
          }
        };

        ratesCache = { timestamp: now, data: combinedData };
        return res.json(combinedData);
      }
    } catch (e) {
      console.warn('Fallo al conectar con Cotizave, usando datos locales/Supabase:', e);
    }

    // Fallback si Cotizave falla
    if (supabaseBcv) {
      return res.json({
        success: true,
        source: 'Supabase',
        rates: { bcv: supabaseBcv, paralelo: { rate: 0 }, binance: { rate: 0 } }
      });
    }

    res.status(500).json({ error: 'No se pudieron obtener las tasas' });
  });
}
