/**
 * WIN BACK DATA - Capa de Servicio de Autenticación
 * 
 * NOTA DE SEGURIDAD PARA PRODUCCIÓN:
 * En un entorno de producción real, las credenciales, hashes de contraseña y lógica de validación
 * NO deben residir en el frontend de la aplicación. Deben crearse mediante un script de inicialización
 * (seed) en el backend (PostgreSQL/Cloud SQL o Firebase Auth) y validarse a través de un endpoint seguro
 * con tokens JWT en cookies HttpOnly o sesiones seguras de Firebase Auth.
 * 
 * Esta implementación simula de forma fidedigna y segura dicho comportamiento mediante:
 * 1. Hashing con bcryptjs (coste 10).
 * 2. Almacenamiento seguro de sesión en localStorage/sessionStorage.
 * 3. Control de intentos fallidos (bloqueo temporal de 30 segundos tras 5 intentos erróneos).
 * 4. Interfaz lista para migrar a API REST o Firebase Auth cambiando este adaptador.
 */

import bcrypt from 'bcryptjs';
import { Usuario, UserRole } from '../types';

const USERS_STORAGE_KEY = 'win_back_users';
const SESSION_STORAGE_KEY = 'win_back_current_session';
const LOCKOUT_STORAGE_KEY = 'win_back_lockout_state';

// Initial admin user credentials required by prompt
// Usuario: MATEOHIGA (no distingue mayúsculas/minúsculas)
// Contraseña: T5Xfpfu9SMLzY4BXmFfc (sí distingue mayúsculas/minúsculas)
// Display name: MATEO HIGA
// Rol: Admin
const INITIAL_ADMIN_USERNAME = 'MATEOHIGA';
const INITIAL_ADMIN_PASSWORD_PLAIN = 'T5Xfpfu9SMLzY4BXmFfc';
const INITIAL_ADMIN_DISPLAY_NAME = 'MATEO HIGA';

interface LockoutState {
  attempts: number;
  lockedUntil: number | null; // timestamp in ms
}

class AuthService {
  private users: Usuario[] = [];

  constructor() {
    this.initializeUsers();
  }

  /**
   * Initializes users in localStorage or generates the initial Admin user with bcrypt hash
   */
  private initializeUsers(): void {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      try {
        this.users = JSON.parse(raw);
        // Verify if initial admin exists
        const adminExists = this.users.some(
          (u) => u.usuario.toUpperCase() === INITIAL_ADMIN_USERNAME.toUpperCase()
        );
        if (!adminExists) {
          this.seedInitialAdmin();
        }
        return;
      } catch (e) {
        console.error('Error parsing stored users, reinitializing', e);
      }
    }
    this.seedInitialAdmin();
  }

  private seedInitialAdmin(): void {
    // Generate bcrypt hash for the official admin password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(INITIAL_ADMIN_PASSWORD_PLAIN, salt);

    const initialAdmin: Usuario = {
      id: 'usr-admin-mateo',
      usuario: INITIAL_ADMIN_USERNAME,
      nombreMostrar: INITIAL_ADMIN_DISPLAY_NAME,
      passwordHash,
      rol: 'Admin',
      sala: 'TODAS',
      activo: true,
      createdAt: '2026-09-01T08:00:00.000Z'
    };

    // Keep existing non-admin users if any
    const others = this.users.filter(
      (u) => u.usuario.toUpperCase() !== INITIAL_ADMIN_USERNAME.toUpperCase()
    );
    this.users = [initialAdmin, ...others];
    this.saveUsersToStorage();
  }

  private saveUsersToStorage(): void {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(this.users));
  }

  public getUsers(): Usuario[] {
    return [...this.users];
  }

  public getLockoutState(): LockoutState {
    const raw = sessionStorage.getItem(LOCKOUT_STORAGE_KEY) || localStorage.getItem(LOCKOUT_STORAGE_KEY);
    if (raw) {
      try {
        const state: LockoutState = JSON.parse(raw);
        if (state.lockedUntil && Date.now() >= state.lockedUntil) {
          // Lockout expired
          return { attempts: 0, lockedUntil: null };
        }
        return state;
      } catch (e) {
        // invalid
      }
    }
    return { attempts: 0, lockedUntil: null };
  }

  private setLockoutState(state: LockoutState): void {
    const json = JSON.stringify(state);
    sessionStorage.setItem(LOCKOUT_STORAGE_KEY, json);
    localStorage.setItem(LOCKOUT_STORAGE_KEY, json);
  }

  /**
   * Validates user credentials.
   * - Username is case-insensitive.
   * - Password is case-sensitive and verified via bcrypt.
   * - Tracks failed attempts (lockout for 30s after 5 failed).
   */
  public async login(
    usuarioInput: string,
    passwordInput: string,
    mantenerSesion: boolean
  ): Promise<{ success: boolean; user?: Usuario; error?: string; remainingLockSeconds?: number }> {
    // Check lockout first
    const lockout = this.getLockoutState();
    if (lockout.lockedUntil && Date.now() < lockout.lockedUntil) {
      const remainingSeconds = Math.ceil((lockout.lockedUntil - Date.now()) / 1000);
      return {
        success: false,
        error: `Demasiados intentos fallidos. Sistema bloqueado temporalmente por ${remainingSeconds}s.`,
        remainingLockSeconds: remainingSeconds
      };
    }

    const trimmedUser = usuarioInput.trim().toUpperCase();
    const user = this.users.find(
      (u) => u.usuario.trim().toUpperCase() === trimmedUser
    );

    if (!user || !user.activo) {
      return this.handleFailedAttempt(lockout);
    }

    // Verify bcrypt hash
    const isPasswordValid = bcrypt.compareSync(passwordInput, user.passwordHash);
    if (!isPasswordValid) {
      return this.handleFailedAttempt(lockout);
    }

    // Successful login: reset lockout
    this.setLockoutState({ attempts: 0, lockedUntil: null });

    // Store active session
    const sessionData = {
      id: user.id,
      usuario: user.usuario,
      nombreMostrar: user.nombreMostrar,
      rol: user.rol,
      sala: user.sala,
      asesorAsociadoId: user.asesorAsociadoId,
      loggedAt: new Date().toISOString()
    };

    if (mantenerSesion) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }

    return { success: true, user };
  }

  private handleFailedAttempt(
    lockout: LockoutState
  ): { success: boolean; error: string; remainingLockSeconds?: number } {
    const nextAttempts = (lockout.attempts || 0) + 1;
    if (nextAttempts >= 5) {
      const lockedUntil = Date.now() + 30 * 1000; // 30 seconds
      this.setLockoutState({ attempts: nextAttempts, lockedUntil });
      return {
        success: false,
        error: 'Demasiados intentos erróneos. Sistema bloqueado por 30 segundos.',
        remainingLockSeconds: 30
      };
    } else {
      this.setLockoutState({ attempts: nextAttempts, lockedUntil: null });
      return {
        success: false,
        error: 'Usuario o contraseña incorrectos.'
      };
    }
  }

  /**
   * Returns current active session or null if not logged in
   */
  public getCurrentUser(): Usuario | null {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      const user = this.users.find((u) => u.id === data.id && u.activo);
      return user || null;
    } catch {
      return null;
    }
  }

  public logout(): void {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  // Admin user management methods
  public createUser(userData: {
    usuario: string;
    nombreMostrar: string;
    passwordPlain: string;
    rol: UserRole;
    sala?: string;
    asesorAsociadoId?: string;
  }): Usuario {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(userData.passwordPlain, salt);

    const newUser: Usuario = {
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      usuario: userData.usuario.trim().toUpperCase(),
      nombreMostrar: userData.nombreMostrar.trim(),
      passwordHash,
      rol: userData.rol,
      sala: userData.sala,
      activo: true,
      createdAt: new Date().toISOString(),
      asesorAsociadoId: userData.asesorAsociadoId
    };

    this.users.push(newUser);
    this.saveUsersToStorage();
    return newUser;
  }

  public updateUser(
    id: string,
    updates: Partial<Pick<Usuario, 'nombreMostrar' | 'rol' | 'sala' | 'activo' | 'asesorAsociadoId'>>
  ): boolean {
    const user = this.users.find((u) => u.id === id);
    if (!user) return false;

    // Prevent deactivating initial admin
    if (user.usuario.toUpperCase() === INITIAL_ADMIN_USERNAME.toUpperCase() && updates.activo === false) {
      return false;
    }

    Object.assign(user, updates);
    this.saveUsersToStorage();
    return true;
  }

  public resetPassword(id: string, newPasswordPlain: string): boolean {
    const user = this.users.find((u) => u.id === id);
    if (!user) return false;

    const salt = bcrypt.genSaltSync(10);
    user.passwordHash = bcrypt.hashSync(newPasswordPlain, salt);
    this.saveUsersToStorage();
    return true;
  }

  public deleteUser(id: string): boolean {
    const user = this.users.find((u) => u.id === id);
    if (!user) return false;
    // Cannot delete initial admin
    if (user.usuario.toUpperCase() === INITIAL_ADMIN_USERNAME.toUpperCase()) {
      return false;
    }

    this.users = this.users.filter((u) => u.id !== id);
    this.saveUsersToStorage();
    return true;
  }
}

export const authService = new AuthService();
