import React, { useRef, useState } from 'react';
import { PhoneItem, CurrencyRates, Customer, WarrantyOrder, SellerProfile } from '../types';
import { 
  X, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  FileJson, 
  RefreshCw, 
  Check, 
  AlertTriangle,
  Database,
  Trash2
} from 'lucide-react';
import { calculateRealCostUsdt, calculateRealCostBs, calculateRealProfit, calculateProjectedProfit } from '../utils/calculations';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PhoneItem[];
  rates: CurrencyRates;
  customers?: Customer[];
  orders?: WarrantyOrder[];
  sellerProfile?: SellerProfile;
  onImportData: (
    newItems: PhoneItem[], 
    newRates?: CurrencyRates, 
    newCustomers?: Customer[], 
    newOrders?: WarrantyOrder[],
    newSellerProfile?: SellerProfile
  ) => void;
  onResetData: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  items,
  rates,
  customers = [],
  orders = [],
  sellerProfile,
  onImportData,
  onResetData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  // Exportar como CSV para Excel
  const handleExportCsv = () => {
    const headers = [
      'ID',
      'Producto/Modelo',
      'Condición',
      'Almacenamiento',
      'Color',
      'IMEI 1',
      'IMEI 2',
      'Salud Batería (%)',
      'Estado Físico / Grado',
      'Fecha Compra',
      'Link eBay',
      'N° Orden eBay (Order Number)',
      'Guía USA (Tracking)',
      'Transportista USA',
      'Prealertado en Zoom',
      'Guía Zoom Vzla',
      'Costo Zoom ($ BCV)',
      'Pagado en Zoom',
      'Retirado en Zoom',
      'Agencia Zoom',
      'Costo Producto ($ USDT)',
      'Extras ($ USDT)',
      'Costo Real ($ USDT)',
      'Costo Real (Bs)',
      'Precio Prospectado ($ USDT)',
      'Estado',
      'Precio Vendido ($ USDT)',
      'Ganancia Real ($ USDT)',
      'Ganancia Prospectada ($ USDT)',
      'Comprador',
      'Cédula Comprador',
      'Teléfono Comprador',
      'N° Orden Garantía',
      'Notas',
    ];

    const rows = items.map((item) => {
      const realCostUsdt = calculateRealCostUsdt(item, rates);
      const realCostBs = calculateRealCostBs(item, rates);
      const real = calculateRealProfit(item, rates);
      const projected = calculateProjectedProfit(item, rates);

      return [
        `"${item.id}"`,
        `"${item.model.replace(/"/g, '""')}"`,
        `"${item.condition}"`,
        `"${item.storage || ''}"`,
        `"${item.color || ''}"`,
        `"${item.imei1 || item.imei || ''}"`,
        `"${item.imei2 || ''}"`,
        `"${item.batteryHealth || ''}"`,
        `"${(item.physicalGrade || '').replace(/"/g, '""')}"`,
        `"${item.purchaseDate}"`,
        `"${item.ebayLink || ''}"`,
        `"${item.ebayOrderNumber || ''}"`,
        `"${item.usTrackingNumber || ''}"`,
        `"${item.usCarrier || ''}"`,
        `"${item.isPrealerted ? 'SÍ' : 'NO'}"`,
        `"${item.zoomTrackingNumber || ''}"`,
        item.zoomCostStatus === 'known' ? item.zoomCostBcv : 'En espera',
        `"${item.isZoomPaid ? 'SÍ' : 'NO'}"`,
        `"${item.isZoomPickedUp ? 'SÍ' : 'NO'}"`,
        `"${item.zoomAgency || ''}"`,
        item.productCostUsdt,
        item.additionalCostUsdt,
        realCostUsdt,
        realCostBs,
        item.projectedPriceUsdt,
        `"${item.status}"`,
        item.soldPriceUsdt || '',
        item.status === 'vendido' ? real.profitUsdt : '',
        projected.profitUsdt,
        `"${item.buyerName || ''}"`,
        `"${item.buyerIdNumber || ''}"`,
        `"${item.buyerPhone || ''}"`,
        `"${item.orderControlNumber || item.receiptNumber || ''}"`,
        `"${(item.notes || '').replace(/"/g, '""')}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventario_telefonos_ebay_zoom_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar como JSON completo (Backup Total)
  const handleExportJson = () => {
    const backupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      rates,
      items,
      customers,
      orders,
      sellerProfile,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `backup_completo_inventario_garantias_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Importar JSON
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (Array.isArray(parsed)) {
          onImportData(parsed);
          setImportStatus(`¡Importados exitosamente ${parsed.length} teléfonos!`);
        } else if (parsed.items && Array.isArray(parsed.items)) {
          onImportData(
            parsed.items, 
            parsed.rates, 
            parsed.customers || [], 
            parsed.orders || [],
            parsed.sellerProfile
          );
          setImportStatus(`¡Copia de seguridad restaurada (${parsed.items.length} equipos, ${(parsed.orders || []).length} garantías, ${(parsed.customers || []).length} clientes)!`);
        } else {
          setImportStatus('Error: El formato del archivo no es válido.');
        }
      } catch (err) {
        setImportStatus('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg my-8 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Exportar y Copia de Seguridad
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Descarga tus datos en Excel/CSV o restaura tu base de datos completa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          {importStatus && (
            <div className={`p-3 rounded-xl border flex items-center gap-2 ${
              importStatus.startsWith('Error') 
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300' 
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            }`}>
              {importStatus.startsWith('Error') ? <AlertTriangle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              <span>{importStatus}</span>
            </div>
          )}

          {/* Export Options */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
              1. Descargar Respaldo de Datos
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleExportCsv}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10 transition text-left group cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold mb-1">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Excel / CSV</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Ideal para abrir en Excel o Google Sheets con cálculos de margen y costos.
                </p>
              </button>

              <button
                onClick={handleExportJson}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 hover:bg-sky-50/50 dark:hover:bg-sky-950/10 transition text-left group cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold mb-1">
                  <FileJson className="w-4 h-4" />
                  <span>Backup Completo JSON</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Copia de seguridad total: equipos, clientes, garantías emitidas y tasas.
                </p>
              </button>
            </div>
          </div>

          {/* Import Option */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
              2. Restaurar Copia de Seguridad
            </h4>
            
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/10 transition flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-300 font-semibold cursor-pointer"
              >
                <Upload className="w-4 h-4 text-amber-500" />
                <span>Seleccionar archivo .JSON de Respaldo</span>
              </button>
            </div>
          </div>

          {/* Reset / Start from scratch */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            {showResetConfirm ? (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 space-y-2.5">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>¿Reiniciar y borrar todos los registros?</span>
                </div>
                <p className="text-[11px] text-rose-700/80 dark:text-rose-200/80">
                  Esta acción dejará el inventario, clientes y órdenes en 0 para empezar desde cero.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      onResetData();
                      setShowResetConfirm(false);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Sí, Empezar de 0
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">Reiniciar Datos:</span>
                  <span className="text-[11px] text-slate-500">Dejar inventario y registros en 0</span>
                </div>
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Empezar de 0</span>
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-950/80">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
