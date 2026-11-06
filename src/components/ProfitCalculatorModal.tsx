import React, { useState } from 'react';
import { CurrencyRates } from '../types';
import { X, Calculator, DollarSign, TrendingUp, ArrowRight, Check, Plus } from 'lucide-react';
import { convertZoomBcvToUsdt, formatUsdt, formatBs, formatBcv } from '../utils/calculations';

interface ProfitCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  rates: CurrencyRates;
  onUseValuesForNewPhone?: (productCost: number, usShippingCost: number, zoomCostBcv: number, projectedPrice: number) => void;
}

export const ProfitCalculatorModal: React.FC<ProfitCalculatorModalProps> = ({
  isOpen,
  onClose,
  rates,
  onUseValuesForNewPhone,
}) => {
  const [productCostUsdt, setProductCostUsdt] = useState<string>('300');
  const [hasUsShipping, setHasUsShipping] = useState<boolean>(false);
  const [usShippingCostUsdt, setUsShippingCostUsdt] = useState<string>('0');
  const [zoomCostBcv, setZoomCostBcv] = useState<string>('18.50');
  const [extraCostUsdt, setExtraCostUsdt] = useState<string>('5');
  const [targetMarginPercent, setTargetMarginPercent] = useState<string>('25');
  const [customSellingPrice, setCustomSellingPrice] = useState<string>('420');

  if (!isOpen) return null;

  const costProduct = parseFloat(productCostUsdt) || 0;
  const costUsShipping = hasUsShipping ? (parseFloat(usShippingCostUsdt) || 0) : 0;
  const costZoomBcv = parseFloat(zoomCostBcv) || 0;
  const costExtra = parseFloat(extraCostUsdt) || 0;
  const marginTarget = parseFloat(targetMarginPercent) || 0;
  const customPrice = parseFloat(customSellingPrice) || 0;

  const zoomCostUsdt = convertZoomBcvToUsdt(costZoomBcv, rates);
  const totalRealCostUsdt = Number((costProduct + costUsShipping + zoomCostUsdt + costExtra).toFixed(2));
  const totalRealCostBs = Number(((costProduct + costUsShipping + costExtra) * rates.binanceUsdtRate + (costZoomBcv * rates.bcvRate)).toFixed(2));

  // Precios sugeridos por margen
  const suggestedPriceByMargin = Number((totalRealCostUsdt * (1 + marginTarget / 100)).toFixed(2));
  const profitByMargin = Number((suggestedPriceByMargin - totalRealCostUsdt).toFixed(2));

  // Ganancia con precio manual
  const profitCustom = Number((customPrice - totalRealCostUsdt).toFixed(2));
  const marginCustom = totalRealCostUsdt > 0 ? ((profitCustom / totalRealCostUsdt) * 100).toFixed(1) : '0';

  const presets = [
    { label: 'Margen 15%', margin: 15 },
    { label: 'Margen 20%', margin: 20 },
    { label: 'Margen 25%', margin: 25 },
    { label: 'Margen 30%', margin: 30 },
    { label: 'Margen 40%', margin: 40 },
  ];

  const handleUsePreset = (pPrice: number) => {
    if (onUseValuesForNewPhone) {
      onUseValuesForNewPhone(costProduct, costUsShipping, costZoomBcv, pPrice);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl my-8 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                Simulador de Costos y Ganancias
              </h3>
              <p className="text-xs text-slate-400">
                Calcula el precio de venta ideal antes de ofertar en eBay
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

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-slate-300 font-semibold">Costo en eBay ($ USDT)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={productCostUsdt}
                onChange={(e) => setProductCostUsdt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-sm font-bold focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sky-400 font-semibold">Flete Zoom ($ BCV)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={zoomCostBcv}
                onChange={(e) => setZoomCostBcv(e.target.value)}
                className="w-full bg-slate-950 border border-sky-800/60 rounded-xl px-3 py-2 text-sky-300 font-mono text-sm font-bold focus:outline-hidden focus:border-sky-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-slate-300 font-semibold">Extras (Mica/Estuche)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={extraCostUsdt}
                onChange={(e) => setExtraCostUsdt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-sm font-bold focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          {/* Costo de Envío dentro de EE.UU. */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-300 block">
                Envío dentro de EE.UU. (eBay):
              </span>
              <span className="text-[11px] text-slate-500">
                {hasUsShipping ? `Con costo de envío: $${costUsShipping} USDT` : 'Envío doméstico gratis ($0.00)'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setHasUsShipping(false);
                    setUsShippingCostUsdt('0');
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                    !hasUsShipping ? 'bg-emerald-600 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Gratis ($0)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHasUsShipping(true);
                    if (usShippingCostUsdt === '0' || !usShippingCostUsdt) setUsShippingCostUsdt('6.50');
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                    hasUsShipping ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Con Costo
                </button>
              </div>

              {hasUsShipping && (
                <div className="relative w-24">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">$</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={usShippingCostUsdt}
                    onChange={(e) => setUsShippingCostUsdt(e.target.value)}
                    className="w-full bg-slate-900 border border-amber-500/50 rounded-lg pl-6 pr-2 py-1 text-xs font-mono font-bold text-amber-300 focus:outline-hidden"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Costo Real Result Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-900/50 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                Costo Real Puesto en Vzla:
              </span>
              <div className="text-2xl font-black font-mono text-emerald-400">
                ${totalRealCostUsdt} <span className="text-xs font-normal text-emerald-300">USDT</span>
              </div>
              <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                Equivalente en Bs: <span className="text-sky-300 font-bold">{formatBs(totalRealCostBs)}</span>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-400 space-y-0.5 font-mono">
              <div>eBay: ${costProduct} USDT</div>
              {costUsShipping > 0 && <div className="text-amber-300">Envío USA: +${costUsShipping} USDT</div>}
              <div>Zoom: ${zoomCostUsdt} USDT ({formatBs(costZoomBcv * rates.bcvRate)})</div>
              {costExtra > 0 && <div>Extras: ${costExtra} USDT</div>}
            </div>
          </div>

          {/* Tabla de Márgenes Sugeridos */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              Precios de Venta Sugeridos por Margen de Ganancia:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {presets.map((p) => {
                const targetPrice = Number((totalRealCostUsdt * (1 + p.margin / 100)).toFixed(2));
                const profit = Number((targetPrice - totalRealCostUsdt).toFixed(2));
                return (
                  <div
                    key={p.margin}
                    onClick={() => {
                      setTargetMarginPercent(p.margin.toString());
                      setCustomSellingPrice(targetPrice.toString());
                    }}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      marginTarget === p.margin
                        ? 'bg-amber-950/40 border-amber-600 text-amber-200 shadow-sm'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-xs">{p.label}</span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">+${profit}</span>
                    </div>
                    <div className="text-base font-black font-mono text-white">
                      ${targetPrice}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {formatBs(targetPrice * rates.binanceUsdtRate)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Simulador Personalizado */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-200 flex items-center justify-between">
              <span>Probar Precio Personalizado de Venta:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div className="space-y-1">
                <label className="text-slate-400 text-[11px]">Precio de Venta ($ USDT)</label>
                <input
                  type="number"
                  step="1"
                  value={customSellingPrice}
                  onChange={(e) => setCustomSellingPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-base font-mono font-bold text-amber-400 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Ganancia Neta:</span>
                  <span className={`font-mono font-bold text-sm ${profitCustom >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {profitCustom >= 0 ? `+$${profitCustom}` : `-$${Math.abs(profitCustom)}`} USDT
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Margen Real:</span>
                  <span className="font-mono font-bold text-slate-200">
                    +{marginCustom}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/80">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            Cerrar
          </button>

          {onUseValuesForNewPhone && (
            <button
              onClick={() => handleUsePreset(customPrice || suggestedPriceByMargin)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Usar estos valores para Nuevo Teléfono</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
