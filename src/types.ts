export interface CurrencyRates {
  bcvRate: number; // e.g. 78.50 Bs / USD
  binanceUsdtRate: number; // e.g. 89.20 Bs / USDT
  lastUpdated: string;
  bcvEffectiveDate?: string;
  bcvEffectiveDateFormatted?: string;
  bcvIsTomorrow?: boolean;
  source?: string;
}

export type PhoneCondition = 'Nuevo' | 'Como Nuevo' | 'Excelente' | 'Buen Estado' | 'Para Repuesto' | 'Otro';

export type ItemStatus = 
  | 'en_transito_usa'      // Comprado en eBay, viajando a Miami
  | 'en_casillero_zoom'    // En casillero Zoom Miami / En vuelo a Vzla
  | 'en_agencia_zoom'      // Llegó a Zoom Venezuela, listo para pagar/retirar
  | 'disponible_para_venta'// Retirado de Zoom y listo para la venta
  | 'reservado'            // Apartado por un cliente
  | 'vendido';             // Vendido con ganancia consolidada

export interface PhoneItem {
  id: string;
  model: string;                 // e.g. "Apple iPhone 13 Pro"
  condition: PhoneCondition;
  imei?: string;                 // IMEI 1 principal
  imei1?: string;                // Alias IMEI 1
  imei2?: string;                // IMEI 2 (eSIM o bandeja física secundaria)
  storage?: string;              // e.g. "128GB", "256GB"
  color?: string;                // e.g. "Sierra Blue", "Space Black"
  physicalGrade?: string;        // e.g. "Grado A - Pantalla intacta, leves micro-detalles en bisel"
  
  // eBay details
  ebayLink: string;
  ebayOrderNumber?: string;
  purchaseDate: string;          // YYYY-MM-DD
  
  // Costo en USDT Binance
  productCostUsdt: number;
  usShippingCostUsdt?: number;   // Costo de envío o taxes dentro de EE.UU.
  additionalCostUsdt: number;    // Protectores, micas, baterias, repuestos
  
  // Tracking USA & Pre-alerta Zoom
  usTrackingNumber: string;      // Guía dentro de EEUU (USPS, FedEx, UPS)
  usCarrier?: string;            // USPS, FedEx, UPS, DHL, Amazon Logistics, Zoom
  isPrealerted: boolean;         // Prealertado en Zoom ? Si o No
  prealertDate?: string;
  zoomTrackingNumber?: string;   // Número de guía o casillero de Zoom
  
  // Costo de Zoom (Importación EEUU a Vzla)
  zoomCostStatus: 'known' | 'pending'; // Si - cuanto, No - en espera
  zoomCostBcv: number;                 // Costo facturado por Zoom en $ a tasa BCV
  
  // Pago en Zoom
  isZoomPaid: boolean;                 // Pagado en Zoom: Si o No
  zoomPaidAmountBcv: number;           // Monto pagado
  zoomPaymentMethod?: 'Bolívares (BCV)' | 'Dólares Efectivo' | 'Pago Móvil' | 'Transferencia';
  
  // Retiro en Zoom
  isZoomPickedUp: boolean;             // Retirado en zoom: Si o No
  zoomPickupDate?: string;
  zoomAgency?: string;                 // e.g. "Zoom Boleíta", "Zoom Valencia Centro"
  
  // Ventas y Ganancias
  projectedPriceUsdt: number;          // Precio Prospectado en $ USDT
  status: ItemStatus;
  soldPriceUsdt?: number;              // Precio Vendido en $ USDT
  soldDate?: string;
  buyerName?: string;
  buyerPhone?: string;
  buyerIdNumber?: string;              // Cédula o RIF del cliente
  soldPaymentMethod?: string;          // Forma de pago del cliente (Zelle, Efectivo, Pago Móvil, etc.)
  receiptNumber?: string;              // Número de recibo de venta / control
  orderControlNumber?: string;         // e.g. "GAR-0015"
  
  // Ficha comercial / Garantía
  batteryHealth?: number;              // % de salud de batería (ej. 88%)
  accessories?: string;                // ej. "Cable Original + Mica 9D instalada + Cubo 20W"
  warrantyDays?: number;               // ej. 30 días
  
  // Fotos del Producto (URLs de eBay, fotos locales o capturas)
  images?: string[];                   // Lista de URLs o Data URLs de fotos del iPhone
  primaryImage?: string;               // Foto de portada principal

  // Archivo de Equipos Vendidos
  isArchived?: boolean;                // Archivado (oculta de listas activas manteniendo historial)
  archivedAt?: string;                 // Fecha de archivo (ISO string)

  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  idNumber: string;                    // Cédula / RIF (ej. "V-18.456.789")
  fullName: string;                    // Nombre y Apellido
  phone: string;                       // Teléfono de contacto / WhatsApp
  email?: string;
  instagram?: string;                  // @usuario_instagram
  city?: string;                       // ej. Caracas / Valencia / Maracaibo
  address?: string;                    // Dirección opcional
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SellerProfile {
  sellerName: string;                  // Tu Nombre y Apellido (ej. "Carlos Mendoza")
  sellerIdNumber: string;              // Tu Cédula de Identidad (ej. "V-24.567.890")
  sellerPhone: string;                 // Tu Teléfono / WhatsApp (ej. "0414-1234567")
  storeName: string;                   // Nombre Comercial (ej. "iPhoneros Store Vzla")
  instagram: string;                   // Red Social (ej. "@iphoneros.vzla")
  cityAddress: string;                 // Ciudad / Ubicación (ej. "Caracas, Venezuela")
  warrantyTerms: string;               // Texto de garantía estricto
}

export interface WarrantyClaimLog {
  id: string;
  date: string;
  issueDescription: string;
  batteryHealthAtClaim?: number;
  physicalConditionNotes?: string;
  resolution: string;
  technicianNotes?: string;
}

export interface WarrantyOrder {
  id: string;
  controlNumber: string;               // e.g. "GAR-0001", "GAR-0015"
  date: string;                        // Fecha de emisión / entrega
  
  // Datos del Cliente
  customerId?: string;
  customerName: string;
  customerIdNumber: string;            // Cédula de Identidad del Cliente
  customerPhone: string;
  
  // Datos del Equipo (Núcleo de Protección Serializada)
  phoneItemId: string;
  phoneModel: string;                  // e.g. "Apple iPhone 13 Pro"
  storage: string;                     // e.g. "256 GB"
  color: string;                       // e.g. "Sierra Blue"
  imei1: string;                       // IMEI 1 (Fundamental)
  imei2?: string;                      // IMEI 2 (Opcional/eSIM)
  batteryHealth?: number;              // Condición de Batería (ej. 88%)
  physicalGrade: string;               // Estado Físico / Observaciones (ej. "Grado A - Pantalla intacta...")
  accessories: string;                 // Accesorios entregados
  primaryImage?: string;               // Foto del equipo entregado (opcional)
  
  // Detalle Económico
  amountPaidUsdt: number;              // Monto Pagado en USD / USDT
  amountPaidBs: number;                // Monto equivalente en Bolívares
  originalProjectedUsdt?: number;      // Precio esperado antes de la negociación (ej. $280)
  discountUsdt?: number;               // Descuento concedido en la negociación (ej. $10)
  bcvRateUsed: number;
  binanceRateUsed: number;
  paymentMethod: string;               // Método de Pago (ej. "Zelle", "Dólares Efectivo", "Pago Móvil", "Binance USDT")
  paymentReference?: string;           // Referencia de pago opcional
  
  // Términos de Entrega y Recepción Conforme (en lugar de 'garantía')
  warrantyDays: number;                // Días de revisión técnica acordados (ej. 7, 15, 30 días)
  warrantyExpiresDate: string;         // YYYY-MM-DD
  warrantyTerms: string;               // Términos de conformidad y exclusiones claras
  
  // Datos del Vendedor
  seller: SellerProfile;
  
  // Estado y Reclamos
  status: 'active' | 'expired' | 'voided';
  voidReason?: string;
  claimLogs?: WarrantyClaimLog[];
  
  createdAt: string;
  updatedAt: string;
}

export interface FinancialSummary {
  totalItems: number;
  totalInvestedUsdt: number;
  totalZoomCostUsdt: number;
  totalRealCostUsdt: number;
  totalProjectedRevenueUsdt: number;
  totalProjectedProfitUsdt: number;      // Ganancia proyectada de stock activo & en camino (no vendidos)
  totalAllProjectedProfitUsdt?: number;  // Ganancia prospectada histórica total
  totalCombinedProfitUsdt: number;       // Ganancia Real Cerrada + Ganancia Proyectada Activa
  totalSoldRevenueUsdt: number;
  totalRealProfitUsdt: number;
  
  itemsInTransitUsa: number;
  itemsInZoom: number;
  itemsAvailable: number;
  itemsSold: number;
  itemsSoldActive: number;               // Vendidos activos (no archivados)
  itemsArchived: number;                 // Vendidos archivados
  activeProjectedCount: number;          // Equipos en tránsito y stock que forman la proyección
  
  pendingPrealertCount: number;
  pendingZoomPaymentCount: number;
  pendingZoomPickupCount: number;
}
