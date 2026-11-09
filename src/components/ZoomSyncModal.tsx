import React, { useState, useMemo } from 'react';
import { PhoneItem, CurrencyRates } from '../types';
import { 
  ZoomEmailEvent, 
  fetchZoomEmailsFromGmail, 
  parseZoomEmailContent, 
  applyZoomEventToPhone 
} from '../services/zoomGmailService';
import { getCachedAccessToken, requestGmailPermission } from '../services/supabaseDatabase';
import { 
  X, 
  Mail, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Truck, 
  FileText, 
  DollarSign, 
  Building2, 
  Clock, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Filter,
  Inbox
} from 'lucide-react';
import { formatUsdt, formatBcv, formatBs } from '../utils/calculations';

interface ZoomSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  phones: PhoneItem[];
  rates: CurrencyRates;
  currentUser?: { email?: string | null; displayName?: string | null } | null;
  onLoginGoogle?: () => Promise<void>;
  onBatchUpdatePhones: (updatedPhones: PhoneItem[]) => Promise<void> | void;
}

export const ZoomSyncModal: React.FC<ZoomSyncModalProps> = ({
  isOpen,
  onClose,
  phones,
  rates,
  currentUser,
  onLoginGoogle,
  onBatchUpdatePhones,
}) => {
  const [activeTab, setActiveTab] = useState<'gmail' | 'manual'>('gmail');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [events, setEvents] = useState<ZoomEmailEvent[]>([]);
  const [appliedEventIds, setAppliedEventIds] = useState<Set<string>>(new Set());

  const [needsScopeConsent, setNeedsScopeConsent] = useState<boolean>(false);

  // Manual Paste State
  const [manualText, setManualText] = useState<string>('');
  const [manualSubject, setManualSubject] = useState<string>('Notificación Zoom');
  const [manualParsed, setManualParsed] = useState<ReturnType<typeof parseZoomEmailContent> | null>(null);
  const [manualSelectedPhoneId, setManualSelectedPhoneId] = useState<string>('');

  const hasAccessToken = !!getCachedAccessToken();

  // Active phones (not archived and not sold)
  const activePhones = useMemo(() => {
    return phones.filter((p) => !p.isArchived);
  }, [phones]);

  if (!isOpen) return null;

  // Solicitar consentimiento explícito de Gmail a Google
  const handleGrantConsent = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const newToken = await requestGmailPermission();
      setNeedsScopeConsent(false);
      setSuccessMsg('¡Permiso de lectura concedido con éxito! Buscando correos de Zoom...');
      
      const fetched = await fetchZoomEmailsFromGmail(newToken, activePhones, 20);
      setEvents(fetched);

      if (fetched.length === 0) {
        setSuccessMsg('Conexión exitosa. No se encontraron correos recientes de Zoom con los filtros actuales.');
      } else {
        const matchedCount = fetched.filter((e) => !!e.matchedPhone).length;
        setSuccessMsg(`¡Sincronización exitosa! Se encontraron ${fetched.length} correos de Zoom (${matchedCount} vinculados con iPhones de tu inventario).`);
      }
    } catch (err: any) {
      console.error('Error al autorizar permiso de Gmail:', err);
      if (!err?.message?.includes('popup-closed-by-user')) {
        setErrorMsg(err?.message || 'Error al conectar con la cuenta de Google.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Escanear correos desde Gmail
  const handleFetchEmails = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      let token = getCachedAccessToken();
      if (!token) {
        token = await requestGmailPermission();
      }

      const fetched = await fetchZoomEmailsFromGmail(token, activePhones, 20);
      setEvents(fetched);
      setNeedsScopeConsent(false);

      if (fetched.length === 0) {
        setErrorMsg('No se encontraron correos recientes de Zoom en tu bandeja. Puedes usar la pestaña "Pegar Texto de Correo" para probar con cualquier correo.');
      } else {
        const matchedCount = fetched.filter((e) => !!e.matchedPhone).length;
        setSuccessMsg(`Se encontraron ${fetched.length} correos de Zoom (${matchedCount} coincidieron automáticamente con tus iPhones).`);
      }
    } catch (err: any) {
      console.error('Error sincronizando Gmail:', err);
      if (
        err?.message?.includes('SCOPE_INSUFFICIENT') || 
        err?.message?.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT') ||
        err?.message?.includes('insufficient authentication scopes') ||
        err?.message?.includes('insufficientPermissions')
      ) {
        setNeedsScopeConsent(true);
        setErrorMsg('Tu sesión actual no tiene activado el permiso de lectura de Gmail. Pulsa el botón "Conceder Permiso en Google" a continuación para autorizarlo.');
      } else if (!err?.message?.includes('popup-closed-by-user')) {
        setErrorMsg(err?.message || 'Error al conectar con Gmail.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Re-asignar manualmente un correo a otro teléfono
  const handleAssignPhone = (eventIndex: number, phoneId: string) => {
    const targetPhone = phones.find((p) => p.id === phoneId);
    setEvents((prev) => {
      const copy = [...prev];
      copy[eventIndex] = {
        ...copy[eventIndex],
        matchedPhone: targetPhone,
      };
      return copy;
    });
  };

  // Aplicar un evento individual
  const handleApplySingleEvent = async (event: ZoomEmailEvent, index: number) => {
    if (!event.matchedPhone) return;

    try {
      const updated = applyZoomEventToPhone(event.matchedPhone, event);
      await onBatchUpdatePhones([updated]);
      
      setAppliedEventIds((prev) => new Set([...prev, event.messageId]));
      setEvents((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], matchedPhone: updated, applied: true };
        return copy;
      });

      setSuccessMsg(`¡iPhone "${updated.model}" actualizado correctamente según el correo de Zoom!`);
    } catch (err: any) {
      setErrorMsg(`Error al guardar: ${err?.message || 'Error desconocido'}`);
    }
  };

  // Aplicar todos los eventos coincidentes
  const handleApplyAllMatched = async () => {
    const toApply = events.filter((e) => e.matchedPhone && !appliedEventIds.has(e.messageId));
    if (toApply.length === 0) return;

    setIsLoading(true);
    try {
      const updatedPhones: PhoneItem[] = [];
      const updatedIds = new Set(appliedEventIds);

      // Usar un mapa para agrupar cambios si varios eventos aplican al mismo teléfono
      const phoneMap = new Map<string, PhoneItem>();
      phones.forEach((p) => phoneMap.set(p.id, p));

      for (const ev of toApply) {
        if (!ev.matchedPhone) continue;
        const currentPhone = phoneMap.get(ev.matchedPhone.id) || ev.matchedPhone;
        const updated = applyZoomEventToPhone(currentPhone, ev);
        phoneMap.set(updated.id, updated);
        updatedPhones.push(updated);
        updatedIds.add(ev.messageId);
      }

      await onBatchUpdatePhones(Array.from(phoneMap.values()).filter((p) => updatedPhones.some((u) => u.id === p.id)));
      setAppliedEventIds(updatedIds);
      setSuccessMsg(`¡Se actualizaron con éxito ${toApply.length} notificaciones en tu inventario!`);
    } catch (err: any) {
      setErrorMsg(`Error en sincronización en lote: ${err?.message || 'Error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Analizar texto pegado manualmente
  const handleParseManualText = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!manualText.trim()) {
      setErrorMsg('Por favor pega el contenido de un correo de Zoom.');
      return;
    }

    const parsed = parseZoomEmailContent(manualSubject, manualText, manualText.slice(0, 150));
    setManualParsed(parsed);

    // Intentar emparejar automáticamente por tracking USA o Zoom
    if (parsed.detectedUsTracking) {
      const match = phones.find((p) => {
        if (!p.usTrackingNumber) return false;
        const phoneTrack = p.usTrackingNumber.trim().toUpperCase();
        const emailTrack = parsed.detectedUsTracking!.trim().toUpperCase();
        return phoneTrack === emailTrack || phoneTrack.includes(emailTrack) || emailTrack.includes(phoneTrack);
      });
      if (match) {
        setManualSelectedPhoneId(match.id);
        setSuccessMsg(`¡Coincidencia detectada automáticamente con: ${match.model} (${match.usTrackingNumber})!`);
        return;
      }
    }

    if (parsed.detectedZoomTracking) {
      const match = phones.find((p) => p.zoomTrackingNumber?.trim().toUpperCase() === parsed.detectedZoomTracking!.trim().toUpperCase());
      if (match) {
        setManualSelectedPhoneId(match.id);
        setSuccessMsg(`¡Coincidencia detectada con Guía Zoom: ${match.model}!`);
      }
    }
  };

  // Aplicar texto manual analizado
  const handleApplyManual = async () => {
    if (!manualParsed) return;
    if (!manualSelectedPhoneId) {
      setErrorMsg('Por favor selecciona cuál iPhone de tu inventario deseas actualizar.');
      return;
    }

    const target = phones.find((p) => p.id === manualSelectedPhoneId);
    if (!target) return;

    try {
      const mockEvent: ZoomEmailEvent = {
        messageId: `manual_${Date.now()}`,
        threadId: '',
        date: new Date().toISOString(),
        from: 'casillero@zoom.red',
        ...manualParsed,
        matchedPhone: target,
      };

      const updated = applyZoomEventToPhone(target, mockEvent);
      await onBatchUpdatePhones([updated]);
      setSuccessMsg(`¡iPhone "${updated.model}" actualizado con éxito con los datos del correo pegado!`);
      setManualText('');
      setManualParsed(null);
      setManualSelectedPhoneId('');
    } catch (err: any) {
      setErrorMsg(`Error al actualizar: ${err?.message || 'Error'}`);
    }
  };

  const getEventBadge = (type: ZoomEmailEvent['eventType'], title: string) => {
    switch (type) {
      case 'llegada_miami':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            {title}
          </span>
        );
      case 'factura_emitida':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            {title}
          </span>
        );
      case 'disponible_agencia':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            {title}
          </span>
        );
      case 'entregado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            {title}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            {title}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-red-500 p-0.5 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-500">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Rastreo Avanzado Zoom Envíos
                </h3>
                <span className="px-2 py-0.5 text-[10px] rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold">
                  Gmail API Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Llegada a casillero Miami, factura de flete con tasa BCV, llegada a agencia Barinas y retiro
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex items-center justify-between">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('gmail')}
              className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'gmail'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Sincronizar Bandeja Gmail</span>
              {events.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-full font-mono font-bold">
                  {events.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('manual')}
              className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'manual'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Pegar Texto de Correo Zoom</span>
            </button>
          </div>

          {activeTab === 'gmail' && events.some((e) => e.matchedPhone && !appliedEventIds.has(e.messageId)) && (
            <button
              onClick={handleApplyAllMatched}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Aplicar Todas las Coincidencias</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <div className="flex-1">{errorMsg}</div>
              <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600 text-xs font-bold">
                Cerrar
              </button>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <div className="flex-1 font-medium">{successMsg}</div>
              <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700 text-xs font-bold">
                Cerrar
              </button>
            </div>
          )}

          {/* TAB 1: GMAIL INTEGRATION */}
          {activeTab === 'gmail' && (
            <div className="space-y-4">
              {/* Status & Sync Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {currentUser?.email ? currentUser.email : 'Google Gmail'}
                      </span>
                      {hasAccessToken ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Conectado
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800">
                          Requiere Autorización
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Permiso de solo lectura para buscar notificaciones de casillero y guías de Zoom
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGrantConsent}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                    title="Abrir ventana de Google para autorizar permiso de lectura de Gmail"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    <span>Autorizar Gmail</span>
                  </button>

                  <button
                    onClick={handleFetchEmails}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>{isLoading ? 'Escaneando Gmail...' : 'Escanear Correos Zoom'}</span>
                  </button>
                </div>
              </div>

              {/* Consent Warning Banner */}
              {needsScopeConsent && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600/60 text-xs space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-500 text-slate-950 font-bold shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                        Se requiere autorizar el permiso de lectura en Google
                      </h5>
                      <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                        Google requiere que concedas permiso de solo lectura para que la aplicación pueda consultar los correos enviados por <strong>Zoom Casillero</strong> (facturas, guías y llegadas a agencia).
                      </p>
                      <div className="p-2.5 rounded-lg bg-amber-100/70 dark:bg-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200">
                        ⚠️ <strong>Paso clave en la ventana emergente de Google:</strong> Cuando veas la lista de permisos, <strong>marca la casilla de verificación</strong> para permitir <em>"Ver los mensajes de correo electrónico"</em> y luego haz clic en <strong>Continuar</strong>.
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={handleGrantConsent}
                      disabled={isLoading}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>🔐 Abrir Ventana de Google y Conceder Permiso</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Emails List */}
              {events.length === 0 && !isLoading && (
                <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 mx-auto flex items-center justify-center mb-3">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                    No hay correos de Zoom cargados todavía
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
                    Haz clic en "Escanear Correos Zoom" para que el sistema busque automáticamente notificaciones de paquetes recibidos en Miami, facturas y entregas.
                  </p>
                  <button
                    onClick={handleFetchEmails}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold hover:opacity-90 transition cursor-pointer"
                  >
                    Buscar Correos en Gmail Ahora
                  </button>
                </div>
              )}

              {events.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                    <span>Notificaciones encontradas ({events.length})</span>
                    <span className="text-[11px]">Se analizan guías USA, guía Zoom y facturas</span>
                  </div>

                  {events.map((ev, idx) => {
                    const isApplied = appliedEventIds.has(ev.messageId) || ev.applied;
                    const phone = ev.matchedPhone;

                    return (
                      <div
                        key={ev.messageId || idx}
                        className={`p-4 rounded-xl border transition ${
                          isApplied
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                            : phone
                            ? 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700/60 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {/* Top info */}
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {getEventBadge(ev.eventType, ev.eventTitle)}
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                              {ev.date ? new Date(ev.date).toLocaleDateString('es-VE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>

                          {isApplied ? (
                            <span className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              Actualizado en Inventario
                            </span>
                          ) : phone ? (
                            <button
                              onClick={() => handleApplySingleEvent(ev, idx)}
                              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                            >
                              <span>Aplicar a {phone.model}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          ) : null}
                        </div>

                        {/* Subject & snippet */}
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                          {ev.subject}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 bg-slate-50 dark:bg-slate-950/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800/60">
                          {ev.snippet}
                        </p>

                        {/* Extracted Data Pills */}
                        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                          {ev.detectedUsTracking && (
                            <span className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-mono text-[11px]">
                              Guía USA: <strong>{ev.detectedUsTracking}</strong>
                            </span>
                          )}
                          {ev.detectedZoomTracking && (
                            <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-mono text-[11px]">
                              Guía Zoom: <strong>{ev.detectedZoomTracking}</strong>
                            </span>
                          )}
                          {ev.detectedCostBcv !== undefined && (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono text-[11px]">
                              Flete: <strong>{formatBcv(ev.detectedCostBcv)}</strong> (${formatUsdt(ev.detectedCostBcv)})
                            </span>
                          )}
                          {ev.detectedAgency && (
                            <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[11px]">
                              Agencia: <strong>{ev.detectedAgency}</strong>
                            </span>
                          )}
                        </div>

                        {/* Matching Target Phone */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                            <span className="text-slate-500 text-[11px] font-semibold shrink-0">
                              Equipo Vinculado:
                            </span>

                            <select
                              value={phone ? phone.id : ''}
                              onChange={(e) => handleAssignPhone(idx, e.target.value)}
                              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden focus:border-amber-500 flex-1 max-w-md"
                            >
                              <option value="">-- Sin vincular (Seleccionar de Inventario) --</option>
                              {activePhones.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.model} ({p.storage}) • IMEI {p.imei ? p.imei.slice(-6) : 'S/I'} • Order: {p.ebayOrderNumber || p.orderControlNumber || 'S/N'} • {p.usTrackingNumber || 'Sin guía USA'}
                                </option>
                              ))}
                            </select>
                          </div>

                          {phone && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              Estado actual: <strong className="text-slate-700 dark:text-slate-300">{phone.status}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MANUAL PASTE TEXT */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Analizador de Texto Copiado de Correos Zoom
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Copia el contenido del correo que te llegó de Zoom y pégalo aquí
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Asunto del correo (opcional):
                  </label>
                  <input
                    type="text"
                    value={manualSubject}
                    onChange={(e) => setManualSubject(e.target.value)}
                    placeholder="Ej: Notificación de Paquete Recibido en Casillero / ZOOM Envíos Factura"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 mb-2 focus:outline-hidden focus:border-amber-500"
                  />

                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Cuerpo del correo de Zoom:
                  </label>
                  <textarea
                    rows={6}
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder="Estimado cliente CESAR PRADA, su paquete con tracking 9400108205497223910300 ha ingresado a nuestro casillero Miami..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setManualText('');
                      setManualParsed(null);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Limpiar
                  </button>
                  <button
                    onClick={handleParseManualText}
                    className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Interpretar Correo de Zoom</span>
                  </button>
                </div>
              </div>

              {/* Preview Analyzed Result */}
              {manualParsed && (
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-amber-400/80 dark:border-amber-500/80 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getEventBadge(manualParsed.eventType, manualParsed.eventTitle)}
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Resultado de Interpretación
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">TRACKING USA</span>
                      <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                        {manualParsed.detectedUsTracking || 'No detectado'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">GUÍA ZOOM</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {manualParsed.detectedZoomTracking || 'No detectado'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">MONTO FLETE BCV</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {manualParsed.detectedCostBcv !== undefined ? `$${manualParsed.detectedCostBcv.toFixed(2)}` : 'No detectado'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">AGENCIA DESTINO</span>
                      <span className="font-semibold text-purple-600 dark:text-purple-400 truncate block">
                        {manualParsed.detectedAgency || 'ZOOM Barinas'}
                      </span>
                    </div>
                  </div>

                  {/* Select phone to apply to */}
                  <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex-1 min-w-[240px]">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Selecciona el iPhone al que deseas aplicar estos datos:
                      </label>
                      <select
                        value={manualSelectedPhoneId}
                        onChange={(e) => setManualSelectedPhoneId(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium"
                      >
                        <option value="">-- Seleccionar iPhone de Inventario --</option>
                        {activePhones.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.model} ({p.storage}) • {p.color} • Track: {p.usTrackingNumber || 'S/G'} • Orden: {p.ebayOrderNumber || p.orderControlNumber || 'S/N'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleApplyManual}
                      disabled={!manualSelectedPhoneId}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Actualizar iPhone Seleccionado</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Seguridad garantizada: Solo se consultan correos de Zoom para actualizar tu inventario.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
