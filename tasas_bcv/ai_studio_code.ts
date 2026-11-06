export interface LiveRateResult {
  rate: number;
  date: string;
  formattedDate: string;
  effectiveDate?: string;
  effectiveDateFormatted?: string;
  isTomorrowRate?: boolean;
  source: string;
  success: boolean;
}

export async function fetchLiveRates(forceRefresh = false): Promise<{
  bcv: LiveRateResult | null;
  sale: LiveRateResult | null;
} | null> {
  try {
    const res = await fetch(`/api/rates${forceRefresh ? '?refresh=true' : ''}`);
    if (!res.ok) return null;
    const data = await res.json();

    const bcvRate = data.rates?.bcv?.rate || 0;
    const binanceRate = data.rates?.binance?.rate || data.rates?.paralelo?.rate || 0;
    const rawEffectiveDate = data.rates?.bcv?.effective_date;

    let isTomorrowRate = false;
    let effectiveDateFormatted: string | undefined = undefined;

    if (rawEffectiveDate && typeof rawEffectiveDate === 'string') {
      try {
        const now = new Date();
        const caracasToday = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Caracas',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(now);

        // Parseo de fechas en español (ej. "Lunes, 21 Septiembre 2026") o ISO
        const monthsMap: Record<string, number> = {
          enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
          julio: 6, agosto: 7, septiembre: 8, setiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
        };
        const match = rawEffectiveDate.match(/(\d{1,2})\s+(?:de\s+)?([A-Za-zñÑáéíóúÁÉÍÓÚ]+)\s+(?:de\s+)?(\d{4})/i);
        if (match) {
          const day = parseInt(match[1], 10);
          const monthIndex = monthsMap[match[2].toLowerCase()] ?? 8;
          const year = parseInt(match[3], 10);
          const isoStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          isTomorrowRate = isoStr > caracasToday;
          effectiveDateFormatted = new Date(year, monthIndex, day).toLocaleDateString('es-VE', { weekday: 'short', day: '2-digit', month: 'short' });
        }
      } catch (e) {}
    }

    return {
      bcv: bcvRate > 0 ? {
        rate: bcvRate,
        date: data.rates.bcv?.updated_at || new Date().toISOString(),
        formattedDate: new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }),
        effectiveDate: rawEffectiveDate,
        effectiveDateFormatted,
        isTomorrowRate,
        source: data.rates.bcv?.source || 'BCV',
        success: true
      } : null,
      sale: binanceRate > 0 ? {
        rate: binanceRate,
        date: data.rates.binance?.updated_at || new Date().toISOString(),
        formattedDate: new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }),
        source: 'Binance P2P (Cotizave)',
        success: true
      } : null
    };
  } catch (err) {
    return null;
  }
}