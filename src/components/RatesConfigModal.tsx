import React, { useState } from 'react';
import { CurrencyRates } from '../types';
import { X, ArrowRightLeft, Check, RefreshCw, Database, Calendar } from 'lucide-react';
import { formatBs } from '../utils/calculations';
import { fetchLiveRates } from '../services/ratesService';

interface RatesConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  rates: CurrencyRates;
  onSaveRates: (newRates: CurrencyRates) => void;
  onLiveRatesFetched?: () => void;
}

export const RatesConfigModal: React.FC<RatesConfigModalProps> = ({
  isOpen,
  onClose,
  rates,
  onSaveRates,
  onLiveRatesFetched,
}) => {
  const [bcvRateInput, setBcvRateInput] = useState<string>(rates.bcvRate.toString());
  const [binanceUsdtRateInput, setBinanceUsdtRateInput] = useState<string>(rates.binanceUsdtRate.toString());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const bcv = parseFloat(bcvRateInput) || 0;
  const usdt = parseFloat(binanceUsdtRateInput) || 0;
  const spread = bcv > 0 ? (((usdt - bcv) / bcv) * 100).toFixed(2) : '0.00';

  const handleFetchFromSources = async () => {
    setIsFetchingLive(true);
    setFetchStatus(null);
    try {
      const data = await fetchLiveRates(true);
      if (data && (data.bcv || data.sale)) {
        if (data.bcv?.rate) {
          setBcvRateInput(data.bcv.rate.toString());
        }
        if (data.sale?.rate) {
          setBinanceUsdtRateInput(data.sale.rate.toString());
        }
        setFetchStatus(
          `Sincronizado con éxito (${data.bcv?.source || 'Supabase'} + Cotizave)`
        );
        if (onLiveRatesFetched) {
          onLiveRatesFetched();
        }
      } else {
        setFetchStatus('No se obtuvieron tasas. Verifica tu conexión.');
      }
    } catch (e) {
      setFetchStatus('Error al consultar servicios de tasas.');
    } finally {
      setIsFetchingLive(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bcv <= 0 || usdt <= 0) return;

    onSaveRates({
      ...rates,
      bcvRate: bcv,
      binanceUsdtRate: usdt,
      lastUpdated: new Date().toISOString(),
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Configuración de Tasas</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">BCV (Supabase) y Binance USDT (Cotizave)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Sincronización automática botón */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-xs">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Supabase DB + Cotizave</span>
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                {fetchStatus || 'Carga las tasas oficiales y de mercado'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleFetchFromSources}
              disabled={isFetchingLive}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30 text-xs font-semibold cursor-pointer disabled:opacity-50 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingLive ? 'animate-spin' : ''}`} />
              <span>{isFetchingLive ? 'Consultando...' : 'Obtener En Vivo'}</span>
            </button>
          </div>

          {/* Tasa BCV */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Tasa Oficial BCV ($ / Bs.)
              </label>
              {rates.bcvIsTomorrow && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 px-1.5 py-0.2 rounded">
                  <Calendar className="w-2.5 h-2.5" />
                  <span>Mañana {rates.bcvEffectiveDateFormatted ? `(${rates.bcvEffectiveDateFormatted})` : ''}</span>
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm font-mono">Bs.</span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={bcvRateInput}
                onChange={(e) => setBcvRateInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-emerald-500/40 rounded-xl pl-11 pr-4 py-2 text-emerald-800 dark:text-emerald-300 font-mono text-sm font-bold focus:outline-hidden focus:border-emerald-400"
                placeholder="Ej: 78.50"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Zoom factura el flete de importación en dólares a la tasa oficial del BCV.
            </p>
          </div>

          {/* Tasa Binance USDT */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Tasa Binance P2P (USDT / Bs.)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm font-mono">Bs.</span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={binanceUsdtRateInput}
                onChange={(e) => setBinanceUsdtRateInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-amber-500/40 rounded-xl pl-11 pr-4 py-2 text-amber-800 dark:text-amber-300 font-mono text-sm font-bold focus:outline-hidden focus:border-amber-400"
                placeholder="Ej: 88.90"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tasa para compra de teléfonos en eBay y cálculo de ganancias reales.
            </p>
          </div>

          {/* Brecha / Diferencial Cambiario Preview */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs shadow-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Brecha Cambiaria:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">+{spread}%</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Ejemplo Flete Zoom $20 BCV:</span>
              <span className="text-slate-700 dark:text-slate-300 font-mono">
                {formatBs(20 * bcv)} = <span className="text-emerald-600 dark:text-emerald-400 font-bold">${((20 * bcv) / (usdt || 1)).toFixed(2)} USDT</span>
              </span>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saveSuccess}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Aplicar Tasas</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
