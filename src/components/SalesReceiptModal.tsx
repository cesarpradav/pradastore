import React, { useState } from 'react';
import { PhoneItem, CurrencyRates } from '../types';
import { 
  X, 
  Printer, 
  Share2, 
  Check, 
  Copy, 
  ShieldCheck, 
  Smartphone, 
  Calendar, 
  User, 
  DollarSign,
  FileText
} from 'lucide-react';
import { formatUsdt, formatBs, usdtToBs } from '../utils/calculations';

interface SalesReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone: PhoneItem | null;
  rates: CurrencyRates;
  onUpdatePhoneSaleData?: (id: string, buyerData: { buyerName?: string; buyerPhone?: string; buyerIdNumber?: string; soldPaymentMethod?: string; warrantyDays?: number }) => void;
}

export const SalesReceiptModal: React.FC<SalesReceiptModalProps> = ({
  isOpen,
  onClose,
  phone,
  rates,
  onUpdatePhoneSaleData,
}) => {
  const [storeName, setStoreName] = useState('TechStore Import');
  const [storePhone, setStorePhone] = useState('0414-1234567');
  const [storeInstagram, setStoreInstagram] = useState('@techstore.vzla');
  const [storeAddress, setStoreAddress] = useState('Caracas, Venezuela');
  
  const [buyerName, setBuyerName] = useState(phone?.buyerName || 'Cliente Particular');
  const [buyerPhone, setBuyerPhone] = useState(phone?.buyerPhone || '');
  const [buyerIdNumber, setBuyerIdNumber] = useState(phone?.buyerIdNumber || 'V-');
  const [paymentMethod, setPaymentMethod] = useState(phone?.soldPaymentMethod || 'Dólares Efectivo / USDT');
  const [warrantyDays, setWarrantyDays] = useState<number>(phone?.warrantyDays || 30);
  const [receiptNumber, setReceiptNumber] = useState(phone?.receiptNumber || `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !phone) return null;

  const soldPrice = phone.soldPriceUsdt || phone.projectedPriceUsdt || 0;
  const soldPriceBs = usdtToBs(soldPrice, rates);
  const saleDateFormatted = phone.soldDate 
    ? new Date(phone.soldDate).toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' });

  const handlePrint = () => {
    window.print();
  };

  const generateReceiptText = () => {
    return `🧾 *COMPROBANTE DE COMPRA & GARANTÍA DIGITAL*
#️⃣ *Recibo:* ${receiptNumber}
📅 *Fecha:* ${saleDateFormatted}

🏢 *Vendedor:* ${storeName} (${storePhone} | ${storeInstagram})
👤 *Cliente:* ${buyerName} ${buyerIdNumber ? `(CI: ${buyerIdNumber})` : ''}
📞 *Teléfono:* ${buyerPhone || 'No registrado'}

📱 *EQUIPO VENDIDO:*
• *Modelo:* ${phone.model}
• *Condición:* ${phone.condition}
• *Capacidad:* ${phone.storage || '128GB'}
• *IMEI:* ${phone.imei || 'Registrado en sistema'}
• *Batería:* ${phone.batteryHealth ? `${phone.batteryHealth}%` : 'Excelente'}
• *Accesorios:* ${phone.accessories || 'Ninguno (solo equipo)'}

💰 *DETALLE DE PAGO:*
• *Monto Total:* $${soldPrice} USDT / Dólares
• *Equivalente Bs:* ${formatBs(soldPriceBs)}
• *Método de Pago:* ${paymentMethod}

🛡️ *TÉRMINOS DE GARANTÍA (${warrantyDays} DÍAS):*
1. Cubre exclusivamente defectos de fábrica de componentes internos.
2. Quedan excluidos: Golpes, caídas, pantalla rota, humedad o manipulación por terceros.
3. Conserve este comprobante y el serial/IMEI intacto.

¡Gracias por su compra y preferencia! ✨`;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateReceiptText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(generateReceiptText());
    const phoneClean = buyerPhone.replace(/\D/g, '');
    const url = phoneClean 
      ? `https://api.whatsapp.com/send?phone=${phoneClean}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl my-6 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="print:hidden px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                Comprobante de Venta & Certificado de Garantía
              </h3>
              <p className="text-xs text-slate-400">
                Genera comprobantes digitales listos para imprimir o enviar por WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Customization Form (Hidden in Print) */}
        <div className="print:hidden p-4 bg-slate-950/60 border-b border-slate-800 text-xs space-y-3">
          <div className="font-bold text-slate-300 text-[11px] uppercase tracking-wider">
            Datos del Comprobante (Editables):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Nombre del Cliente</label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-100 text-xs focus:outline-hidden focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Cédula / RIF</label>
              <input
                type="text"
                value={buyerIdNumber}
                onChange={(e) => setBuyerIdNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-100 text-xs focus:outline-hidden focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">WhatsApp Cliente</label>
              <input
                type="text"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-100 text-xs focus:outline-hidden focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Días Garantía</label>
              <select
                value={warrantyDays}
                onChange={(e) => setWarrantyDays(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 text-xs focus:outline-hidden focus:border-amber-500"
              >
                <option value={15}>15 Días</option>
                <option value={30}>30 Días (Estándar)</option>
                <option value={60}>60 Días</option>
                <option value={90}>90 Días</option>
              </select>
            </div>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-6 sm:p-8 bg-white text-slate-900 max-h-[65vh] print:max-h-none overflow-y-auto space-y-6">
          
          {/* Header Receipt */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-900 pb-4">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">
                {storeName}
              </h2>
              <p className="text-xs text-slate-600 font-medium">{storeAddress}</p>
              <p className="text-xs text-slate-600 font-mono">WhatsApp: {storePhone} • {storeInstagram}</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-0.5 bg-slate-900 text-white font-mono font-bold text-xs rounded mb-1">
                {receiptNumber}
              </span>
              <p className="text-xs text-slate-600 font-mono">{saleDateFormatted}</p>
            </div>
          </div>

          {/* Customer & Transaction Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cliente:</span>
              <p className="font-bold text-slate-900 text-sm">{buyerName}</p>
              {buyerIdNumber && <p className="text-slate-600 font-mono">C.I.: {buyerIdNumber}</p>}
              {buyerPhone && <p className="text-slate-600 font-mono">Tel: {buyerPhone}</p>}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Forma de Pago:</span>
              <p className="font-bold text-slate-900">{paymentMethod}</p>
              <p className="text-slate-600 font-mono text-[11px]">Tasa referencial: {formatBs(rates.binanceUsdtRate)}/USDT</p>
            </div>
          </div>

          {/* Equipment Table */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Detalle del Equipo Adquirido
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Descripción</th>
                    <th className="p-3">Especificaciones / IMEI</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-3 font-bold text-slate-900">
                      {phone.model}
                      <span className="block text-[11px] font-normal text-slate-500">
                        Condición: {phone.condition} {phone.batteryHealth ? `• Salud Batería: ${phone.batteryHealth}%` : ''}
                      </span>
                      {phone.accessories ? (
                        <span className="block text-[11px] font-normal text-emerald-700">
                          Accesorios: {phone.accessories}
                        </span>
                      ) : (
                        <span className="block text-[11px] font-normal text-slate-500">
                          Accesorios: Ninguno (solo equipo)
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      <div>Capacidad: {phone.storage || '128GB'}</div>
                      <div>Color: {phone.color || 'Original'}</div>
                      <div>IMEI: {phone.imei || 'Registrado en sistema'}</div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 text-sm">
                      ${soldPrice} USDT
                      <span className="block text-[11px] font-normal text-slate-500">
                        {formatBs(soldPriceBs)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Box */}
          <div className="flex justify-end">
            <div className="w-64 bg-slate-900 text-white p-4 rounded-xl space-y-1 text-right">
              <div className="text-xs text-slate-400">Total Cancelado:</div>
              <div className="text-xl font-black font-mono text-emerald-400">
                ${soldPrice} <span className="text-xs text-white">USDT / USD</span>
              </div>
              <div className="text-xs font-mono text-slate-300">
                Equivalente: {formatBs(soldPriceBs)}
              </div>
            </div>
          </div>

          {/* Warranty Terms & Conditions */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-[11px] space-y-2 text-slate-700">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 uppercase text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Certificado de Garantía Limitada ({warrantyDays} Días Continuos)</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-600 leading-relaxed">
              <li>Cubre defectos de funcionamiento interno de fábrica (placa lógica, cámaras, micrófonos).</li>
              <li><strong>Exclusiones:</strong> Caídas, golpes, presión en pantalla, contacto con líquidos, sobretensiones eléctricas o sellos de seguridad alterados.</li>
              <li>Para cualquier reclamo es indispensable presentar este comprobante y que el serial/IMEI coincida con el registro.</li>
            </ul>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-4 text-center text-xs text-slate-500">
            <div className="border-t border-slate-300 pt-2">
              <span className="font-bold text-slate-700 block">{storeName}</span>
              Firma y Sello Autorizado
            </div>
            <div className="border-t border-slate-300 pt-2">
              <span className="font-bold text-slate-700 block">{buyerName}</span>
              Firma del Comprador / Conforme
            </div>
          </div>

        </div>

        {/* Modal Footer Actions (Hidden in Print) */}
        <div className="print:hidden px-6 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/80">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Enviar WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
