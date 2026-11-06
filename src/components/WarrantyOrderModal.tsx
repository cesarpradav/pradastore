import React, { useState, useRef } from 'react';
import { WarrantyOrder, CurrencyRates } from '../types';
import { 
  X, 
  Printer, 
  Share2, 
  Check, 
  Copy, 
  FileText, 
  Download,
  Smartphone, 
  User, 
  DollarSign,
  Battery, 
  Phone, 
  Instagram, 
  CheckCircle2, 
  Calendar,
  AlertTriangle,
  Edit3,
  Loader2,
  FileSpreadsheet,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { formatUsdt, formatBs } from '../utils/calculations';
import { generatePdfFromElement } from '../utils/pdfGenerator';

interface WarrantyOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: WarrantyOrder | null;
  rates: CurrencyRates;
  onUpdateOrder?: (updatedOrder: WarrantyOrder) => void;
  onDeleteOrder?: (order: WarrantyOrder, reOpenSaleModal?: boolean) => void;
}

export const WarrantyOrderModal: React.FC<WarrantyOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  rates,
  onUpdateOrder,
  onDeleteOrder,
}) => {
  const documentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Editable local state in case user wants quick tweaks
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerIdNumber, setEditCustomerIdNumber] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editImei1, setEditImei1] = useState('');
  const [editImei2, setEditImei2] = useState('');
  const [editBatteryHealth, setEditBatteryHealth] = useState<number | undefined>(undefined);
  const [editPhysicalGrade, setEditPhysicalGrade] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('');
  const [editAmountPaidUsdt, setEditAmountPaidUsdt] = useState<number>(0);
  const [editWarrantyDays, setEditWarrantyDays] = useState<number>(7);

  // Initialize edit form when order opens
  React.useEffect(() => {
    if (order) {
      setEditCustomerName(order.customerName || '');
      setEditCustomerIdNumber(order.customerIdNumber || '');
      setEditCustomerPhone(order.customerPhone || '');
      setEditImei1(order.imei1 || '');
      setEditImei2(order.imei2 || '');
      setEditBatteryHealth(order.batteryHealth);
      setEditPhysicalGrade(order.physicalGrade || '');
      setEditPaymentMethod(order.paymentMethod || '');
      setEditAmountPaidUsdt(order.amountPaidUsdt || 0);
      setEditWarrantyDays(order.warrantyDays || 7);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const saleDateFormatted = order.date 
    ? new Date(order.date + 'T12:00:00').toLocaleDateString('es-VE', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : new Date().toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' });

  // Native Print
  const handlePrint = () => {
    window.print();
  };

  // Direct PDF Download with jsPDF & html2canvas
  const handleDownloadPdf = async () => {
    if (!documentRef.current) return;
    setIsDownloadingPdf(true);
    try {
      const safeName = (order.customerName || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Nota_Entrega_${order.controlNumber}_${safeName}.pdf`;
      await generatePdfFromElement(documentRef.current, filename);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Structured WhatsApp Message
  const generateWhatsAppMessage = () => {
    return `📄 *NOTA DE ENTREGA & COMPROBANTE DE COMPRA*
━━━━━━━━━━━━━━━━━━━━
🆔 *Control:* ${order.controlNumber}
📅 *Fecha de Entrega:* ${saleDateFormatted}

🏢 *Vendedor:* ${order.seller.storeName || order.seller.sellerName}
📞 *Contacto:* ${order.seller.sellerPhone}
📍 *Ubicación:* ${order.seller.cityAddress || 'Barinas, Venezuela'}

👤 *DATOS DEL CLIENTE:*
• *Nombre:* ${order.customerName}
• *Cédula:* ${order.customerIdNumber || 'V-'}
• *Teléfono:* ${order.customerPhone || 'Registrado'}

📱 *EQUIPO ENTREGADO (VERIFICADO):*
• *Modelo:* ${order.phoneModel}
• *Capacidad:* ${order.storage || '128 GB'}
• *Color:* ${order.color || 'Original'}
• *IMEI 1 (Principal):* ${order.imei1}
${order.imei2 ? `• *IMEI 2 (eSIM/Secundario):* ${order.imei2}\n` : ''}• *Salud Batería:* ${order.batteryHealth ? `${order.batteryHealth}%` : 'Óptima'}
• *Condición:* ${order.physicalGrade || 'Excelente estado verificado en entrega'}
• *Accesorios:* ${order.accessories || 'Ninguno (solo equipo)'}

💰 *DETALLE DE PAGO:*
${order.originalProjectedUsdt && order.discountUsdt && order.discountUsdt > 0 ? `• *Precio Base:* $${order.originalProjectedUsdt} USD\n• *Rebaja Concedida:* -$${order.discountUsdt} USD\n` : ''}• *Total Cancelado:* $${order.amountPaidUsdt} USD / USDT
• *Equivalente Bs:* ${formatBs(order.amountPaidBs)}
• *Forma de Pago:* ${order.paymentMethod}${order.paymentReference ? ` (Ref: ${order.paymentReference})` : ''}

📋 *TÉRMINOS DE ENTREGA & RECEPCIÓN CONFORME:*
El cliente declara haber recibido el equipo iPhone probado y a entera satisfacción. Por política comercial y naturaleza de equipos usados, no se realizan cambios ni devoluciones de dinero por causas cosméticas. Soporte técnico de cortesía por defecto de fábrica interno por ${order.warrantyDays || 7} días continuos. Quedan excluidos: caídas, golpes, pantalla rota, humedad o intervención de terceros.`;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateWhatsAppMessage());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(generateWhatsAppMessage());
    const phoneClean = order.customerPhone.replace(/\D/g, '');
    const url = phoneClean 
      ? `https://api.whatsapp.com/send?phone=${phoneClean}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleSaveEdits = () => {
    if (!onUpdateOrder) return;
    
    const startDate = new Date(order.date + 'T12:00:00');
    const newExpDate = new Date(startDate);
    newExpDate.setDate(newExpDate.getDate() + editWarrantyDays);
    const newExpDateStr = newExpDate.toISOString().split('T')[0];

    const updated: WarrantyOrder = {
      ...order,
      customerName: editCustomerName.trim(),
      customerIdNumber: editCustomerIdNumber.trim(),
      customerPhone: editCustomerPhone.trim(),
      imei1: editImei1.trim(),
      imei2: editImei2.trim() || undefined,
      batteryHealth: editBatteryHealth,
      physicalGrade: editPhysicalGrade.trim(),
      paymentMethod: editPaymentMethod.trim(),
      amountPaidUsdt: editAmountPaidUsdt,
      amountPaidBs: Number((editAmountPaidUsdt * (order.bcvRateUsed || rates.bcvRate)).toFixed(2)),
      warrantyDays: editWarrantyDays,
      warrantyExpiresDate: newExpDateStr,
      updatedAt: new Date().toISOString(),
    };

    onUpdateOrder(updated);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl my-6 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Action Bar (Hidden in Print) */}
        <div className="print:hidden px-5 sm:px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-base">
                  Nota de Entrega &amp; Factura Digital
                </h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {order.controlNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Comprobante oficial para entregar al cliente por WhatsApp o en PDF
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>{isEditing ? 'Ver Documento' : 'Editar Datos'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Inline Editor (Hidden in Print) */}
        {isEditing && (
          <div className="print:hidden p-4 bg-slate-950/90 border-b border-slate-800 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">
                Modificar Datos de la Nota de Entrega:
              </span>
              <button
                onClick={handleSaveEdits}
                className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Nombre Cliente</label>
                <input
                  type="text"
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 text-xs focus:outline-hidden focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Cédula</label>
                <input
                  type="text"
                  value={editCustomerIdNumber}
                  onChange={(e) => setEditCustomerIdNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 text-xs focus:outline-hidden focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  value={editCustomerPhone}
                  onChange={(e) => setEditCustomerPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 text-xs focus:outline-hidden focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Precio Final ($)</label>
                <input
                  type="number"
                  value={editAmountPaidUsdt}
                  onChange={(e) => setEditAmountPaidUsdt(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-emerald-400 font-mono font-bold text-xs focus:outline-hidden focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">IMEI 1 (Principal)</label>
                <input
                  type="text"
                  value={editImei1}
                  onChange={(e) => setEditImei1(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 text-xs focus:outline-hidden focus:border-amber-500 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">IMEI 2 (Secundario)</label>
                <input
                  type="text"
                  value={editImei2}
                  onChange={(e) => setEditImei2(e.target.value)}
                  placeholder="Opcional"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 text-xs focus:outline-hidden focus:border-amber-500 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Batería (%)</label>
                <input
                  type="number"
                  value={editBatteryHealth || ''}
                  onChange={(e) => setEditBatteryHealth(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 text-xs focus:outline-hidden focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Método de Pago</label>
                <input
                  type="text"
                  value={editPaymentMethod}
                  onChange={(e) => setEditPaymentMethod(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 text-xs focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* PRINTABLE & EXPORTABLE NOTA DE ENTREGA (Capturable by html2canvas) */}
        <div 
          ref={documentRef}
          id="nota-entrega-document"
          className="p-6 sm:p-10 bg-white text-slate-950 max-h-[72vh] print:max-h-none print:p-8 overflow-y-auto space-y-5"
          style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
        >
          
          {/* HEADER: SELLER & DELIVERY NOTE NUMBER */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="inline-block px-2.5 py-0.5 bg-slate-900 text-white font-mono text-[10px] font-black uppercase tracking-wider rounded mb-1">
                  Comprobante Comercial &amp; Despacho
                </div>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950 leading-tight">
                  NOTA DE ENTREGA
                </h1>
                
                {/* Seller Store Info */}
                <div className="mt-1.5 text-xs text-slate-700 space-y-0.5">
                  <p className="font-black text-slate-900 text-sm">
                    {order.seller.storeName || order.seller.sellerName}
                  </p>
                  <p className="text-slate-600">
                    <span className="font-semibold">Titular:</span> {order.seller.sellerName} &nbsp;|&nbsp; 
                    <span className="font-semibold"> C.I.:</span> {order.seller.sellerIdNumber}
                  </p>
                  <p className="text-slate-600">
                    <span className="font-semibold">WhatsApp:</span> {order.seller.sellerPhone} &nbsp;|&nbsp; 
                    <span className="font-semibold"> Instagram:</span> {order.seller.instagram}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    {order.seller.cityAddress || 'Barinas, Venezuela'}
                  </p>
                </div>
              </div>

              {/* Delivery Note Number & Date Box */}
              <div className="text-right bg-slate-50 p-3 rounded-xl border border-slate-300 min-w-[200px]">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  N° Nota de Entrega:
                </span>
                <span className="text-xl font-black font-mono text-slate-950 tracking-wider block text-emerald-800">
                  {order.controlNumber}
                </span>
                
                <div className="mt-2 pt-2 border-t border-slate-200 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Fecha de Emisión:</span>
                  <span className="font-bold text-slate-800">{saleDateFormatted}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 1: CUSTOMER DATA */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-300 space-y-1.5">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-700" />
              <span>Datos del Comprador (Receptor)</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-0.5">
              <div>
                <span className="text-[10px] text-slate-500 block font-semibold">Nombre y Apellido:</span>
                <p className="font-black text-slate-900 text-sm">{order.customerName}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-semibold">Cédula de Identidad / RIF:</span>
                <p className="font-black font-mono text-slate-900 text-sm">
                  {order.customerIdNumber || 'V- No especificada'}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-semibold">Teléfono / WhatsApp:</span>
                <p className="font-bold font-mono text-slate-900 text-sm">
                  {order.customerPhone || 'No registrado'}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2: IPHONE SERIALIZED SPECS & ECONOMIC BREAKDOWN */}
          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-slate-700" />
                Especificaciones del Equipo Entregado
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                Serial IMEI Verificado
              </span>
            </div>

            <div className="border-2 border-slate-900 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-white font-bold text-[11px]">
                  <tr>
                    <th className="p-3 w-1/3">Modelo &amp; Detalles</th>
                    <th className="p-3 w-1/3">Serial IMEI &amp; Condición</th>
                    <th className="p-3 w-1/3 text-right">Detalle Económico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="bg-white">
                    {/* Model & Specs */}
                    <td className="p-3.5 align-top space-y-1">
                      <div className="flex items-start gap-2.5">
                        {order.primaryImage && (
                          <img
                            src={order.primaryImage}
                            alt={order.phoneModel}
                            className="w-12 h-12 rounded-lg object-contain bg-slate-50 border border-slate-200 p-1 shrink-0"
                            loading="lazy"
                          />
                        )}
                        <div className="space-y-0.5">
                          <div className="font-black text-slate-950 text-base leading-snug">
                            {order.phoneModel}
                          </div>
                          <div className="text-slate-700 space-y-0.5 text-xs">
                            <div>Capacidad: <strong className="text-slate-900">{order.storage || '128 GB'}</strong></div>
                            <div>Color: <strong className="text-slate-900">{order.color || 'Original'}</strong></div>
                            <div className="text-[11px] text-emerald-800 font-semibold pt-0.5">
                              Accesorios: {order.accessories || 'Ninguno (solo equipo)'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* IMEI 1, IMEI 2 & Battery */}
                    <td className="p-3.5 align-top space-y-2 bg-slate-50/50">
                      <div className="p-2 bg-slate-100 rounded-lg border border-slate-300">
                        <span className="text-[9px] uppercase font-black text-slate-600 block">
                          IMEI 1 Principal:
                        </span>
                        <span className="font-mono font-black text-slate-950 text-xs tracking-wider">
                          {order.imei1 || 'REGISTRADO EN SISTEMA'}
                        </span>
                      </div>

                      {order.imei2 && (
                        <div className="p-1.5 bg-slate-100 rounded border border-slate-200 text-[10px]">
                          <span className="font-bold text-slate-600 block">IMEI 2 (eSIM / Secundario):</span>
                          <span className="font-mono font-bold text-slate-900">{order.imei2}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-950 font-bold text-[10px] border border-emerald-300">
                          <Battery className="w-3 h-3 text-emerald-700" />
                          Batería: {order.batteryHealth ? `${order.batteryHealth}%` : 'Óptima'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-700">
                        <span className="font-semibold text-slate-900">Estado: </span> 
                        {order.physicalGrade || 'Grado A - Excelente estado verificado'}
                      </div>
                    </td>

                    {/* Pricing Breakdown with Negotiated Discount */}
                    <td className="p-3.5 align-top text-right space-y-1">
                      {order.originalProjectedUsdt && order.discountUsdt && order.discountUsdt > 0 ? (
                        <div className="space-y-0.5 pb-1 border-b border-slate-200">
                          <div className="text-slate-500 text-[11px]">
                            Precio Base: <span className="font-mono line-through">${order.originalProjectedUsdt}</span>
                          </div>
                          <div className="text-amber-700 font-bold text-[11px]">
                            Rebaja Comercial: -${order.discountUsdt}
                          </div>
                        </div>
                      ) : null}

                      <div className="text-[10px] uppercase font-bold text-slate-500 pt-0.5">Total Cancelado:</div>
                      <div className="text-2xl font-black font-mono text-emerald-800">
                        ${order.amountPaidUsdt} <span className="text-xs font-bold text-slate-600">USD/USDT</span>
                      </div>
                      <div className="text-xs font-mono font-bold text-slate-700">
                        {formatBs(order.amountPaidBs)}
                      </div>

                      <div className="pt-2 text-[11px]">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Forma de Pago:</span>
                        <span className="font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-300 inline-block mt-0.5">
                          {order.paymentMethod}
                        </span>
                        {order.paymentReference && (
                          <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                            Ref: {order.paymentReference}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3: TÉRMINOS DE ENTREGA & RECEPCIÓN CONFORME (STRICT COMPLIANCE - NO "GARANTIA" ABUSES) */}
          <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 text-[11px] space-y-2 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="font-black text-slate-950 uppercase text-xs">
                Condiciones de Entrega y Recepción Conforme
              </span>
              <span className="font-bold text-slate-700 text-[11px]">
                Revisión Técnica: {order.warrantyDays || 7} días de cortesía
              </span>
            </div>

            <p className="leading-relaxed">
              El cliente declara haber <strong>revisado y verificado en su presencia</strong> el equipo telefónico aquí detallado, recibiéndolo a entera satisfacción en cuanto a su estado estético y plena operatividad (pantalla táctil, cámaras, Face ID / Touch ID, audio, señal de telefonía, WiFi, Bluetooth y carga).
            </p>

            <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-slate-900 text-[10.5px] space-y-1">
              <strong className="block uppercase text-amber-900 font-black text-[10px]">
                Cláusulas de Exclusión y No Devolución:
              </strong>
              <ul className="list-disc list-inside space-y-0.5 leading-snug">
                <li>Por política comercial y naturaleza de equipos electrónicos previamente inspeccionados, <strong>no se aceptan devoluciones de dinero ni cambios por razones estéticas o de inconformidad posterior</strong>.</li>
                <li>Cualquier revisión técnica de cortesía se limita estrictamente a defectos internos de fabricación durante un período de <strong>{order.warrantyDays || 7} días continuos</strong> a partir de esta entrega.</li>
                <li>Quedan expresamente <strong>excluidos</strong>: caídas, golpes, pantalla rota, contacto con humedad o líquidos, sobrevoltaje eléctrico o manipulación por técnicos terceros.</li>
                <li>Es indispensable que el serial/IMEI coincida con el registrado en esta Nota de Entrega.</li>
              </ul>
            </div>
          </div>

          {/* SECTION 4: FIRMAS DE RECEPCIÓN */}
          <div className="pt-2 space-y-5">
            <div className="grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t-2 border-slate-800 pt-2 space-y-0.5">
                <span className="font-black text-slate-950 block text-xs">
                  {order.seller.sellerName}
                </span>
                <span className="text-[10px] text-slate-600 block">
                  C.I. {order.seller.sellerIdNumber} • {order.seller.storeName}
                </span>
                <span className="text-[10px] font-bold text-slate-500 block uppercase">
                  Entregado por (Vendedor)
                </span>
              </div>

              <div className="border-t-2 border-slate-800 pt-2 space-y-0.5">
                <span className="font-black text-slate-950 block text-xs">
                  {order.customerName}
                </span>
                <span className="text-[10px] text-slate-600 block">
                  C.I. {order.customerIdNumber || 'V-'} • Tel: {order.customerPhone}
                </span>
                <span className="text-[10px] font-bold text-slate-500 block uppercase">
                  Recibido Conforme (Comprador)
                </span>
              </div>
            </div>

            {/* OBLIGATORY LEGAL FOOTER */}
            <div className="border-t border-slate-200 pt-2 text-center">
              <p className="text-[9.5px] text-slate-400 uppercase tracking-tight italic">
                Comprobante de entrega y control interno comercial emitido para constancia mutua entre las partes.
              </p>
            </div>
          </div>

        </div>

        {/* Modal Bottom Actions (Hidden in Print) */}
        <div className="print:hidden px-5 sm:px-6 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/90">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Nota de Entrega Lista</span>
            </span>

            {onDeleteOrder && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition cursor-pointer"
                title="Eliminar por error al facturar y devolver iPhone a inventario"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Anular / Devolver a Stock</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-md shadow-sky-600/20 cursor-pointer"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isDownloadingPdf ? 'Generando PDF...' : 'Descargar PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* DIÁLOGO CONFIRMACIÓN DE ANULACIÓN Y RETORNO A INVENTARIO */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    ¿Eliminar Nota de Entrega y Devolver a Inventario?
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Úsalo si cometiste un error al facturar (nombre, cédula, precio negociado o IMEI) o si la venta no se concretó.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5">
                <div className="text-slate-300 font-semibold flex items-center justify-between">
                  <span>Nota N°: {order.controlNumber}</span>
                  <span className="text-amber-400 font-mono">${order.amountPaidUsdt} USD</span>
                </div>
                <div className="text-slate-400">
                  <strong className="text-slate-200">{order.phoneModel}</strong> ({order.storage || '128GB'})
                </div>
                <div className="text-slate-400 font-mono text-[11px]">
                  IMEI 1: {order.imei1}
                </div>
                <div className="text-slate-400">
                  Cliente: {order.customerName} ({order.customerIdNumber || 'V-'})
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span>El iPhone pasará inmediatamente a estar <strong>disponible en el inventario</strong>.</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                {/* Opción 1: Devolver y volver a facturar de inmediato */}
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    onDeleteOrder?.(order, true);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Eliminar y Volver a Facturar de Inmediato</span>
                </button>

                {/* Opción 2: Solo devolver al inventario */}
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    onDeleteOrder?.(order, false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar Nota y Devolver a Inventario</span>
                </button>

                {/* Cancelar */}
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer text-center"
                >
                  Cancelar (No hacer cambios)
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
