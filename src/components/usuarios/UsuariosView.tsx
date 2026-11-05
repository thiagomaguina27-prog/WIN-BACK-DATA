import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  UserPlus,
  Edit,
  KeyRound,
  Trash2,
  CheckCircle,
  XCircle,
  Shield,
  UserCheck,
  Lock,
  User,
  Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { Usuario, UserRole } from '../../types';
import { useApp } from '../../context/AppContext';
import { leadService } from '../../services/leadService';

const SALAS_DISPONIBLES = ['SALA 1', 'SALA 2', 'SALA 3', 'SALA 4', 'SALA 5', 'SALA VIP'];

export const UsuariosView: React.FC = () => {
  const { currentUser } = useAuth();
  const { asesores, refreshData, showToast } = useApp();

  const [users, setUsers] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals / forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [resettingUser, setResettingUser] = useState<Usuario | null>(null);

  // New user form
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Asesor');
  const [newSala, setNewSala] = useState('SALA 1');
  const [newAsesorId, setNewAsesorId] = useState('');

  // Reset password form
  const [resetNewPass, setResetNewPass] = useState('');

  const refreshUsers = () => {
    setUsers(authService.getUsers());
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          u.usuario.toLowerCase().includes(q) ||
          u.nombreMostrar.toLowerCase().includes(q) ||
          u.rol.toLowerCase().includes(q) ||
          (u.sala && u.sala.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [users, searchTerm]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newDisplayName.trim() || !newPassword) {
      showToast('Completa todos los campos requeridos', 'error');
      return;
    }

    try {
      const createdUser = authService.createUser({
        usuario: newUsername,
        nombreMostrar: newDisplayName,
        passwordPlain: newPassword,
        rol: newRole,
        sala: newRole === 'Back' ? 'TODAS LAS SALAS' : newSala,
        asesorAsociadoId: newRole === 'Asesor' ? newAsesorId || `as-usr-${Date.now()}` : undefined
      });

      // If role is Asesor, register automatically as active advisor in leadService with this sala
      if (newRole === 'Asesor') {
        leadService.addOrUpdateAsesor({
          id: createdUser.asesorAsociadoId || createdUser.id,
          nombreCompleto: newDisplayName.trim().toUpperCase(),
          usuario: newUsername.trim().toLowerCase(),
          sala: newSala,
          color: '#ef4444',
          activo: true
        });
        refreshData();
      }

      refreshUsers();
      setShowCreateModal(false);
      setNewUsername('');
      setNewDisplayName('');
      setNewPassword('');
      setNewRole('Asesor');
      setNewSala('SALA 1');
      showToast(`Usuario ${createdUser.usuario} creado y asignado a ${newSala}`, 'success');
    } catch {
      showToast('Error al crear usuario', 'error');
    }
  };

  const handleToggleActive = (user: Usuario) => {
    if (user.usuario.toUpperCase() === 'MATEOHIGA') {
      showToast('No es posible desactivar al Administrador Principal', 'error');
      return;
    }
    const nextState = !user.activo;
    authService.updateUser(user.id, { activo: nextState });
    refreshUsers();
    showToast(`Usuario ${user.usuario} ${nextState ? 'activado' : 'desactivado'}`, 'info');
  };

  const handleDeleteUser = (user: Usuario) => {
    if (user.usuario.toUpperCase() === 'MATEOHIGA') {
      showToast('No se puede eliminar el usuario administrador inicial', 'error');
      return;
    }
    if (confirm(`¿Estás seguro de eliminar al usuario ${user.usuario}? Esta acción no se puede deshacer.`)) {
      authService.deleteUser(user.id);
      refreshUsers();
      showToast('Usuario eliminado', 'info');
    }
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !resetNewPass) return;

    authService.resetPassword(resettingUser.id, resetNewPass);
    refreshUsers();
    setResettingUser(null);
    setResetNewPass('');
    showToast(`Contraseña actualizada para @${resettingUser.usuario}`, 'success');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    authService.updateUser(editingUser.id, {
      nombreMostrar: editingUser.nombreMostrar,
      rol: editingUser.rol,
      sala: editingUser.sala,
      activo: editingUser.activo,
      asesorAsociadoId: editingUser.asesorAsociadoId
    });

    // If asesor, sync sala and name
    if (editingUser.rol === 'Asesor' && editingUser.sala) {
      leadService.addOrUpdateAsesor({
        id: editingUser.asesorAsociadoId || editingUser.id,
        nombreCompleto: editingUser.nombreMostrar.trim().toUpperCase(),
        usuario: editingUser.usuario.trim().toLowerCase(),
        sala: editingUser.sala,
        color: '#ef4444',
        activo: editingUser.activo
      });
      refreshData();
    }

    refreshUsers();
    setEditingUser(null);
    showToast('Datos de usuario y sala actualizados', 'success');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div>
          <h1 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            Gestión de Usuarios, Roles y Salas
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Define accesos por rol: asigna la SALA a cada Asesor y Supervisor para segmentar su base y reportes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por usuario, sala o rol..."
            className="bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-600"
          />

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Crear Usuario</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#121218] border border-[#1f1f28] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#16161f] text-neutral-400 text-[10px] uppercase font-bold border-b border-[#1f1f28]">
              <tr>
                <th className="py-2.5 px-3">Usuario</th>
                <th className="py-2.5 px-3">Nombre a Mostrar</th>
                <th className="py-2.5 px-3">Rol</th>
                <th className="py-2.5 px-3">Sala Asignada</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3">Seguridad</th>
                <th className="py-2.5 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f28]/60 bg-[#0b0b0f]">
              {filteredUsers.map((user) => {
                const isInitialAdmin = user.usuario.toUpperCase() === 'MATEOHIGA';

                return (
                  <tr key={user.id} className="hover:bg-[#14141c]">
                    <td className="py-2.5 px-3 font-mono font-bold text-white">
                      @{user.usuario}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-neutral-200">
                      {user.nombreMostrar}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          user.rol === 'Admin'
                            ? 'bg-red-950/70 border border-red-700/60 text-red-300'
                            : user.rol === 'Back'
                            ? 'bg-sky-950/70 border border-sky-700/60 text-sky-300'
                            : user.rol === 'Supervisor'
                            ? 'bg-purple-950/70 border border-purple-700/60 text-purple-300'
                            : 'bg-emerald-950/70 border border-emerald-700/60 text-emerald-300'
                        }`}
                      >
                        {user.rol}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-xs text-neutral-300">
                      {user.sala ? (
                        <span className="flex items-center gap-1.5 text-neutral-200">
                          <Building2 className="w-3.5 h-3.5 text-red-400" />
                          <span>{user.sala}</span>
                        </span>
                      ) : (
                        <span className="text-neutral-500 italic">No aplica</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => handleToggleActive(user)}
                        disabled={isInitialAdmin}
                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                          user.activo
                            ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/50'
                            : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700'
                        }`}
                      >
                        {user.activo ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            <span>Activo</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-neutral-400" />
                            <span>Inactivo</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-[10px] text-neutral-400 font-mono">
                      bcrypt (10 rounds)
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setResettingUser(user);
                            setResetNewPass('');
                          }}
                          title="Restablecer contraseña"
                          className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 rounded cursor-pointer transition-colors"
                        >
                          <KeyRound className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => setEditingUser({ ...user })}
                          title="Editar usuario y sala"
                          className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded cursor-pointer transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                        </button>

                        {!isInitialAdmin && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            title="Eliminar usuario"
                            className="p-1.5 bg-neutral-800 hover:bg-red-900/50 text-neutral-400 hover:text-red-400 rounded cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Crear Usuario */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121218] border border-[#1f1f28] rounded-xl w-full max-w-md shadow-2xl p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-red-500" />
              Crear Nuevo Usuario y Asignar Sala
            </h2>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                  ROL DE ACCESO *
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-red-600"
                >
                  <option value="Asesor">Asesor (Solo Llamadas, Rendimiento propio y Ventas Subidas)</option>
                  <option value="Supervisor">Supervisor (Rendimiento y Avance de su Sala)</option>
                  <option value="Back">Back Data (Base General, Carga Masiva N1, Rotación, Rendimiento y Avance)</option>
                  <option value="Admin">Admin (Control Total)</option>
                </select>
              </div>

              {/* Sala selector for Asesor and Supervisor */}
              {(newRole === 'Asesor' || newRole === 'Supervisor') && (
                <div className="bg-[#0b0b0f] p-3 rounded-lg border border-red-900/40">
                  <label className="text-[10px] uppercase font-bold text-red-400 block mb-1">
                    {newRole === 'Asesor' ? 'SALA DEL ASESOR *' : 'SALA SUPERVISADA *'}
                  </label>
                  <select
                    value={newSala}
                    onChange={(e) => setNewSala(e.target.value)}
                    className="w-full bg-[#16161f] border border-red-700/60 rounded-lg px-3 py-2 text-white font-bold focus:outline-none"
                  >
                    {SALAS_DISPONIBLES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                    {newRole === 'Supervisor' && (
                      <option value="TODAS LAS SALAS">TODAS LAS SALAS (Supervisor General)</option>
                    )}
                  </select>
                  <span className="text-[10px] text-neutral-400 mt-1 block">
                    {newRole === 'Asesor'
                      ? 'El asesor pertenecerá a esta sala y solo verá sus propios leads asignados.'
                      : 'El supervisor solo podrá ver métricas y asesores de esta sala.'}
                  </span>
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                  NOMBRE COMPLETO A MOSTRAR *
                </label>
                <input
                  type="text"
                  required
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="Ej. RENZO MENDOZA"
                  className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                  USUARIO LOGIN (NO DISTINGUE MAYÚSCULAS) *
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Ej. rmendoza"
                  className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                  CONTRASEÑA INICIAL *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-600"
                />
                <span className="text-[10px] text-neutral-500 mt-0.5 block">
                  Encriptada con bcrypt
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1f1f28]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Usuario */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121218] border border-[#1f1f28] rounded-xl w-full max-w-md shadow-2xl p-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Edit className="w-4 h-4 text-sky-400" />
              Editar Usuario: @{editingUser.usuario}
            </h2>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                  NOMBRE A MOSTRAR
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.nombreMostrar}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, nombreMostrar: e.target.value })
                  }
                  className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                  ROL
                </label>
                <select
                  value={editingUser.rol}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, rol: e.target.value as UserRole })
                  }
                  disabled={editingUser.usuario.toUpperCase() === 'MATEOHIGA'}
                  className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-600 disabled:opacity-50"
                >
                  <option value="Admin">Admin</option>
                  <option value="Back">Back</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Asesor">Asesor</option>
                </select>
              </div>

              {/* Sala */}
              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                  SALA ASIGNADA
                </label>
                <select
                  value={editingUser.sala || 'SALA 1'}
                  onChange={(e) => setEditingUser({ ...editingUser, sala: e.target.value })}
                  className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-3 py-2 text-white focus:outline-none"
                >
                  {SALAS_DISPONIBLES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value="TODAS LAS SALAS">TODAS LAS SALAS</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1f1f28]">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Restablecer Contraseña */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121218] border border-[#1f1f28] rounded-xl w-full max-w-sm shadow-2xl p-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              Restablecer Contraseña
            </h2>
            <p className="text-xs text-neutral-400 mb-4">
              Usuario: <strong className="text-white">@{resettingUser.usuario}</strong>
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                  NUEVA CONTRASEÑA
                </label>
                <input
                  type="password"
                  required
                  value={resetNewPass}
                  onChange={(e) => setResetNewPass(e.target.value)}
                  placeholder="Ingresa la nueva clave"
                  className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1f1f28]">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
                >
                  Actualizar Clave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
