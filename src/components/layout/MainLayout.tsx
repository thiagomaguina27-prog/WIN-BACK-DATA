import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BaseView } from '../base/BaseView';
import { CargaMasivaView } from '../carga-masiva/CargaMasivaView';
import { RotacionView } from '../rotacion/RotacionView';
import { RendimientoView } from '../rendimiento/RendimientoView';
import { AvanceAsesoresView } from '../avance/AvanceAsesoresView';
import { UsuariosView } from '../usuarios/UsuariosView';
import { AsesorLlamadasView } from '../asesor/AsesorLlamadasView';
import { AsesorRendimientoView } from '../asesor/AsesorRendimientoView';
import { AsesorVentasSubidasView } from '../asesor/AsesorVentasSubidasView';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const { currentUser, canAccessRoute } = useAuth();
  const { toasts, removeToast } = useApp();

  // Determine initial default view based on user role
  const getDefaultViewForRole = (): string => {
    if (!currentUser) return 'base';
    if (currentUser.rol === 'Asesor') return 'llamadas';
    if (currentUser.rol === 'Supervisor') return 'rendimiento';
    return 'base';
  };

  const [currentView, setCurrentView] = useState<string>(getDefaultViewForRole);

  useEffect(() => {
    // If role changed or current view not allowed, reset to default allowed view
    if (!canAccessRoute(currentView)) {
      setCurrentView(getDefaultViewForRole());
    }
  }, [currentUser, currentView, canAccessRoute]);

  const handleNavigate = (viewId: string) => {
    if (canAccessRoute(viewId)) {
      setCurrentView(viewId);
    }
  };

  // Render view or Access Denied
  const renderCurrentView = () => {
    if (!canAccessRoute(currentView)) {
      return (
        <div className="bg-[#121218] border border-red-900/40 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-lg">
          <div className="w-14 h-14 bg-red-950/50 border border-red-700/50 rounded-2xl flex items-center justify-center text-red-400 mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            Acceso Denegado
          </h2>
          <p className="text-xs text-neutral-400 max-w-md mt-1 mb-5">
            Tu rol actual ({currentUser?.rol}) no tiene permisos para acceder a esta sección. Consulta con el Administrador.
          </p>
          <button
            onClick={() => setCurrentView(getDefaultViewForRole())}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
          >
            Regresar a vista permitida
          </button>
        </div>
      );
    }

    switch (currentView) {
      // Views for Asesor
      case 'llamadas':
        return <AsesorLlamadasView />;
      case 'ventas-subidas':
        return <AsesorVentasSubidasView />;

      // Views for Admin & Back
      case 'base':
        return <BaseView />;
      case 'carga-masiva':
        return <CargaMasivaView />;
      case 'rotacion':
        return <RotacionView />;

      // Rendimiento: If Asesor, show personal analytics; else show supervisor/global analytics
      case 'rendimiento':
        return currentUser?.rol === 'Asesor' ? (
          <AsesorRendimientoView />
        ) : (
          <RendimientoView />
        );

      // Avance: For Supervisor (restricted to their room) and Back/Admin (all rooms)
      case 'avance':
        return <AvanceAsesoresView />;

      // Admin only
      case 'usuarios':
        return <UsuariosView />;

      default:
        return <BaseView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-neutral-200 flex flex-col">
      {/* Fixed Header */}
      <Header />

      {/* Main Container */}
      <div className="flex flex-1 pt-14">
        {/* Fixed Sidebar */}
        <Sidebar currentView={currentView} onNavigate={handleNavigate} />

        {/* Content Viewport (offset by 205px sidebar) */}
        <main className="flex-1 ml-[205px] p-4 overflow-y-auto">
          {renderCurrentView()}
        </main>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3 rounded-lg border shadow-xl flex items-center justify-between gap-3 text-xs transition-all animate-in slide-in-from-bottom-2 ${
              toast.type === 'error'
                ? 'bg-red-950/90 border-red-700 text-red-200'
                : toast.type === 'info'
                ? 'bg-neutral-900/95 border-[#2f2f42] text-neutral-200'
                : 'bg-emerald-950/90 border-emerald-700 text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              ) : toast.type === 'info' ? (
                <Info className="w-4 h-4 text-sky-400 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span className="font-medium leading-tight">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
