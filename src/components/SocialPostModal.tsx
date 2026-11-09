import React, { useState } from 'react';
import { PhoneItem, CurrencyRates } from '../types';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  MessageSquare, 
  Instagram, 
  ShoppingBag, 
  Sparkles,
  ExternalLink,
  Layers,
  Smartphone,
  Download,
  Image as ImageIcon
} from 'lucide-react';
import { formatUsdt, formatBs, usdtToBs } from '../utils/calculations';
import { getPresetIPhoneImage } from '../data/iphoneImages';

interface SocialPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPhone: PhoneItem | null;
  allPhones: PhoneItem[];
  rates: CurrencyRates;
}

type ChannelType = 'whatsapp' | 'instagram' | 'marketplace' | 'catalog_broadcast';

export const SocialPostModal: React.FC<SocialPostModalProps> = ({
  isOpen,
  onClose,
  selectedPhone,
  allPhones,
  rates,
}) => {
  const [activeChannel, setActiveChannel] = useState<ChannelType>('whatsapp');
  const [storeName, setStoreName] = useState('Prada Store');
  const [contactPhone, setContactPhone] = useState('0412-5166645');
  const [locationCity, setLocationCity] = useState('Barinas');
  const [includeBsPrice, setIncludeBsPrice] = useState(false);
  const [includeAccessories, setIncludeAccessories] = useState(false);
  const [includeWarranty, setIncludeWarranty] = useState(false);
  const [includeCallToAction, setIncludeCallToAction] = useState(true);
  const [copied, setCopied] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);

  // Phone to use (or multi-selection mode)
  const phone = selectedPhone || allPhones.find(p => p.status === 'disponible_para_venta') || allPhones[0];

  if (!isOpen || !phone) return null;

  const priceUsdt = phone.status === 'vendido' ? (phone.soldPriceUsdt || phone.projectedPriceUsdt) : phone.projectedPriceUsdt;
  const priceBs = usdtToBs(priceUsdt, rates);

  // Foto del equipo (foto propia cargada o render predeterminado oficial de Apple)
  const phoneImage = phone.primaryImage || (phone.images && phone.images[0]) || getPresetIPhoneImage(phone.model, phone.color);

  const generatePostContent = (): string => {
    const accessoriesText = phone.accessories?.trim() 
      ? phone.accessories 
      : 'Solo equipo (sin accesorios)';
    const batteryText = phone.batteryHealth ? `🔋 Batería: ${phone.batteryHealth}%` : '🔋 Batería: Excelente';
    const warrantyText = phone.warrantyDays ? `🛡️ Garantía: ${phone.warrantyDays} días` : '🛡️ Garantía: 30 días';
    const priceTextUsdt = `$${priceUsdt} USDT / Dólares`;
    const priceTextBs = includeBsPrice ? ` (o ${formatBs(priceBs)} a tasa del día)` : '';

    if (activeChannel === 'whatsapp') {
      return `🔥 ¡DISPONIBLE PARA ENTREGA INMEDIATA! 🔥

📱 ${phone.model}
✨ Condición: ${phone.condition}
💾 Almacenamiento: ${phone.storage || '128GB'}
🎨 Color: ${phone.color || 'Original'}
${batteryText}
🔓 Liberación: Libre de fábrica

${includeAccessories && phone.accessories?.trim() ? `🎁 Accesorios: ${accessoriesText}\n` : ''}${includeWarranty ? `${warrantyText}\n` : ''}💰 PRECIO ESPECIAL: ${priceTextUsdt}${priceTextBs}

📍 Entregas: ${locationCity}
💳 Métodos de pago: Binance USDT, Efectivo $

${includeCallToAction ? `📲 Escríbeme al privado para apartarlo hoy mismo: ${contactPhone}` : ''}`;
    }

    if (activeChannel === 'instagram') {
      return `🔥 ¡DISPONIBLE PARA ENTREGA INMEDIATA! 🔥

📱 ${phone.model}
✨ Condición: ${phone.condition}
💾 Almacenamiento: ${phone.storage || '128GB'}
🎨 Color: ${phone.color || 'Original'}
${batteryText}
🔓 Liberación: Libre de fábrica

${includeAccessories && phone.accessories?.trim() ? `🎁 Accesorios: ${accessoriesText}\n` : ''}${includeWarranty ? `🛡️ ${warrantyText}\n` : ''}💰 PRECIO ESPECIAL: ${priceTextUsdt}${priceTextBs}

📍 Entregas: ${locationCity}
💳 Métodos de pago: Binance USDT, Efectivo $

${includeCallToAction ? `📲 Escríbeme al privado para apartarlo hoy mismo: ${contactPhone}` : ''}

#TelefonosVenezuela #iPhonesVenezuela #Barinas #VentaDeTelefonos #AppleVenezuela`;
    }

    if (activeChannel === 'marketplace') {
      return `🔥 ${phone.model} - IMPECABLE ESTADO LIBRE

- Condición: ${phone.condition}
- Capacidad: ${phone.storage || '128GB'}
- Color: ${phone.color || 'Original'}
- ${batteryText}
- Liberación: Libre de fábrica

PRECIO: $${priceUsdt} USDT / Dólares
Ubicación: ${locationCity}
Métodos de pago: Binance USDT, Efectivo $

📲 WhatsApp directo: ${contactPhone}`;
    }

    // Catalog broadcast (List of all available items)
    const availablePhones = allPhones.filter(p => p.status === 'disponible_para_venta' || p.status === 'en_agencia_zoom');
    const itemsListText = availablePhones.map((p, idx) => {
      const pPrice = p.projectedPriceUsdt;
      const pBs = usdtToBs(pPrice, rates);
      const bText = p.batteryHealth ? ` [Bat: ${p.batteryHealth}%]` : '';
      return `${idx + 1}. 📱 *${p.model}* (${p.condition}, ${p.storage || '128GB'})${bText}\n   💵 *${formatUsdt(pPrice)}*${includeBsPrice ? ` ~ ${formatBs(pBs)}` : ''}`;
    }).join('\n\n');

    return `📢 *LISTA DE TELÉFONOS EN STOCK - ${storeName.toUpperCase()}* 📢
📅 *Actualizado:* ${new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })}

${itemsListText || '📱 No hay equipos marcados como disponibles en este momento.'}

📍 Entregas en ${locationCity}
💳 Aceptamos Binance USDT, Efectivo $.

📲 *Pedidos & Consultas al:* ${contactPhone}`;
  };

  const textContent = generatePostContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = async () => {
    try {
      const response = await fetch(phoneImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${phone.model.replace(/\s+/g, '_')}_${phone.color || 'phone'}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      window.open(phoneImage, '_blank');
    }
  };

  const handleCopyImage = async () => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = phoneImage;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(async (blob) => {
          if (blob && navigator.clipboard && (window as any).ClipboardItem) {
            await navigator.clipboard.write([
              new (window as any).ClipboardItem({ 'image/png': blob })
            ]);
            setImageCopied(true);
            setTimeout(() => setImageCopied(false), 2000);
          } else {
            handleDownloadImage();
          }
        }, 'image/png');
      }
    } catch (err) {
      handleDownloadImage();
    }
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(textContent);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl my-6 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <span>Generador de Publicaciones</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Foto + Texto
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Plantilla limpia con foto predeterminada lista para WhatsApp, Instagram y Marketplace
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channels Tabs */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveChannel('whatsapp')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeChannel === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-white dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Estados WhatsApp</span>
          </button>

          <button
            onClick={() => setActiveChannel('instagram')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeChannel === 'instagram'
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-600/30'
                : 'bg-white dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50'
            }`}
          >
            <Instagram className="w-4 h-4" />
            <span>Instagram / Post</span>
          </button>

          <button
            onClick={() => setActiveChannel('marketplace')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeChannel === 'marketplace'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-white dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Marketplace / Telegram</span>
          </button>

          <button
            onClick={() => setActiveChannel('catalog_broadcast')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeChannel === 'catalog_broadcast'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'bg-white dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Lista Todo el Stock</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          
          {/* Item Selector & Picture Preview */}
          {activeChannel !== 'catalog_broadcast' && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shrink-0 shadow-inner group">
                  <img
                    src={phoneImage}
                    alt={phone.model}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center py-0.5">
                    Foto
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                    Equipo Seleccionado
                  </span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {phone.model} ({phone.storage || '128GB'})
                  </span>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Color: <strong>{phone.color || 'Original'}</strong></span>
                    <span>•</span>
                    <span>Bat: <strong>{phone.batteryHealth || 85}%</strong></span>
                  </div>
                </div>
              </div>

              {/* Quick Image Copy / Download Buttons */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                <div className="text-left sm:text-right">
                  <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {formatUsdt(priceUsdt)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyImage}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    title="Copiar imagen para pegarla en WhatsApp o Instagram"
                  >
                    {imageCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <ImageIcon className="w-3.5 h-3.5 text-amber-500" />}
                    <span>{imageCopied ? '¡Foto Copiada!' : 'Copiar Foto'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadImage}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold transition cursor-pointer"
                    title="Descargar Foto del Teléfono"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-500" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Configuration Toggles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeBsPrice}
                onChange={(e) => setIncludeBsPrice(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              <span>Incluir Precio Bs</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeAccessories}
                onChange={(e) => setIncludeAccessories(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              <span>Accesorios / Regalos</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeWarranty}
                onChange={(e) => setIncludeWarranty(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              <span>Garantía</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeCallToAction}
                onChange={(e) => setIncludeCallToAction(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              <span>Llamado a Acción</span>
            </label>
          </div>

          {/* Quick Customization Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Nombre de tu Tienda</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">WhatsApp de Contacto</label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 font-mono focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Entregas / Ubicación</label>
              <input
                type="text"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Generated Text Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Texto Listo para Publicar:
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {textContent.length} caracteres
              </span>
            </div>

            <textarea
              rows={11}
              readOnly
              value={textContent}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3.5 text-xs text-slate-800 dark:text-slate-200 font-mono leading-relaxed focus:outline-hidden focus:border-slate-400 dark:focus:border-slate-700 select-all"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/80">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition cursor-pointer"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenWhatsApp}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Enviar por WhatsApp</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>¡Copiado al Portapapeles!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Publicación</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
