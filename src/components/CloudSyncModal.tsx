import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cloud, 
  CloudCheck, 
  RefreshCw, 
  UploadCloud, 
  DownloadCloud, 
  LogOut, 
  CheckCircle2, 
  AlertTriangle,
  Smartphone,
  FileText,
  ShieldCheck,
  Laptop
} from 'lucide-react';
import { PhoneItem, Customer, WarrantyOrder, SellerProfile } from '../types';
import { getCloudData, AuthUser, loginWithEmail } from '../services/supabaseDatabase';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  isSyncing: boolean;
  localPhones: PhoneItem[];
  localCustomers: Customer[];
  localOrders: WarrantyOrder[];
  sellerProfile: SellerProfile;
  onLoginGoogle: () => Promise<void>;
  onLogoutGoogle: () => Promise<void>;
  onTwoWaySync: (forcePush?: boolean, forcePull?: boolean) => Promise<void>;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isSyncing,
  localPhones,
  localCustomers,
  localOrders,
  onLoginGoogle,
  onLogoutGoogle,
  onTwoWaySync,
}) => {
  const [cloudPhonesCount, setCloudPhonesCount] = useState<number | null>(null);
  const [cloudOrdersCount, setCloudOrdersCount] = useState<number | null>(null);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Formulario de Correo / Clave
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      setAuthError('Por favor escribe tu correo y contraseña');
      return;
    }
    setAuthError(null);
    setIsSubmittingAuth(true);
    try {
      await loginWithEmail(emailInput, passwordInput);
      await refreshCounts();
      setSyncFeedback('¡Sesión iniciada con éxito!');
    } catch (err: any) {
      console.error(err);
      setAuthError(err?.message || 'Error al conectar. Verifica tus datos.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const refreshCounts = async () => {
    if (!currentUser) {
      setCloudPhonesCount(null);
      setCloudOrdersCount(null);
      return;
    }
    setIsLoadingCounts(true);
    try {
      const data = await getCloudData(currentUser.uid);
      setCloudPhonesCount(data.phones.length);
      setCloudOrdersCount(data.orders.length);
    } catch (err) {
      console.error('Error fetching cloud stats:', err);
    } finally {
      setIsLoadingCounts(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshCounts();
      setSyncFeedback(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleAction = async (action: 'merge' | 'push' | 'pull') => {
    setSyncFeedback(null);
    try {
      if (action === 'merge') {
        await onTwoWaySync(false, false);
        setSyncFeedback('¡Sincronización completada! Ambos dispositivos están unificados.');
      } else if (action === 'push') {
        await onTwoWaySync(true, false);
        setSyncFeedback('¡Subida exitosa! Los iPhones de este dispositivo ahora están guardados en la nube.');
      } else if (action === 'pull') {
        await onTwoWaySync(false, true);
        setSyncFeedback('¡Descarga exitosa! Se cargó el inventario completo guardado en la nube.');
      }
      await refreshCounts();
    } catch (err: any) {
      setSyncFeedback(`Error: ${err?.message || 'Error de sincronización'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl my-6 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                Sincronización en la Nube (Multi-Dispositivo)
              </h3>
              <p className="text-xs text-slate-400">
                Mantén tu inventario idéntico en tu computadora, laptop y celular
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

        <div className="p-6 space-y-5 text-xs">
          
          {/* Account Status Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Cuenta Conectada:
                </span>
                {currentUser ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{currentUser.email}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Modo Local (Sin Conectar)</span>
                  </span>
                )}
              </div>

              {currentUser && (
                <button
                  onClick={async () => {
                    await onLogoutGoogle();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Cerrar sesión</span>
                </button>
              )}
            </div>

            {/* Formulario de Login si no hay usuario */}
            {!currentUser && (
              <form onSubmit={handleEmailLogin} className="pt-3 border-t border-slate-800 space-y-2.5">
                <div className="text-[11px] font-semibold text-slate-300">
                  Acceso directo con tu Correo y Contraseña:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="email"
                    placeholder="Tu correo (ej. cesar@gmail.com)"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Tu contraseña o clave"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                {authError && (
                  <p className="text-[11px] text-rose-400 font-medium">{authError}</p>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSubmittingAuth || isSyncing}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer text-center shadow-md shadow-emerald-950/40"
                  >
                    {isSubmittingAuth ? 'Conectando...' : 'Entrar y Sincronizar'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  * Si es tu primera vez, se creará tu cuenta automáticamente con esa clave.
                </p>
              </form>
            )}

            {/* Counts Comparison */}
            {currentUser && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <Laptop className="w-3.5 h-3.5 text-sky-400" />
                    <span>En este Dispositivo (Local)</span>
                  </div>
                  <div className="font-mono text-base font-bold text-slate-100 flex items-center gap-2">
                    <span>{localPhones.length}</span>
                    <span className="text-[10px] text-slate-400 font-normal">iPhones</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {localOrders.length} Notas de Entrega
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>En la Nube (Supabase Cloud)</span>
                    </span>
                    <button
                      onClick={refreshCounts}
                      disabled={isLoadingCounts}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition"
                      title="Refrescar conteo"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingCounts ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <div className="font-mono text-base font-bold text-emerald-400 flex items-center gap-2">
                    <span>{isLoadingCounts ? '...' : cloudPhonesCount ?? 0}</span>
                    <span className="text-[10px] text-slate-400 font-normal">iPhones</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isLoadingCounts ? '...' : cloudOrdersCount ?? 0} Notas de Entrega
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Feedback Banner */}
          {syncFeedback && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{syncFeedback}</span>
            </div>
          )}

          {/* Action Buttons */}
          {currentUser && (
            <div className="space-y-2.5">
              <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                Acciones de Sincronización Inmediata:
              </div>

              {/* Botón 1: Sincronizar y Unificar (Recomendado) */}
              <button
                type="button"
                onClick={() => handleAction('merge')}
                disabled={isSyncing}
                className="w-full p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-between cursor-pointer shadow-lg shadow-emerald-950/40"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <div>
                    <div className="text-sm">Sincronizar y Unificar Todo (Recomendado)</div>
                    <div className="text-[10px] text-emerald-100 font-normal opacity-90">
                      Junta los iPhones de este dispositivo con los de la nube sin borrar nada.
                    </div>
                  </div>
                </div>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded uppercase font-black">
                  Auto
                </span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* Botón 2: Subir este equipo a la nube */}
                <button
                  type="button"
                  onClick={() => handleAction('push')}
                  disabled={isSyncing}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 font-semibold text-xs transition flex flex-col items-start gap-1 cursor-pointer text-left"
                >
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <UploadCloud className="w-4 h-4" />
                    <span>Subir este equipo a la Nube</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Si este es el dispositivo donde cargaste los iPhone y quieres enviarlos a la nube.
                  </span>
                </button>

                {/* Botón 3: Descargar de la nube */}
                <button
                  type="button"
                  onClick={() => handleAction('pull')}
                  disabled={isSyncing}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 font-semibold text-xs transition flex flex-col items-start gap-1 cursor-pointer text-left"
                >
                  <div className="flex items-center gap-1.5 text-sky-400 font-bold">
                    <DownloadCloud className="w-4 h-4" />
                    <span>Descargar desde la Nube</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Si estás en tu segunda computadora y quieres cargar lo que ya guardaste en la nube.
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Explanation info */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>¿Cómo funciona la sincronización en 2 lugares?</span>
            </div>
            <p>
              1. <strong>En el primer lugar (donde cargaste los iPhone):</strong> Inicia sesión y pulsa <em>&quot;Subir este equipo a la Nube&quot;</em> para asegurarte de que tu inventario quede 100% respaldado.
            </p>
            <p>
              2. <strong>En el segundo lugar:</strong> Inicia sesión con el mismo correo ({currentUser?.email || 'tu correo y clave'}) y pulsa <em>&quot;Sincronizar y Unificar Todo&quot;</em>. Los iPhone aparecerán de inmediato.
            </p>
            <p>
              3. A partir de ese momento, <strong>cada cambio que hagas se sincroniza en vivo</strong> en tiempo real.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition cursor-pointer"
          >
            Entendido / Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
