import React, { useState, useMemo } from 'react';
import { PhoneItem, CurrencyRates, ItemStatus } from '../types';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Truck, 
  Plane, 
  DollarSign, 
  Edit, 
  Trash2, 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  Share2,
  FileText,
  Battery,
  ShieldCheck,
  PackageCheck,
  TrendingUp,
  Calculator,
  Plus,
  Equal,
  RotateCcw,
  Image as ImageIcon,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Archive,
  ArchiveRestore,
  Timer
} from 'lucide-react';
import { 
  convertZoomBcvToUsdt, 
  calculateRealCostUsdt, 
  calculateRealCostBs, 
  calculateProjectedProfit, 
  calculateRealProfit,
  getItemTimeMetrics,
  formatUsdt,
  formatBcv,
  formatBs
} from '../utils/calculations';
import { detectCarrier, getTrackingUrl, getUniversalTrackingUrl, CARRIERS } from '../utils/tracking';
import { findPresetModel } from '../data/iphonePresets';

interface PhoneDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PhoneItem | null;
  rates: CurrencyRates;
  onEdit: (item: PhoneItem) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, newStatus: any) => void;
  onTogglePrealert: (id: string) => void;
  onToggleZoomPaid: (id: string) => void;
  onToggleZoomPickup: (id: string) => void;
  onOpenSocialPost?: (item: PhoneItem) => void;
  onOpenSalesReceipt?: (item: PhoneItem) => void;
  onReturnToInventory?: (item: PhoneItem) => void;
  onToggleArchivePhone?: (id: string) => void;
}

export const PhoneDetailModal: React.FC<PhoneDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  rates,
  onEdit,
  onDelete,
  onToggleStatus,
  onTogglePrealert,
  onToggleZoomPaid,
  onToggleZoomPickup,
  onOpenSocialPost,
  onOpenSalesReceipt,
  onReturnToInventory,
  onToggleArchivePhone,
}) => {
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [copiedImei, setCopiedImei] = useState(false);
  const [copiedOrder, setCopiedOrder] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const allImages = useMemo(() => {
    if (!item) return [];
    const list: string[] = [];
    if (item.primaryImage) list.push(item.primaryImage);
    if (item.images) {
      for (const img of item.images) {
        if (!list.includes(img)) list.push(img);
      }
    }
    return list;
  }, [item]);

  if (!isOpen || !item) return null;

  const realCostUsdt = calculateRealCostUsdt(item, rates);
  const realCostBs = calculateRealCostBs(item, rates);
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

  const handleCopyText = (text: string, type: 'tracking' | 'imei' | 'order') => {
    navigator.clipboard.writeText(text);
    if (type === 'tracking') {
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    } else if (type === 'imei') {
      setCopiedImei(true);
      setTimeout(() => setCopiedImei(false), 2000);
    } else if (type === 'order') {
      setCopiedOrder(true);
      setTimeout(() => setCopiedOrder(false), 2000);
    }
  };

  const detectedCarrier = item.usCarrier || detectCarrier(item.usTrackingNumber || '');
  const carrierData = CARRIERS[detectedCarrier] || CARRIERS.USPS;
  const officialTrackingUrl = item.usTrackingNumber ? getTrackingUrl(detectedCarrier, item.usTrackingNumber) : '#';

  const getStatusBadge = (status: ItemStatus) => {
    switch (status) {
      case 'disponible_para_venta':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Disponible Stock</span>
          </span>
        );
      case 'en_transito_usa':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-sky-950/40 text-sky-300 border border-sky-800/60 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span>En Tránsito USA</span>
          </span>
        );
      case 'en_casillero_zoom':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-950/40 text-purple-300 border border-purple-800/60 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span>Zoom Miami / Vuelo</span>
          </span>
        );
      case 'en_agencia_zoom':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-950/40 text-amber-300 border border-amber-800/60 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>En Agencia Zoom</span>
          </span>
        );
      case 'reservado':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-950/40 text-yellow-300 border border-yellow-800/60 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            <span>Reservado</span>
          </span>
        );
      case 'vendido':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800/70 text-slate-300 border border-slate-700/60 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Vendido</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 rounded-2xl w-full max-w-3xl my-8 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 transition-colors">
        
        {/* Header B2B */}
        <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/90">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg tracking-tight">
                  {item.model}
                </h3>
                {getStatusBadge(item.status)}
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold border ${timeMetrics.badgeColor}`}>
                  {timeMetrics.badgeLabel}
                </span>
                {item.isArchived && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                    <Archive className="w-3 h-3 text-slate-500" />
                    <span>Archivado</span>
                  </span>
                )}
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50">
                  {item.condition}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                {item.storage && (
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {item.storage}
                  </span>
                )}
                {item.color && (
                  <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300">
                    <span>•</span>
                    {colorObj && (
                      <span
                        className={`w-2.5 h-2.5 rounded-full inline-block border ${colorObj.borderClass || 'border-black/20 dark:border-white/20'}`}
                        style={{ backgroundColor: colorObj.hex }}
                        title={`${colorObj.name} (${colorObj.nameEn})`}
                      />
                    )}
                    <span>{item.color}</span>
                  </span>
                )}
                <span>• Registrado el {item.purchaseDate}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-slate-800 dark:text-slate-100">
          
          {/* GALERÍA DE FOTOS INTERACTIVA */}
          {allImages.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Galería de Fotos ({allImages.length} {allImages.length === 1 ? 'Foto' : 'Fotos'})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition shadow-xs cursor-pointer"
                  title="Ampliar foto a pantalla completa"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pantalla Completa</span>
                </button>
              </div>

              {/* Main Photo Showcase */}
              <div className="relative w-full h-64 sm:h-72 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-center p-3 overflow-hidden group">
                <img
                  src={allImages[selectedImageIndex] || allImages[0]}
                  alt={`${item.model} vista ${selectedImageIndex + 1}`}
                  onClick={() => setIsLightboxOpen(true)}
                  className="max-h-full max-w-full object-contain cursor-zoom-in transition-transform duration-200 group-hover:scale-105"
                />

                {/* Navigation arrows if multiple images */}
                {allImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
                      }}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition backdrop-blur-xs cursor-pointer shadow-md"
                      title="Foto anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition backdrop-blur-xs cursor-pointer shadow-md"
                      title="Foto siguiente"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Counter Badge */}
                <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 text-white text-[11px] font-mono font-bold backdrop-blur-xs">
                  {selectedImageIndex + 1} / {allImages.length}
                </div>
              </div>

              {/* Thumbnails Strip */}
              {allImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
                  {allImages.map((img, idx) => (
                    <button
                      key={`${idx}-${img.slice(0, 20)}`}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative aspect-square w-14 sm:w-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 bg-white dark:bg-slate-900 cursor-pointer ${
                        selectedImageIndex === idx
                          ? 'border-amber-500 ring-2 ring-amber-500/30 scale-105'
                          : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Miniatura ${idx + 1}`}
                        className="w-full h-full object-contain p-1"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 1. Ecuación Financiera B2B Destacada */}
          <div className="p-4.5 rounded-xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800/90 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Ecuación Financiera B2B
                </h4>
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                BCV: {formatBs(rates.bcvRate)} | P2P: {formatBs(rates.binanceUsdtRate)}
              </div>
            </div>

            {/* Visual Formula: Compra + Envío USA + Zoom = Costo Real ➔ Venta = Margen */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              
              {/* Step 1: Compra */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 space-y-1 shadow-xs">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">1. Compra eBay</span>
                <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                  ${item.productCostUsdt} USDT
                </div>
                <span className="text-[10px] text-slate-500 font-mono block truncate">
                  {formatBs(item.productCostUsdt * rates.binanceUsdtRate)}
                </span>
              </div>

              {/* Step 2: Envíos USA + Zoom */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 space-y-1 shadow-xs">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">2. Envíos (USA+Zoom)</span>
                <div className="font-mono font-bold text-sky-700 dark:text-sky-300 text-sm">
                  +${((item.usShippingCostUsdt || 0) + zoomCostUsdt).toFixed(2)} USDT
                </div>
                <span className="text-[10px] text-slate-500 font-mono block truncate">
                  Zoom: {item.zoomCostStatus === 'known' ? `${item.zoomCostBcv} BCV` : 'En espera'}
                </span>
              </div>

              {/* Step 3: Costo Real Total */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 space-y-1 shadow-xs">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">3. Costo Real Final</span>
                <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {formatUsdt(realCostUsdt)}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block truncate">
                  {formatBs(realCostBs)}
                </span>
              </div>

              {/* Step 4: Precio Venta & Margen Elegante */}
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-1 shadow-xs">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-semibold block">
                  {isSold ? '4. Vendido Final' : '4. Venta Prospectada'}
                </span>
                <div className="font-mono font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                  {isSold ? formatUsdt(item.soldPriceUsdt) : formatUsdt(item.projectedPriceUsdt)}
                </div>
                <div className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                  <span>+${activeProfit.profitUsdt}</span>
                  <span>+{activeProfit.marginPercent}%</span>
                </div>
              </div>
            </div>

            {/* Sub-bar Margen Highlight */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs">
              <span className="text-emerald-800 dark:text-emerald-300 font-medium">Margen de Ganancia Neto Calculado:</span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                +${activeProfit.profitUsdt} USDT ({activeProfit.marginPercent}% de retorno sobre costo real)
              </span>
            </div>
          </div>

          {/* 2. Identificadores Técnicos (IMEI, Seriales, Guías) */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800/90 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Identificadores Técnicos &amp; Serialización
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* IMEI 1 Tag */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 shadow-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">IMEI 1 (Principal):</span>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded font-mono text-xs border border-slate-200 dark:border-slate-700/60 inline-flex items-center mt-1">
                    {primaryImei || 'No registrado'}
                  </span>
                </div>
                {primaryImei && (
                  <button
                    onClick={() => handleCopyText(primaryImei, 'imei')}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    title="Copiar IMEI"
                  >
                    {copiedImei ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* IMEI 2 Tag (si aplica) */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 shadow-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">IMEI 2 / eSIM:</span>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-mono text-xs border border-slate-200 dark:border-slate-700/60 inline-flex items-center mt-1">
                    {item.imei2 || 'N/A (Físico único)'}
                  </span>
                </div>
              </div>

              {/* Order Number de eBay */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/80 dark:border-amber-900/60 flex items-center justify-between gap-2 shadow-xs">
                <div className="truncate">
                  <span className="text-amber-800 dark:text-amber-400 text-[10px] uppercase font-bold flex items-center gap-1">
                    <span>🧾 Número de Orden eBay:</span>
                  </span>
                  <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded font-mono text-xs font-bold border border-amber-200 dark:border-amber-800/60 inline-flex items-center mt-1 truncate max-w-[200px]">
                    {item.ebayOrderNumber ? `#${item.ebayOrderNumber}` : 'Sin orden asignada'}
                  </span>
                </div>
                {item.ebayOrderNumber && (
                  <button
                    onClick={() => handleCopyText(item.ebayOrderNumber!, 'order')}
                    className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-950/60 text-amber-700 dark:text-amber-400 transition cursor-pointer"
                    title="Copiar Order Number de eBay"
                  >
                    {copiedOrder ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* Tracking USA Tag */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 shadow-xs">
                <div className="truncate">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">Guía EE.UU. (Carrier: {carrierData.shortName}):</span>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded font-mono text-xs border border-slate-200 dark:border-slate-700/60 inline-flex items-center mt-1 truncate max-w-[200px]">
                    {item.usTrackingNumber || 'Sin guía asignada'}
                  </span>
                </div>
                {item.usTrackingNumber && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleCopyText(item.usTrackingNumber, 'tracking')}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                      title="Copiar Guía"
                    >
                      {copiedTracking ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a
                      href={officialTrackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600 dark:text-sky-400 hover:underline transition"
                      title={`Rastrear en portal oficial de ${carrierData.shortName}`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>

              {/* Estado Físico & Batería */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 shadow-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">Condición &amp; Batería:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-slate-800 dark:text-slate-200 font-medium">{item.physicalGrade || item.condition}</span>
                    {item.batteryHealth && (
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300 font-mono text-xs font-bold">
                        🔋 {item.batteryHealth}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Accesorios Incluidos */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 shadow-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">Accesorios Incluidos:</span>
                  <span className={`text-xs inline-block mt-1 ${item.accessories ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-slate-400 font-normal italic'}`}>
                    {item.accessories || 'Ninguno (solo equipo)'}
                  </span>
                </div>
              </div>

              {/* Información de Zoom (Solo si está prealertado o tiene guía Zoom) */}
              {item.isPrealerted && (
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-purple-200/80 dark:border-purple-800/60 flex flex-wrap items-center justify-between gap-2 shadow-xs sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Agencia Zoom:</span>
                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 px-2 py-0.5 rounded">
                      🏢 {item.zoomAgency || 'ZOOM Barinas'}
                    </span>
                  </div>
                  {item.zoomTrackingNumber && (
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="text-slate-500 text-[10px] uppercase font-semibold">Guía Zoom:</span>
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded font-bold border border-slate-200 dark:border-slate-700">
                        {item.zoomTrackingNumber}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 3. Control Operativo Logístico (Prealerta / Pago Zoom / Retiro) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Prealerta Zoom */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              item.isPrealerted 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800/60 dark:text-emerald-300' 
                : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-800/60 dark:text-rose-300 sm:col-span-3'
            }`}>
              <div className="text-xs">
                <span className="block font-semibold">Prealerta Zoom Casillero:</span>
                <span className="text-[11px]">
                  {item.isPrealerted 
                    ? '✅ Registrado con la guía EE.UU.' 
                    : '⚠️ Pendiente por prealertar (Habilita el flete y retiro Zoom)'}
                </span>
              </div>
              <button
                onClick={() => onTogglePrealert(item.id)}
                className="px-2.5 py-1 rounded bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer shadow-xs shrink-0"
              >
                {item.isPrealerted ? 'Desmarcar' : 'Marcar Prealertado'}
              </button>
            </div>

            {/* Pagado Zoom (Solo visible si está prealertado) */}
            {item.isPrealerted && (
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                item.isZoomPaid 
                  ? 'bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-950/30 dark:border-sky-800/60 dark:text-sky-300' 
                  : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800/60 dark:text-amber-300'
              }`}>
                <div className="text-xs">
                  <span className="block font-semibold">Flete Zoom:</span>
                  <span className="text-[11px]">{item.isZoomPaid ? '✅ Pagado' : '⏳ Pendiente'}</span>
                </div>
                <button
                  onClick={() => onToggleZoomPaid(item.id)}
                  className="px-2 py-1 rounded bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer shadow-xs"
                >
                  {item.isZoomPaid ? 'No pagado' : 'Marcar Pagado'}
                </button>
              </div>
            )}

            {/* Retirado Zoom (Solo visible si está prealertado) */}
            {item.isPrealerted && (
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                item.isZoomPickedUp 
                  ? 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-950/30 dark:border-purple-800/60 dark:text-purple-300' 
                  : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300'
              }`}>
                <div className="text-xs">
                  <span className="block font-semibold">Retirado en Zoom:</span>
                  <span className="text-[11px]">{item.isZoomPickedUp ? '✅ Retirado' : '🏢 En custodia'}</span>
                </div>
                <button
                  onClick={() => onToggleZoomPickup(item.id)}
                  className="px-2 py-1 rounded bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer shadow-xs"
                >
                  {item.isZoomPickedUp ? 'En custodia' : 'Marcar Retirado'}
                </button>
              </div>
            )}
          </div>

          {/* 4. Tiempos & Ciclo de Rotación del Equipo */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Ciclo de Rotación &amp; Tiempos Logísticos
                </h4>
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${timeMetrics.badgeColor}`}>
                {timeMetrics.badgeLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Fecha Compra eBay</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                  {item.purchaseDate || 'Sin registrar'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Días Transcurridos</span>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400 block mt-0.5">
                  {timeMetrics.daysSincePurchase} {timeMetrics.daysSincePurchase === 1 ? 'día' : 'días'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Retiro Zoom Vzla</span>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400 block mt-0.5">
                  {item.zoomPickupDate || (item.isZoomPickedUp ? 'Retirado' : 'Pendiente')}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Velocidad de Venta</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                  {isSold && timeMetrics.daysToSell !== undefined ? `${timeMetrics.daysToSell} días` : 'En inventario'}
                </span>
              </div>
            </div>
          </div>

          {/* 5. Datos de Venta & Cliente (Si está vendido) */}
          {item.status === 'vendido' && (item.buyerName || item.buyerPhone || item.buyerIdNumber || item.receiptNumber) && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800/90 text-xs space-y-2">
              <div className="font-bold text-slate-900 dark:text-slate-200 flex items-center justify-between">
                <span>Comprobante de Entrega &amp; Cliente Vinculado:</span>
                {item.receiptNumber && (
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                    Control #{item.receiptNumber}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 text-xs pt-1">
                {item.buyerName && <div><span className="text-slate-500">Cliente:</span> {item.buyerName}</div>}
                {item.buyerIdNumber && <div><span className="text-slate-500">Cédula / RIF:</span> {item.buyerIdNumber}</div>}
                {item.buyerPhone && <div><span className="text-slate-500">Teléfono:</span> {item.buyerPhone}</div>}
                {item.soldPaymentMethod && <div><span className="text-slate-500">Método de Pago:</span> {item.soldPaymentMethod}</div>}
              </div>
            </div>
          )}

          {/* Notas */}
          {item.notes && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300">
              <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Observaciones Técnicas:</span>
              {item.notes}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/90">
          <div className="flex items-center gap-2">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-600 dark:text-rose-400">¿Eliminar este iPhone?</span>
                <button
                  onClick={() => onDelete(item.id)}
                  className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  Sí, eliminar
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs transition cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenSocialPost && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSocialPost(item);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Post Redes</span>
              </button>
            )}

            {onOpenSalesReceipt && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSalesReceipt(item);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 text-xs font-semibold transition cursor-pointer"
                title="Generar o ver Nota de Entrega y Factura PDF"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Nota de Entrega / PDF</span>
              </button>
            )}

            {onReturnToInventory && item.status === 'vendido' && (
              <button
                onClick={() => {
                  onClose();
                  onReturnToInventory(item);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 text-xs font-semibold transition cursor-pointer"
                title="Devolver este iPhone a inventario disponible para volver a facturar"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Devolver a Inventario</span>
              </button>
            )}

            {item.status === 'vendido' && onToggleArchivePhone && (
              <button
                onClick={() => {
                  onToggleArchivePhone(item.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  item.isArchived
                    ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/50'
                    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title={item.isArchived ? 'Desarchivar (regresar a lista activa de vendidos)' : 'Archivar este teléfono vendido para limpiar la lista activa'}
              >
                {item.isArchived ? (
                  <>
                    <ArchiveRestore className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Desarchivar</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Archivar Vendido</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              <span>Editar</span>
            </button>
          </div>
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {isLightboxOpen && allImages.length > 0 && (
        <div 
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center"
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-amber-400 transition cursor-pointer"
              title="Cerrar (Esc)"
            >
              <X className="w-6 h-6" />
            </button>

            <img
              src={allImages[selectedImageIndex] || allImages[0]}
              alt={item.model}
              className="max-h-[78vh] max-w-full object-contain rounded-xl shadow-2xl bg-slate-950/40 p-2"
            />

            {allImages.length > 1 && (
              <div className="flex items-center justify-between w-full max-w-md mt-4 text-white text-xs px-2">
                <button
                  type="button"
                  onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>
                <span className="font-mono font-bold text-sm">
                  {selectedImageIndex + 1} de {allImages.length}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition flex items-center gap-1 cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

