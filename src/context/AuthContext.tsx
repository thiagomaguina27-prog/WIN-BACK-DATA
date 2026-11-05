import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario, UserRole } from '../types';
import { authService } from '../services/authService';

export interface AuthContextType {
  currentUser: Usuario | null;
  isLoading: boolean;
  lockoutSeconds: number;
  login: (username: string, pass: string, keepSession: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  canAccessRoute: (routeId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

  // Initialize session check
  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);

    const lockout = authService.getLockoutState();
    if (lockout.lockedUntil && Date.now() < lockout.lockedUntil) {
      setLockoutSeconds(Math.ceil((lockout.lockedUntil - Date.now()) / 1000));
    }

    setIsLoading(false);
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const login = async (
    username: string,
    pass: string,
    keepSession: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    const res = await authService.login(username, pass, keepSession);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      return { success: true };
    } else {
      if (res.remainingLockSeconds) {
        setLockoutSeconds(res.remainingLockSeconds);
      }
      return { success: false, error: res.error || 'Credenciales incorrectas' };
    }
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  /**
   * Route permissions matrix:
   * - Admin: all routes
   * - Back: 'base', 'carga-masiva', 'rotacion'
   * - Supervisor: 'rendimiento', 'avance'
   * - Asesor: 'mi-base' / 'avance'
   */
  const canAccessRoute = (routeId: string): boolean => {
    if (!currentUser) return false;
    const role: UserRole = currentUser.rol;

    if (role === 'Admin') return true;

    if (role === 'Back') {
      // Back Data: Base General, Carga Masiva (con pegado N1), Rotación, Rendimiento y Avance de todas las salas
      return ['base', 'carga-masiva', 'rotacion', 'rendimiento', 'avance'].includes(routeId);
    }

    if (role === 'Supervisor') {
      // Supervisor: Rendimiento y Avance filtrados por su sala
      return ['rendimiento', 'avance'].includes(routeId);
    }

    if (role === 'Asesor') {
      // Asesor: Solo sus apartados Llamadas, Rendimiento personal y Ventas Subidas
      return ['llamadas', 'rendimiento', 'ventas-subidas'].includes(routeId);
    }

    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        lockoutSeconds,
        login,
        logout,
        canAccessRoute
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
