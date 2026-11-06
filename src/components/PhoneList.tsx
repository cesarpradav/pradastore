import React, { useState, useMemo } from 'react';
import { PhoneItem, CurrencyRates, ItemStatus } from '../types';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Truck, 
  Plane, 
  Store, 
  MoreVertical, 
  Edit, 
  Eye, 
  LayoutList, 
  LayoutGrid, 
  ArrowUpDown,
  Copy,
  Check,
  Building2,
  DollarSign,
  Share2,
  FileText,
  Battery,
  AlertTriangle,
  Zap,
  Smartphone,
  ChevronRight,
  TrendingUp,
  Archive,
  ArchiveRestore,
  Mail
} from 'lucide-react';
import { 
  convertZoomBcvToUsdt, 
  calculateRealCostUsdt, 
  calculateRealCostBs, 
  calculateProjectedProfit, 
  calculateRealProfit,
  getItemTimeMetrics,
  calculateDaysBetween,
  formatUsdt,
  formatBcv,
  formatBs
} from '../utils/calculations';
import { detectCarrier, getTrackingUrl, CARRIERS } from '../utils/tracking';
import { findPresetModel } from '../data/iphonePresets';

interface PhoneListProps {
  items: PhoneItem[];
  rates: CurrencyRates;
  currencyView: 'USDT' | 'BS' | 'DUAL';
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  onSelectPhone: (item: PhoneItem) => void;
  onEditPhone: (item: PhoneItem) => void;
  onTogglePrealert: (id: string) => void;
  onToggleZoomPaid: (id: string) => void;
  onToggleZoomPickup: (id: string) => void;
  onQuickMarkSold: (item: PhoneItem) => void;
  onOpenSocialPost: (item: PhoneItem) => void;
  onOpenSalesReceipt: (item: PhoneItem) => void;
  onAddNewPhone?: () => void;
  onOpenTrackingModal?: (trackingNumber?: string, carrier?: string) => void;
  onOpenZoomSyncModal?: () => void;
  onToggleArchivePhone?: (id: string) => void;
  onBatchArchiveSold?: () => void;
}

export const PhoneList: React.FC<PhoneListProps> = ({
  items,
  rates,
  currencyView,
  activeFilter,
  setActiveFilter,
  onSelectPhone,
  onEditPhone,
  onTogglePrealert,
  onToggleZoomPaid,
  onToggleZoomPickup,
  onQuickMarkSold,
  onOpenSocialPost,
  onOpenSalesReceipt,
  onAddNewPhone,
  onOpenTrackingModal,
  onOpenZoomSyncModal,
  onToggleArchivePhone,
  onBatchArchiveSold,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modelFilter, setModelFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortBy, setSortBy] = useState<'date' | 'cost' | 'profit' | 'model'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState<boolean>(false);

  // Counts for filters
  const countArchived = useMemo(() => items.filter((i) => i.isArchived).length, [items]);
  const countSoldActive = useMemo(() => items.filter((i) => i.status === 'vendido' && !i.isArchived).length, [items]);
  const countActiveTotal = useMemo(() => items.filter((i) => !i.isArchived).length, [items]);

  const handleCopyText = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // Archive handling:
        if (activeFilter === 'archivados') {
          if (!item.isArchived) return false;
        } else {
          // In standard views, hide archived items unless user checked showArchived
          if (item.isArchived && !showArchived) return false;
        }

        // Status filters
        if (activeFilter === 'en_transito_usa' && item.status !== 'en_transito_usa') return false;
        if (activeFilter === 'en_zoom' && item.status !== 'en_casillero_zoom' && item.status !== 'en_agencia_zoom') return false;
        if (activeFilter === 'disponible_para_venta' && item.status !== 'disponible_para_venta' && item.status !== 'reservado') return false;
        if (activeFilter === 'vendido' && item.status !== 'vendido') return false;
        if (activeFilter === 'sin_prealertar' && item.isPrealerted) return false;
        if (activeFilter === 'pendiente_pago' && (item.isZoomPaid || (item.status !== 'en_casillero_zoom' && item.status !== 'en_agencia_zoom'))) return false;
        if (activeFilter === 'pendiente_retiro' && (item.isZoomPickedUp || item.status !== 'en_agencia_zoom')) return false;
        if (activeFilter === 'estancados' && ((item.status !== 'disponible_para_venta' && item.status !== 'reservado') || calculateDaysBetween(item.purchaseDate) < 25)) return false;

        // Model presets filter
        if (modelFilter !== 'all') {
          const itemModel = item.model.toLowerCase();
          if (modelFilter === 'iphone-13-all' && !itemModel.includes('13')) return false;
          if (modelFilter === 'iphone-13-pro' && !(itemModel.includes('13 pro') || itemModel.includes('13 pro max'))) return false;
          if (modelFilter === 'iphone-14-all' && !itemModel.includes('14')) return false;
          if (modelFilter === 'iphone-14-pro' && !(itemModel.includes('14 pro') || itemModel.includes('14 pro max'))) return false;
          if (modelFilter === 'other' && (itemModel.includes('13') || itemModel.includes('14'))) return false;
        }

        // Search text
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchModel = item.model.toLowerCase().includes(q);
          const matchImei = (item.imei || '').toLowerCase().includes(q);
          const matchImei1 = (item.imei1 || '').toLowerCase().includes(q);
          const matchImei2 = (item.imei2 || '').toLowerCase().includes(q);
          const matchTracking = (item.usTrackingNumber || '').toLowerCase().includes(q);
          const matchZoom = (item.zoomTrackingNumber || '').toLowerCase().includes(q);
          const matchOrder = (item.ebayOrderNumber || '').toLowerCase().includes(q);
          const matchBuyer = (item.buyerName || '').toLowerCase().includes(q);

          return matchModel || matchImei || matchImei1 || matchImei2 || matchTracking || matchZoom || matchOrder || matchBuyer;
        }

        return true;
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;

        if (sortBy === 'date') {
          return sortOrder === 'desc'
            ? new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
            : new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
        }
        if (sortBy === 'model') {
          return sortOrder === 'desc' ? b.model.localeCompare(a.model) : a.model.localeCompare(b.model);
        }
        if (sortBy === 'cost') {
          valA = calculateRealCostUsdt(a, rates);
          valB = calculateRealCostUsdt(b, rates);
        }
        if (sortBy === 'profit') {
          valA = a.status === 'vendido' 
            ? calculateRealProfit(a, rates).profitUsdt 
            : calculateProjectedProfit(a, rates).profitUsdt;
          valB = b.status === 'vendido' 
            ? calculateRealProfit(b, rates).profitUsdt 
            : calculateProjectedProfit(b, rates).profitUsdt;
        }

        return sortOrder === 'desc' ? valB - valA : valA - valB;
      });
  }, [items, activeFilter, searchTerm, sortBy, sortOrder, rates]);

  // Dot-Pill status badges matching high-end B2B specifications
  const getStatusBadge = (status: ItemStatus) => {
    switch (status) {
      case 'disponible_para_venta':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Disponible</span>
          </span>
        );
      case 'en_transito_usa':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-950/40 text-sky-300 border border-sky-800/60 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span>En Tránsito USA</span>
          </span>
        );
      case 'en_casillero_zoom':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-950/40 text-purple-300 border border-purple-800/60 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span>Zoom Miami / Vuelo</span>
          </span>
        );
      case 'en_agencia_zoom':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/40 text-amber-300 border border-amber-800/60 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>En Agencia Zoom</span>
          </span>
        );
      case 'reservado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-950/40 text-yellow-300 border border-yellow-800/60 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            <span>Reservado</span>
          </span>
        );
      case 'vendido':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/70 text-slate-300 border border-slate-700/60 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Vendido</span>
          </span>
        );
    }
  };

  const renderAmountFormatted = (amountUsdt: number) => {
    const amountBs = amountUsdt * rates.binanceUsdtRate;
    if (currencyView === 'USDT') {
      return <span className="font-mono tabular-nums font-semibold text-slate-100">{formatUsdt(amountUsdt)}</span>;
    }
    if (currencyView === 'BS') {
      return <span className="font-mono tabular-nums font-semibold text-sky-400">{formatBs(amountBs)}</span>;
    }
    return (
      <div className="flex flex-col leading-tight">
        <span className="font-mono tabular-nums font-semibold text-slate-100">{formatUsdt(amountUsdt)}</span>
        <span className="font-mono tabular-nums text-[10px] text-slate-500">{formatBs(amountBs)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search, Filters & Views */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 space-y-3 shadow-xs transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por modelo, IMEI, guía de rastreo USA, Zoom o cliente..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/90 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-slate-400 dark:focus:border-slate-600 focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Sort & View Mode Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-lg p-1 text-xs">
              <span className="text-slate-500 text-[11px] px-1.5 hidden sm:inline">Ordenar:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-hidden pr-2 cursor-pointer"
              >
                <option value="date" className="dark:bg-slate-900">Fecha</option>
                <option value="cost" className="dark:bg-slate-900">Costo Real</option>
                <option value="profit" className="dark:bg-slate-900">Margen / Ganancia</option>
                <option value="model" className="dark:bg-slate-900">Modelo</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                title={`Orden ${sortOrder === 'desc' ? 'Descendente' : 'Ascendente'}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Layout Toggle */}
            <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs border border-slate-200 dark:border-transparent dark:bg-slate-800 dark:text-slate-100' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                }`}
                title="Vista de Tabla B2B"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-md transition ${
                  viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs border border-slate-200 dark:border-transparent dark:bg-slate-800 dark:text-slate-100' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                }`}
                title="Vista de Tarjetas de Inventario"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 text-[11px] font-semibold mr-1">Estado:</span>
            {[
              { id: 'todos', label: `Todos Activos (${countActiveTotal})` },
              { id: 'en_transito_usa', label: 'Tránsito USA' },
              { id: 'en_zoom', label: 'En Zoom (Miami/Vzla)' },
              { id: 'disponible_para_venta', label: 'En Stock' },
              { id: 'vendido', label: `Vendidos (${countSoldActive})` },
              { id: 'archivados', label: `📦 Archivados (${countArchived})` },
              { id: 'sin_prealertar', label: '⚠️ Sin Prealerta' },
              { id: 'pendiente_pago', label: '💳 Flete por Pagar' },
              { id: 'pendiente_retiro', label: '🏢 Por Retirar' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer text-[11px] ${
                  activeFilter === f.id
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200 dark:bg-slate-950/80 dark:text-slate-400 dark:hover:text-slate-200 dark:border-slate-800/80 dark:hover:bg-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}

            {onOpenZoomSyncModal && (
              <button
                onClick={onOpenZoomSyncModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/40 font-bold text-[11px] transition cursor-pointer shadow-xs ml-1"
                title="Leer correos de Zoom en Gmail para actualizar automáticamente estado, guías y fletes"
              >
                <Mail className="w-3.5 h-3.5 text-amber-500" />
                <span>⚡ Sync Zoom Gmail</span>
              </button>
            )}
          </div>

          {/* Quick Archive Actions & Toggle */}
          <div className="flex items-center gap-2.5 shrink-0 ml-auto">
            {activeFilter === 'vendido' && countSoldActive > 0 && onBatchArchiveSold && (
              <button
                onClick={onBatchArchiveSold}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-semibold text-[11px] transition cursor-pointer"
                title="Archivar todos los teléfonos vendidos activos para limpiar tu vista"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archivar {countSoldActive} Vendidos</span>
              </button>
            )}

            <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 dark:border-slate-700 dark:bg-slate-900"
              />
              <span>Incluir archivados ({countArchived})</span>
            </label>
          </div>
        </div>

        {/* Model Presets Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/40 text-xs">
          <span className="text-amber-600 dark:text-amber-400 text-[11px] font-bold mr-1 flex items-center gap-1">
            <span>Modelos:</span>
          </span>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'iphone-13-all', label: '⭐ Serie iPhone 13' },
            { id: 'iphone-13-pro', label: '13 Pro / Pro Max' },
            { id: 'iphone-14-all', label: '⭐ Serie iPhone 14' },
            { id: 'iphone-14-pro', label: '14 Pro / Pro Max' },
            { id: 'other', label: 'Otras Series' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setModelFilter(m.id)}
              className={`px-2.5 py-0.5 rounded-lg font-medium transition cursor-pointer text-[11px] ${
                modelFilter === m.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:text-slate-200 dark:border-slate-800 dark:hover:bg-slate-800'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 ? (
        items.length === 0 ? (
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-12 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 flex items-center justify-center mx-auto">
              <Smartphone className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-200">Inventario serializado listo</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                No tienes registros de teléfonos guardados. Agrega tu primer iPhone para calcular la ecuación financiera de compra, envíos y margen neto.
              </p>
            </div>
            {onAddNewPhone && (
              <button
                onClick={onAddNewPhone}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-400 dark:text-slate-950" />
                <span>+ Registrar Primer iPhone</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-12 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-300">No se encontraron registros coincidentes</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No hay equipos que coincidan con los filtros o el término de búsqueda ingresado.
            </p>
            <button
              onClick={() => {
                setActiveFilter('todos');
                setSearchTerm('');
              }}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
            >
              Ver todos los equipos
            </button>
          </div>
        )
      ) : viewMode === 'table' ? (
        /* PREMIUM B2B TABLE VIEW */
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/90 text-slate-500 dark:text-slate-400/90 border-b border-slate-200 dark:border-slate-800/80 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider select-none">
                  <th className="py-3.5 px-4">Equipo &amp; Serialización</th>
                  <th className="py-3.5 px-4">Identificadores (Tracking / Prealerta)</th>
                  <th className="py-3.5 px-4">Flete Zoom (BCV)</th>
                  <th className="py-3.5 px-4">Costo Real (Compra + Envíos)</th>
                  <th className="py-3.5 px-4">Precio de Venta</th>
                  <th className="py-3.5 px-4">Estado Logístico</th>
                  <th className="py-3.5 px-4">Margen Financiero</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {filteredItems.map((item) => {
                  const realCostUsdt = calculateRealCostUsdt(item, rates);
                  const zoomCostUsdt = convertZoomBcvToUsdt(item.zoomCostStatus === 'known' ? item.zoomCostBcv : 0, rates);
                  const projected = calculateProjectedProfit(item, rates);
                  const real = calculateRealProfit(item, rates);
                  const isSold = item.status === 'vendido';
                  const activeProfit = isSold ? real : projected;
                  const timeMetrics = getItemTimeMetrics(item);
                  const primaryImei = item.imei1 || item.imei;
                  const preset = findPresetModel(item.model);
                  const colorObj = preset?.colors.find(
                    (c) =>
                      c.name.toLowerCase() === item.color?.toLowerCase() ||
                      c.nameEn.toLowerCase() === item.color?.toLowerCase()
                  );

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectPhone(item)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors duration-150 cursor-pointer group"
                    >
                      {/* 1. Equipo & Serialización */}
                      <td className="py-3.5 px-4 min-w-[240px]">
                        <div className="flex items-start gap-3">
                          {/* Mini Thumbnail */}
                          {item.primaryImage || (item.images && item.images.length > 0) ? (
                            <img
                              src={item.primaryImage || item.images![0]}
                              alt={item.model}
                              className="w-11 h-11 rounded-xl object-contain bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700/60 shrink-0 shadow-xs group-hover:scale-105 transition-transform"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-400 dark:text-slate-500 flex items-center justify-center shrink-0">
                              <Smartphone className="w-5 h-5" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition text-sm">
                                {item.model}
                              </span>
                              {item.isArchived && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-300 dark:border-slate-700">
                                  <Archive className="w-2.5 h-2.5 text-slate-500" />
                                  <span>Archivado</span>
                                </span>
                              )}
                              {item.batteryHealth && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/50 dark:text-emerald-300 font-mono text-[10px] font-bold">
                                  🔋{item.batteryHealth}%
                                </span>
                              )}
                            </div>

                            {/* IMEI Tag en Monospace */}
                            {primaryImei && (
                              <div className="mt-1 flex items-center gap-1.5">
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 px-2 py-0.5 rounded font-mono text-xs border border-slate-200 dark:border-slate-700/60 inline-flex items-center gap-1">
                                  <span className="text-slate-500 dark:text-slate-400 text-[10px]">IMEI:</span>
                                  <span>{primaryImei}</span>
                                </span>
                                <button
                                  onClick={(e) => handleCopyText(e, primaryImei, `imei-${item.id}`)}
                                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                                  title="Copiar IMEI"
                                >
                                  {copiedId === `imei-${item.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-medium text-[10px]">
                            {item.condition}
                          </span>
                          {item.storage && <span className="text-slate-600 dark:text-slate-300 font-mono">{item.storage}</span>}
                          {item.color && (
                            <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                              <span>•</span>
                              {colorObj && (
                                <span
                                  className={`w-2 h-2 rounded-full inline-block border ${colorObj.borderClass || 'border-black/20 dark:border-white/20'}`}
                                  style={{ backgroundColor: colorObj.hex }}
                                  title={`${colorObj.name} (${colorObj.nameEn})`}
                                />
                              )}
                              <span>{item.color}</span>
                            </span>
                          )}
                          {item.ebayLink && (
                            <a
                              href={item.ebayLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-0.5 text-[10px]"
                              title="Abrir publicación en eBay"
                            >
                              <span>eBay</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          {item.ebayOrderNumber && (
                            <span
                              onClick={(e) => handleCopyText(e, item.ebayOrderNumber!, `ord-${item.id}`)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-mono text-[10px] font-semibold hover:border-amber-400 cursor-pointer shadow-2xs"
                              title="Número de Orden eBay (Clic para copiar)"
                            >
                              <span>Orden #{item.ebayOrderNumber}</span>
                              {copiedId === `ord-${item.id}` ? (
                                <Check className="w-2.5 h-2.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-2.5 h-2.5 opacity-60" />
                              )}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Identificadores (Tracking USA / Prealerta Zoom) */}
                      <td className="py-3.5 px-4 min-w-[210px]">
                        {(() => {
                          const detected = item.usCarrier || detectCarrier(item.usTrackingNumber || '');
                          const cInfo = CARRIERS[detected] || CARRIERS.USPS;
                          const trackUrl = getTrackingUrl(detected, item.usTrackingNumber || '');

                          return (
                            <div className="space-y-1.5">
                              {item.usTrackingNumber ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded font-mono text-xs border border-slate-200 dark:border-slate-700/60 inline-flex items-center gap-1.5 max-w-[170px] truncate" title={item.usTrackingNumber}>
                                    <span className="text-[9px] font-bold text-sky-600 dark:text-sky-400">{cInfo.shortName}</span>
                                    <span className="truncate">{item.usTrackingNumber}</span>
                                  </span>
                                  <button
                                    onClick={(e) => handleCopyText(e, item.usTrackingNumber, `track-${item.id}`)}
                                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                                    title="Copiar Tracking USA"
                                  >
                                    {copiedId === `track-${item.id}` ? (
                                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                  <a
                                    href={trackUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-sky-600 dark:text-sky-400 hover:underline transition"
                                    title={`Rastrear en portal ${cInfo.shortName}`}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">Sin guía asignada</span>
                              )}

                              {/* Prealert status badge */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onTogglePrealert(item.id);
                                  }}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer border ${
                                    item.isPrealerted
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                                      : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/50'
                                  }`}
                                  title="Clic para cambiar estado de prealerta en Zoom"
                                >
                                  <span>{item.isPrealerted ? '✅ Prealertado' : '⚠️ Sin Prealerta'}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* 3. Flete Zoom (BCV) */}
                      <td className="py-3.5 px-4 min-w-[130px]">
                        {item.zoomCostStatus === 'known' ? (
                          <div>
                            <div className="font-mono tabular-nums font-semibold text-sky-700 dark:text-sky-300 text-xs">
                              {formatBcv(item.zoomCostBcv)}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                              ≈ ${zoomCostUsdt} USDT
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-[10px] font-medium border border-slate-200 dark:border-slate-700/50">
                            <Clock className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400" />
                            <span>En espera</span>
                          </span>
                        )}
                      </td>

                      {/* 4. Costo Real (Ecuación: Compra + Envíos) */}
                      <td className="py-3.5 px-4 min-w-[140px]">
                        <div className="font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100 text-xs">
                          {formatUsdt(realCostUsdt)}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                          Eq: ${item.productCostUsdt} | Env: {item.usShippingCostUsdt && item.usShippingCostUsdt > 0 ? `$${item.usShippingCostUsdt}` : '$0'}
                        </div>
                      </td>

                      {/* 5. Precio de Venta (Prospectado o Cerrado) */}
                      <td className="py-3.5 px-4 min-w-[130px]">
                        <div className="font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100 text-xs">
                          {isSold ? formatUsdt(item.soldPriceUsdt || item.projectedPriceUsdt) : formatUsdt(item.projectedPriceUsdt)}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {isSold ? 'Vendido final' : 'Precio proyectado'}
                        </div>
                      </td>

                      {/* 6. Estado Logístico con Dot-Pill & Tiempo de Rotación */}
                      <td className="py-3.5 px-4 min-w-[150px]">
                        <div className="space-y-1">
                          {getStatusBadge(item.status)}
                          <div>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${timeMetrics.badgeColor}`}>
                              {timeMetrics.badgeLabel}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 7. Margen Financiero (Verde Elegante si Positivo) */}
                      <td className="py-3.5 px-4 min-w-[130px]">
                        <div className="inline-flex flex-col">
                          <span className="font-mono tabular-nums font-bold text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800/50 px-2 py-0.5 rounded">
                            +${activeProfit.profitUsdt} USDT
                          </span>
                          <span className="text-[10px] font-mono tabular-nums text-emerald-600 dark:text-emerald-300/90 font-semibold mt-0.5">
                            +{activeProfit.marginPercent}% {isSold ? 'REAL' : 'Margen'}
                          </span>
                        </div>
                      </td>

                      {/* 8. Acciones Rápidas */}
                      <td className="py-3.5 px-4 text-right min-w-[140px]">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onOpenSalesReceipt(item)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 transition cursor-pointer"
                            title="Emitir / Ver Nota de Entrega & Factura PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onOpenSocialPost(item)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 transition cursor-pointer"
                            title="Generar publicación WhatsApp / Instagram"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onEditPhone(item)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 transition cursor-pointer"
                            title="Editar Teléfono"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {isSold && onToggleArchivePhone && (
                            <button
                              onClick={() => onToggleArchivePhone(item.id)}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                item.isArchived
                                  ? 'hover:bg-sky-50 dark:hover:bg-slate-800 text-sky-600 dark:text-sky-400'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                              }`}
                              title={item.isArchived ? 'Desarchivar (regresar a vendidos activos)' : 'Archivar vendido'}
                            >
                              {item.isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                            </button>
                          )}

                          {!isSold && (
                            <button
                              onClick={() => onQuickMarkSold(item)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-xs transition cursor-pointer"
                              title="Registrar Venta & Emitir Nota de Entrega en PDF"
                            >
                              Vender
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* PREMIUM B2B CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const realCostUsdt = calculateRealCostUsdt(item, rates);
            const zoomCostUsdt = convertZoomBcvToUsdt(item.zoomCostStatus === 'known' ? item.zoomCostBcv : 0, rates);
            const projected = calculateProjectedProfit(item, rates);
            const real = calculateRealProfit(item, rates);
            const isSold = item.status === 'vendido';
            const activeProfit = isSold ? real : projected;
            const timeMetrics = getItemTimeMetrics(item);
            const primaryImei = item.imei1 || item.imei;
            const preset = findPresetModel(item.model);
            const colorObj = preset?.colors.find(
              (c) =>
                c.name.toLowerCase() === item.color?.toLowerCase() ||
                c.nameEn.toLowerCase() === item.color?.toLowerCase()
            );

            return (
              <div
                key={item.id}
                onClick={() => onSelectPhone(item)}
                className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Photo Header Preview */}
                  {(item.primaryImage || (item.images && item.images.length > 0)) ? (
                    <div className="relative w-full h-36 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-center p-3 overflow-hidden">
                      <img
                        src={item.primaryImage || item.images![0]}
                        alt={item.model}
                        className="max-h-full max-w-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {item.images && item.images.length > 1 && (
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold backdrop-blur-xs">
                          +{item.images.length - 1} fotos
                        </div>
                      )}
                    </div>
                  ) : null}

                  <div className="p-4.5 space-y-4">
                    {/* Top Bar: Dot-Pill Status Badge & Condition */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getStatusBadge(item.status)}
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${timeMetrics.badgeColor}`}>
                          {timeMetrics.badgeLabel}
                        </span>
                        {item.isArchived && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                            <Archive className="w-2.5 h-2.5 text-slate-500" />
                            <span>Archivado</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800/80">
                        {item.condition}
                      </span>
                    </div>

                    {/* Title & Specs */}
                    <div className="mt-3">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                        {item.model}
                      </h4>
                    
                    {/* IMEI Tag */}
                    {primaryImei && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 px-2 py-0.5 rounded font-mono text-xs border border-slate-200 dark:border-slate-700/60 inline-flex items-center gap-1">
                          <span className="text-slate-500 dark:text-slate-400 text-[10px]">IMEI:</span>
                          <span>{primaryImei}</span>
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
                      {item.storage && <span className="text-slate-700 dark:text-slate-300 font-mono font-medium">{item.storage}</span>}
                      {item.color && (
                        <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300">
                          <span>•</span>
                          {colorObj && (
                            <span
                              className={`w-2 h-2 rounded-full inline-block border ${colorObj.borderClass || 'border-black/20 dark:border-white/20'}`}
                              style={{ backgroundColor: colorObj.hex }}
                              title={`${colorObj.name} (${colorObj.nameEn})`}
                            />
                          )}
                          <span>{item.color}</span>
                        </span>
                      )}
                      {item.batteryHealth && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/50 dark:text-emerald-300 font-mono text-[10px] font-bold">
                          🔋 {item.batteryHealth}%
                        </span>
                      )}
                      {item.ebayLink && (
                        <a
                          href={item.ebayLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-0.5 ml-auto text-[11px]"
                        >
                          <span>eBay</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Order Number Badge */}
                    {item.ebayOrderNumber && (
                      <div className="mt-2.5 flex items-center justify-between p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-xs">
                        <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                          <span>🧾 Orden eBay:</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">#{item.ebayOrderNumber}</span>
                        </span>
                        <button
                          onClick={(e) => handleCopyText(e, item.ebayOrderNumber!, `card-ord-${item.id}`)}
                          className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 transition cursor-pointer"
                          title="Copiar Order Number"
                        >
                          {copiedId === `card-ord-${item.id}` ? (
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tracking Box */}
                  {item.usTrackingNumber && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 px-2 py-0.5 rounded font-mono text-xs border border-slate-200 dark:border-slate-700/60 truncate max-w-[180px]">
                        {item.usTrackingNumber}
                      </span>
                      <button
                        onClick={(e) => handleCopyText(e, item.usTrackingNumber, `card-${item.id}`)}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                        title="Copiar guía"
                      >
                        {copiedId === `card-${item.id}` ? (
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Financial Equation Box */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-50/90 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800/80 space-y-2">
                    <div className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider flex items-center justify-between">
                      <span>Ecuación Financiera</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">+{activeProfit.marginPercent}%</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                      <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Compra</span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">${item.productCostUsdt}</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Costo Real</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">${realCostUsdt}</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{isSold ? 'Venta Real' : 'Venta Est.'}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          ${isSold ? item.soldPriceUsdt : item.projectedPriceUsdt}
                        </span>
                      </div>
                    </div>

                    {/* Margen Highlight en Verde Elegante */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800/60 text-xs">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">Ganancia Neta:</span>
                      <span className="font-mono tabular-nums font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800/50 px-2 py-0.5 rounded">
                        +${activeProfit.profitUsdt} USDT
                      </span>
                    </div>
                  </div>
                </div>
              </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenSalesReceipt(item);
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 transition cursor-pointer"
                      title="Nota de Entrega & Factura PDF"
                    >
                      <FileText className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenSocialPost(item);
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 transition cursor-pointer"
                      title="Generar Publicación en Redes"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    {isSold && onToggleArchivePhone && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleArchivePhone(item.id);
                        }}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          item.isArchived
                            ? 'hover:bg-sky-50 dark:hover:bg-slate-800 text-sky-600 dark:text-sky-400'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                        title={item.isArchived ? 'Desarchivar (regresar a lista activa)' : 'Archivar vendido'}
                      >
                        {item.isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditPhone(item);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition cursor-pointer"
                    >
                      Editar
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <button
                      onClick={() => onSelectPhone(item)}
                      className="text-xs font-semibold text-slate-900 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-white transition flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Detalle</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

