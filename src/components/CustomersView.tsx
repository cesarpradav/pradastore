import React, { useState, useMemo } from 'react';
import { Customer, WarrantyOrder, PhoneItem } from '../types';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Instagram, 
  ShoppingBag, 
  FileText, 
  Clock, 
  Check, 
  X, 
  Edit, 
  Trash2, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { formatUsdt, formatBs } from '../utils/calculations';

interface CustomersViewProps {
  customers: Customer[];
  orders: WarrantyOrder[];
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer?: (customerId: string) => void;
  onSelectCustomerToSell?: (customer: Customer) => void;
  onOpenOrderModal: (order: WarrantyOrder) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  orders,
  onSaveCustomer,
  onDeleteCustomer,
  onSelectCustomerToSell,
  onOpenOrderModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedDetailCustomer, setSelectedDetailCustomer] = useState<Customer | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('V-');
  const [phone, setPhone] = useState('0414-');
  const [instagram, setInstagram] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFullName('');
    setIdNumber('V-');
    setPhone('0414-');
    setInstagram('');
    setCity('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cust: Customer) => {
    setEditingCustomer(cust);
    setFullName(cust.fullName);
    setIdNumber(cust.idNumber);
    setPhone(cust.phone);
    setInstagram(cust.instagram || '');
    setCity(cust.city || '');
    setNotes(cust.notes || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !idNumber.trim() || !phone.trim()) {
      alert('Por favor completa los campos obligatorios (*).');
      return;
    }

    const newCust: Customer = {
      id: editingCustomer ? editingCustomer.id : `cust-${Date.now()}`,
      fullName: fullName.trim(),
      idNumber: idNumber.trim(),
      phone: phone.trim(),
      instagram: instagram.trim() || undefined,
      city: city.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: editingCustomer ? editingCustomer.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveCustomer(newCust);
    setIsModalOpen(false);
  };

  // Get orders for each customer
  const customerStats = useMemo(() => {
    const stats: Record<string, { count: number; totalSpent: number; orders: WarrantyOrder[] }> = {};
    customers.forEach((c) => {
      const custOrders = orders.filter(
        (o) => o.customerId === c.id || o.customerIdNumber === c.idNumber || o.customerName === c.fullName
      );
      const totalSpent = custOrders.reduce((sum, o) => sum + (o.amountPaidUsdt || 0), 0);
      stats[c.id] = { count: custOrders.length, totalSpent, orders: custOrders };
    });
    return stats;
  }, [customers, orders]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    const term = searchTerm.toLowerCase();
    return customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(term) ||
        c.idNumber.toLowerCase().includes(term) ||
        c.phone.toLowerCase().includes(term) ||
        (c.instagram && c.instagram.toLowerCase().includes(term))
    );
  }, [customers, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Base de Datos de Clientes
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-sky-400 border border-slate-700">
                {customers.length} registrados
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Gestión de clientes, historial de iPhones comprados y control de seriales vinculados
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md shadow-sky-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nuevo Cliente</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar cliente por nombre, cédula, teléfono o Instagram..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-sky-500"
        />
      </div>

      {/* Customer List or Empty State */}
      {filteredCustomers.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-200">
            {customers.length === 0 ? 'No hay clientes registrados aún' : 'No se encontraron clientes'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Puedes registrar a tus compradores directamente aquí o de forma automática cada vez que emitas una Orden de Entrega y Certificado de Garantía.
          </p>
          {customers.length === 0 && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Primer Cliente</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredCustomers.map((cust) => {
            const stats = customerStats[cust.id] || { count: 0, totalSpent: 0, orders: [] };
            const phoneClean = cust.phone.replace(/\D/g, '');

            return (
              <div
                key={cust.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-3 flex flex-col justify-between shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">{cust.fullName}</h4>
                      <p className="font-mono text-xs text-amber-400 font-semibold">{cust.idNumber}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {stats.count} {stats.count === 1 ? 'iPhone' : 'iPhones'}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-mono">{cust.phone}</span>
                      {phoneClean && (
                        <a
                          href={`https://api.whatsapp.com/send?phone=${phoneClean}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold underline"
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                    {cust.instagram && (
                      <div className="flex items-center gap-2">
                        <Instagram className="w-3.5 h-3.5 text-pink-400" />
                        <span className="text-slate-300">{cust.instagram}</span>
                      </div>
                    )}
                    {cust.city && (
                      <div className="text-[11px] text-slate-400">
                        📍 {cust.city}
                      </div>
                    )}
                  </div>

                  {stats.orders.length > 0 && (
                    <div className="p-2 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1 text-[11px]">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">
                        Equipos Comprados:
                      </span>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {stats.orders.map((ord) => (
                          <div
                            key={ord.id}
                            onClick={() => onOpenOrderModal(ord)}
                            className="flex items-center justify-between text-slate-300 hover:text-amber-400 transition cursor-pointer"
                          >
                            <span className="truncate">{ord.phoneModel}</span>
                            <span className="font-mono text-amber-400 font-bold ml-2">
                              {ord.controlNumber}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenEdit(cust)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer text-xs"
                    title="Editar Cliente"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  {onSelectCustomerToSell && (
                    <button
                      onClick={() => onSelectCustomerToSell(cust)}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition cursor-pointer text-center"
                    >
                      + Emitir Venta
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit Customer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
              <h3 className="font-bold text-slate-100 text-sm">
                {editingCustomer ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Nombre y Apellido *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Cédula de Identidad / RIF *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. V-25.123.456"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Teléfono / WhatsApp *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 0414-1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Instagram (Opcional)</label>
                <input
                  type="text"
                  placeholder="@usuario"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Ciudad / Ubicación (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. Caracas, El Rosal"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Notas Internas</label>
                <textarea
                  rows={2}
                  placeholder="Preferencias del cliente, recomendaciones, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition"
                >
                  {editingCustomer ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
