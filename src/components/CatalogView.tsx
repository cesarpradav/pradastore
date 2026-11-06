import React, { useState } from 'react';
import { PhoneItem, CurrencyRates } from '../types';
import { 
  Smartphone, 
  Search, 
  Filter, 
  Share2, 
  Battery, 
  ShieldCheck, 
  Gift, 
  Sparkles, 
  ArrowRight, 
  Check, 
  ExternalLink,
  MessageCircle,
  Copy,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { formatUsdt, formatBs, usdtToBs } from '../utils/calculations';

interface CatalogViewProps {
  phones: PhoneItem[];
  rates: CurrencyRates;
  currencyView: 'USDT' | 'BS' | 'BOTH';
  onBackToAdmin: () => void;
  onOpenSocialPost: (phone: PhoneItem) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  phones,
  rates,
  currencyView,
  onBackToAdmin,
  onOpenSocialPost,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<'all' | 'apple' | 'samsung' | 'google' | 'other'>('all');
  const [filterAvailability, setFilterAvailability] = useState<'all' | 'disponible' | 'en_camino'>('disponible');
  const [copiedCatalog, setCopiedCatalog] = useState(false);

  // Filtrar solo equipos para venta (disponibles, reservados o en camino a Venezuela)
  const catalogItems = phones.filter((item) => {
    // Solo mostrar los que no estén vendidos
    const isCatalogCandidate = 
      item.status === 'disponible_para_venta' || 
      item.status === 'reservado' || 
      item.status === 'en_agencia_zoom' || 
      item.status === 'en_casillero_zoom' || 
      item.status === 'en_transito_usa';

    if (!isCatalogCandidate) return false;

    // Filtro disponibilidad
    if (filterAvailability === 'disponible') {
      if (item.status !== 'disponible_para_venta' && item.status !== 'reservado') return false;
    } else if (filterAvailability === 'en_camino') {
      if (item.status === 'disponible_para_venta' || item.status === 'reservado') return false;
    }

    // Filtro de marca
    const modelUpper = item.model.toUpperCase();
    if (selectedBrand === 'apple' && !modelUpper.includes('IPHONE') && !modelUpper.includes('APPLE')) return false;
    if (selectedBrand === 'samsung' && !modelUpper.includes('SAMSUNG') && !modelUpper.includes('GALAXY')) return false;
    if (selectedBrand === 'google' && !modelUpper.includes('PIXEL') && !modelUpper.includes('GOOGLE')) return false;
    if (selectedBrand === 'other' && (modelUpper.includes('IPHONE') || modelUpper.includes('SAMSUNG') || modelUpper.includes('PIXEL'))) return false;

    // Buscador
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchModel = item.model.toLowerCase().includes(term);
      const matchStorage = item.storage?.toLowerCase().includes(term);
      const matchColor = item.color?.toLowerCase().includes(term);
      return matchModel || matchStorage || matchColor;
    }

    return true;
  });

  const handleCopyFullCatalog = () => {
    const available = catalogItems.filter(p => p.status === 'disponible_para_venta');
    const onWay = catalogItems.filter(p => p.status !== 'disponible_para_venta' && p.status !== 'reservado');

    let text = `🔥 *CATÁLOGO DE TELÉFONOS DISPONIBLES* 🔥\n`;
    text += `📅 Actualizado al día de hoy | Tasa: ${formatBs(rates.binanceUsdtRate)}/USDT\n\n`;

    if (available.length > 0) {
      text += `📱 *DISPONIBLES PARA ENTREGA INMEDIATA:*\n`;
      available.forEach((p, idx) => {
        const bs = usdtToBs(p.projectedPriceUsdt, rates);
        const bat = p.batteryHealth ? ` • Bat: ${p.batteryHealth}%` : '';
        text += `${idx + 1}. *${p.model}* (${p.condition}${bat})\n   💵 *${formatUsdt(p.projectedPriceUsdt)}* (~ ${formatBs(bs)})\n`;
      });
      text += `\n`;
    }

    if (onWay.length > 0) {
      text += `✈️ *PRÓXIMOS EN LLEGAR (PUEDES APARTAR):*\n`;
      onWay.forEach((p, idx) => {
        const bs = usdtToBs(p.projectedPriceUsdt, rates);
        text += `${idx + 1}. *${p.model}* (${p.condition})\n   💵 *${formatUsdt(p.projectedPriceUsdt)}* (~ ${formatBs(bs)})\n`;
      });
      text += `\n`;
    }

    text += `🛡️ *Garantía de 30 días en todos los equipos*\n`;
    text += `🎁 Incluyen accesorios de cortesía\n`;
    text += `💳 Recibimos Binance USDT, Efectivo $, Pago Móvil.\n\n`;
    text += `📲 *Pregunta por tu equipo favorito al privado!*`;

    navigator.clipboard.writeText(text);
    setCopiedCatalog(true);
    setTimeout(() => setCopiedCatalog(false), 2000);
  };

  const handleAskWhatsApp = (phone: PhoneItem) => {
    const text = `Hola! Vi en el catálogo que tienen disponible el *${phone.model}* en *$${phone.projectedPriceUsdt} USDT*. ¿Aún está disponible para entrega o apartado?`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Navigation */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToAdmin}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Volver a la vista de administración"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Volver a Inventario</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-slate-100">
                Catálogo & Vitrina Comercial
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                Modo Cliente
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Vista limpia sin costos ni rastreos, diseñada para mostrar o compartir precios al público
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyFullCatalog}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/30 cursor-pointer"
          >
            {copiedCatalog ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCatalog ? '¡Lista Copiada!' : 'Copiar Lista para WhatsApp'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Brand Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setSelectedBrand('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                selectedBrand === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({phones.filter(p => p.status !== 'vendido').length})
            </button>
            <button
              onClick={() => setSelectedBrand('apple')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                selectedBrand === 'apple'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              🍎 iPhones
            </button>
            <button
              onClick={() => setSelectedBrand('samsung')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                selectedBrand === 'samsung'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              🌌 Samsung Galaxy
            </button>
            <button
              onClick={() => setSelectedBrand('google')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                selectedBrand === 'google'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              🔍 Google Pixel
            </button>
          </div>

          {/* Availability Switch */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setFilterAvailability('disponible')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                filterAvailability === 'disponible' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ✅ Disponibles Hoy
            </button>
            <button
              onClick={() => setFilterAvailability('en_camino')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                filterAvailability === 'en_camino' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ✈️ Próximos en Llegar
            </button>
            <button
              onClick={() => setFilterAvailability('all')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                filterAvailability === 'all' ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ver Todo
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por modelo, capacidad (ej. iPhone 13, 256GB, Deep Purple)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500"
          />
        </div>
      </div>

      {/* Catalog Grid Cards */}
      {catalogItems.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Smartphone className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No hay teléfonos en este filtro</h3>
          <p className="text-xs text-slate-500">Prueba cambiando los filtros de marca o disponibilidad.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {catalogItems.map((item) => {
            const priceBs = usdtToBs(item.projectedPriceUsdt, rates);
            const isAvailableNow = item.status === 'disponible_para_venta';
            const isReserved = item.status === 'reservado';

            return (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg transition duration-200 hover:shadow-emerald-950/20 group"
              >
                {/* Photo Display Banner */}
                {(item.primaryImage || (item.images && item.images.length > 0)) ? (
                  <div className="relative w-full h-48 bg-slate-950/80 border-b border-slate-800 flex items-center justify-center p-3 overflow-hidden">
                    <img
                      src={item.primaryImage || item.images![0]}
                      alt={item.model}
                      className="max-h-full max-w-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {item.images && item.images.length > 1 && (
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold backdrop-blur-xs">
                        +{item.images.length - 1} fotos
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="p-5 flex flex-col justify-between flex-1 space-y-4">
                  {/* Header Card */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        isAvailableNow
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : isReserved
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      }`}
                    >
                      {isAvailableNow ? '✅ Disponible Hoy' : isReserved ? '⏳ Reservado' : '✈️ En Camino (Aparta Ya)'}
                    </span>

                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800">
                      {item.condition}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-slate-100 text-base group-hover:text-amber-400 transition leading-snug">
                    {item.model}
                  </h4>

                  {/* Specs Badges */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5 text-[11px]">
                    {item.storage && (
                      <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono font-semibold">
                        💾 {item.storage}
                      </span>
                    )}
                    {item.color && (
                      <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                        🎨 {item.color}
                      </span>
                    )}
                    {item.batteryHealth && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-mono font-bold flex items-center gap-1">
                        <Battery className="w-3 h-3 text-emerald-400" />
                        {item.batteryHealth}% Bat.
                      </span>
                    )}
                  </div>
                </div>

                {/* Extras & Benefits */}
                <div className="space-y-1.5 text-xs border-t border-slate-800/80 pt-3 text-slate-300">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Garantía de {item.warrantyDays || 30} días por escrito</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <Gift className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{item.accessories || 'Solo equipo (sin accesorios)'}</span>
                  </div>
                </div>

                {/* Price Box */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Precio de Venta</span>
                    <div className="text-xl font-black font-mono text-emerald-400">
                      ${item.projectedPriceUsdt} <span className="text-xs font-normal text-emerald-300">USDT / $</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Equivalente Bs</span>
                    <span className="font-mono font-bold text-sky-300 text-xs">
                      {formatBs(priceBs)}
                    </span>
                  </div>
                </div>

                {/* Customer Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleAskWhatsApp(item)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Consultar</span>
                  </button>

                  <button
                    onClick={() => onOpenSocialPost(item)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                    title="Generar publicación rápida para redes sociales"
                  >
                    <Share2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Crear Post</span>
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
