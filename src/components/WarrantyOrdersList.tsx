import React, { useState, useMemo } from 'react';
import { WarrantyOrder, CurrencyRates } from '../types';
import { 
  FileText, 
  Search, 
  Filter, 
  ShieldCheck, 
  Printer, 
  Share2, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Smartphone, 
  User, 
  Plus, 
  DollarSign,
  Copy,
  Check,
  Calendar,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { formatUsdt, formatBs } from '../utils/calculations';

interface WarrantyOrdersListProps {
  orders: WarrantyOrder[];
  rates: CurrencyRates;
  onOpenOrderModal: (order: WarrantyOrder) => void;
  onOpenNewSaleModal: () => void;
  onDeleteOrder?: (order: WarrantyOrder, reOpenSaleModal?: boolean) => void;
}

export const WarrantyOrdersList: React.FC<WarrantyOrdersListProps> = ({
  orders,
  rates,
  onOpenOrderModal,
  onOpenNewSaleModal,
  onDeleteOrder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<WarrantyOrder | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getOrderStatus = (order: WarrantyOrder) => {
    if (order.status === 'voided') return { status: 'voided', label: 'Anulada', days: 0, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20' };
    const expDate = new Date(order.warrantyExpiresDate + 'T23:59:59');
    const diffTime = expDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) {
      return { status: 'expired', label: 'Entrega Conforme (Cerrada)', days: daysRemaining, color: 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' };
    }
    return { status: 'active', label: `Revisión Activa (${daysRemaining}d)`, days: daysRemaining, color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' };
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const { status } = getOrderStatus(order);
      if (statusFilter === 'active' && status !== 'active') return false;
      if (statusFilter === 'expired' && status !== 'expired') return false;

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        order.controlNumber.toLowerCase().includes(term) ||
        order.customerName.toLowerCase().includes(term) ||
        order.customerIdNumber.toLowerCase().includes(term) ||
        order.customerPhone.toLowerCase().includes(term) ||
        order.phoneModel.toLowerCase().includes(term) ||
        order.imei1.toLowerCase().includes(term) ||
        (order.imei2 && order.imei2.toLowerCase().includes(term))
      );
    });
  }, [orders, statusFilter, searchTerm]);

  const handleCopyText = (e: React.MouseEvent, order: WarrantyOrder) => {
    e.stopPropagation();
    const text = `📄 NOTA DE ENTREGA ${order.controlNumber} | ${order.customerName} (CI: ${order.customerIdNumber}) | IMEI: ${order.imei1} | ${order.phoneModel} | $${order.amountPaidUsdt}`;
    navigator.clipboard.writeText(text);
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Notas de Entrega &amp; Facturas de Venta
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">
                {orders.length} emitidas
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Registro formal de ventas, seriales IMEI, datos de comprador y constancia de recepción conforme
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewSaleModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nueva Nota de Entrega</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs transition-colors">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por N° Nota (NE-0001), IMEI, Cédula o Cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Todas ({orders.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Garantía Vigente
          </button>
          <button
            onClick={() => setStatusFilter('expired')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              statusFilter === 'expired'
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Garantía Vencida
          </button>
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {orders.length === 0 ? 'No hay órdenes de entrega emitidas aún' : 'No se encontraron órdenes con ese filtro'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {orders.length === 0 
              ? 'Cuando realices una venta, el sistema generará automáticamente la Orden de Entrega y Certificado de Garantía con el IMEI del equipo.'
              : 'Intenta con otro término de búsqueda o limpia los filtros.'}
          </p>
          {orders.length === 0 && (
            <button
              onClick={onOpenNewSaleModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Emitir Primera Orden</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">N° Control / Fecha</th>
                  <th className="p-3.5">Cliente (Receptor)</th>
                  <th className="p-3.5">Equipo &amp; Serial IMEI 1</th>
                  <th className="p-3.5">Monto Cobrado</th>
                  <th className="p-3.5">Estado Garantía</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredOrders.map((order) => {
                  const statusInfo = getOrderStatus(order);
                  return (
                    <tr 
                      key={order.id}
                      onClick={() => onOpenOrderModal(order)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer group"
                    >
                      {/* Control & Fecha */}
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs block">
                          {order.controlNumber}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {order.date}
                        </span>
                      </td>

                      {/* Cliente */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{order.customerName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {order.customerIdNumber} • {order.customerPhone}
                        </div>
                      </td>

                      {/* Equipo & IMEI */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span>{order.phoneModel}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">({order.storage})</span>
                        </div>
                        <div className="font-mono text-[11px] text-amber-600 dark:text-amber-400/90 font-semibold mt-0.5">
                          IMEI 1: {order.imei1}
                        </div>
                        {order.batteryHealth && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            Batería entregada: {order.batteryHealth}%
                          </div>
                        )}
                      </td>

                      {/* Monto Cobrado */}
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                          ${order.amountPaidUsdt} <span className="text-[10px] text-slate-500 dark:text-slate-400">USD</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {order.paymentMethod}
                        </div>
                      </td>

                      {/* Estado Entrega */}
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.color}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{statusInfo.label}</span>
                        </span>
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                          Emisión: {order.date}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="p-3.5 text-right space-x-1">
                        <button
                          onClick={(e) => handleCopyText(e, order)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer inline-flex"
                          title="Copiar resumen"
                        >
                          {copiedId === order.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenOrderModal(order);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Ver Nota / PDF</span>
                        </button>
                        {onDeleteOrder && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOrderToDelete(order);
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold transition cursor-pointer inline-flex items-center"
                            title="Eliminar Nota y Devolver iPhone a Inventario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DIÁLOGO CONFIRMACIÓN DE ANULACIÓN Y RETORNO A INVENTARIO */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
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
                  Úsalo si hubo una equivocación al emitir la factura/nota (precio acordado, cédula o IMEI) o si el cliente no completó la compra.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5">
              <div className="text-slate-300 font-semibold flex items-center justify-between">
                <span>Nota N°: {orderToDelete.controlNumber}</span>
                <span className="text-amber-400 font-mono">${orderToDelete.amountPaidUsdt} USD</span>
              </div>
              <div className="text-slate-300">
                <strong className="text-slate-100">{orderToDelete.phoneModel}</strong> ({orderToDelete.storage || '128GB'})
              </div>
              <div className="text-slate-400 font-mono text-[11px]">
                IMEI 1: {orderToDelete.imei1}
              </div>
              <div className="text-slate-400">
                Cliente: {orderToDelete.customerName} ({orderToDelete.customerIdNumber || 'V-'})
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-emerald-400 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span>El iPhone volverá a estar <strong>disponible en el inventario</strong> inmediatamente.</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              {/* Opción 1: Devolver y volver a facturar de inmediato */}
              <button
                type="button"
                onClick={() => {
                  const target = orderToDelete;
                  setOrderToDelete(null);
                  onDeleteOrder?.(target, true);
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
                  const target = orderToDelete;
                  setOrderToDelete(null);
                  onDeleteOrder?.(target, false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Nota y Devolver a Inventario</span>
              </button>

              {/* Cancelar */}
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer text-center"
              >
                Cancelar (No hacer cambios)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
