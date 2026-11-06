import React from 'react';
import { FinancialSummary, CurrencyRates, PhoneItem } from '../types';
import { 
  TrendingUp, 
  Package, 
  Plane, 
  Store, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Coins, 
  ShoppingBag,
  Truck,
  Zap,
  Timer,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import { formatUsdt, formatBs, formatBcv, calculateInventoryCycleSummary } from '../utils/calculations';

interface KpiOverviewProps {
  summary: FinancialSummary;
  rates: CurrencyRates;
  currencyView: 'USDT' | 'BS' | 'DUAL';
  allPhones?: PhoneItem[];
  onFilterByStatus?: (filter: string) => void;
}

export const KpiOverview: React.FC<KpiOverviewProps> = ({
  summary,
  rates,
  currencyView,
  allPhones = [],
  onFilterByStatus,
}) => {
  // Cycle metrics
  const cycleSummary = calculateInventoryCycleSummary(allPhones);

  // Helpers to display based on currencyView
  const renderAmount = (amountUsdt: number) => {
    const amountBs = amountUsdt * rates.binanceUsdtRate;
    if (currencyView === 'USDT') {
      return <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">{formatUsdt(amountUsdt)}</span>;
    }
    if (currencyView === 'BS') {
      return <span className="font-mono tabular-nums font-bold text-sky-600 dark:text-sky-400">{formatBs(amountBs)}</span>;
    }
    return (
      <div className="flex flex-col">
        <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">{formatUsdt(amountUsdt)}</span>
        <span className="font-mono tabular-nums text-xs text-slate-500">{formatBs(amountBs)}</span>
      </div>
    );
  };

  const realMarginPercent = summary.totalRealCostUsdt > 0 && summary.totalSoldRevenueUsdt > 0
    ? ((summary.totalRealProfitUsdt / (summary.totalSoldRevenueUsdt - summary.totalRealProfitUsdt)) * 100).toFixed(1)
    : '0.0';

  const projectedMarginPercent = summary.totalRealCostUsdt > 0
    ? ((summary.totalProjectedProfitUsdt / summary.totalRealCostUsdt) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-4">
      {/* Operational Urgent Alerts Bar (if any) */}
      {(summary.pendingPrealertCount > 0 || summary.pendingZoomPaymentCount > 0 || summary.pendingZoomPickupCount > 0 || cycleSummary.stagnantCount > 0) && (
        <div className="bg-white dark:bg-slate-900/90 border border-amber-200 dark:border-slate-800/90 rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Atención Operativa &amp; Logística:
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Prealertas pendientes en Zoom y rotación de stock serializado.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {summary.pendingPrealertCount > 0 && (
              <button
                onClick={() => onFilterByStatus?.('sin_prealertar')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span>{summary.pendingPrealertCount} Sin Prealertar</span>
              </button>
            )}

            {summary.pendingZoomPaymentCount > 0 && (
              <button
                onClick={() => onFilterByStatus?.('pendiente_pago')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>{summary.pendingZoomPaymentCount} Fletes por Pagar</span>
              </button>
            )}

            {summary.pendingZoomPickupCount > 0 && (
              <button
                onClick={() => onFilterByStatus?.('pendiente_retiro')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/60 text-sky-700 dark:text-sky-300 text-xs font-semibold hover:bg-sky-100 dark:hover:bg-sky-900/50 transition cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                <span>{summary.pendingZoomPickupCount} Listos en Agencia</span>
              </button>
            )}

            {cycleSummary.stagnantCount > 0 && (
              <button
                onClick={() => onFilterByStatus?.('estancados')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/60 text-orange-700 dark:text-orange-300 text-xs font-semibold hover:bg-orange-100 dark:hover:bg-orange-900/50 transition cursor-pointer"
                title="Equipos disponibles con más de 25 días en inventario"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
                <span>{cycleSummary.stagnantCount} Stock Lento (+25d)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Inversión Total */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-xs relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Inversión en Teléfonos</span>
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl">
            {renderAmount(summary.totalInvestedUsdt)}
          </div>
          <div className="mt-2.5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-2">
            <span>Total Inventario:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">{summary.totalItems} unidades</span>
          </div>
        </div>

        {/* Card 2: Flete Zoom */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-xs relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Flete Casillero Zoom</span>
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400">
              <Plane className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl">
            {renderAmount(summary.totalZoomCostUsdt)}
          </div>
          <div className="mt-2.5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-2">
            <span>Costo Consolidado:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">
              ${summary.totalRealCostUsdt} USDT
            </span>
          </div>
        </div>

        {/* Card 3: Ganancia Realizada (Vendido) */}
        <div className="bg-white dark:bg-slate-900/90 border border-emerald-200 dark:border-slate-800/80 rounded-xl p-4 shadow-xs relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Ganancia Real Cerrada</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl text-emerald-600 dark:text-emerald-400">
            {renderAmount(summary.totalRealProfitUsdt)}
          </div>
          <div className="mt-2.5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-2">
            <span>Margen Real:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              +{realMarginPercent}% ({summary.itemsSold} vendidos{summary.itemsArchived > 0 ? ` · ${summary.itemsArchived} arch.` : ''})
            </span>
          </div>
        </div>

        {/* Card 4: Ganancia Proyectada (Stock & En Camino) */}
        <div 
          className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-xs relative overflow-hidden transition-colors"
          title="Ganancia proyectada del inventario activo por vender (tránsito USA, casillero Zoom y stock en tienda). No incluye equipos ya vendidos."
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium">Ganancia Proyectada</span>
              <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold px-1 rounded bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/50 hidden sm:inline">
                Activa
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl text-slate-800 dark:text-slate-200">
            {renderAmount(summary.totalProjectedProfitUsdt)}
          </div>
          <div className="mt-2.5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-2">
            <span title="Equipos en tránsito o disponibles por vender">En camino y stock:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
              +{projectedMarginPercent}% ({summary.activeProjectedCount} uds.)
            </span>
          </div>
        </div>
      </div>

      {/* Metric 5: Métricas de Tiempo y Rotación de Inventario */}
      <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl transition-colors shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Métricas de Rotación &amp; Tiempos de Entrega
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Velocidad de capital: eBay EE.UU. ➔ Casillero Zoom ➔ Retiro Venezuela ➔ Venta al Cliente
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/60">
              Rotación Global: <strong className="text-emerald-600 dark:text-emerald-400">{cycleSummary.turnoverRatePercent}%</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {/* 1. Rotación Promedio */}
          <div 
            onClick={() => onFilterByStatus?.('vendido')}
            className="bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-950 dark:hover:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 transition cursor-pointer group"
            title="Días promedio desde que compras el equipo en eBay hasta que se cierra la venta. Clic para ver vendidos."
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block group-hover:text-slate-800 dark:group-hover:text-slate-200">
                Rotación Promedio
              </span>
              <ArrowUpRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
            </div>
            <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {cycleSummary.avgDaysToSell > 0 
                ? `${cycleSummary.avgDaysToSell} días` 
                : cycleSummary.totalSoldWithDays > 0 ? '0 días' : 'Sin ventas aún'}
            </div>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-0.5">
              {cycleSummary.totalSoldWithDays > 0 ? `${cycleSummary.totalSoldWithDays} ventas analizadas` : 'Al vender el 1er equipo'}
            </span>
          </div>

          {/* 2. Venta Más Rápida */}
          <div 
            onClick={() => onFilterByStatus?.('vendido')}
            className="bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-950 dark:hover:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 transition cursor-pointer group"
            title="El tiempo récord en que se vendió un equipo. Clic para ver vendidos."
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block group-hover:text-slate-800 dark:group-hover:text-slate-200">
                Venta Más Rápida
              </span>
              <Zap className="w-3 h-3 text-amber-500 dark:text-amber-400" />
            </div>
            <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200 mt-1">
              {cycleSummary.fastestSaleDays !== null ? `${cycleSummary.fastestSaleDays} días` : '--'}
            </div>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-0.5">
              Récord de rotación
            </span>
          </div>

          {/* 3. Tiempo en Tránsito Activo */}
          <div 
            onClick={() => onFilterByStatus?.('en_transito_usa')}
            className="bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-950 dark:hover:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 transition cursor-pointer group"
            title="Días transcurridos de los equipos que actualmente viajan a Miami o están en tránsito. Clic para filtrar."
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block group-hover:text-slate-800 dark:group-hover:text-slate-200">
                Tránsito Activo
              </span>
              <Plane className="w-3 h-3 text-sky-500 dark:text-sky-400" />
            </div>
            <div className="text-sm font-bold font-mono text-sky-600 dark:text-sky-400 mt-1">
              {cycleSummary.totalTransitCount > 0 
                ? (cycleSummary.avgDaysInTransit > 0 ? `~${cycleSummary.avgDaysInTransit} días` : '< 1 día') 
                : '0 en camino'}
            </div>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-0.5">
              {cycleSummary.totalTransitCount} en ruta internacional
            </span>
          </div>

          {/* 4. Tiempo de Entrega / Importación Zoom */}
          <div 
            onClick={() => onFilterByStatus?.('en_zoom')}
            className="bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-950 dark:hover:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 transition cursor-pointer group"
            title="Tiempo promedio de entrega desde compra en eBay hasta llegada y retiro en Zoom Venezuela. Clic para ver envíos Zoom."
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block group-hover:text-slate-800 dark:group-hover:text-slate-200">
                Entrega Zoom Vzla
              </span>
              <Truck className="w-3 h-3 text-purple-500 dark:text-purple-400" />
            </div>
            <div className="text-sm font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
              {cycleSummary.avgDeliveryDays > 0 
                ? `~${cycleSummary.avgDeliveryDays} días` 
                : cycleSummary.totalTransitCount > 0 ? 'En tránsito' : 'Est. 8-12d'}
            </div>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-0.5">
              eBay ➔ Zoom Vzla
            </span>
          </div>

          {/* 5. Stock con Rotación Lenta */}
          <div 
            onClick={() => onFilterByStatus?.('estancados')}
            className={`p-2.5 rounded-lg border transition cursor-pointer group col-span-2 sm:col-span-1 ${
              cycleSummary.stagnantCount > 0 
                ? 'bg-rose-50/70 hover:bg-rose-100/70 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 border-rose-200 dark:border-rose-800/60' 
                : 'bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-950 dark:hover:bg-slate-900/80 border-slate-200 dark:border-slate-800/80'
            }`}
            title="Equipos disponibles en tienda que tienen más de 25 días desde su compra sin haberse vendido. Clic para filtrar."
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block group-hover:text-slate-800 dark:group-hover:text-slate-200">
                Stock Lento (+25d)
              </span>
              <AlertTriangle className={`w-3 h-3 ${cycleSummary.stagnantCount > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400'}`} />
            </div>
            <div className={`text-sm font-bold font-mono mt-1 ${cycleSummary.stagnantCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}`}>
              {cycleSummary.stagnantCount} {cycleSummary.stagnantCount === 1 ? 'equipo' : 'equipos'}
            </div>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-0.5">
              {cycleSummary.stagnantCount > 0 ? 'Requiere promoción' : 'Rotación al día'}
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Status Pipeline Counts with Dot Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div 
          onClick={() => onFilterByStatus?.('en_transito_usa')}
          className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500 dark:bg-sky-400" />
            <span className="text-slate-700 dark:text-slate-300">En Tránsito USA</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold font-mono text-[11px]">
            {summary.itemsInTransitUsa}
          </span>
        </div>

        <div 
          onClick={() => onFilterByStatus?.('en_zoom')}
          className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400" />
            <span className="text-slate-700 dark:text-slate-300">Zoom Miami / Vzla</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold font-mono text-[11px]">
            {summary.itemsInZoom}
          </span>
        </div>

        <div 
          onClick={() => onFilterByStatus?.('disponible_para_venta')}
          className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            <span className="text-slate-700 dark:text-slate-300">En Stock / Disponible</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold font-mono text-[11px]">
            {summary.itemsAvailable}
          </span>
        </div>

        <div 
          onClick={() => onFilterByStatus?.('vendido')}
          className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-slate-700 dark:text-slate-300">Vendidos</span>
          </div>
          <div className="flex items-center gap-1.5">
            {summary.itemsArchived > 0 && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                ({summary.itemsArchived} arch.)
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold font-mono text-[11px]">
              {summary.itemsSold}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};


