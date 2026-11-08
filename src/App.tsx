import React, { useState, useEffect, useCallback } from 'react';
import { PhoneItem, CurrencyRates, Customer, WarrantyOrder, SellerProfile } from './types';
import { 
  INITIAL_PHONES, 
  INITIAL_RATES, 
  INITIAL_CUSTOMERS, 
  INITIAL_ORDERS, 
  DEFAULT_SELLER_PROFILE 
} from './data/initialData';
import { calculateFinancialSummary } from './utils/calculations';
import { RatesBar } from './components/RatesBar';
import { Navbar, ActiveNavTab } from './components/Navbar';
import { KpiOverview } from './components/KpiOverview';
import { PhoneList } from './components/PhoneList';
import { PhoneFormModal } from './components/PhoneFormModal';
import { PhoneDetailModal } from './components/PhoneDetailModal';
import { RatesConfigModal } from './components/RatesConfigModal';
import { ProfitCalculatorModal } from './components/ProfitCalculatorModal';
import { ExportImportModal } from './components/ExportImportModal';
import { QuickSoldModal } from './components/QuickSoldModal';
import { SocialPostModal } from './components/SocialPostModal';
import { SalesReceiptModal } from './components/SalesReceiptModal';
import { WarrantyOrderModal } from './components/WarrantyOrderModal';
import { NewSaleOrderModal } from './components/NewSaleOrderModal';
import { WarrantyOrdersList } from './components/WarrantyOrdersList';
import { WarrantyLookupView } from './components/WarrantyLookupView';
import { CustomersView } from './components/CustomersView';
import { SellerProfileModal } from './components/SellerProfileModal';
import { TrackingModal } from './components/TrackingModal';
import { CatalogView } from './components/CatalogView';
import { CloudSyncModal } from './components/CloudSyncModal';
import { ZoomSyncModal } from './components/ZoomSyncModal';
import { fetchLiveRates } from './services/ratesService';
import {
  AuthUser,
  onAuthStateChange,
  loginWithGoogle,
  logoutSupabase,
  getCloudData,
  savePhoneToSupabase,
  deletePhoneFromSupabase,
  saveCustomerToSupabase,
  deleteCustomerFromSupabase,
  saveOrderToSupabase,
  deleteOrderFromSupabase,
  saveProfileToSupabase,
  syncAllToSupabase,
} from './services/supabaseDatabase';
import { 
  Package, 
  HelpCircle, 
  Sparkles, 
  ExternalLink, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  DollarSign,
  Plus,
  FileText,
  Cloud,
  CheckCircle2,
  X
} from 'lucide-react';

const STORAGE_KEY_PHONES = 'ebay_zoom_inventory_phones_v2';
const STORAGE_KEY_RATES = 'ebay_zoom_inventory_rates_v1';
const STORAGE_KEY_CURRENCY_VIEW = 'ebay_zoom_currency_view_v1';
const STORAGE_KEY_CUSTOMERS = 'ebay_zoom_customers_v1';
const STORAGE_KEY_ORDERS = 'ebay_zoom_warranty_orders_v1';
const STORAGE_KEY_SELLER_PROFILE = 'ebay_zoom_seller_profile_v1';

export default function App() {
  // 1. Estado de Teléfonos (Inventario Serializado)
  const [phones, setPhones] = useState<PhoneItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PHONES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading phones from storage', e);
    }
    return INITIAL_PHONES;
  });

  // 2. Estado de Tasas de Cambio
  const [rates, setRates] = useState<CurrencyRates>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RATES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading rates from storage', e);
    }
    return INITIAL_RATES;
  });

  // 3. Estado de Clientes (Módulo CRM)
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading customers from storage', e);
    }
    return INITIAL_CUSTOMERS;
  });

  // 4. Estado de Órdenes de Entrega & Certificados de Garantía
  const [orders, setOrders] = useState<WarrantyOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading orders from storage', e);
    }
    return INITIAL_ORDERS;
  });

  // 5. Datos del Vendedor / Emprendedor & Términos
  const [sellerProfile, setSellerProfile] = useState<SellerProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SELLER_PROFILE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading seller profile from storage', e);
    }
    return DEFAULT_SELLER_PROFILE;
  });

  // 6. Navegación Principal (Pestañas de los 4 Módulos)
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('inventory');

  // 6.1 Tema Claro / Oscuro
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('iphone_theme_mode');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem('iphone_theme_mode', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // 7. Vista de Moneda
  const [currencyView, setCurrencyView] = useState<'USDT' | 'BS' | 'DUAL'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENCY_VIEW);
      if (saved && (saved === 'USDT' || saved === 'BS' || saved === 'DUAL')) {
        return saved as 'USDT' | 'BS' | 'DUAL';
      }
    } catch (e) {}
    return 'USDT';
  });

  // 8. Filtros de Inventario
  const [activeFilter, setActiveFilter] = useState<string>('todos');

  // 9. Modales
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [editingPhone, setEditingPhone] = useState<PhoneItem | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<PhoneItem | null>(null);

  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);

  const [isQuickSoldModalOpen, setIsQuickSoldModalOpen] = useState(false);
  const [quickSoldItem, setQuickSoldItem] = useState<PhoneItem | null>(null);

  // Modal Nueva Venta Asistida
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [saleInitialPhone, setSaleInitialPhone] = useState<PhoneItem | null>(null);

  // Modal Certificado de Garantía / Orden de Entrega (Documento 5 Secciones)
  const [isWarrantyModalOpen, setIsWarrantyModalOpen] = useState(false);
  const [selectedWarrantyOrder, setSelectedWarrantyOrder] = useState<WarrantyOrder | null>(null);

  // Modo Catálogo
  const [isCatalogMode, setIsCatalogMode] = useState<boolean>(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [selectedSocialPhone, setSelectedSocialPhone] = useState<PhoneItem | null>(null);

  // Modal Rastreador Multitransportista (USPS, UPS, FedEx, DHL, Zoom)
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingInitialNumber, setTrackingInitialNumber] = useState<string>('');
  const [trackingInitialCarrier, setTrackingInitialCarrier] = useState<string>('');

  // Modal Sincronizador Zoom Envíos (Gmail)
  const [isZoomSyncModalOpen, setIsZoomSyncModalOpen] = useState<boolean>(false);

  // Sincronización en vivo de tasas
  const [isRatesLoading, setIsRatesLoading] = useState(false);
  const [lastRatesSyncMessage, setLastRatesSyncMessage] = useState<string>('');

  // Consultar tasas en vivo
  const handleRefreshLiveRates = useCallback(async (forceRefresh = true) => {
    setIsRatesLoading(true);
    try {
      const data = await fetchLiveRates(forceRefresh);
      if (data && (data.bcv || data.sale)) {
        setRates((prev) => ({
          ...prev,
          bcvRate: data.bcv?.rate || prev.bcvRate,
          binanceUsdtRate: data.sale?.rate || prev.binanceUsdtRate,
          bcvEffectiveDate: data.bcv?.effectiveDate,
          bcvEffectiveDateFormatted: data.bcv?.effectiveDateFormatted,
          bcvIsTomorrow: data.bcv?.isTomorrowRate,
          source: data.source || data.bcv?.source || prev.source,
          lastUpdated: new Date().toISOString(),
        }));
        setLastRatesSyncMessage(`Sincronizado ${new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}`);
      }
    } catch (err) {
      console.error('Error al sincronizar tasas:', err);
    } finally {
      setIsRatesLoading(false);
    }
  }, []);

  // Actualizaciones directas desde la barra
  const handleUpdateBcvRate = (newBcv: number) => {
    setRates((prev) => ({
      ...prev,
      bcvRate: newBcv,
      lastUpdated: new Date().toISOString(),
    }));
  };

  const handleUpdateSaleRate = (newSale: number) => {
    setRates((prev) => ({
      ...prev,
      binanceUsdtRate: newSale,
      lastUpdated: new Date().toISOString(),
    }));
  };

  useEffect(() => {
    handleRefreshLiveRates(false);
  }, [handleRefreshLiveRates]);

  // Supabase Auth & Cloud Sync States
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState<boolean>(false);
  const [cloudNotification, setCloudNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Sincronización Inteligente Bidireccional (Merge / Push / Pull)
  const performTwoWaySync = useCallback(async (
    forcePush: boolean = false, 
    forcePull: boolean = false,
    targetUser?: AuthUser | null
  ) => {
    const userToSync = targetUser || currentUser;
    if (!userToSync) return;

    setIsSyncingCloud(true);
    try {
      const cloud = await getCloudData(userToSync.uid);

      // CASO A: Forzar Subida (Push) de este dispositivo a la nube
      if (forcePush) {
        await syncAllToSupabase(userToSync.uid, phones, customers, orders, sellerProfile);
        setCloudNotification({
          message: `¡Nube actualizada! Se respaldaron ${phones.length} iPhones y ${orders.length} notas en tu cuenta ${userToSync.email}.`,
          type: 'success',
        });
        return;
      }

      // CASO B: Forzar Descarga (Pull) de la nube a este dispositivo
      if (forcePull) {
        setPhones(cloud.phones);
        setCustomers(cloud.customers);
        setOrders(cloud.orders);
        if (cloud.profile) setSellerProfile(cloud.profile);
        setCloudNotification({
          message: `¡Descarga exitosa! Se cargaron ${cloud.phones.length} iPhones desde tu cuenta.`,
          type: 'success',
        });
        return;
      }

      // CASO C: La nube tiene datos y este dispositivo está vacío (segunda computadora o navegador nuevo)
      if (cloud.phones.length > 0 && phones.length === 0) {
        setPhones(cloud.phones);
        setCustomers(cloud.customers);
        setOrders(cloud.orders);
        if (cloud.profile) setSellerProfile(cloud.profile);
        setCloudNotification({
          message: `¡Sincronizado! Se cargaron ${cloud.phones.length} iPhones desde tu cuenta ${userToSync.email}.`,
          type: 'success',
        });
        return;
      }

      // CASO D: Este dispositivo tiene datos y la nube estaba vacía (primer dispositivo)
      if (phones.length > 0 && cloud.phones.length === 0) {
        await syncAllToSupabase(userToSync.uid, phones, customers, orders, sellerProfile);
        setCloudNotification({
          message: `¡Inventario subido a la nube! ${phones.length} iPhones quedaron guardados para verse en tus otros dispositivos.`,
          type: 'success',
        });
        return;
      }

      // CASO E: Ambos tienen datos (Unificación / Merge Inteligente)
      if (cloud.phones.length > 0 && phones.length > 0) {
        const mergedPhonesMap = new Map<string, PhoneItem>();
        cloud.phones.forEach((p) => mergedPhonesMap.set(p.id, p));
        phones.forEach((local) => {
          const cloudItem = mergedPhonesMap.get(local.id);
          if (!cloudItem) {
            mergedPhonesMap.set(local.id, local);
          } else {
            const localTime = new Date(local.updatedAt || local.createdAt || 0).getTime();
            const cloudTime = new Date(cloudItem.updatedAt || cloudItem.createdAt || 0).getTime();
            if (localTime > cloudTime) {
              mergedPhonesMap.set(local.id, local);
            }
          }
        });
        const unifiedPhones = Array.from(mergedPhonesMap.values());
        setPhones(unifiedPhones);

        // Clientes
        const mergedCustMap = new Map<string, Customer>();
        cloud.customers.forEach((c) => mergedCustMap.set(c.id, c));
        customers.forEach((c) => mergedCustMap.set(c.id, c));
        const unifiedCust = Array.from(mergedCustMap.values());
        setCustomers(unifiedCust);

        // Órdenes
        const mergedOrdersMap = new Map<string, WarrantyOrder>();
        cloud.orders.forEach((o) => mergedOrdersMap.set(o.id, o));
        orders.forEach((o) => mergedOrdersMap.set(o.id, o));
        const unifiedOrders = Array.from(mergedOrdersMap.values());
        setOrders(unifiedOrders);

        // Perfil
        const unifiedProfile = cloud.profile || sellerProfile;
        if (cloud.profile) setSellerProfile(cloud.profile);

        // Guardar la unificación en Supabase
        await syncAllToSupabase(userToSync.uid, unifiedPhones, unifiedCust, unifiedOrders, unifiedProfile);

        setCloudNotification({
          message: `¡Sincronización completa! ${unifiedPhones.length} iPhones unificados entre todos tus dispositivos.`,
          type: 'success',
        });
      }
    } catch (err: any) {
      console.error('Error durante la sincronización bidireccional:', err);
      setCloudNotification({
        message: `Error al sincronizar: ${err?.message || 'Error de conexión'}`,
        type: 'error',
      });
    } finally {
      setIsSyncingCloud(false);
    }
  }, [currentUser, phones, customers, orders, sellerProfile]);

  // Inicializar Supabase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setCurrentUser(user);
      if (user) {
        const cloud = await getCloudData(user.uid);
        if (cloud.phones.length > 0 && phones.length === 0) {
          setPhones(cloud.phones);
          setCustomers(cloud.customers);
          setOrders(cloud.orders);
          if (cloud.profile) setSellerProfile(cloud.profile);
        } else if (phones.length > 0 && cloud.phones.length === 0) {
          syncAllToSupabase(user.uid, phones, customers, orders, sellerProfile).catch(console.error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Acciones de autenticación y respaldo en la nube
  const handleLoginGoogle = async () => {
    try {
      setIsSyncingCloud(true);
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Error al iniciar sesión con Google:', err);
      setCloudNotification({
        message: `Detalle de autenticación: ${err?.message || 'Error conectando con Google'}`,
        type: 'error',
      });
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleLogoutGoogle = async () => {
    try {
      await logoutSupabase();
      setCurrentUser(null);
      setCloudNotification({
        message: 'Sesión cerrada. Tu inventario continúa seguro en la nube y guardado localmente.',
        type: 'info',
      });
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  const handleManualSync = async () => {
    if (!currentUser) {
      await handleLoginGoogle();
      return;
    }
    await performTwoWaySync(false, false, currentUser);
  };

  // Persistencia de Respaldo Local (LocalStorage como Fallback Offline)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PHONES, JSON.stringify(phones));
    } catch (e) {
      console.error('Error saving phones to storage', e);
    }
  }, [phones]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
    } catch (e) {
      console.error('Error saving customers to storage', e);
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.error('Error saving orders to storage', e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SELLER_PROFILE, JSON.stringify(sellerProfile));
    } catch (e) {
      console.error('Error saving seller profile to storage', e);
    }
  }, [sellerProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(rates));
    } catch (e) {
      console.error('Error saving rates to storage', e);
    }
  }, [rates]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENCY_VIEW, currencyView);
    } catch (e) {}
  }, [currencyView]);

  // Resumen Financiero Dinámico
  const summary = calculateFinancialSummary(phones, rates);

  // Equipos disponibles para venta
  const availablePhones = phones.filter((p) => p.status !== 'vendido');

  // Guardar / Actualizar Teléfono en Inventario
  const handleSavePhone = (phoneData: Partial<PhoneItem>) => {
    if (editingPhone && editingPhone.id) {
      const updatedPhone: PhoneItem = {
        ...editingPhone,
        ...phoneData,
        updatedAt: new Date().toISOString(),
      } as PhoneItem;

      setPhones((prev) =>
        prev.map((p) => (p.id === editingPhone.id ? updatedPhone : p))
      );

      if (selectedPhone?.id === editingPhone.id) {
        setSelectedPhone(updatedPhone);
      }

      if (currentUser) {
        savePhoneToSupabase(currentUser.uid, updatedPhone).catch((err) =>
          console.error('Error saving phone to Supabase', err)
        );
      }
    } else {
      const newPhone: PhoneItem = {
        id: `phone-${Date.now()}`,
        model: phoneData.model || 'Teléfono Sin Modelo',
        condition: phoneData.condition || 'Excelente',
        storage: phoneData.storage,
        color: phoneData.color,
        imei: phoneData.imei || phoneData.imei1,
        imei1: phoneData.imei1 || phoneData.imei,
        imei2: phoneData.imei2,
        physicalGrade: phoneData.physicalGrade,
        batteryHealth: phoneData.batteryHealth,
        accessories: phoneData.accessories ? phoneData.accessories.trim() : undefined,
        warrantyDays: phoneData.warrantyDays || 30,
        ebayLink: phoneData.ebayLink || '',
        ebayOrderNumber: phoneData.ebayOrderNumber,
        purchaseDate: phoneData.purchaseDate || new Date().toISOString().split('T')[0],
        productCostUsdt: phoneData.productCostUsdt || 0,
        usShippingCostUsdt: phoneData.usShippingCostUsdt || 0,
        additionalCostUsdt: phoneData.additionalCostUsdt || 0,
        usTrackingNumber: phoneData.usTrackingNumber || '',
        usCarrier: phoneData.usCarrier || 'USPS',
        isPrealerted: phoneData.isPrealerted ?? false,
        prealertDate: phoneData.prealertDate,
        zoomTrackingNumber: phoneData.zoomTrackingNumber,
        zoomCostStatus: phoneData.zoomCostStatus || 'pending',
        zoomCostBcv: phoneData.zoomCostBcv || 0,
        isZoomPaid: phoneData.isZoomPaid ?? false,
        zoomPaidAmountBcv: phoneData.zoomPaidAmountBcv || 0,
        zoomPaymentMethod: phoneData.zoomPaymentMethod,
        isZoomPickedUp: phoneData.isZoomPickedUp ?? false,
        zoomPickupDate: phoneData.zoomPickupDate,
        zoomAgency: phoneData.zoomAgency ? phoneData.zoomAgency.trim() : 'ZOOM Barinas',
        projectedPriceUsdt: phoneData.projectedPriceUsdt || 0,
        status: phoneData.status || 'en_transito_usa',
        soldPriceUsdt: phoneData.soldPriceUsdt,
        soldDate: phoneData.soldDate,
        buyerName: phoneData.buyerName,
        buyerPhone: phoneData.buyerPhone,
        buyerIdNumber: phoneData.buyerIdNumber,
        soldPaymentMethod: phoneData.soldPaymentMethod,
        receiptNumber: phoneData.receiptNumber,
        orderControlNumber: phoneData.orderControlNumber,
        images: phoneData.images || [],
        primaryImage: phoneData.primaryImage || (phoneData.images && phoneData.images[0]) || undefined,
        notes: phoneData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setPhones((prev) => [newPhone, ...prev]);

      if (currentUser) {
        savePhoneToSupabase(currentUser.uid, newPhone).catch((err) =>
          console.error('Error creating phone in Supabase', err)
        );
      }
    }

    setEditingPhone(null);
  };

  const handleDeletePhone = (id: string) => {
    setPhones((prev) => prev.filter((p) => p.id !== id));
    setIsDetailModalOpen(false);
    setSelectedPhone(null);
    if (currentUser) {
      deletePhoneFromSupabase(currentUser.uid, id).catch((err) =>
        console.error('Error deleting phone from Supabase', err)
      );
    }
  };

  // Toggle Prealerta
  const handleTogglePrealert = (id: string) => {
    setPhones((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newStatus = !p.isPrealerted;
          const updated: PhoneItem = {
            ...p,
            isPrealerted: newStatus,
            prealertDate: newStatus ? new Date().toISOString().split('T')[0] : undefined,
            updatedAt: new Date().toISOString(),
          };
          if (currentUser) {
            savePhoneToSupabase(currentUser.uid, updated).catch(console.error);
          }
          return updated;
        }
        return p;
      })
    );
  };

  // Toggle Pago Zoom
  const handleToggleZoomPaid = (id: string) => {
    setPhones((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newStatus = !p.isZoomPaid;
          const updated: PhoneItem = {
            ...p,
            isZoomPaid: newStatus,
            zoomPaidAmountBcv: newStatus ? p.zoomCostBcv : 0,
            updatedAt: new Date().toISOString(),
          };
          if (currentUser) {
            savePhoneToSupabase(currentUser.uid, updated).catch(console.error);
          }
          return updated;
        }
        return p;
      })
    );
  };

  // Toggle Retiro Zoom
  const handleToggleZoomPickup = (id: string) => {
    setPhones((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newStatus = !p.isZoomPickedUp;
          const updated: PhoneItem = {
            ...p,
            isZoomPickedUp: newStatus,
            zoomPickupDate: newStatus ? new Date().toISOString().split('T')[0] : undefined,
            status: newStatus && (p.status === 'en_agencia_zoom' || p.status === 'en_casillero_zoom') 
              ? 'disponible_para_venta' 
              : p.status,
            updatedAt: new Date().toISOString(),
          };
          if (currentUser) {
            savePhoneToSupabase(currentUser.uid, updated).catch(console.error);
          }
          return updated;
        }
        return p;
      })
    );
  };

  // Cambio de estado general
  const handleToggleStatus = (id: string, newStatus: any) => {
    setPhones((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated: PhoneItem = { ...p, status: newStatus, updatedAt: new Date().toISOString() };
          if (currentUser) {
            savePhoneToSupabase(currentUser.uid, updated).catch(console.error);
          }
          return updated;
        }
        return p;
      })
    );
  };

  // Archivar / Desarchivar Teléfono (para mantener limpia la lista de vendidos)
  const handleToggleArchivePhone = (id: string) => {
    setPhones((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const isArchived = !p.isArchived;
          const updated: PhoneItem = {
            ...p,
            isArchived,
            archivedAt: isArchived ? new Date().toISOString() : undefined,
            updatedAt: new Date().toISOString(),
          };
          if (currentUser) {
            savePhoneToSupabase(currentUser.uid, updated).catch(console.error);
          }
          return updated;
        }
        return p;
      })
    );

    if (selectedPhone?.id === id) {
      setSelectedPhone((prev) =>
        prev
          ? {
              ...prev,
              isArchived: !prev.isArchived,
              archivedAt: !prev.isArchived ? new Date().toISOString() : undefined,
            }
          : null
      );
    }
  };

  // Archivar en lote todos los vendidos activos
  const handleBatchArchiveSold = () => {
    setPhones((prev) =>
      prev.map((p) => {
        if (p.status === 'vendido' && !p.isArchived) {
          const updated: PhoneItem = {
            ...p,
            isArchived: true,
            archivedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          if (currentUser) {
            savePhoneToSupabase(currentUser.uid, updated).catch(console.error);
          }
          return updated;
        }
        return p;
      })
    );
  };

  // Actualización en Lote desde el Sincronizador de Zoom (Gmail / Manual)
  const handleBatchUpdatePhones = async (updatedPhones: PhoneItem[]) => {
    setPhones((prev) => {
      const map = new Map<string, PhoneItem>();
      prev.forEach((p) => map.set(p.id, p));
      updatedPhones.forEach((p) => map.set(p.id, p));
      return Array.from(map.values());
    });

    if (currentUser) {
      for (const phone of updatedPhones) {
        await savePhoneToSupabase(currentUser.uid, phone);
      }
    }

    setCloudNotification({
      message: `¡${updatedPhones.length} iPhone(s) sincronizado(s) con las notificaciones de Zoom!`,
      type: 'success',
    });
    setTimeout(() => setCloudNotification(null), 4000);
  };

  // COMPLETAR VENTA Y EMITIR ORDEN DE ENTREGA & CERTIFICADO DE GARANTÍA
  const handleCompleteSale = (
    newOrder: WarrantyOrder, 
    updatedPhoneData: Partial<PhoneItem>, 
    newCustomer?: Customer
  ) => {
    // 1. Guardar nueva orden
    setOrders((prev) => [newOrder, ...prev]);
    if (currentUser) {
      saveOrderToSupabase(currentUser.uid, newOrder).catch(console.error);
    }

    // 2. Si vino un cliente nuevo, guardarlo en la base de clientes
    if (newCustomer) {
      setCustomers((prev) => {
        const exists = prev.some((c) => c.idNumber === newCustomer.idNumber || c.id === newCustomer.id);
        if (exists) return prev;
        return [newCustomer, ...prev];
      });
      if (currentUser) {
        saveCustomerToSupabase(currentUser.uid, newCustomer).catch(console.error);
      }
    }

    // 3. Actualizar estado del teléfono a Vendido
    if (updatedPhoneData.id) {
      setPhones((prev) =>
        prev.map((p) => {
          if (p.id === updatedPhoneData.id) {
            const soldItem = {
              ...p,
              ...updatedPhoneData,
              status: 'vendido',
              updatedAt: new Date().toISOString(),
            } as PhoneItem;
            if (currentUser) {
              savePhoneToSupabase(currentUser.uid, soldItem).catch(console.error);
            }
            return soldItem;
          }
          return p;
        })
      );
    }

    // 4. Abrir de inmediato el Certificado de Garantía para Imprimir o Enviar por WhatsApp
    setSelectedWarrantyOrder(newOrder);
    setIsWarrantyModalOpen(true);
  };

  // Actualizar orden de garantía existente
  const handleUpdateWarrantyOrder = (updatedOrder: WarrantyOrder) => {
    setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    setSelectedWarrantyOrder(updatedOrder);
    if (currentUser) {
      saveOrderToSupabase(currentUser.uid, updatedOrder).catch(console.error);
    }
  };

  // ELIMINAR NOTA DE ENTREGA POR ERROR AL FACTURAR Y DEVOLVER IPHONE A INVENTARIO
  const handleDeleteOrderAndReturnToInventory = (
    order: WarrantyOrder,
    reOpenSaleModal: boolean = false
  ) => {
    // 1. Ubicar el iPhone asociado a la venta
    const targetPhone = phones.find(
      (p) =>
        p.id === order.phoneItemId ||
        (p.imei && p.imei === order.imei1) ||
        (p.orderControlNumber && p.orderControlNumber === order.controlNumber)
    );

    let restoredPhone: PhoneItem | null = null;

    if (targetPhone) {
      restoredPhone = {
        ...targetPhone,
        status: 'disponible_para_venta',
        soldPriceUsdt: undefined,
        soldDate: undefined,
        buyerName: undefined,
        buyerPhone: undefined,
        buyerIdNumber: undefined,
        soldPaymentMethod: undefined,
        receiptNumber: undefined,
        orderControlNumber: undefined,
        updatedAt: new Date().toISOString(),
      };

      setPhones((prev) =>
        prev.map((p) => (p.id === targetPhone.id ? restoredPhone! : p))
      );

      if (currentUser) {
        savePhoneToSupabase(currentUser.uid, restoredPhone).catch(console.error);
      }
    }

    // 2. Eliminar la nota de entrega de la lista y de Supabase
    setOrders((prev) => prev.filter((o) => o.id !== order.id));
    if (currentUser) {
      deleteOrderFromSupabase(currentUser.uid, order.id).catch(console.error);
    }

    // 3. Cerrar el modal del documento si estaba abierto
    setIsWarrantyModalOpen(false);
    setSelectedWarrantyOrder(null);

    // 4. Mostrar alerta visual amigable
    setCloudNotification({
      message: `Nota ${order.controlNumber} eliminada. ${targetPhone ? `El equipo ${targetPhone.model} fue devuelto al inventario.` : ''}`,
      type: 'success',
    });
    setTimeout(() => setCloudNotification(null), 4000);

    // 5. Si el usuario desea volver a facturar de inmediato, reabrir modal de venta
    if (reOpenSaleModal && (restoredPhone || targetPhone)) {
      const phoneToBill = restoredPhone || targetPhone!;
      setTimeout(() => {
        setSaleInitialPhone(phoneToBill);
        setIsNewSaleModalOpen(true);
      }, 150);
    }
  };

  // Devolver un teléfono a inventario disponible desde el modal de detalle
  const handleReturnPhoneToInventory = (phone: PhoneItem) => {
    const associatedOrder = orders.find(
      (o) =>
        o.phoneItemId === phone.id ||
        (phone.orderControlNumber && o.controlNumber === phone.orderControlNumber) ||
        (phone.imei && o.imei1 === phone.imei)
    );

    if (associatedOrder) {
      handleDeleteOrderAndReturnToInventory(associatedOrder, false);
    } else {
      const restoredPhone: PhoneItem = {
        ...phone,
        status: 'disponible_para_venta',
        soldPriceUsdt: undefined,
        soldDate: undefined,
        buyerName: undefined,
        buyerPhone: undefined,
        buyerIdNumber: undefined,
        soldPaymentMethod: undefined,
        receiptNumber: undefined,
        orderControlNumber: undefined,
        updatedAt: new Date().toISOString(),
      };

      setPhones((prev) => prev.map((p) => (p.id === phone.id ? restoredPhone : p)));
      if (currentUser) {
        savePhoneToSupabase(currentUser.uid, restoredPhone).catch(console.error);
      }

      setCloudNotification({
        message: `El equipo ${phone.model} fue devuelto a inventario disponible.`,
        type: 'success',
      });
      setTimeout(() => setCloudNotification(null), 4000);
    }
  };

  // Guardar cliente
  const handleSaveCustomer = (customer: Customer) => {
    setCustomers((prev) => {
      const exists = prev.some((c) => c.id === customer.id);
      if (exists) {
        return prev.map((c) => (c.id === customer.id ? customer : c));
      }
      return [customer, ...prev];
    });
    if (currentUser) {
      saveCustomerToSupabase(currentUser.uid, customer).catch(console.error);
    }
  };

  // Abrir modal de venta para un teléfono específico
  const handleStartSaleForPhone = (phone: PhoneItem) => {
    // Si ya tiene una orden previa emitida, abrirla directamente
    const existingOrder = orders.find(
      (o) => o.phoneItemId === phone.id || (phone.orderControlNumber && o.controlNumber === phone.orderControlNumber) || (phone.imei && o.imei1 === phone.imei)
    );

    if (existingOrder && phone.status === 'vendido') {
      setSelectedWarrantyOrder(existingOrder);
      setIsWarrantyModalOpen(true);
    } else {
      setSaleInitialPhone(phone);
      setIsNewSaleModalOpen(true);
    }
  };

  // Abrir modal de venta para un cliente específico
  const handleStartSaleForCustomer = (customer: Customer) => {
    setSaleInitialPhone(null);
    setIsNewSaleModalOpen(true);
  };

  // Abrir rastreo
  const handleOpenTrackingModal = (trackingNumber?: string, carrier?: string) => {
    setTrackingInitialNumber(trackingNumber || '');
    setTrackingInitialCarrier(carrier || '');
    setIsTrackingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 transition-colors">
      
      {/* 0. Barra Interactiva de Tasas BCV & P2P en Vivo */}
      <RatesBar
        bcvRate={rates.bcvRate}
        saleRate={rates.binanceUsdtRate}
        bcvEffectiveDate={rates.bcvEffectiveDate}
        bcvEffectiveDateFormatted={rates.bcvEffectiveDateFormatted}
        bcvIsTomorrow={rates.bcvIsTomorrow}
        source={rates.source}
        isLoading={isRatesLoading}
        lastSyncedMessage={lastRatesSyncMessage}
        onUpdateBcv={handleUpdateBcvRate}
        onUpdateSale={handleUpdateSaleRate}
        onRefreshAll={() => handleRefreshLiveRates(true)}
        onSyncAll={() => setIsRatesModalOpen(true)}
      />

      {/* 1. Barra de Navegación & Pestañas de los 4 Módulos */}
      <Navbar
        rates={rates}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenRatesModal={() => setIsRatesModalOpen(true)}
        onOpenNewPhoneModal={() => {
          setEditingPhone(null);
          setIsPhoneModalOpen(true);
        }}
        onOpenNewSaleModal={() => {
          setSaleInitialPhone(null);
          setIsNewSaleModalOpen(true);
        }}
        onOpenCalculatorModal={() => setIsCalcModalOpen(true)}
        onOpenExportImportModal={() => setIsExportModalOpen(true)}
        onOpenSocialPostModal={() => {
          setSelectedSocialPhone(null);
          setIsSocialModalOpen(true);
        }}
        onOpenTrackingModal={() => handleOpenTrackingModal()}
        onOpenZoomSyncModal={() => setIsZoomSyncModalOpen(true)}
        onOpenSellerProfileModal={() => setIsSellerModalOpen(true)}
        isCatalogMode={isCatalogMode}
        onToggleCatalogMode={() => setIsCatalogMode((prev) => !prev)}
        currencyView={currencyView}
        setCurrencyView={setCurrencyView}
        ordersCount={orders.length}
        customersCount={customers.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        currentUser={currentUser}
        isSyncingCloud={isSyncingCloud}
        onLoginGoogle={handleLoginGoogle}
        onLogoutGoogle={handleLogoutGoogle}
        onManualSync={handleManualSync}
        onOpenCloudSyncModal={() => setIsCloudSyncModalOpen(true)}
      />

      {/* Notificación de Nube */}
      {cloudNotification && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-3">
          <div className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-xs shadow-xs ${
            cloudNotification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border-emerald-500/30'
              : cloudNotification.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/70 text-red-800 dark:text-red-200 border-red-500/30'
              : 'bg-sky-50 dark:bg-sky-950/70 text-sky-800 dark:text-sky-200 border-sky-500/30'
          }`}>
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{cloudNotification.message}</span>
            </div>
            <button
              onClick={() => setCloudNotification(null)}
              className="p-1 hover:opacity-75 rounded transition cursor-pointer"
              title="Cerrar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Banner de Bienvenida (Si no está conectado con Google) */}
      {!currentUser && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 text-xs text-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white">
                  Respaldo en la nube activo con Supabase
                </p>
                <p className="text-slate-400 text-[11px]">
                  Inicia sesión con tu cuenta de Google para que tu inventario no se borre nunca y puedas gestionarlo desde cualquier celular o PC.
                </p>
              </div>
            </div>
            <button
              onClick={handleLoginGoogle}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-sm shadow-emerald-950"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Conectar Google</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {isCatalogMode ? (
          /* Vista de Catálogo Comercial para Clientes */
          <CatalogView
            phones={phones}
            rates={rates}
            currencyView={currencyView === 'BS' ? 'BS' : currencyView === 'DUAL' ? 'BOTH' : 'USDT'}
            onBackToAdmin={() => setIsCatalogMode(false)}
            onOpenSocialPost={(p) => {
              setSelectedSocialPhone(p || null);
              setIsSocialModalOpen(true);
            }}
          />
        ) : (
          <>
            {/* PESTAÑA 1: INVENTARIO SERIALIZADO */}
            {activeTab === 'inventory' && (
              <>
                <KpiOverview
                  summary={summary}
                  rates={rates}
                  currencyView={currencyView}
                  allPhones={phones}
                  onFilterByStatus={(filter) => setActiveFilter(filter)}
                />

                {/* Banner de Garantías & Despacho Serializado */}
                <div className="p-4 rounded-2xl bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">
                        Flujo Serializado: Inventario ➔ Orden de Entrega (GAR-XXXX) ➔ Respaldo Anti-Estafas
                      </h4>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Cada iPhone se registra con su IMEI 1, IMEI 2, % de batería y grado estético. Al vender, emites la Orden de Entrega y Certificado de Garantía en 1 clic.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSaleInitialPhone(null);
                        setIsNewSaleModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer transition shadow-md shadow-amber-500/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Emitir Orden de Entrega</span>
                    </button>
                  </div>
                </div>

                <PhoneList
                  items={phones}
                  rates={rates}
                  currencyView={currencyView}
                  activeFilter={activeFilter}
                  setActiveFilter={setActiveFilter}
                  onSelectPhone={(item) => {
                    setSelectedPhone(item);
                    setIsDetailModalOpen(true);
                  }}
                  onEditPhone={(item) => {
                    setEditingPhone(item);
                    setIsPhoneModalOpen(true);
                  }}
                  onTogglePrealert={handleTogglePrealert}
                  onToggleZoomPaid={handleToggleZoomPaid}
                  onToggleZoomPickup={handleToggleZoomPickup}
                  onQuickMarkSold={(item) => handleStartSaleForPhone(item)}
                  onOpenSocialPost={(item) => {
                    setSelectedSocialPhone(item);
                    setIsSocialModalOpen(true);
                  }}
                  onOpenSalesReceipt={(item) => handleStartSaleForPhone(item)}
                  onOpenTrackingModal={handleOpenTrackingModal}
                  onOpenZoomSyncModal={() => setIsZoomSyncModalOpen(true)}
                  onAddNewPhone={() => {
                    setEditingPhone(null);
                    setIsPhoneModalOpen(true);
                  }}
                  onToggleArchivePhone={handleToggleArchivePhone}
                  onBatchArchiveSold={handleBatchArchiveSold}
                />
              </>
            )}

            {/* PESTAÑA 2: ÓRDENES DE ENTREGA & CERTIFICADOS DE GARANTÍA */}
            {activeTab === 'orders' && (
              <WarrantyOrdersList
                orders={orders}
                rates={rates}
                onOpenOrderModal={(order) => {
                  setSelectedWarrantyOrder(order);
                  setIsWarrantyModalOpen(true);
                }}
                onOpenNewSaleModal={() => {
                  setSaleInitialPhone(null);
                  setIsNewSaleModalOpen(true);
                }}
                onDeleteOrder={handleDeleteOrderAndReturnToInventory}
              />
            )}

            {/* PESTAÑA 3: VERIFICADOR ANTI-FRAUDE (IMEI) */}
            {activeTab === 'warranty_lookup' && (
              <WarrantyLookupView
                orders={orders}
                phones={phones}
                rates={rates}
                onOpenOrderModal={(order) => {
                  setSelectedWarrantyOrder(order);
                  setIsWarrantyModalOpen(true);
                }}
                onOpenNewSaleModal={() => {
                  setSaleInitialPhone(null);
                  setIsNewSaleModalOpen(true);
                }}
              />
            )}

            {/* PESTAÑA 4: BASE DE CLIENTES CRM */}
            {activeTab === 'customers' && (
              <CustomersView
                customers={customers}
                orders={orders}
                onSaveCustomer={handleSaveCustomer}
                onSelectCustomerToSell={handleStartSaleForCustomer}
                onOpenOrderModal={(order) => {
                  setSelectedWarrantyOrder(order);
                  setIsWarrantyModalOpen(true);
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Sistema de Control de Despacho &amp; Garantías Vzla</span>
            <span>•</span>
            <span>Inventario Serializado por IMEI • Multimoneda USDT / BCV</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Documentos generados según normativa de control interno y certificados de garantía.
          </div>
        </div>
      </footer>

      {/* MODALES */}

      {/* 1. Modal Registro / Edición de iPhone */}
      <PhoneFormModal
        isOpen={isPhoneModalOpen}
        onClose={() => {
          setIsPhoneModalOpen(false);
          setEditingPhone(null);
        }}
        onSave={handleSavePhone}
        editingItem={editingPhone}
        rates={rates}
        existingPhones={phones}
      />

      {/* 2. Modal Detalle de Teléfono */}
      <PhoneDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedPhone(null);
        }}
        item={selectedPhone}
        rates={rates}
        onEdit={(item) => {
          setIsDetailModalOpen(false);
          setEditingPhone(item);
          setIsPhoneModalOpen(true);
        }}
        onDelete={handleDeletePhone}
        onToggleStatus={handleToggleStatus}
        onTogglePrealert={handleTogglePrealert}
        onToggleZoomPaid={handleToggleZoomPaid}
        onToggleZoomPickup={handleToggleZoomPickup}
        onOpenSocialPost={(item) => {
          setSelectedSocialPhone(item);
          setIsSocialModalOpen(true);
        }}
        onOpenSalesReceipt={(item) => handleStartSaleForPhone(item)}
        onReturnToInventory={handleReturnPhoneToInventory}
        onToggleArchivePhone={handleToggleArchivePhone}
      />

      {/* 3. Modal Asistido de Venta & Emisión de Orden */}
      <NewSaleOrderModal
        isOpen={isNewSaleModalOpen}
        onClose={() => {
          setIsNewSaleModalOpen(false);
          setSaleInitialPhone(null);
        }}
        availablePhones={availablePhones}
        customers={customers}
        sellerProfile={sellerProfile}
        rates={rates}
        lastOrderNumber={orders.length}
        initialSelectedPhone={saleInitialPhone}
        onCompleteSale={handleCompleteSale}
      />

      {/* 4. Modal de Orden de Entrega y Certificado de Garantía (5 Secciones Legales) */}
      <WarrantyOrderModal
        isOpen={isWarrantyModalOpen}
        onClose={() => {
          setIsWarrantyModalOpen(false);
          setSelectedWarrantyOrder(null);
        }}
        order={selectedWarrantyOrder}
        rates={rates}
        onUpdateOrder={handleUpdateWarrantyOrder}
        onDeleteOrder={handleDeleteOrderAndReturnToInventory}
      />

      {/* 5. Modal Perfil del Vendedor & Términos Legales */}
      <SellerProfileModal
        isOpen={isSellerModalOpen}
        onClose={() => setIsSellerModalOpen(false)}
        sellerProfile={sellerProfile}
        onSaveProfile={(profile) => {
          setSellerProfile(profile);
          if (currentUser) {
            saveProfileToSupabase(currentUser.uid, profile).catch(console.error);
          }
        }}
      />

      {/* 6. Modal de Tasas de Cambio */}
      <RatesConfigModal
        isOpen={isRatesModalOpen}
        onClose={() => setIsRatesModalOpen(false)}
        rates={rates}
        onSaveRates={(newRates) => setRates(newRates)}
        onLiveRatesFetched={() => handleRefreshLiveRates(false)}
      />

      {/* 7. Modal Simulador de Ganancia */}
      <ProfitCalculatorModal
        isOpen={isCalcModalOpen}
        onClose={() => setIsCalcModalOpen(false)}
        rates={rates}
        onUseValuesForNewPhone={(productCost, usShipping, zoomBcv, projected) => {
          setEditingPhone({
            id: '',
            model: '',
            condition: 'Excelente',
            ebayLink: '',
            purchaseDate: new Date().toISOString().split('T')[0],
            productCostUsdt: productCost,
            usShippingCostUsdt: usShipping,
            additionalCostUsdt: 0,
            usTrackingNumber: '',
            usCarrier: 'USPS',
            isPrealerted: false,
            zoomCostStatus: zoomBcv > 0 ? 'known' : 'pending',
            zoomCostBcv: zoomBcv,
            isZoomPaid: false,
            zoomPaidAmountBcv: 0,
            isZoomPickedUp: false,
            projectedPriceUsdt: projected,
            status: 'en_transito_usa',
            createdAt: '',
            updatedAt: '',
          });
          setIsPhoneModalOpen(true);
        }}
      />

      {/* 8. Modal de Respaldo y Exportación */}
      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        items={phones}
        rates={rates}
        customers={customers}
        orders={orders}
        sellerProfile={sellerProfile}
        onImportData={(newItems, newRates, newCustomers, newOrders, newProfile) => {
          setPhones(newItems);
          if (newRates) setRates(newRates);
          if (newCustomers) setCustomers(newCustomers);
          if (newOrders) setOrders(newOrders);
          if (newProfile) setSellerProfile(newProfile);
          if (currentUser) {
            syncAllToSupabase(
              currentUser.uid,
              newItems,
              newCustomers || customers,
              newOrders || orders,
              newProfile || sellerProfile
            ).catch(console.error);
          }
        }}
        onResetData={() => {
          setPhones(INITIAL_PHONES);
          setCustomers(INITIAL_CUSTOMERS);
          setOrders(INITIAL_ORDERS);
          setRates(INITIAL_RATES);
        }}
      />

      {/* 9. Modal Rastreador Multitransportista */}
      <TrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => {
          setIsTrackingModalOpen(false);
          setTrackingInitialNumber('');
          setTrackingInitialCarrier('');
        }}
        phones={phones}
        initialTrackingNumber={trackingInitialNumber}
        initialCarrier={trackingInitialCarrier}
        onOpenZoomSyncModal={() => setIsZoomSyncModalOpen(true)}
      />

      {/* 9.1 Modal Sincronizador Zoom Envíos (Gmail & Manual) */}
      <ZoomSyncModal
        isOpen={isZoomSyncModalOpen}
        onClose={() => setIsZoomSyncModalOpen(false)}
        phones={phones}
        rates={rates}
        currentUser={currentUser}
        onLoginGoogle={handleLoginGoogle}
        onBatchUpdatePhones={handleBatchUpdatePhones}
      />

      {/* 10. Modal Redes Sociales */}
      <SocialPostModal
        isOpen={isSocialModalOpen}
        onClose={() => {
          setIsSocialModalOpen(false);
          setSelectedSocialPhone(null);
        }}
        selectedPhone={selectedSocialPhone}
        allPhones={phones}
        rates={rates}
      />

      {/* 11. Modal Gestión de Sincronización en la Nube */}
      <CloudSyncModal
        isOpen={isCloudSyncModalOpen}
        onClose={() => setIsCloudSyncModalOpen(false)}
        currentUser={currentUser}
        isSyncing={isSyncingCloud}
        localPhones={phones}
        localCustomers={customers}
        localOrders={orders}
        sellerProfile={sellerProfile}
        onLoginGoogle={handleLoginGoogle}
        onLogoutGoogle={handleLogoutGoogle}
        onTwoWaySync={performTwoWaySync}
      />

    </div>
  );
}
