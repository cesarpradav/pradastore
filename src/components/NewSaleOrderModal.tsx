import React, { useState, useEffect, useMemo } from 'react';
import { PhoneItem, Customer, WarrantyOrder, CurrencyRates, SellerProfile } from '../types';
import { 
  X, 
  ShoppingBag, 
  User, 
  Smartphone, 
  DollarSign, 
  Plus, 
  Search, 
  Check, 
  Battery, 
  Calendar,
  Sparkles,
  ArrowRight,
  Percent,
  TrendingUp,
  FileText,
  ShieldAlert
} from 'lucide-react';
import { calculateRealCostUsdt, calculateRealProfit, formatUsdt, formatBs, usdtToBs } from '../utils/calculations';

interface NewSaleOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  availablePhones: PhoneItem[];
  customers: Customer[];
  sellerProfile: SellerProfile;
  rates: CurrencyRates;
  lastOrderNumber: number;
  initialSelectedPhone?: PhoneItem | null;
  onCompleteSale: (
    newOrder: WarrantyOrder, 
    updatedPhone: Partial<PhoneItem>, 
    newCustomer?: Customer
  ) => void;
}

export const NewSaleOrderModal: React.FC<NewSaleOrderModalProps> = ({
  isOpen,
  onClose,
  availablePhones,
  customers,
  sellerProfile,
  rates,
  lastOrderNumber,
  initialSelectedPhone,
  onCompleteSale,
}) => {
  // Selected phone
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>('');
  const [phoneSearchTerm, setPhoneSearchTerm] = useState('');

  // Editable equipment specs for delivery note
  const [phoneModel, setPhoneModel] = useState('');
  const [storage, setStorage] = useState('128 GB');
  const [color, setColor] = useState('');
  const [imei1, setImei1] = useState('');
  const [imei2, setImei2] = useState('');
  const [batteryHealth, setBatteryHealth] = useState<number | undefined>(88);
  const [physicalGrade, setPhysicalGrade] = useState('Grado A - Excelente estado físico verificado en entrega');
  const [accessories, setAccessories] = useState('');
  const [phoneImage, setPhoneImage] = useState<string | undefined>(undefined);

  // Pricing & Negotiation
  const [expectedPriceUsdt, setExpectedPriceUsdt] = useState<number>(0);
  const [finalPriceUsdtInput, setFinalPriceUsdtInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('Dólares Efectivo');
  const [paymentReference, setPaymentReference] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [warrantyDays, setWarrantyDays] = useState<number>(7); // Default to 7 days courtesy check instead of large warranty
  const [controlNumber, setControlNumber] = useState<string>('');

  // Customer fields (The 3 core essentials)
  const [customerName, setCustomerName] = useState('');
  const [customerIdNumber, setCustomerIdNumber] = useState('V-');
  const [customerPhone, setCustomerPhone] = useState('0414-');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // Populate phone specs
  const populatePhoneDetails = (phone: PhoneItem) => {
    setSelectedPhoneId(phone.id);
    setPhoneModel(phone.model || '');
    setStorage(phone.storage || '128 GB');
    setColor(phone.color || '');
    setImei1(phone.imei1 || phone.imei || '');
    setImei2(phone.imei2 || '');
    setBatteryHealth(phone.batteryHealth ?? 88);
    setPhysicalGrade(phone.physicalGrade || 'Grado A - Excelente estado físico verificado en entrega');
    setAccessories(phone.accessories || '');
    setPhoneImage(phone.primaryImage || (phone.images && phone.images[0]) || undefined);

    const basePrice = phone.projectedPriceUsdt || 0;
    setExpectedPriceUsdt(basePrice);
    setFinalPriceUsdtInput(basePrice > 0 ? basePrice.toString() : '');
  };

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      const nextNum = lastOrderNumber + 1;
      const formattedNum = `NE-${nextNum.toString().padStart(4, '0')}`;
      setControlNumber(formattedNum);
      setSaleDate(new Date().toISOString().split('T')[0]);

      if (initialSelectedPhone) {
        populatePhoneDetails(initialSelectedPhone);
      } else if (availablePhones.length > 0) {
        populatePhoneDetails(availablePhones[0]);
      } else {
        setSelectedPhoneId('');
        setPhoneModel('');
        setImei1('');
        setPhoneImage(undefined);
        setExpectedPriceUsdt(0);
        setFinalPriceUsdtInput('');
      }

      setCustomerName('');
      setCustomerIdNumber('V-');
      setCustomerPhone('0414-');
      setSelectedCustomerId('');
      setPaymentMethod('Dólares Efectivo');
      setPaymentReference('');
      setWarrantyDays(7);
    }
  }, [isOpen, initialSelectedPhone, lastOrderNumber, availablePhones]);

  // Current selected phone object
  const currentPhoneObj = useMemo(() => {
    return availablePhones.find((p) => p.id === selectedPhoneId) || initialSelectedPhone || null;
  }, [availablePhones, selectedPhoneId, initialSelectedPhone]);

  // Calculations for Negotiation & Profit
  const finalPrice = parseFloat(finalPriceUsdtInput) || 0;
  const discountAmount = Math.max(0, expectedPriceUsdt - finalPrice);
  const realCostUsdt = currentPhoneObj ? calculateRealCostUsdt(currentPhoneObj, rates) : 0;
  const realProfitUsdt = Number((finalPrice - realCostUsdt).toFixed(2));
  const realMarginPercent = realCostUsdt > 0 ? ((realProfitUsdt / realCostUsdt) * 100).toFixed(1) : '0';

  const amountPaidBsBcv = finalPrice * rates.bcvRate;
  const amountPaidBsBinance = finalPrice * rates.binanceUsdtRate;

  // Filter existing customers for quick picker
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return [];
    const q = customerSearchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.idNumber.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [customers, customerSearchQuery]);

  const handleSelectExistingCustomer = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setCustomerName(c.fullName);
    setCustomerIdNumber(c.idNumber);
    setCustomerPhone(c.phone);
    setCustomerSearchQuery('');
  };

  // Quick discount buttons
  const applyQuickDiscount = (discountUsdt: number) => {
    if (expectedPriceUsdt <= 0) return;
    const newPrice = Math.max(1, expectedPriceUsdt - discountUsdt);
    setFinalPriceUsdtInput(newPrice.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneModel.trim()) {
      alert('Por favor especifica el modelo del iPhone.');
      return;
    }
    if (!customerName.trim()) {
      alert('Por favor ingresa el Nombre del Cliente.');
      return;
    }
    if (!customerIdNumber.trim() || customerIdNumber === 'V-') {
      alert('Por favor ingresa la Cédula del Cliente.');
      return;
    }
    if (!customerPhone.trim() || customerPhone === '0414-') {
      alert('Por favor ingresa el Teléfono / WhatsApp del Cliente.');
      return;
    }
    if (finalPrice <= 0) {
      alert('Por favor ingresa el Precio Final Acordado de Venta ($ USDT).');
      return;
    }

    // 1. Calculate validity / expiry date
    const startDate = new Date(saleDate + 'T12:00:00');
    const expDate = new Date(startDate);
    expDate.setDate(expDate.getDate() + warrantyDays);
    const warrantyExpiresDate = expDate.toISOString().split('T')[0];

    // 2. Build the Delivery Note / Warranty Order
    const newOrder: WarrantyOrder = {
      id: `order-${Date.now()}`,
      controlNumber: controlNumber || `NE-${(lastOrderNumber + 1).toString().padStart(4, '0')}`,
      date: saleDate,

      customerId: selectedCustomerId || undefined,
      customerName: customerName.trim(),
      customerIdNumber: customerIdNumber.trim(),
      customerPhone: customerPhone.trim(),

      phoneItemId: selectedPhoneId || `phone-custom-${Date.now()}`,
      phoneModel: phoneModel.trim(),
      storage: storage.trim(),
      color: color.trim() || 'Color Original',
      imei1: imei1.trim() || 'REGISTRADO EN ENTREGA',
      imei2: imei2.trim() || undefined,
      batteryHealth: batteryHealth,
      physicalGrade: physicalGrade.trim(),
      accessories: accessories.trim() || 'Ninguno (solo equipo)',
      primaryImage: phoneImage,

      amountPaidUsdt: finalPrice,
      amountPaidBs: Number(amountPaidBsBcv.toFixed(2)),
      originalProjectedUsdt: expectedPriceUsdt > 0 ? expectedPriceUsdt : finalPrice,
      discountUsdt: discountAmount > 0 ? Number(discountAmount.toFixed(2)) : 0,
      bcvRateUsed: rates.bcvRate,
      binanceRateUsed: rates.binanceUsdtRate,
      paymentMethod: paymentMethod,
      paymentReference: paymentReference.trim() || undefined,

      warrantyDays: warrantyDays,
      warrantyExpiresDate: warrantyExpiresDate,
      warrantyTerms: sellerProfile.warrantyTerms,
      seller: sellerProfile,

      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 3. Updated phone data
    const updatedPhoneData: Partial<PhoneItem> = {
      id: selectedPhoneId,
      status: 'vendido',
      soldPriceUsdt: finalPrice,
      soldDate: saleDate,
      buyerName: customerName.trim(),
      buyerPhone: customerPhone.trim(),
      buyerIdNumber: customerIdNumber.trim(),
      soldPaymentMethod: paymentMethod,
      orderControlNumber: newOrder.controlNumber,
      imei1: imei1.trim() || currentPhoneObj?.imei1 || currentPhoneObj?.imei,
      imei: imei1.trim() || currentPhoneObj?.imei,
      imei2: imei2.trim() || currentPhoneObj?.imei2,
      batteryHealth: batteryHealth,
      storage: storage,
      color: color,
      accessories: accessories.trim(),
    };

    // 4. Register customer if new
    let newCustomerObj: Customer | undefined = undefined;
    if (!selectedCustomerId) {
      newCustomerObj = {
        id: `customer-${Date.now()}`,
        idNumber: customerIdNumber.trim(),
        fullName: customerName.trim(),
        phone: customerPhone.trim(),
        createdAt: new Date().toISOString(),
      };
    }

    onCompleteSale(newOrder, updatedPhoneData, newCustomerObj);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl my-6 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-base">
                  Registrar Venta &amp; Emitir Nota de Entrega
                </h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {controlNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Genera la Nota de Entrega y Factura PDF con solo Nombre, Cédula, Teléfono y Precio Negociado
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
          
          {/* 1. SELECCIÓN DE IPHONE A VENDER */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <Smartphone className="w-4 h-4 text-sky-400" />
                1. Equipo iPhone a Entregar
              </span>
              {currentPhoneObj && (
                <span className="text-[11px] font-mono text-slate-400">
                  Costo Real: <strong className="text-emerald-400">{formatUsdt(realCostUsdt)}</strong>
                </span>
              )}
            </div>

            {availablePhones.length > 1 && !initialSelectedPhone && (
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">
                  Seleccionar equipo de inventario disponible:
                </label>
                <select
                  value={selectedPhoneId}
                  onChange={(e) => {
                    const found = availablePhones.find((p) => p.id === e.target.value);
                    if (found) populatePhoneDetails(found);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs font-semibold focus:outline-hidden focus:border-sky-500"
                >
                  {availablePhones.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.model} - {p.storage || '128GB'} {p.color || ''} (IMEI: {p.imei1 || p.imei || 'S/N'}{p.ebayOrderNumber ? ` • Orden eBay: #${p.ebayOrderNumber}` : ''}) - Base: ${p.projectedPriceUsdt}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Editable iPhone details for the Delivery Note */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="col-span-2">
                <label className="text-slate-400 text-[10px] block mb-0.5">Modelo Exacto</label>
                <input
                  type="text"
                  required
                  value={phoneModel}
                  onChange={(e) => setPhoneModel(e.target.value)}
                  placeholder="Ej: Apple iPhone 13 Pro"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-bold text-xs focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[10px] block mb-0.5">Capacidad</label>
                <input
                  type="text"
                  value={storage}
                  onChange={(e) => setStorage(e.target.value)}
                  placeholder="Ej: 128 GB"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[10px] block mb-0.5">Color</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Ej: Sierra Blue"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div className="col-span-2">
                <label className="text-amber-400 font-bold text-[10px] block mb-0.5">
                  IMEI 1 Principal (Fundamental para la Nota de Entrega) *
                </label>
                <input
                  type="text"
                  required
                  value={imei1}
                  onChange={(e) => setImei1(e.target.value)}
                  placeholder="Ej: 354890123456789"
                  className="w-full bg-slate-900 border border-amber-600/60 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono font-bold text-xs focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[10px] block mb-0.5">Salud Batería (%)</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={batteryHealth || ''}
                  onChange={(e) => setBatteryHealth(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Ej: 88"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[10px] block mb-0.5">Accesorios Incluidos</label>
                <input
                  type="text"
                  value={accessories}
                  onChange={(e) => setAccessories(e.target.value)}
                  placeholder="Ej: Cable + Cubo + Mica"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:outline-hidden focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* 2. NEGOCIACIÓN & PRECIO FINAL ACORDADO */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/50 via-slate-950 to-slate-950 border border-emerald-800/60 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-emerald-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                2. Negociación &amp; Precio Final Acordado
              </span>
              
              {/* Quick discount chips */}
              {expectedPriceUsdt > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400">Rebajas rápidas:</span>
                  <button
                    type="button"
                    onClick={() => applyQuickDiscount(5)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-[10px] border border-amber-500/30 transition cursor-pointer"
                  >
                    -$5
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickDiscount(10)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-[10px] border border-amber-500/30 transition cursor-pointer"
                  >
                    -$10
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickDiscount(15)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-[10px] border border-amber-500/30 transition cursor-pointer"
                  >
                    -$15
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickDiscount(20)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-[10px] border border-amber-500/30 transition cursor-pointer"
                  >
                    -$20
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinalPriceUsdtInput(expectedPriceUsdt.toString())}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] border border-slate-700 transition cursor-pointer"
                  >
                    Restaurar
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              {/* Expected Price (Reference) */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Precio Base Esperado:</span>
                <span className="text-base font-black font-mono text-amber-400">
                  {formatUsdt(expectedPriceUsdt)}
                </span>
                <span className="text-[10px] text-slate-500 block">Valor de vitrina</span>
              </div>

              {/* Final Negotiated Price (Input) */}
              <div className="sm:col-span-2 space-y-1">
                <label className="block text-emerald-300 font-black text-xs flex items-center justify-between">
                  <span>Precio Final Acordado ($ USDT) *</span>
                  {discountAmount > 0 && (
                    <span className="text-amber-400 font-mono font-bold text-[11px]">
                      Rebaja concedida: -${discountAmount} USDT
                    </span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 text-lg font-black font-mono">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={finalPriceUsdtInput}
                    onChange={(e) => setFinalPriceUsdtInput(e.target.value)}
                    placeholder="Ej: 270.00"
                    className="w-full bg-slate-950 border-2 border-emerald-500/80 rounded-xl pl-8 pr-4 py-2.5 text-xl font-mono font-black text-emerald-400 focus:outline-hidden focus:border-emerald-400 shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Live Profit & Bs Calculation */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-900/50 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Ganancia Neta Real:</span>
                <span className={`font-black text-sm ${realProfitUsdt >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {realProfitUsdt >= 0 ? `+$${realProfitUsdt}` : `-$${Math.abs(realProfitUsdt)}`} USDT
                </span>
                <span className="text-[10px] text-slate-400">
                  ({realMarginPercent}% margen)
                </span>
              </div>
              <div className="text-right text-slate-300">
                <span>≈ {formatBs(amountPaidBsBcv)} (Tasa BCV {rates.bcvRate})</span>
              </div>
            </div>
          </div>

          {/* 3. DATOS DEL CLIENTE (NOMBRE, CÉDULA, TELÉFONO) */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <User className="w-4 h-4 text-amber-400" />
                3. Datos del Comprador (Cliente)
              </span>
              <span className="text-[10px] text-slate-400">
                Se guardará automáticamente en tu base de clientes
              </span>
            </div>

            {/* Quick search existing customer */}
            {customers.length > 0 && (
              <div className="relative">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    placeholder="¿Cliente recurrente? Busca por nombre, cédula o teléfono..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 text-xs focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                {filteredCustomers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden divide-y divide-slate-800">
                    {filteredCustomers.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectExistingCustomer(c)}
                        className="p-2 hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-slate-100">{c.fullName}</span>
                        <span className="text-slate-400 font-mono text-[11px]">{c.idNumber} | {c.phone}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* The 3 Core Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-slate-200 font-bold block">
                  Nombre Completo <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej: César Prado"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-semibold text-xs focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-200 font-bold block">
                  Cédula de Identidad / RIF <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerIdNumber}
                  onChange={(e) => setCustomerIdNumber(e.target.value)}
                  placeholder="Ej: V-18.456.789"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold text-xs focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-200 font-bold block">
                  Teléfono / WhatsApp <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ej: 0414-1234567"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold text-xs focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* 4. MÉTODO DE PAGO, FECHA Y TÉRMINOS */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <span className="font-bold text-slate-200 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <Calendar className="w-4 h-4 text-purple-400" />
              4. Forma de Pago &amp; Condiciones de Entrega
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="text-slate-400 text-[10px] block mb-0.5">Método de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:outline-hidden focus:border-purple-500"
                >
                  <option value="Dólares Efectivo">Dólares Efectivo</option>
                  <option value="Zelle">Zelle</option>
                  <option value="Pago Móvil">Pago Móvil</option>
                  <option value="Binance USDT (P2P)">Binance USDT (P2P)</option>
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Mixto (Efectivo + Pago Móvil)">Mixto (Efectivo + Pago Móvil)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 text-[10px] block mb-0.5">Referencia de Pago</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Ej: Ref 4892 o Zelle Carlos"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[10px] block mb-0.5">Fecha de Entrega</label>
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[10px] block mb-0.5" title="Lapso de cortesía para revisión técnica interna de hardware">
                  Días Revisión Técnica
                </label>
                <select
                  value={warrantyDays}
                  onChange={(e) => setWarrantyDays(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:outline-hidden focus:border-purple-500"
                >
                  <option value={7}>7 Días (Recomendado)</option>
                  <option value={15}>15 Días</option>
                  <option value={30}>30 Días</option>
                  <option value={0}>Sin plazo (Entrega Conforme)</option>
                </select>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                La <strong>Nota de Entrega</strong> estipula que el cliente revisó y recibió el iPhone a entera satisfacción. No contempla devoluciones por motivos cosméticos ni caídas.
              </span>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition cursor-pointer flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Generar Nota de Entrega &amp; Factura PDF</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
