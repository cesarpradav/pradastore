import { PhoneItem, CurrencyRates, FinancialSummary } from '../types';

/**
 * Convierte el costo de Zoom ($ BCV) a su equivalente en $ USDT Binance.
 * Como Zoom cobra a tasa oficial BCV, al pagar en Bolívares o cambiar desde USDT,
 * el costo real en USDT se calcula usando la relación entre ambas tasas.
 */
export function convertZoomBcvToUsdt(zoomCostBcv: number, rates: CurrencyRates): number {
  if (!zoomCostBcv || zoomCostBcv <= 0) return 0;
  if (!rates.binanceUsdtRate || rates.binanceUsdtRate <= 0) return zoomCostBcv;
  
  // Costo en Bolívares pagado a Zoom = zoomCostBcv * bcvRate
  const costInBs = zoomCostBcv * rates.bcvRate;
  // Equivalente en USDT al vender o comprar USDT en Binance P2P = costInBs / binanceUsdtRate
  return Number((costInBs / rates.binanceUsdtRate).toFixed(2));
}

/**
 * Convierte un monto en USDT a Bolívares (Tasa Binance P2P)
 */
export function usdtToBs(amountUsdt: number, rates: CurrencyRates): number {
  return (amountUsdt || 0) * (rates.binanceUsdtRate || 0);
}

/**
 * Convierte un monto en $ BCV a Bolívares (Tasa BCV)
 */
export function bcvToBs(amountBcv: number, rates: CurrencyRates): number {
  return (amountBcv || 0) * (rates.bcvRate || 0);
}

/**
 * Calcula el Costo Real consolidado de un equipo en $ USDT
 */
export function calculateRealCostUsdt(item: PhoneItem, rates: CurrencyRates): number {
  const productCost = item.productCostUsdt || 0;
  const usShippingCost = item.usShippingCostUsdt || 0;
  const additionalCost = item.additionalCostUsdt || 0;
  
  // Si el costo de Zoom aún está en espera, consideramos 0 o el estimado
  const zoomCostBcv = item.zoomCostStatus === 'known' ? (item.zoomCostBcv || 0) : 0;
  const zoomCostUsdt = convertZoomBcvToUsdt(zoomCostBcv, rates);
  
  return Number((productCost + usShippingCost + zoomCostUsdt + additionalCost).toFixed(2));
}

/**
 * Calcula el Costo Real total en Bolívares (Bs)
 */
export function calculateRealCostBs(item: PhoneItem, rates: CurrencyRates): number {
  const productCostBs = (item.productCostUsdt || 0) * rates.binanceUsdtRate;
  const usShippingBs = (item.usShippingCostUsdt || 0) * rates.binanceUsdtRate;
  const additionalCostBs = (item.additionalCostUsdt || 0) * rates.binanceUsdtRate;
  
  const zoomCostBs = item.zoomCostStatus === 'known' 
    ? (item.zoomCostBcv || 0) * rates.bcvRate 
    : 0;
    
  return Number((productCostBs + usShippingBs + zoomCostBs + additionalCostBs).toFixed(2));
}

/**
 * Calcula la ganancia prospectada (esperada)
 */
export function calculateProjectedProfit(item: PhoneItem, rates: CurrencyRates): {
  profitUsdt: number;
  marginPercent: number;
  profitBs: number;
} {
  const realCostUsdt = calculateRealCostUsdt(item, rates);
  const projectedPrice = item.projectedPriceUsdt || 0;
  
  const profitUsdt = Number((projectedPrice - realCostUsdt).toFixed(2));
  const marginPercent = realCostUsdt > 0 
    ? Number(((profitUsdt / realCostUsdt) * 100).toFixed(1)) 
    : 0;
    
  const profitBs = Number((profitUsdt * rates.binanceUsdtRate).toFixed(2));
  
  return { profitUsdt, marginPercent, profitBs };
}

/**
 * Calcula la ganancia real obtenida (si ya está vendido)
 */
export function calculateRealProfit(item: PhoneItem, rates: CurrencyRates): {
  profitUsdt: number;
  marginPercent: number;
  profitBs: number;
  isSold: boolean;
} {
  if (item.status !== 'vendido' || item.soldPriceUsdt === undefined || item.soldPriceUsdt === null) {
    return { profitUsdt: 0, marginPercent: 0, profitBs: 0, isSold: false };
  }
  
  const realCostUsdt = calculateRealCostUsdt(item, rates);
  const soldPrice = item.soldPriceUsdt || 0;
  
  const profitUsdt = Number((soldPrice - realCostUsdt).toFixed(2));
  const marginPercent = realCostUsdt > 0 
    ? Number(((profitUsdt / realCostUsdt) * 100).toFixed(1)) 
    : 0;
    
  const profitBs = Number((profitUsdt * rates.binanceUsdtRate).toFixed(2));
  
  return { profitUsdt, marginPercent, profitBs, isSold: true };
}

/**
 * Genera el resumen financiero global
 */
export function calculateFinancialSummary(items: PhoneItem[], rates: CurrencyRates): FinancialSummary {
  let totalInvestedUsdt = 0;
  let totalZoomCostUsdt = 0;
  let totalRealCostUsdt = 0;
  let totalProjectedRevenueUsdt = 0;
  let totalProjectedProfitUsdt = 0;
  let totalAllProjectedProfitUsdt = 0;
  let totalSoldRevenueUsdt = 0;
  let totalRealProfitUsdt = 0;
  
  let itemsInTransitUsa = 0;
  let itemsInZoom = 0;
  let itemsAvailable = 0;
  let itemsSold = 0;
  let itemsSoldActive = 0;
  let itemsArchived = 0;
  let activeProjectedCount = 0;
  
  let pendingPrealertCount = 0;
  let pendingZoomPaymentCount = 0;
  let pendingZoomPickupCount = 0;

  items.forEach(item => {
    const itemRealCost = calculateRealCostUsdt(item, rates);
    const zoomUsdt = convertZoomBcvToUsdt(item.zoomCostStatus === 'known' ? item.zoomCostBcv : 0, rates);
    
    totalInvestedUsdt += item.productCostUsdt || 0;
    totalZoomCostUsdt += zoomUsdt;
    totalRealCostUsdt += itemRealCost;
    
    // Proyección de ganancias:
    if (item.projectedPriceUsdt) {
      const { profitUsdt } = calculateProjectedProfit(item, rates);
      totalAllProjectedProfitUsdt += profitUsdt;

      // Ganancia Proyectada Activa:
      // Exclusivamente para inventario que viene en camino o está en stock (NO vendido)
      if (item.status !== 'vendido') {
        totalProjectedRevenueUsdt += item.projectedPriceUsdt;
        totalProjectedProfitUsdt += profitUsdt;
        activeProjectedCount++;
      }
    }
    
    // Ganancia Real Consolidada (solo vendidos)
    if (item.status === 'vendido') {
      itemsSold++;
      if (item.isArchived) {
        itemsArchived++;
      } else {
        itemsSoldActive++;
      }

      if (item.soldPriceUsdt) {
        totalSoldRevenueUsdt += item.soldPriceUsdt;
        const { profitUsdt } = calculateRealProfit(item, rates);
        totalRealProfitUsdt += profitUsdt;
      }
    }
    
    if (item.status === 'en_transito_usa') itemsInTransitUsa++;
    if (item.status === 'en_casillero_zoom' || item.status === 'en_agencia_zoom') itemsInZoom++;
    if (item.status === 'disponible_para_venta' || item.status === 'reservado') itemsAvailable++;
    
    // Alertas operativas (solo para equipos no archivados y no vendidos)
    if (!item.isArchived && item.status !== 'vendido') {
      if (!item.isPrealerted && item.status === 'en_transito_usa') {
        pendingPrealertCount++;
      }
      if ((item.status === 'en_casillero_zoom' || item.status === 'en_agencia_zoom') && !item.isZoomPaid) {
        pendingZoomPaymentCount++;
      }
      if (item.status === 'en_agencia_zoom' && !item.isZoomPickedUp) {
        pendingZoomPickupCount++;
      }
    }
  });

  const totalCombinedProfitUsdt = Number((totalRealProfitUsdt + totalProjectedProfitUsdt).toFixed(2));

  return {
    totalItems: items.length,
    totalInvestedUsdt: Number(totalInvestedUsdt.toFixed(2)),
    totalZoomCostUsdt: Number(totalZoomCostUsdt.toFixed(2)),
    totalRealCostUsdt: Number(totalRealCostUsdt.toFixed(2)),
    totalProjectedRevenueUsdt: Number(totalProjectedRevenueUsdt.toFixed(2)),
    totalProjectedProfitUsdt: Number(totalProjectedProfitUsdt.toFixed(2)),
    totalAllProjectedProfitUsdt: Number(totalAllProjectedProfitUsdt.toFixed(2)),
    totalCombinedProfitUsdt,
    totalSoldRevenueUsdt: Number(totalSoldRevenueUsdt.toFixed(2)),
    totalRealProfitUsdt: Number(totalRealProfitUsdt.toFixed(2)),
    itemsInTransitUsa,
    itemsInZoom,
    itemsAvailable,
    itemsSold,
    itemsSoldActive,
    itemsArchived,
    activeProjectedCount,
    pendingPrealertCount,
    pendingZoomPaymentCount,
    pendingZoomPickupCount,
  };
}

/**
 * Formateadores de moneda
 */
export function formatUsdt(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '$0.00';
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
}

export function formatBcv(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '$0.00 BCV';
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BCV`;
}

export function formatBs(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return 'Bs. 0,00';
  return `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Parsea de forma segura cualquier string de fecha (ISO, eBay, formato local DD/MM/YYYY)
 * Retorna null si la fecha no es válida.
 */
export function safeParseDate(dateStr?: string | null): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // 1. Intentar constructor estándar Date (ISO o RFC)
  const directDate = new Date(trimmed);
  if (!isNaN(directDate.getTime())) {
    return directDate;
  }

  // 2. Formato DD/MM/YYYY o DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // 3. Formato YYYY/MM/DD
  const ymdMatch = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // 4. Formato textual de eBay o similar (ej. "Sep 23, 2026 at 1:27 PM" o "Sep 23, 2026")
  const cleaned = trimmed.replace(/\s+at\s+[\d:]+\s*(?:AM|PM)?/i, '').replace(/[,\.]/g, ' ').replace(/\s+/g, ' ');
  const cleanedDate = new Date(cleaned);
  if (!isNaN(cleanedDate.getTime())) {
    return cleanedDate;
  }

  return null;
}

/**
 * Cálculos de Tiempos y Rotación de Inventario (Métricas de Rotación)
 * Garantiza que nunca retorne NaN y nunca sea negativo.
 */
export function calculateDaysBetween(
  startDateStr?: string | null, 
  endDateStr?: string | null, 
  fallbackStartDateStr?: string | null
): number {
  let start = safeParseDate(startDateStr);
  if (!start && fallbackStartDateStr) {
    start = safeParseDate(fallbackStartDateStr);
  }
  if (!start) return 0;

  const end = safeParseDate(endDateStr) || new Date();
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (isNaN(diffDays)) return 0;
  return Math.max(0, diffDays);
}

export interface ItemTimeMetrics {
  daysSincePurchase: number;
  daysToSell?: number;
  daysInStock?: number;
  badgeLabel: string;
  badgeColor: string;
  isStagnant: boolean;
}

export function getItemTimeMetrics(item: PhoneItem): ItemTimeMetrics {
  const purchaseDate = item.purchaseDate || item.createdAt;

  if (item.status === 'vendido') {
    const soldDate = item.soldDate || item.updatedAt;
    const daysToSell = calculateDaysBetween(purchaseDate, soldDate);
    const isFast = daysToSell <= 7;
    return {
      daysSincePurchase: daysToSell,
      daysToSell,
      badgeLabel: `✅ Vendido en ${daysToSell} ${daysToSell === 1 ? 'día' : 'días'}`,
      badgeColor: isFast 
        ? 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800/60' 
        : 'text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700',
      isStagnant: false,
    };
  }

  const daysActive = calculateDaysBetween(purchaseDate);

  if (item.status === 'en_transito_usa') {
    return {
      daysSincePurchase: daysActive,
      badgeLabel: `✈️ ${daysActive}d en tránsito USA`,
      badgeColor: 'text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-300 dark:bg-sky-950/40 dark:border-sky-800/60',
      isStagnant: false,
    };
  }

  if (item.status === 'en_casillero_zoom') {
    return {
      daysSincePurchase: daysActive,
      badgeLabel: `📦 ${daysActive}d en casillero Zoom`,
      badgeColor: 'text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-300 dark:bg-purple-950/40 dark:border-purple-800/60',
      isStagnant: false,
    };
  }

  if (item.status === 'en_agencia_zoom') {
    return {
      daysSincePurchase: daysActive,
      badgeLabel: `🏢 ${daysActive}d en agencia Zoom`,
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-800/60',
      isStagnant: false,
    };
  }

  // Disponible para venta / Reservado
  const isStagnant = daysActive >= 25;
  return {
    daysSincePurchase: daysActive,
    daysInStock: daysActive,
    badgeLabel: isStagnant ? `⚠️ ${daysActive}d en stock (Lento)` : `⚡ ${daysActive}d en stock`,
    badgeColor: isStagnant 
      ? 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/40 dark:border-rose-800/60' 
      : 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800/60',
    isStagnant,
  };
}

export interface InventoryCycleSummary {
  avgDaysToSell: number;
  avgDaysInTransit: number;
  avgDeliveryDays: number;
  stagnantCount: number;
  fastestSaleDays: number | null;
  slowestSaleDays: number | null;
  totalSoldWithDays: number;
  totalTransitCount: number;
  turnoverRatePercent: number;
}

export function calculateInventoryCycleSummary(items: PhoneItem[] = []): InventoryCycleSummary {
  if (!items || items.length === 0) {
    return {
      avgDaysToSell: 0,
      avgDaysInTransit: 0,
      avgDeliveryDays: 0,
      stagnantCount: 0,
      fastestSaleDays: null,
      slowestSaleDays: null,
      totalSoldWithDays: 0,
      totalTransitCount: 0,
      turnoverRatePercent: 0,
    };
  }

  // 1. Equipos vendidos (usando purchaseDate o createdAt como fecha de inicio)
  const soldItems = items.filter(i => i.status === 'vendido');
  let totalSoldDays = 0;
  let fastestSaleDays: number | null = null;
  let slowestSaleDays: number | null = null;
  let validSoldDaysCount = 0;

  soldItems.forEach(i => {
    const startDate = i.purchaseDate || i.createdAt;
    const endDate = i.soldDate || i.updatedAt;
    const days = calculateDaysBetween(startDate, endDate);
    
    totalSoldDays += days;
    validSoldDaysCount++;

    if (fastestSaleDays === null || days < fastestSaleDays) {
      fastestSaleDays = days;
    }
    if (slowestSaleDays === null || days > slowestSaleDays) {
      slowestSaleDays = days;
    }
  });

  // 2. Equipos actualmente en tránsito activo (USA + Casillero + Agencia Zoom)
  const transitItems = items.filter(i => 
    i.status === 'en_transito_usa' || 
    i.status === 'en_casillero_zoom' || 
    i.status === 'en_agencia_zoom'
  );
  let totalTransitDays = 0;
  transitItems.forEach(i => {
    const startDate = i.purchaseDate || i.createdAt;
    totalTransitDays += calculateDaysBetween(startDate);
  });

  // 3. Tiempos de Entrega / Importación (desde compra hasta entrega en Venezuela/Zoom)
  let totalDeliveryDays = 0;
  let deliveryCount = 0;
  items.forEach(i => {
    const startDate = i.purchaseDate || i.createdAt;
    if (i.zoomPickupDate) {
      const days = calculateDaysBetween(startDate, i.zoomPickupDate);
      if (days > 0) {
        totalDeliveryDays += days;
        deliveryCount++;
      }
    } else if (i.isZoomPickedUp || i.status === 'disponible_para_venta' || i.status === 'reservado' || i.status === 'vendido') {
      const arrivalDate = i.zoomPickupDate || (i.prealertDate ? i.updatedAt : undefined);
      if (arrivalDate) {
        const days = calculateDaysBetween(startDate, arrivalDate);
        if (days > 0) {
          totalDeliveryDays += days;
          deliveryCount++;
        }
      }
    }
  });

  // 4. Equipos en stock disponibles con rotación lenta (> 25 días desde compra)
  const availableItems = items.filter(i => i.status === 'disponible_para_venta' || i.status === 'reservado');
  const stagnantCount = availableItems.filter(i => {
    const startDate = i.purchaseDate || i.createdAt;
    return calculateDaysBetween(startDate) >= 25;
  }).length;

  const turnoverRate = items.length > 0 ? (soldItems.length / items.length) * 100 : 0;

  return {
    avgDaysToSell: validSoldDaysCount > 0 ? Number((totalSoldDays / validSoldDaysCount).toFixed(1)) : 0,
    avgDaysInTransit: transitItems.length > 0 ? Number((totalTransitDays / transitItems.length).toFixed(1)) : 0,
    avgDeliveryDays: deliveryCount > 0 ? Number((totalDeliveryDays / deliveryCount).toFixed(1)) : 0,
    stagnantCount,
    fastestSaleDays,
    slowestSaleDays,
    totalSoldWithDays: validSoldDaysCount,
    totalTransitCount: transitItems.length,
    turnoverRatePercent: Number(turnoverRate.toFixed(1)),
  };
}
