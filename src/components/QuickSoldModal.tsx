import React, { useState, useEffect } from 'react';
import { PhoneItem, CurrencyRates } from '../types';
import { X, CheckCircle2, DollarSign, Calculator, ArrowRight } from 'lucide-react';
import { calculateRealCostUsdt, calculateRealProfit, formatUsdt, formatBs } from '../utils/calculations';

interface QuickSoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PhoneItem | null;
  rates: CurrencyRates;
  onConfirmSold: (id: string, soldPriceUsdt: number, buyerName?: string, soldDate?: string) => void;
}

export const QuickSoldModal: React.FC<QuickSoldModalProps> = ({
  isOpen,
  onClose,
  item,
  rates,
  onConfirmSold,
}) => {
  const [soldPriceInput, setSoldPriceInput] = useState<string>('');
  const [buyerName, setBuyerName] = useState<string>('');
  const [soldDate, setSoldDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (item) {
      setSoldPriceInput(item.projectedPriceUsdt?.toString() || '');
      setBuyerName('');
      setSoldDate(new Date().toISOString().split('T')[0]);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const realCostUsdt = calculateRealCostUsdt(item, rates);
  const soldPrice = parseFloat(soldPriceInput) || 0;
  const realProfitUsdt = Number((soldPrice - realCostUsdt).toFixed(2));
  const realMargin = realCostUsdt > 0 ? ((realProfitUsdt / realCostUsdt) * 100).toFixed(1) : '0';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (soldPrice <= 0) return;

    onConfirmSold(item.id, soldPrice, buyerName.trim() || undefined, soldDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">Registrar Venta de Teléfono</h3>
              <p className="text-xs text-slate-400">{item.model}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Cost vs Price Info */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-slate-400 text-[11px] block">Costo Real de Importación:</span>
              <span className="text-sm font-black font-mono text-emerald-400">{formatUsdt(realCostUsdt)}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 text-[11px] block">Precio Prospectado:</span>
              <span className="text-sm font-bold font-mono text-amber-400">{formatUsdt(item.projectedPriceUsdt)}</span>
            </div>
          </div>

          {/* Sold Price Input */}
          <div className="space-y-1">
            <label className="block text-slate-200 font-bold">
              Precio Real de Venta ($ USDT) <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono">$</span>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={soldPriceInput}
                onChange={(e) => setSoldPriceInput(e.target.value)}
                placeholder="Ej: 520.00"
                className="w-full bg-slate-950 border border-emerald-800/80 rounded-xl pl-8 pr-4 py-2.5 text-base font-mono font-black text-emerald-400 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Buyer & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-slate-300 font-semibold">Nombre del Comprador</label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-slate-300 font-semibold">Fecha de Venta</label>
              <input
                type="date"
                value={soldDate}
                onChange={(e) => setSoldDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono"
              />
            </div>
          </div>

          {/* Real Profit Calculation Box */}
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-emerald-300">Ganancia Neta Real:</span>
              <span className="text-lg font-black font-mono text-emerald-400">
                +${realProfitUsdt} USDT
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
              <span>Margen Obtenido: <strong className="text-emerald-300">+{realMargin}%</strong></span>
              <span>≈ {formatBs(realProfitUsdt * rates.binanceUsdtRate)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              Confirmar Venta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
