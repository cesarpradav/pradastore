import React, { useState, useMemo } from 'react';
import { WarrantyOrder, PhoneItem, CurrencyRates } from '../types';
import { 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  Smartphone, 
  User, 
  Calendar, 
  Battery, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ExternalLink,
  PlusCircle,
  History,
  MessageSquare
} from 'lucide-react';
import { formatUsdt, formatBs } from '../utils/calculations';

interface WarrantyLookupViewProps {
  orders: WarrantyOrder[];
  phones: PhoneItem[];
  rates: CurrencyRates;
  onOpenOrderModal: (order: WarrantyOrder) => void;
  onOpenNewSaleModal: () => void;
}

export const WarrantyLookupView: React.FC<WarrantyLookupViewProps> = ({
  orders,
  phones,
  rates,
  onOpenOrderModal,
  onOpenNewSaleModal,
}) => {
  const [query, setQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<WarrantyOrder | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Search logic
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const cleanQuery = query.trim().toLowerCase();

    return orders.filter((o) => {
      const matchImei1 = o.imei1?.toLowerCase().includes(cleanQuery);
      const matchImei2 = o.imei2?.toLowerCase().includes(cleanQuery);
      const matchControl = o.controlNumber?.toLowerCase().includes(cleanQuery);
      const matchCustomer = o.customerName?.toLowerCase().includes(cleanQuery);
      const matchId = o.customerIdNumber?.toLowerCase().includes(cleanQuery);
      const matchPhone = o.customerPhone?.toLowerCase().includes(cleanQuery);
      const matchModel = o.phoneModel?.toLowerCase().includes(cleanQuery);

      return matchImei1 || matchImei2 || matchControl || matchCustomer || matchId || matchPhone || matchModel;
    });
  }, [orders, query]);

  // If there's an exact or single match, select it
  const activeOrder = selectedOrder || (searchResults.length === 1 ? searchResults[0] : null);

  const getWarrantyCalculation = (order: WarrantyOrder) => {
    const expDate = new Date(order.warrantyExpiresDate + 'T23:59:59');
    const diffTime = expDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalDays = order.warrantyDays || 30;
    const daysPassed = Math.max(0, totalDays - daysRemaining);
    const progressPercent = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));

    const isExpired = daysRemaining < 0;
    const isVoided = order.status === 'voided';

    return {
      daysRemaining,
      totalDays,
      daysPassed,
      progressPercent,
      isExpired,
      isVoided,
      expiresFormatted: new Date(order.warrantyExpiresDate + 'T12:00:00').toLocaleDateString('es-VE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      deliveryFormatted: new Date(order.date + 'T12:00:00').toLocaleDateString('es-VE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    };
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
                Centro de Verificación por IMEI &amp; Notas de Entrega
              </h2>
              <p className="text-xs text-slate-400">
                Verifica al instante el IMEI, la salud original de batería en la entrega, el estado estético y los datos del cliente al recibir consultas.
              </p>
            </div>
          </div>
        </div>

        {/* Big Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-amber-400" />
          <input
            type="text"
            autoFocus
            placeholder="Escribe el IMEI (ej. 354890...), N° de Nota (ej. NE-0001), Cédula o Nombre..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedOrder(null);
            }}
            className="w-full bg-slate-950 border-2 border-slate-700 hover:border-slate-600 focus:border-amber-500 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 font-mono font-medium focus:outline-hidden transition shadow-inner"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSelectedOrder(null);
              }}
              className="absolute right-3.5 top-3 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-2 py-1 rounded-md"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Query Search Results Grid (if multiple found) */}
      {query.trim() && searchResults.length > 1 && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Coincidencias encontradas ({searchResults.length}):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {searchResults.map((order) => {
              const { daysRemaining, isExpired } = getWarrantyCalculation(order);
              const isSelected = activeOrder?.id === order.id;
              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-amber-950/30 border-amber-500 ring-1 ring-amber-500/50'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-amber-400 text-xs">
                      {order.controlNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isExpired
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {isExpired ? 'Vencida' : `${daysRemaining}d restantes`}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-slate-200 text-xs">{order.phoneModel}</div>
                    <div className="text-[11px] text-slate-400 font-mono">IMEI: {order.imei1}</div>
                    <div className="text-[11px] text-slate-300 font-medium mt-1">
                      Cliente: {order.customerName}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* NOT FOUND ALERT */}
      {query.trim() && searchResults.length === 0 && (
        <div className="p-8 rounded-2xl bg-rose-950/30 border-2 border-rose-500/40 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-rose-200">
            ⚠️ Serial / IMEI no registrado en tu sistema
          </h3>
          <p className="text-xs text-rose-300/80 max-w-lg mx-auto">
            El IMEI o número de control &quot;<strong>{query}</strong>&quot; no coincide con ningún teléfono vendido en tus registros. Verifica si el cliente digitó mal el IMEI o si se trata de un equipo no vendido por ti (protección ante fraudes).
          </p>
        </div>
      )}

      {/* ACTIVE SELECTED ORDER VALIDATION CARD */}
      {activeOrder && (
        (() => {
          const { daysRemaining, totalDays, daysPassed, progressPercent, isExpired, isVoided, expiresFormatted, deliveryFormatted } =
            getWarrantyCalculation(activeOrder);

          return (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              
              {/* BIG STATUS HERO */}
              <div
                className={`p-6 rounded-2xl border-2 flex flex-wrap items-center justify-between gap-4 ${
                  isVoided
                    ? 'bg-rose-950/40 border-rose-500 text-rose-100'
                    : isExpired
                    ? 'bg-slate-900 border-slate-700 text-slate-300'
                    : 'bg-emerald-950/30 border-emerald-500 text-emerald-100 shadow-lg shadow-emerald-950/40'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3.5 rounded-2xl border ${
                      isVoided
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        : isExpired
                        ? 'bg-slate-800 text-slate-400 border-slate-700'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}
                  >
                    {isVoided ? (
                      <ShieldX className="w-8 h-8" />
                    ) : isExpired ? (
                      <Clock className="w-8 h-8" />
                    ) : (
                      <ShieldCheck className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-black/40">
                        {activeOrder.controlNumber}
                      </span>
                      <span className="text-xs text-slate-400">
                        Entregado el {deliveryFormatted}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black mt-1">
                      {isVoided
                        ? 'Garantía Anulada por Incumplimiento'
                        : isExpired
                        ? 'Garantía Vencida (Fuera de Plazo)'
                        : `Garantía VIGENTE • ${daysRemaining} Días Restantes`}
                    </h3>
                    <p className="text-xs text-slate-300/90 mt-0.5">
                      {isExpired
                        ? `El período de garantía de ${totalDays} días culminó el ${expiresFormatted}.`
                        : `Válida hasta el ${expiresFormatted} por defectos de fábrica en hardware.`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenOrderModal(activeOrder)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-md cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Ver Certificado Original</span>
                  </button>
                </div>
              </div>

              {/* TIMELINE PROGRESS BAR */}
              {!isExpired && !isVoided && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Progreso de Garantía: <strong className="text-slate-200">{daysPassed} de {totalDays} días transcurridos</strong>
                    </span>
                    <span className="font-bold text-emerald-400">{daysRemaining} días vigentes</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* COMPARISON FORENSIC BOX (ANTI-SCAM VERIFICATION) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Datos Técnicos Registrados al Entregar */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                    <Smartphone className="w-4 h-4 text-amber-400" />
                    <h4 className="font-bold text-slate-100 text-sm">
                      Línea Base del Equipo al Momento de la Entrega:
                    </h4>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Equipo:</span>
                      <span className="font-bold text-slate-100 text-sm">
                        {activeOrder.phoneModel} ({activeOrder.storage || '128GB'} • {activeOrder.color || 'Original'})
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase text-amber-400 font-bold">IMEI 1 Registrado:</span>
                        <span className="font-bold text-slate-100 text-xs">{activeOrder.imei1}</span>
                      </div>
                      {activeOrder.imei2 && (
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
                          <span className="text-slate-400">IMEI 2:</span>
                          <span className="text-slate-200">{activeOrder.imei2}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Salud de Batería Inicial:
                        </span>
                        <span className="font-bold text-emerald-400 text-sm flex items-center gap-1 mt-0.5">
                          <Battery className="w-3.5 h-3.5" />
                          {activeOrder.batteryHealth ? `${activeOrder.batteryHealth}%` : 'Óptima'}
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Monto Cancelado:
                        </span>
                        <span className="font-bold text-slate-100 text-sm mt-0.5 block font-mono">
                          ${activeOrder.amountPaidUsdt} USD
                        </span>
                        <span className="text-[10px] text-slate-400">{activeOrder.paymentMethod}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                        Estado Físico / Estético Registrado en Certificado:
                      </span>
                      <p className="text-slate-200 font-medium text-xs leading-relaxed">
                        {activeOrder.physicalGrade || 'Grado A - Pantalla intacta sin rayones'}
                      </p>
                    </div>

                    {activeOrder.accessories && (
                      <div className="text-[11px] text-slate-400">
                        <span className="font-bold text-slate-300">Accesorios entregados:</span> {activeOrder.accessories}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Datos del Comprador & Protocolo de Revisión */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                      <User className="w-4 h-4 text-sky-400" />
                      <h4 className="font-bold text-slate-100 text-sm">
                        Datos del Comprador &amp; Contacto:
                      </h4>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Cliente:</span>
                        <span className="font-bold text-slate-100 text-sm">{activeOrder.customerName}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 font-mono">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Cédula:</span>
                          <span className="text-slate-200">{activeOrder.customerIdNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Teléfono:</span>
                          <span className="text-slate-200">{activeOrder.customerPhone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Protocol checklist */}
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <span className="text-[10px] text-amber-400 uppercase font-bold block">
                        Checklist de Recepción en Garantía:
                      </span>
                      <div className="space-y-1.5 text-[11px] text-slate-300">
                        <label className="flex items-start gap-2">
                          <input type="checkbox" className="mt-0.5 rounded border-slate-700 bg-slate-900" />
                          <span>Verificar que el IMEI del equipo en mano coincida con <strong>{activeOrder.imei1}</strong>.</span>
                        </label>
                        <label className="flex items-start gap-2">
                          <input type="checkbox" className="mt-0.5 rounded border-slate-700 bg-slate-900" />
                          <span>Verificar que no tenga golpes, pantalla fracturada o indicadores de humedad (LDI rojos).</span>
                        </label>
                        <label className="flex items-start gap-2">
                          <input type="checkbox" className="mt-0.5 rounded border-slate-700 bg-slate-900" />
                          <span>Comprobar que el cliente haya <strong>desactivado la cuenta de iCloud</strong>.</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onOpenOrderModal(activeOrder)}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition text-center cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/30"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Ver Nota de Entrega / PDF / Opciones ({activeOrder.controlNumber})</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          );
        })()
      )}

      {/* Guide when nothing is searched */}
      {!query.trim() && (
        <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-200">
            Ingresa un IMEI o Número de Control arriba
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Si un cliente te escribe con una consulta o reclamo, escribe los últimos dígitos del serial o su nombre para validar en 1 segundo la vigencia y condiciones pactadas.
          </p>
        </div>
      )}
    </div>
  );
};
