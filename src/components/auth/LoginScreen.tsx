import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, AlertCircle, ShieldAlert, Wifi, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { login, lockoutSeconds } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mantenerSesion, setMantenerSesion] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    if (!usuario.trim() || !password) {
      setErrorMessage('Por favor ingresa usuario y contraseña.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      // Simulate minor async verification latency
      await new Promise((resolve) => setTimeout(resolve, 300));
      const res = await login(usuario, password, mantenerSesion);
      if (!res.success) {
        setErrorMessage(res.error || 'Usuario o contraseña incorrectos');
      }
    } catch {
      setErrorMessage('Error al validar credenciales');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLocked = lockoutSeconds > 0;

  return (
    <div className="min-h-screen w-full bg-[#0b0b0f] flex items-center justify-center p-4 selection:bg-red-900 selection:text-white">
      {/* Background ambient accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-red-600/5 rounded-full blur-3xl transform -translate-y-12" />
      </div>

      <div className="w-full max-w-[420px] bg-[#121218] border border-[#1f1f28] rounded-xl shadow-2xl p-8 relative z-10">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-14 h-14 bg-red-600/10 border border-red-600/30 rounded-2xl flex items-center justify-center mb-3.5 shadow-inner">
            <div className="flex items-center justify-center relative">
              <Wifi className="w-7 h-7 text-red-500" strokeWidth={2.4} />
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-wider text-white uppercase">
            WIN BACK DATA
          </h1>
          <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest font-medium">
            Acceso al sistema
          </p>
          <span className="text-[11px] text-neutral-500 mt-0.5">
            Gestión de Leads y Ventas Fibra Óptica
          </span>
        </div>

        {/* Lockout Warning Banner */}
        {isLocked && (
          <div className="mb-5 p-3.5 bg-red-950/40 border border-red-800/60 rounded-lg flex items-start gap-3 text-red-200">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-red-300">Sistema bloqueado por seguridad</p>
              <p className="text-neutral-300 mt-0.5">
                5 intentos fallidos consecutivos. Espera{' '}
                <span className="font-mono text-red-400 font-bold text-sm">
                  {lockoutSeconds}s
                </span>{' '}
                antes de volver a intentar.
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && !isLocked && (
          <div className="mb-5 p-3 bg-red-950/40 border border-red-700/50 rounded-lg flex items-center gap-2.5 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-400 mb-1.5">
              USUARIO
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                autoComplete="username"
                disabled={isLocked || isSubmitting}
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Ingresa tu usuario"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#0b0b0f] border border-[#1f1f28] rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-400 mb-1.5">
              CONTRASEÑA
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                disabled={isLocked || isSubmitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-[#0b0b0f] border border-[#1f1f28] rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={mantenerSesion}
                onChange={(e) => setMantenerSesion(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-[#0b0b0f] border-[#1f1f28] text-red-600 focus:ring-red-600 focus:ring-offset-0 focus:ring-1 cursor-pointer accent-red-600"
              />
              <span className="text-xs text-neutral-300">Mantener sesión iniciada</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLocked || isSubmitting}
            className="w-full mt-2 py-2.5 px-4 bg-[#dc2626] hover:bg-[#b91c1c] active:bg-red-800 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Validando...</span>
              </>
            ) : isLocked ? (
              <span>Bloqueado ({lockoutSeconds}s)</span>
            ) : (
              <span>Ingresar</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#1f1f28]/70 text-center text-[11px] text-neutral-500">
          <p>WIN TELECOMUNICACIONES S.A. · Fibra Óptica 100%</p>
        </div>
      </div>
    </div>
  );
};
