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
  Smartphone
} from 'lucide-react';
import { formatUsdt, formatBs, usdtToBs } from '../utils/calculations';

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
  const [storeName, setStoreName] = useState('TechStore Vzla');
  const [contactPhone, setContactPhone] = useState('0414-1234567');
  const [locationCity, setLocationCity] = useState('Barinas / Envíos Zoom a todo el país');
  const [includeBsPrice, setIncludeBsPrice] = useState(true);
  const [includeAccessories, setIncludeAccessories] = useState(true);
  const [includeWarranty, setIncludeWarranty] = useState(true);
  const [includeCallToAction, setIncludeCallToAction] = useState(true);
  const [copied, setCopied] = useState(false);

  // Phone to use (or multi-selection mode)
  const phone = selectedPhone || allPhones.find(p => p.status === 'disponible_para_venta') || allPhones[0];

  if (!isOpen || !phone) return null;

  const priceUsdt = phone.status === 'vendido' ? (phone.soldPriceUsdt || phone.projectedPriceUsdt) : phone.projectedPriceUsdt;
  const priceBs = usdtToBs(priceUsdt, rates);

  const generatePostContent = (): string => {
    const accessoriesText = phone.accessories?.trim() 
      ? phone.accessories 
      : 'Solo equipo (sin accesorios)';
    const batteryText = phone.batteryHealth ? `🔋 Batería: ${phone.batteryHealth}% (Excelente rendimiento)` : '🔋 Batería: Excelente estado / 100% operativa';
    const warrantyText = phone.warrantyDays ? `🛡️ Garantía: ${phone.warrantyDays} días` : '🛡️ Garantía: 30 días con nosotros';
    const priceTextUsdt = `$${priceUsdt} USDT / Dólares`;
    const priceTextBs = includeBsPrice ? ` (o ${formatBs(priceBs)} a tasa del día)` : '';

    if (activeChannel === 'whatsapp') {
      return `🔥 *¡DISPONIBLE PARA ENTREGA INMEDIATA!* 🔥

📱 *${phone.model}*
✨ *Condición:* ${phone.condition} (10/10)
💾 *Almacenamiento:* ${phone.storage || '128GB'}
🎨 *Color:* ${phone.color || 'Original'}
${batteryText}
🔓 *Liberación:* Libre de fábrica para Digitel, Movistar y Movilnet (4G/5G)

${includeAccessories && phone.accessories?.trim() ? `🎁 *INCLUYE ACCESORIOS:*\n• ${accessoriesText}\n` : ''}${includeWarranty ? `${warrantyText}\n` : ''}
💰 *PRECIO ESPECIAL:* *${priceTextUsdt}*${priceTextBs}

📍 *Entregas:* ${locationCity}
💳 *Métodos de pago:* Binance USDT, Efectivo $, Pago Móvil, Zelle.

${includeCallToAction ? `📲 *Escríbeme al privado para apartarlo hoy mismo:* ${contactPhone}` : ''}`;
    }

    if (activeChannel === 'instagram') {
      return `✨ ¡NUEVO INGRESO EN STOCK! ✨

¿Buscando renovar tu equipo al mejor precio? Llévate este *${phone.model}* listo para usar y garantizado 🚀

📌 *Ficha Técnica:*
• Condición: ${phone.condition}
• Capacidad: ${phone.storage || '128GB'}
• Color: ${phone.color || 'Original'}
• ${batteryText}
• 100% Libre para todas las operadoras

${includeAccessories && phone.accessories?.trim() ? `📦 *Incluye:* ${accessoriesText}\n` : ''}${includeWarranty ? `🛡️ ${warrantyText}\n` : ''}
💵 *Precio:* ${priceTextUsdt}${priceTextBs}

📍 Entregas personales en ${locationCity}
🛵 Delivery disponible y envíos asegurados por Zoom a nivel nacional.

👇 *Déjanos un DM o haz clic en el enlace de la biografía para más info.*

#TelefonosVenezuela #VentaDeTelefonos #iPhonesVenezuela #Barinas #TechVenezuela #ComprasEbayVenezuela #BinanceVzla #Garantia`;
    }

    if (activeChannel === 'marketplace') {
      return `🔥 ${phone.model} - IMPECABLE ESTADO LIBRE

- Condición: ${phone.condition}
- Capacidad: ${phone.storage || '128GB'}
- Batería: ${phone.batteryHealth ? `${phone.batteryHealth}%` : 'Excelente'}
- Libre para Digitel, Movistar, Movilnet
- Incluye: ${accessoriesText}
- Garantía escrita de ${phone.warrantyDays || 30} días

PRECIO: $${priceUsdt} (Aceptamos USDT Binance, Efectivo, Pago Móvil BCV)
Ubicación: ${locationCity}
Contacto directo por WhatsApp: ${contactPhone}`;
    }

    // Catalog broadcast (List of all available items)
    const availablePhones = allPhones.filter(p => p.status === 'disponible_para_venta' || p.status === 'en_agencia_zoom');
    const itemsListText = availablePhones.map((p, idx) => {
      const pPrice = p.projectedPriceUsdt;
      const pBs = usdtToBs(pPrice, rates);
      const bText = p.batteryHealth ? ` [Bat: ${p.batteryHealth}%]` : '';
      return `${idx + 1}. 📱 *${p.model}* (${p.condition})${bText}\n   💵 *${formatUsdt(pPrice)}*${includeBsPrice ? ` ~ ${formatBs(pBs)}` : ''}`;
    }).join('\n\n');

    return `📢 *LISTA DE TELÉFONOS EN STOCK - ${storeName.toUpperCase()}* 📢
📅 *Actualizado:* ${new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })}
Tasa del día: ${formatBs(rates.binanceUsdtRate)}/USDT

${itemsListText || '📱 No hay equipos marcados como disponibles en este momento.'}

🛡️ *Todos los equipos incluyen garantía de 30 días y accesorios.*
📍 Entregas en ${locationCity}
💳 Aceptamos Binance USDT, Efectivo $, Pago Móvil.

📲 *Pedidos & Consultas al:* ${contactPhone}`;
  };

  const textContent = generatePostContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                  1-Clic
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Copia o envía textos con emojis para WhatsApp, Instagram y Marketplace
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
          
          {/* Item Selector if in single mode */}
          {activeChannel !== 'catalog_broadcast' && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-slate-700">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Equipo Seleccionado</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{phone.model}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">{formatUsdt(priceUsdt)}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">{formatBs(priceBs)}</span>
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
              <span>Regalos / Mica</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeWarranty}
                onChange={(e) => setIncludeWarranty(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              <span>30d Garantía</span>
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
              <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Nombre de tu Tienda / Vendedor</label>
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
              <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Ciudad / Ubicación</label>
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
              rows={10}
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
