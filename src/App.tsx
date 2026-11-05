import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { MainLayout } from './components/layout/MainLayout';
import { Loader2, Wifi } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] flex flex-col items-center justify-center text-neutral-400">
        <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-600/30 flex items-center justify-center text-red-500 mb-3 animate-pulse">
          <Wifi className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-neutral-300">
          <Loader2 className="w-4 h-4 animate-spin text-red-500" />
          <span>Iniciando WIN BACK DATA...</span>
        </div>
      </div>
    );
  }

  // REGLA PRINCIPAL: ACCESO SOLO CON INICIO DE SESIÓN
  // Nadie puede ver ni usar ninguna parte del sistema sin iniciar sesión.
  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
