import React from 'react';
import { Building2, TrendingUp, RefreshCw, Calendar, Zap, Database, Check } from 'lucide-react';

interface RatesBarProps {
  bcvRate: number;
  saleRate: number;
  bcvEffectiveDate?: string;
  bcvEffectiveDateFormatted?: string;
  bcvIsTomorrow?: boolean;
  source?: string;
  isLoading: boolean;
  lastSyncedMessage?: string;
  onUpdateBcv: (val: number) => void;
  onUpdateSale: (val: number) => void;
  onRefreshAll: () => void;
  onSyncAll?: () => void;
}

export const RatesBar: React.FC<RatesBarProps> = ({
  bcvRate,
  saleRate,
  bcvEffectiveDateFormatted,
  bcvIsTomorrow,
  source,
  isLoading,
  lastSyncedMessage,
  onUpdateBcv,
  onUpdateSale,
  onRefreshAll,
  onSyncAll,
}) => {
  const spreadPct = bcvRate > 0 ? (((saleRate - bcvRate) / bcvRate) * 100).toFixed(1) : '0.0';

  return (
    <div className="bg-white/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-1.5 shadow-xs text-xs select-none transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        
        {/* Tasas en línea interactiva */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          
          {/* Tasa BCV (Desde Supabase o Cotizave) */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/90 px-2.5 py-1 rounded-lg border border-emerald-500/30 shadow-xs">
            <Building2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
              BCV (Zoom):
            </span>
            <div className="relative flex items-center">
              <input
                type="number"
                value={bcvRate || ''}
                onChange={(e) => onUpdateBcv(parseFloat(e.target.value) || 0)}
                className="w-20 sm:w-24 bg-white dark:bg-slate-950 border border-emerald-500/40 rounded-md py-0.5 pl-1.5 pr-6 text-emerald-700 dark:text-emerald-300 font-bold font-mono text-xs focus:outline-hidden focus:border-emerald-400 h-6.5 shadow-xs"
                step="any"
                title="Tasa oficial BCV utilizada para cotizar flete de Zoom"
              />
              <span className="absolute right-1 text-[9px] font-mono text-slate-500 dark:text-slate-400">Bs</span>
            </div>

            {bcvIsTomorrow && (
              <span 
                className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 px-1.5 py-0.5 rounded whitespace-nowrap animate-pulse"
                title={`Tasa valor de mañana: ${bcvEffectiveDateFormatted || ''}`}
              >
                <Calendar className="h-2.5 w-2.5 text-amber-600 dark:text-amber-400" />
                <span>Mañana {bcvEffectiveDateFormatted ? `(${bcvEffectiveDateFormatted})` : ''}</span>
              </span>
            )}
          </div>

          {/* Tasa Venta P2P (Binance USDT) */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/90 px-2.5 py-1 rounded-lg border border-amber-500/30 shadow-xs">
            <TrendingUp className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
              Binance (USDT P2P):
            </span>
            <div className="relative flex items-center">
              <input
                type="number"
                value={saleRate || ''}
                onChange={(e) => onUpdateSale(parseFloat(e.target.value) || 0)}
                className="w-20 sm:w-24 bg-white dark:bg-slate-950 border border-amber-500/40 rounded-md py-0.5 pl-1.5 pr-6 text-amber-700 dark:text-amber-300 font-bold font-mono text-xs focus:outline-hidden focus:border-amber-400 h-6.5 shadow-xs"
                step="any"
                title="Tasa de mercado P2P Binance para compra de productos en eBay"
              />
              <span className="absolute right-1 text-[9px] font-mono text-slate-500 dark:text-slate-400">Bs</span>
            </div>
          </div>

          {/* Brecha Cambiaria */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[10px]">
            <span className="text-slate-600 dark:text-slate-400">Brecha:</span>
            <span className={`font-bold ${parseFloat(spreadPct) >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {parseFloat(spreadPct) >= 0 ? '+' : ''}{spreadPct}%
            </span>
          </div>

          {/* Fuente de los datos (Supabase / Cotizave) */}
          {source && (
            <div className="hidden xl:flex items-center gap-1 text-[10px] text-slate-500 font-mono">
              <Database className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-500" />
              <span>{source}</span>
            </div>
          )}
        </div>

        {/* Botones de acción y estado */}
        <div className="flex items-center gap-2 ml-auto">
          {lastSyncedMessage && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
              <Check className="w-2.5 h-2.5" />
              {lastSyncedMessage}
            </span>
          )}

          <button
            type="button"
            onClick={onRefreshAll}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30 text-[11px] font-semibold cursor-pointer disabled:opacity-50 h-6.5 transition shadow-xs"
            title="Consultar tasas en vivo desde Supabase (tasas_bcv) y Cotizave API"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin text-sky-600 dark:text-sky-300' : ''}`} />
            <span>{isLoading ? 'Consultando...' : 'Actualizar Todo'}</span>
          </button>

          {onSyncAll && (
            <button
              type="button"
              onClick={onSyncAll}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[11px] font-medium cursor-pointer h-6.5 transition"
              title="Abrir panel completo de configuración y calculadora de tasas"
            >
              <Zap className="h-3 w-3 text-amber-500 dark:text-amber-400" />
              <span className="hidden sm:inline">Ajustes</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
