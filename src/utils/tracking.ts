export interface CarrierInfo {
  id: string;
  name: string;
  shortName: string;
  color: string;
  bgLight: string;
  borderColor: string;
  textColor: string;
  trackingUrl: (trackingNumber: string) => string;
  logoText: string;
  examplePattern: string;
}

export const CARRIERS: Record<string, CarrierInfo> = {
  USPS: {
    id: 'USPS',
    name: 'USPS (U.S. Postal Service)',
    shortName: 'USPS',
    color: '#004B87',
    bgLight: 'bg-blue-950/60',
    borderColor: 'border-blue-700/60',
    textColor: 'text-blue-400',
    trackingUrl: (track) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(track.trim())}`,
    logoText: 'USPS',
    examplePattern: '9400 1118 9922... (20-22 dígitos)',
  },
  UPS: {
    id: 'UPS',
    name: 'UPS (United Parcel Service)',
    shortName: 'UPS',
    color: '#351C15',
    bgLight: 'bg-amber-950/60',
    borderColor: 'border-amber-700/60',
    textColor: 'text-amber-400',
    trackingUrl: (track) => `https://www.ups.com/track?tracknum=${encodeURIComponent(track.trim())}`,
    logoText: 'UPS',
    examplePattern: '1Z9999999999999999 (Inicia con 1Z)',
  },
  FedEx: {
    id: 'FedEx',
    name: 'FedEx Express / Ground',
    shortName: 'FedEx',
    color: '#4D148C',
    bgLight: 'bg-purple-950/60',
    borderColor: 'border-purple-700/60',
    textColor: 'text-purple-400',
    trackingUrl: (track) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(track.trim())}`,
    logoText: 'FedEx',
    examplePattern: '782910482910 (12 o 15 dígitos)',
  },
  DHL: {
    id: 'DHL',
    name: 'DHL Express',
    shortName: 'DHL',
    color: '#D40511',
    bgLight: 'bg-rose-950/60',
    borderColor: 'border-rose-700/60',
    textColor: 'text-rose-400',
    trackingUrl: (track) => `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(track.trim())}`,
    logoText: 'DHL',
    examplePattern: '10 dígitos numéricos',
  },
  Amazon: {
    id: 'Amazon',
    name: 'Amazon Logistics (TBA)',
    shortName: 'Amazon',
    color: '#FF9900',
    bgLight: 'bg-orange-950/60',
    borderColor: 'border-orange-700/60',
    textColor: 'text-orange-400',
    trackingUrl: (track) => `https://track.amazon.com/tracking/${encodeURIComponent(track.trim())}`,
    logoText: 'Amazon',
    examplePattern: 'TBA999999999999',
  },
  OnTrac: {
    id: 'OnTrac',
    name: 'OnTrac / LaserShip',
    shortName: 'OnTrac',
    color: '#008080',
    bgLight: 'bg-teal-950/60',
    borderColor: 'border-teal-700/60',
    textColor: 'text-teal-400',
    trackingUrl: (track) => `https://www.ontrac.com/tracking/?number=${encodeURIComponent(track.trim())}`,
    logoText: 'OnTrac',
    examplePattern: 'C10000000000000 o D100000000000',
  },
  Zoom: {
    id: 'Zoom',
    name: 'Zoom Envíos Venezuela',
    shortName: 'Zoom Vzla',
    color: '#0055A5',
    bgLight: 'bg-sky-950/60',
    borderColor: 'border-sky-700/60',
    textColor: 'text-sky-400',
    trackingUrl: (track) => `https://zoom.red/`,
    logoText: 'ZOOM',
    examplePattern: 'ZM-XXXXX o 8-10 dígitos de casillero',
  },
  Universal: {
    id: 'Universal',
    name: '17Track / Universal Multi-Carrier',
    shortName: '17Track',
    color: '#FF6600',
    bgLight: 'bg-slate-900',
    borderColor: 'border-slate-700',
    textColor: 'text-amber-400',
    trackingUrl: (track) => `https://t.17track.net/en#nums=${encodeURIComponent(track.trim())}`,
    logoText: '17Track',
    examplePattern: 'Cualquier transportista mundial',
  },
};

/**
 * Detecta automáticamente el transportista probable a partir del formato de la guía
 */
export function detectCarrier(trackingNumber: string): string {
  if (!trackingNumber) return 'USPS';
  const clean = trackingNumber.trim().toUpperCase().replace(/\s+/g, '');

  if (clean.startsWith('1Z')) {
    return 'UPS';
  }

  if (clean.startsWith('TBA')) {
    return 'Amazon';
  }

  if (clean.startsWith('ZM') || clean.startsWith('ZOOM')) {
    return 'Zoom';
  }

  // USPS: típicamente 20 a 22 dígitos numéricos que inician con 94, 92, 93, 95, 420 o 2 letras + 9 dígitos + US
  if (/^(94|92|93|95|420)\d{18,24}$/.test(clean) || /^[A-Z]{2}\d{9}US$/.test(clean) || clean.length >= 20 && /^\d+$/.test(clean)) {
    return 'USPS';
  }

  // FedEx: 12, 15, o 20 dígitos numéricos
  if (/^\d{12}$/.test(clean) || /^\d{15}$/.test(clean)) {
    return 'FedEx';
  }

  // DHL: 10 dígitos
  if (/^\d{10}$/.test(clean) || /^JD\d{18}$/.test(clean)) {
    return 'DHL';
  }

  // OnTrac: Letra C o D seguido de dígitos
  if (/^[CD]\d{13,14}$/.test(clean)) {
    return 'OnTrac';
  }

  return 'USPS';
}

/**
 * Obtiene la URL de rastreo directo para un transportista y guía
 */
export function getTrackingUrl(carrier: string | undefined, trackingNumber: string): string {
  if (!trackingNumber || !trackingNumber.trim()) return '#';
  const cleanTrack = trackingNumber.trim();
  const normalizedCarrier = carrier?.trim() || detectCarrier(cleanTrack);
  
  const carrierInfo = CARRIERS[normalizedCarrier] || CARRIERS.USPS;
  return carrierInfo.trackingUrl(cleanTrack);
}

/**
 * Obtiene URL alternativa universal en 17Track o ParcelsApp
 */
export function getUniversalTrackingUrl(trackingNumber: string): string {
  if (!trackingNumber) return '#';
  return `https://parcelsapp.com/es/tracking/${encodeURIComponent(trackingNumber.trim())}`;
}
