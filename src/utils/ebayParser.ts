import { PhoneCondition } from '../types';
import { detectCarrier } from './tracking';

export interface ParsedEbayOrder {
  orderNumber?: string;
  purchaseDate?: string; // YYYY-MM-DD
  trackingNumber?: string;
  carrier?: string;
  rawTitle?: string;
  model?: string;
  storage?: string;
  color?: string;
  condition?: PhoneCondition;
  ebayLink?: string;
  itemNumber?: string;
  productCostUsdt?: number;
  usShippingCostUsdt?: number;
  hasUsShippingCost?: boolean;
  orderTotalUsdt?: number;
  sellerUsername?: string;
  detectedCount: number;
}

const MONTH_MAP: Record<string, string> = {
  jan: '01', january: '01', ene: '01', enero: '01',
  feb: '02', february: '02', febrero: '02',
  mar: '03', march: '03', marzo: '03',
  apr: '04', april: '04', abr: '04', abril: '04',
  may: '05', mayo: '05',
  jun: '06', june: '06', junio: '06',
  jul: '07', july: '07', julio: '07',
  aug: '08', august: '08', ago: '08', agosto: '08',
  sep: '09', sept: '09', september: '09', septiembre: '09',
  oct: '10', october: '10', octubre: '10',
  nov: '11', november: '11', noviembre: '11',
  dec: '12', december: '12', dic: '12', diciembre: '12',
};

function parseDateToIso(dateStr: string, defaultYear?: string): string | undefined {
  if (!dateStr) return undefined;

  // Formato: "Oct 22, 2026" o "October 22 2026"
  const m1 = dateStr.match(/([A-Za-z]{3,10})\s+(\d{1,2})(?:,?\s+(\d{4}))?/i);
  if (m1) {
    const month = MONTH_MAP[m1[1].toLowerCase()];
    if (month) {
      const day = m1[2].padStart(2, '0');
      const year = m1[3] || defaultYear || new Date().getFullYear().toString();
      return `${year}-${month}-${day}`;
    }
  }

  // Formato: "22 Oct 2026" o "22 de Octubre 2026"
  const m2 = dateStr.match(/(\d{1,2})\s+(?:de\s+)?([A-Za-z]{3,10})(?:,?\s+(\d{4}))?/i);
  if (m2) {
    const month = MONTH_MAP[m2[2].toLowerCase()];
    if (month) {
      const day = m2[1].padStart(2, '0');
      const year = m2[3] || defaultYear || new Date().getFullYear().toString();
      return `${year}-${month}-${day}`;
    }
  }

  // Si ya viene YYYY-MM-DD
  const m3 = dateStr.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m3) return m3[0];

  return undefined;
}

export function parseEbayOrderText(rawText: string): ParsedEbayOrder {
  const result: ParsedEbayOrder = {
    detectedCount: 0,
  };

  if (!rawText || !rawText.trim()) return result;

  const text = rawText.replace(/\r\n/g, '\n');

  // 1. ORDER NUMBER (ej. 19-15314-58459 o 16-15194-69056)
  const orderNumRegex = /(?:order\s*(?:number|#|no)?\s*[:\t]?\s*|^|\b)(\d{2}-\d{5}-\d{5})\b/i;
  const orderMatch = text.match(orderNumRegex);
  if (orderMatch && orderMatch[1]) {
    result.orderNumber = orderMatch[1];
    result.detectedCount++;
  } else {
    const orderFallback = text.match(/order\s*(?:number|#|no)\s*[:\t]?\s*([0-9A-Za-z-]+)/i);
    if (orderFallback && orderFallback[1].length >= 8) {
      result.orderNumber = orderFallback[1].trim();
      result.detectedCount++;
    }
  }

  // 2. PURCHASE DATE
  // Permite que esté pegado: "Time placedOct 22, 2026" o separado "Time placed: Oct 22, 2026"
  const timePlacedRegex = /(?:Time\s*placed|Paid\s*on|Placed\s*on|Date\s*placed|Purchased\s*on)\s*[:\t]?\s*([A-Za-z]{3,10}\s+\d{1,2},?\s+\d{4})/i;
  const dateMatch = text.match(timePlacedRegex);

  if (dateMatch && dateMatch[1]) {
    const iso = parseDateToIso(dateMatch[1]);
    if (iso) {
      result.purchaseDate = iso;
      result.detectedCount++;
    }
  } else {
    // Si no está Time placed, buscar línea por línea ignorando devoluciones, entregas y arribos
    const lines = text.split('\n');
    let fallbackIso: string | undefined;

    for (const line of lines) {
      // Ignorar líneas de garantía, devolución o llegada estimada
      if (/returns|arriving|delivery|delivered|estimated|step completed/i.test(line)) {
        continue;
      }

      // Buscar "Oct 22, 2026"
      const withYear = line.match(/\b([A-Za-z]{3,10}\s+\d{1,2},?\s+202\d)\b/i);
      if (withYear) {
        fallbackIso = parseDateToIso(withYear[1]);
        break;
      }
    }

    // Si aún no la encuentra, buscar si hay una línea bajo "Paid" o "Payment info" (ej: "Oct 22 at 3:13 PM")
    if (!fallbackIso) {
      const paymentDateMatch = text.match(/(?:Paid|Payment info)[\s\S]{0,80}?\b([A-Za-z]{3,10}\s+\d{1,2})\b(?:\s+at\s+\d{1,2}:\d{2})?/i);
      if (paymentDateMatch && paymentDateMatch[1]) {
        fallbackIso = parseDateToIso(paymentDateMatch[1], new Date().getFullYear().toString());
      }
    }

    if (fallbackIso) {
      result.purchaseDate = fallbackIso;
      result.detectedCount++;
    }
  }

  // 3. TRACKING NUMBER & CARRIER
  const trackingBlockRegex = /(?:Tracking details|Track package|Tracking number|Guía de seguimiento)[\s\S]{0,120}?(?:Number|Tracking|Guía)?\s*[:\t]?\s*([0-9]{20,24}|1Z[0-9A-Z]{16}|94[0-9]{20}|92[0-9]{20}|93[0-9]{20}|[0-9]{12,15})/i;
  const trackingMatch = text.match(trackingBlockRegex);
  if (trackingMatch && trackingMatch[1]) {
    result.trackingNumber = trackingMatch[1].trim();
    result.carrier = detectCarrier(result.trackingNumber);
    result.detectedCount++;
  } else {
    const uspsMatch = text.match(/\b(94[0-9]{20}|92[0-9]{20}|93[0-9]{20})\b/);
    if (uspsMatch) {
      result.trackingNumber = uspsMatch[1];
      result.carrier = 'USPS';
      result.detectedCount++;
    } else {
      const upsMatch = text.match(/\b(1Z[0-9A-Z]{16})\b/i);
      if (upsMatch) {
        result.trackingNumber = upsMatch[1];
        result.carrier = 'UPS';
        result.detectedCount++;
      }
    }
  }

  // 4. ITEM NUMBER (eBay Item ID)
  const itemNumMatch = text.match(/Item number\s*[:\t]?\s*(\d{10,14})/i);
  if (itemNumMatch && itemNumMatch[1]) {
    result.itemNumber = itemNumMatch[1];
    result.ebayLink = `https://www.ebay.com/itm/${itemNumMatch[1]}`;
    result.detectedCount++;
  }

  // 5. ITEM TITLE & MODEL DETAILS
  let extractedTitle = '';
  const itemInfoMatch = text.match(/Item info[\r\n\s]+([^\r\n]+)/i);
  if (itemInfoMatch && itemInfoMatch[1].trim()) {
    extractedTitle = itemInfoMatch[1].trim();
  } else {
    const lines = text.split('\n');
    for (const line of lines) {
      const cleanLine = line.trim();
      if (/iphone/i.test(cleanLine) && cleanLine.length > 10 && cleanLine.length < 150) {
        extractedTitle = cleanLine;
        break;
      }
    }
  }

  if (extractedTitle) {
    result.rawTitle = extractedTitle;
    result.detectedCount++;

    const modelPatterns = [
      { regex: /iphone\s*16\s*pro\s*max/i, name: 'iPhone 16 Pro Max' },
      { regex: /iphone\s*16\s*pro/i, name: 'iPhone 16 Pro' },
      { regex: /iphone\s*16\s*plus/i, name: 'iPhone 16 Plus' },
      { regex: /iphone\s*16/i, name: 'iPhone 16' },
      { regex: /iphone\s*15\s*pro\s*max/i, name: 'iPhone 15 Pro Max' },
      { regex: /iphone\s*15\s*pro/i, name: 'iPhone 15 Pro' },
      { regex: /iphone\s*15\s*plus/i, name: 'iPhone 15 Plus' },
      { regex: /iphone\s*15/i, name: 'iPhone 15' },
      { regex: /iphone\s*14\s*pro\s*max/i, name: 'iPhone 14 Pro Max' },
      { regex: /iphone\s*14\s*pro/i, name: 'iPhone 14 Pro' },
      { regex: /iphone\s*14\s*plus/i, name: 'iPhone 14 Plus' },
      { regex: /iphone\s*14/i, name: 'iPhone 14' },
      { regex: /iphone\s*13\s*pro\s*max/i, name: 'iPhone 13 Pro Max' },
      { regex: /iphone\s*13\s*pro/i, name: 'iPhone 13 Pro' },
      { regex: /iphone\s*13\s*mini/i, name: 'iPhone 13 mini' },
      { regex: /iphone\s*13/i, name: 'iPhone 13' },
      { regex: /iphone\s*12\s*pro\s*max/i, name: 'iPhone 12 Pro Max' },
      { regex: /iphone\s*12\s*pro/i, name: 'iPhone 12 Pro' },
      { regex: /iphone\s*12\s*mini/i, name: 'iPhone 12 mini' },
      { regex: /iphone\s*12/i, name: 'iPhone 12' },
      { regex: /iphone\s*11\s*pro\s*max/i, name: 'iPhone 11 Pro Max' },
      { regex: /iphone\s*11\s*pro/i, name: 'iPhone 11 Pro' },
      { regex: /iphone\s*11/i, name: 'iPhone 11' },
      { regex: /iphone\s*xs\s*max/i, name: 'iPhone XS Max' },
      { regex: /iphone\s*xs/i, name: 'iPhone XS' },
      { regex: /iphone\s*xr/i, name: 'iPhone XR' },
      { regex: /iphone\s*x/i, name: 'iPhone X' },
      { regex: /iphone\s*se/i, name: 'iPhone SE' },
    ];

    for (const p of modelPatterns) {
      if (p.regex.test(extractedTitle)) {
        result.model = p.name;
        break;
      }
    }

    const storageMatch = extractedTitle.match(/\b(64|128|256|512)\s*GB\b/i) || extractedTitle.match(/\b(1|2)\s*TB\b/i);
    if (storageMatch) {
      result.storage = storageMatch[0].toUpperCase().replace(/\s+/g, '');
    }

    const colors = [
      'Sierra Blue', 'Alpine Green', 'Deep Purple', 'Space Black', 'Midnight',
      'Starlight', 'Pacific Blue', 'Graphite', 'Space Gray', 'Rose Gold',
      'Silver', 'Gold', 'Blue', 'Pink', 'Green', 'Yellow', 'Red', 'Black', 'White', 'Purple',
      'Azul', 'Verde', 'Blanco', 'Negro', 'Rosa', 'Oro', 'Plata'
    ];
    for (const c of colors) {
      const reg = new RegExp(`\\b${c}\\b`, 'i');
      if (reg.test(extractedTitle)) {
        result.color = c;
        break;
      }
    }
  }

  // 6. CONDITION
  if (/\b(?:New|Brand New|Nuevo)\b/i.test(text)) {
    result.condition = 'Nuevo';
  } else if (/\b(?:Refurbished|Reacondicionado|Certified Refurbished|Like New|Como Nuevo)\b/i.test(text)) {
    result.condition = 'Como Nuevo';
  } else if (/\b(?:UsedUsed|Used|Pre-owned|Usado)\b/i.test(text)) {
    result.condition = 'Excelente';
  } else if (/\b(?:Parts|For parts|Repuesto)\b/i.test(text)) {
    result.condition = 'Para Repuesto';
  }

  // 7. COSTS: PRODUCT PRICE, SHIPPING, ORDER TOTAL
  const unitPriceMatch = text.match(/(?:Unit price|Precio unitario)\s*[:\t]?\s*\$([0-9]+(?:\.[0-9]{2})?)/i) ||
    text.match(/\$([0-9]+(?:\.[0-9]{2})?)\s*(?:Unit price|Precio unitario)/i) ||
    text.match(/(?:1 item|1 artículo)[\r\n\s]+\$([0-9]+(?:\.[0-9]{2})?)/i);

  if (unitPriceMatch && unitPriceMatch[1]) {
    result.productCostUsdt = parseFloat(unitPriceMatch[1]);
    result.detectedCount++;
  }

  const shippingMatch = text.match(/(?:Shipping|Envío)[\r\n\s]+(?:within US[\s\S]*?)?\$([0-9]+(?:\.[0-9]{2})?)/i) ||
    text.match(/(?:Shipping|Envío)\s*[:\t]?\s*\$([0-9]+(?:\.[0-9]{2})?)/i);

  if (shippingMatch && shippingMatch[1]) {
    const shipVal = parseFloat(shippingMatch[1]);
    result.usShippingCostUsdt = shipVal;
    result.hasUsShippingCost = shipVal > 0;
    result.detectedCount++;
  } else if (/(?:Shipping|Envío)[\r\n\s]+Free|Envío gratis/i.test(text)) {
    result.usShippingCostUsdt = 0;
    result.hasUsShippingCost = false;
    result.detectedCount++;
  }

  const orderTotalMatch = text.match(/(?:Order total|Total del pedido|Total)[\s\S]{0,20}?\$([0-9]+(?:\.[0-9]{2})?)/i);
  if (orderTotalMatch && orderTotalMatch[1]) {
    result.orderTotalUsdt = parseFloat(orderTotalMatch[1]);
  }

  if (result.productCostUsdt === undefined && result.orderTotalUsdt !== undefined) {
    const ship = result.usShippingCostUsdt || 0;
    result.productCostUsdt = Number((result.orderTotalUsdt - ship).toFixed(2));
    result.detectedCount++;
  }

  // 8. SELLER USERNAME
  const sellerMatch = text.match(/Sold by\s*[:\t]?\s*([0-9A-Za-z_.-]+)/i);
  if (sellerMatch && sellerMatch[1]) {
    result.sellerUsername = sellerMatch[1].trim();
  }

  return result;
}