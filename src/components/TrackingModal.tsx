import React, { useState, useMemo } from 'react';
import { PhoneItem } from '../types';
import { 
  X, 
  Search, 
  ExternalLink, 
  Copy, 
  Check, 
  Truck, 
  Plane, 
  Building2, 
  Globe, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Package,
  Zap,
  ArrowUpRight,
  Mail
} from 'lucide-react';
import { CARRIERS, detectCarrier, getTrackingUrl, getUniversalTrackingUrl } from '../utils/tracking';

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  phones: PhoneItem[];
  initialTrackingNumber?: string;
  initialCarrier?: string;
  onOpenZoomSyncModal?: () => void;
}

export const TrackingModal: React.FC<TrackingModalProps> = ({
  isOpen,
  onClose,
  phones,
  initialTrackingNumber = '',
  initialCarrier = '',
  onOpenZoomSyncModal,
}) => {
  const [customTracking, setCustomTracking] = useState(initialTrackingNumber);
  const [selectedCarrier, setSelectedCarrier] = useState<string>(
    initialCarrier || (initialTrackingNumber ? detectCarrier(initialTrackingNumber) : 'USPS')
  );
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [selectedCarrierFilter, setSelectedCarrierFilter] = useState<string>('all');

  // Actualizar transportista cuando el usuario tipea o pega una guía
  const handleTrackingInput = (val: string) => {
    setCustomTracking(val);
    if (val.trim()) {
      const detected = detectCarrier(val);
      setSelectedCarrier(detected);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Filtrar equipos del inventario que tengan guía activa
  const activeShipments = useMemo(() => {
    return phones.filter((p) => {
      const hasUsTracking = !!p.usTrackingNumber?.trim();
      const hasZoomTracking = !!p.zoomTrackingNumber?.trim();
      return hasUsTracking || hasZoomTracking;
    });
  }, [phones]);

  const filteredShipments = useMemo(() => {
    if (selectedCarrierFilter === 'all') return activeShipments;
    return activeShipments.filter((p) => {
      const carrier = p.usCarrier || detectCarrier(p.usTrackingNumber || '');
      return carrier.toLowerCase() === selectedCarrierFilter.toLowerCase();
    });
  }, [activeShipments, selectedCarrierFilter]);

  if (!isOpen) return null;

  const currentCarrierInfo = CARRIERS[selectedCarrier] || CARRIERS.USPS;
  const currentTrackingUrl = customTracking.trim() ? getTrackingUrl(selectedCarrier, customTracking) : '#';
  const universalUrl = customTracking.trim() ? getUniversalTrackingUrl(customTracking) : '#';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-0.5 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[10px] flex items-center justify-center text-sky-600 dark:text-sky-400">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Rastreador Multitransportista
                <span className="px-2 py-0.5 text-[10px] rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                  USPS • UPS • FedEx • DHL • Zoom
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Consulta en vivo guías de envío dentro de EEUU y hacia casillero Venezuela
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenZoomSyncModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenZoomSyncModal();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/40 text-xs font-bold transition cursor-pointer shadow-xs"
              >
                <Mail className="w-3.5 h-3.5 text-amber-500" />
                <span>Sync Zoom Gmail</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Quick Tracking Input Bar */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-inner space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-amber-500" />
                Rastrear cualquier guía al instante:
              </label>
              {customTracking.trim() && (
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Detectado: <strong className="font-bold">{currentCarrierInfo.name}</strong>
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={customTracking}
                  onChange={(e) => handleTrackingInput(e.target.value)}
                  placeholder="Pega aquí el número de tracking (ej. 9400..., 1Z999..., 7829..., etc.)"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500"
                />
                {customTracking && (
                  <button
                    onClick={() => handleTrackingInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* Selector de transportista */}
              <select
                value={selectedCarrier}
                onChange={(e) => setSelectedCarrier(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-amber-500 cursor-pointer"
              >
                <option value="USPS">USPS (Postal Service)</option>
                <option value="UPS">UPS (1Z...)</option>
                <option value="FedEx">FedEx Express/Ground</option>
                <option value="DHL">DHL Express</option>
                <option value="Amazon">Amazon Logistics (TBA)</option>
                <option value="OnTrac">OnTrac / LaserShip</option>
                <option value="Zoom">Zoom Venezuela</option>
                <option value="Universal">17Track / Universal</option>
              </select>
            </div>

            {/* Action Buttons for custom tracking */}
            {customTracking.trim() && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={currentTrackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
                >
                  <span>Abrir Rastreo en {currentCarrierInfo.shortName}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <a
                  href={universalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                  title="Rastrear en ParcelsApp Multi-Courier"
                >
                  <Globe className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                  <span>Rastreo Universal (ParcelsApp)</span>
                </a>

                <button
                  onClick={() => handleCopy(customTracking, 'custom-search')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-800 transition cursor-pointer"
                >
                  {copiedText === 'custom-search' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Guía</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Quick Carrier Direct Portals Grid */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Portales Oficiales de Rastreo:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs">
              {[
                { name: 'USPS', url: 'https://tools.usps.com/go/TrackConfirmAction', color: 'border-blue-200 dark:border-blue-700/50 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' },
                { name: 'UPS', url: 'https://www.ups.com/track', color: 'border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300' },
                { name: 'FedEx', url: 'https://www.fedex.com/fedextrack/', color: 'border-purple-200 dark:border-purple-700/50 bg-purple-50 dark:bg-purple-950/30 text-purple-800 dark:text-purple-300' },
                { name: 'DHL', url: 'https://www.dhl.com/en/express/tracking.html', color: 'border-rose-200 dark:border-rose-700/50 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300' },
                { name: 'Zoom Vzla', url: 'https://zoom.red/', color: 'border-sky-200 dark:border-sky-700/50 bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300' },
                { name: '17Track', url: 'https://t.17track.net/', color: 'border-emerald-200 dark:border-emerald-700/50 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300' },
              ].map((c) => (
                <a
                  key={c.name}
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2.5 rounded-xl border flex items-center justify-between font-bold hover:brightness-105 dark:hover:brightness-125 transition cursor-pointer ${c.color}`}
                >
                  <span>{c.name}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
                </a>
              ))}
            </div>
          </div>

          {/* Inventory Active Shipments */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-500" />
                  Guías de tu Inventario ({filteredShipments.length})
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Rastrea con un clic todos los teléfonos que tienes en camino o en casillero
                </p>
              </div>

              {/* Carrier Filter Pill Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                {['all', 'USPS', 'UPS', 'FedEx', 'DHL'].map((carrier) => (
                  <button
                    key={carrier}
                    onClick={() => setSelectedCarrierFilter(carrier)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer text-[11px] ${
                      selectedCarrierFilter === carrier
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {carrier === 'all' ? 'Todos' : carrier}
                  </button>
                ))}
              </div>
            </div>

            {filteredShipments.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-center space-y-2">
                <Truck className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No hay guías registradas en este momento</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Al registrar una compra de eBay con su número de tracking de USPS, UPS o FedEx, aparecerá aquí con acceso directo de rastreo.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredShipments.map((phone) => {
                  const detectedCarrier = phone.usCarrier || detectCarrier(phone.usTrackingNumber || '');
                  const carrierData = CARRIERS[detectedCarrier] || CARRIERS.USPS;
                  const trackUrl = getTrackingUrl(detectedCarrier, phone.usTrackingNumber || '');
                  const hasZoom = !!phone.zoomTrackingNumber;

                  return (
                    <div
                      key={phone.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition space-y-3 shadow-xs"
                    >
                      {/* Top: Phone Model & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block truncate max-w-[240px]">
                            {phone.model}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            Comprado: {phone.purchaseDate}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            phone.status === 'en_transito_usa'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              : phone.status === 'en_casillero_zoom'
                              ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {phone.status === 'en_transito_usa'
                            ? '🇺🇸 Tránsito USA'
                            : phone.status === 'en_casillero_zoom'
                            ? '✈️ Casillero Miami'
                            : phone.status === 'en_agencia_zoom'
                            ? '🏢 En Zoom Vzla'
                            : phone.status}
                        </span>
                      </div>

                      {/* USA Tracking Section */}
                      {phone.usTrackingNumber && (
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${carrierData.bgLight} ${carrierData.textColor} border ${carrierData.borderColor}`}>
                                {carrierData.shortName}
                              </span>
                              Guía USA:
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {phone.isPrealerted ? '✅ Prealertado' : '⚠️ Sin prealertar'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs text-slate-800 dark:text-slate-200 truncate select-all">
                              {phone.usTrackingNumber}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleCopy(phone.usTrackingNumber, `phone-us-${phone.id}`)}
                                className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] transition cursor-pointer"
                                title="Copiar Guía"
                              >
                                {copiedText === `phone-us-${phone.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                              <a
                                href={trackUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 px-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 transition cursor-pointer shadow-xs"
                                title={`Rastrear en portal oficial de ${carrierData.shortName}`}
                              >
                                <span>Rastrear</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Zoom Tracking Section (if available) */}
                      {hasZoom && (
                        <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40 space-y-1 text-[11px]">
                          <div className="flex items-center justify-between text-sky-800 dark:text-sky-300 font-semibold">
                            <span>🏢 Guía Zoom Venezuela:</span>
                            <span className="font-mono">{phone.zoomTrackingNumber}</span>
                          </div>
                          {phone.zoomAgency && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                              <span>{phone.zoomAgency}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-950/80">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
