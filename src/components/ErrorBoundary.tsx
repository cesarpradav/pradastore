import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Download } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleBackupDownload = () => {
    try {
      const phones = localStorage.getItem('ebay_zoom_phones_inventory_v1');
      const orders = localStorage.getItem('ebay_zoom_warranty_orders_v1');
      const customers = localStorage.getItem('ebay_zoom_crm_customers_v1');
      const backup = {
        timestamp: new Date().toISOString(),
        phones: phones ? JSON.parse(phones) : [],
        orders: orders ? JSON.parse(orders) : [],
        customers: customers ? JSON.parse(customers) : [],
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `respaldo_inventario_error_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generating emergency backup', e);
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <div className="p-2.5 bg-red-500/10 rounded-xl">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Se detectó un detalle en pantalla</h2>
                <p className="text-xs text-slate-400">Tus datos e inventario siguen intactos y seguros</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              La protección contra fallos evitó que se perdiera tu sesión. Puedes recargar la interfaz de forma segura o descargar una copia inmediata de respaldo de tu inventario.
            </p>

            {this.state.error && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-red-300 max-h-28 overflow-y-auto mb-4">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-lg shadow-emerald-900/30"
              >
                <RefreshCw className="w-4 h-4" />
                Recuperar y Recargar
              </button>
              <button
                onClick={this.handleBackupDownload}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                title="Descargar copia de seguridad en JSON"
              >
                <Download className="w-4 h-4" />
                Respaldar Datos
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
