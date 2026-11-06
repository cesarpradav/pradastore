import { PhoneItem, CurrencyRates, SellerProfile, Customer, WarrantyOrder } from '../types';

export const INITIAL_RATES: CurrencyRates = {
  bcvRate: 78.45,       // Tasa Oficial BCV Bs / USD
  binanceUsdtRate: 88.90, // Tasa Binance P2P USDT Bs / USDT
  lastUpdated: new Date().toISOString(),
};

export const DEFAULT_WARRANTY_TERMS = 
  'El cliente declara haber recibido el equipo iPhone arriba especificado a entera satisfacción, revisado y probado en todas sus funciones operativas (pantalla, táctil, cámaras, Face ID / Touch ID, audio, señal, llamadas y condición estética). Esta Nota de Entrega respalda la legítima propiedad y serial IMEI. Por política comercial y la naturaleza del equipo usado/reacondicionado, no se realizan devoluciones de dinero ni cambios por razones estéticas, desgaste o inconformidad posterior a la entrega. Toda revisión técnica de cortesía queda estrictamente limitada a defectos internos de fabricación durante un lapso de 7 días continuos y queda sin efecto si el equipo presenta golpes, caídas, pantalla rota, contacto con humedad o líquidos, sobrevoltaje eléctrico o manipulación por técnicos terceros.';

export const DEFAULT_SELLER_PROFILE: SellerProfile = {
  sellerName: 'César Prada',
  sellerIdNumber: 'V-20.123.456',
  sellerPhone: '0414-9876543',
  storeName: 'iPhoneros Store Vzla',
  instagram: '@iphoneros.vzla',
  cityAddress: 'Barinas, Venezuela',
  warrantyTerms: DEFAULT_WARRANTY_TERMS,
};

// Inventario inicial vacío para comenzar desde cero
export const INITIAL_PHONES: PhoneItem[] = [];

// Base de datos de clientes inicial vacía
export const INITIAL_CUSTOMERS: Customer[] = [];

// Base de datos de órdenes de entrega y garantías inicial vacía
export const INITIAL_ORDERS: WarrantyOrder[] = [];
