import React from 'react';
import { CurrencyRates, SellerProfile } from '../types';
import { 
  RefreshCw, 
  TrendingUp, 
  DollarSign, 
  Plus, 
  Calculator, 
  Download, 
  ExternalLink, 
  HelpCircle,
  ShoppingBag,
  Share2,
  SlidersHorizontal,
  Smartphone,
  Truck,
  FileText,
  ShieldCheck,
  Users,
  Store,
  Layers,
  Sun,
  Moon,
  Cloud,
  CloudCheck,
  CloudOff,
  LogIn,
  LogOut,
  Mail
} from 'lucide-react';
import { formatBs } from '../utils/calculations';

export type ActiveNavTab = 'inventory' | 'orders' | 'warranty_lookup' | 'customers';

interface NavbarProps {
  rates: CurrencyRates;
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  onOpenRatesModal: () => void;
  onOpenNewPhoneModal: () => void;
  onOpenNewSaleModal: () => void;
  onOpenCalculatorModal: () => void;
  onOpenExportImportModal: () => void;
  onOpenSocialPostModal?: () => void;
  onOpenTrackingModal?: () => void;
  onOpenZoomSyncModal?: () => void;
  onOpenSellerProfileModal?: () => void;
  isCatalogMode: boolean;
  onToggleCatalogMode: () => void;
  currencyView: 'USDT' | 'BS' | 'DUAL';
  setCurrencyView: (view: 'USDT' | 'BS' | 'DUAL') => void;
  ordersCount: number;
  customersCount: number;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  currentUser?: { email?: string | null; displayName?: string | null; photoURL?: string | null } | null;
  isSyncingCloud?: boolean;
  onLoginGoogle?: () => void;
  onLogoutGoogle?: () => void;
  onManualSync?: () => void;
  onOpenCloudSyncModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  rates,
  activeTab,
  setActiveTab,
  onOpenRatesModal,
  onOpenNewPhoneModal,
  onOpenNewSaleModal,
  onOpenCalculatorModal,
  onOpenExportImportModal,
  onOpenSocialPostModal,
  onOpenTrackingModal,
  onOpenZoomSyncModal,
  onOpenSellerProfileModal,
  isCatalogMode,
  onToggleCatalogMode,
  currencyView,
  setCurrencyView,
  ordersCount,
  customersCount,
  theme = 'dark',
  onToggleTheme,
  currentUser,
  isSyncingCloud = false,
  onLoginGoogle,
  onLogoutGoogle,
  onManualSync,
  onOpenCloudSyncModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      {/* Main Navbar Top Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 via-slate-700 to-emerald-600 dark:from-amber-500 dark:via-orange-600 dark:to-sky-500 p-0.5 flex items-center justify-center shadow-md">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-lg text-emerald-400 dark:text-amber-400">
              eZ
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Sistema de Inventario <span className="text-emerald-600 dark:text-amber-400">&amp;</span> Ventas
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-amber-950/80 text-slate-700 dark:text-amber-300 border border-slate-200 dark:border-amber-800/60">
                Inventario Serializado
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Control de iPhones por IMEI, Órdenes de Entrega, Verificador Anti-Fraudes y Flete Zoom
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Mode Switcher: Vitrina Catálogo de Clientes */}
          <button
            onClick={onToggleCatalogMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
              isCatalogMode
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
            }`}
            title="Cambiar a Vitrina de Catálogo para Clientes"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{isCatalogMode ? '📱 Catálogo Activo' : '📱 Catálogo'}</span>
          </button>

          {/* Tracking Hub */}
          {onOpenTrackingModal && (
            <button
              onClick={onOpenTrackingModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              title="Rastreador de Guías (USPS, UPS, FedEx, DHL, Zoom)"
            >
              <Truck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span className="hidden sm:inline">Rastrear</span>
            </button>
          )}

          {/* Zoom Gmail Sync Hub */}
          {onOpenZoomSyncModal && (
            <button
              onClick={onOpenZoomSyncModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition cursor-pointer shadow-xs"
              title="Sincronizar guías y fletes leyendo correos de Zoom en Gmail"
            >
              <Mail className="w-3.5 h-3.5 text-amber-500" />
              <span>Zoom Gmail</span>
            </button>
          )}

          {/* Social Post */}
          {onOpenSocialPostModal && (
            <button
              onClick={onOpenSocialPostModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              title="Publicación en Redes Sociales"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Post</span>
            </button>
          )}

          {/* Currency Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setCurrencyView('USDT')}
              className={`px-2 py-0.5 rounded font-semibold transition cursor-pointer ${
                currencyView === 'USDT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              USDT
            </button>
            <button
              onClick={() => setCurrencyView('BS')}
              className={`px-2 py-0.5 rounded font-semibold transition cursor-pointer ${
                currencyView === 'BS'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Bs.
            </button>
            <button
              onClick={() => setCurrencyView('DUAL')}
              className={`px-2 py-0.5 rounded font-semibold transition cursor-pointer ${
                currencyView === 'DUAL'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Dual
            </button>
          </div>

          {/* Theme Switcher: Modo Claro / Oscuro */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden xl:inline text-xs">Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700" />
                  <span className="hidden xl:inline text-xs">Oscuro</span>
                </>
              )}
            </button>
          )}

          {/* Calculator */}
          <button
            onClick={onOpenCalculatorModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            title="Simulador de Precios y Ganancias"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden lg:inline">Calculadora</span>
          </button>

          {/* Backup */}
          <button
            onClick={onOpenExportImportModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            title="Exportar Excel CSV o Guardar Copia de Seguridad"
          >
            <Download className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span className="hidden lg:inline">Backup</span>
          </button>

          {/* Cloud Sync Status & Google Auth */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/40 text-xs shadow-xs">
              <button
                onClick={onOpenCloudSyncModal}
                className="flex items-center gap-1.5 hover:opacity-80 transition cursor-pointer"
                title="Abrir panel de sincronización multi-dispositivo"
              >
                <div className="relative flex items-center justify-center">
                  <CloudCheck className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isSyncingCloud ? 'animate-pulse' : ''}`} />
                </div>
                <span className="hidden xl:inline text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 max-w-[120px] truncate" title={currentUser.email || ''}>
                  {currentUser.email ? currentUser.email.split('@')[0] : 'Nube'}
                </span>
                <span className="text-[9px] bg-emerald-200/60 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 px-1 py-0.5 rounded font-mono font-bold">
                  Sincronizado
                </span>
              </button>

              <button
                onClick={onOpenCloudSyncModal || onManualSync}
                disabled={isSyncingCloud}
                className="p-1 hover:bg-emerald-200/50 dark:hover:bg-emerald-800/50 rounded text-emerald-700 dark:text-emerald-300 transition cursor-pointer"
                title="Gestionar sincronización en la nube"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncingCloud ? 'animate-spin' : ''}`} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenCloudSyncModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              title="Ingresa con tu correo para sincronizar tus iPhone en todos tus dispositivos"
            >
              <Cloud className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">Ingresar con Correo</span>
            </button>
          )}

          {/* Settings Profile */}
          {onOpenSellerProfileModal && (
            <button
              onClick={onOpenSellerProfileModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              title="Configurar Datos del Vendedor y Cláusulas Legales de Garantía"
            >
              <Store className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden lg:inline">Mi Perfil</span>
            </button>
          )}

          {/* Primary Quick Action: + Vender / Nota de Entrega */}
          <button
            onClick={onOpenNewSaleModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
            title="Registrar venta y emitir Nota de Entrega / Factura PDF"
          >
            <FileText className="w-4 h-4 text-white" />
            <span>+ Vender / Nota de Entrega</span>
          </button>

          {/* Add Phone to Inventory */}
          <button
            onClick={onOpenNewPhoneModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            title="Registrar nuevo iPhone en Inventario"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ iPhone</span>
          </button>

        </div>
      </div>

      {/* Navigation Tabs Bar (Visible when not in Catalog mode) */}
      {!isCatalogMode && (
        <div className="border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-950/90 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-2 text-xs">
            
            {/* 1. Módulo de Inventario */}
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap text-xs ${
                activeTab === 'inventory'
                  ? 'bg-white text-slate-900 dark:bg-slate-100 dark:text-slate-950 font-bold shadow-xs border border-slate-200 dark:border-transparent'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Inventario Serializado</span>
            </button>

            {/* 2. Módulo de Notas de Entrega */}
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap text-xs ${
                activeTab === 'orders'
                  ? 'bg-white text-slate-900 dark:bg-slate-100 dark:text-slate-950 font-bold shadow-xs border border-slate-200 dark:border-transparent'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Notas de Entrega</span>
              {ordersCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  activeTab === 'orders' ? 'bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {ordersCount}
                </span>
              )}
            </button>

            {/* 3. Módulo de Verificador por IMEI */}
            <button
              onClick={() => setActiveTab('warranty_lookup')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap text-xs ${
                activeTab === 'warranty_lookup'
                  ? 'bg-white text-slate-900 dark:bg-slate-100 dark:text-slate-950 font-bold shadow-xs border border-slate-200 dark:border-transparent'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <Smartphone className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Verificador por IMEI</span>
            </button>

            {/* 4. Módulo de Clientes */}
            <button
              onClick={() => setActiveTab('customers')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap text-xs ${
                activeTab === 'customers'
                  ? 'bg-white text-slate-900 dark:bg-slate-100 dark:text-slate-950 font-bold shadow-xs border border-slate-200 dark:border-transparent'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Base de Clientes</span>
              {customersCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  activeTab === 'customers' ? 'bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {customersCount}
                </span>
              )}
            </button>

          </div>
        </div>
      )}
    </header>
  );
};

