import React, { useState, useMemo } from 'react';
import {
  Phone,
  MessageCircle,
  Search,
  CheckCircle,
  Clock,
  Edit2,
  Plus,
  Copy,
  ExternalLink,
  FilterX,
  User,
  MapPin,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Lead, TipifVendedor } from '../../types';
import { TIPIF_VENDEDOR_LIST, CAMPAÑAS_LIST } from '../../data/initialData';
import { LeadEditModal } from '../modals/LeadEditModal';
import { UBIGEO_PERU } from '../../data/ubigeo';

export const AsesorLlamadasView: React.FC = () => {
  const { currentUser } = useAuth();
  const { leads, updateLead, addLead, showToast, duplicateN1Set } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New lead form state
  const [newCamp, setNewCamp] = useState(CAMPAÑAS_LIST[0]);
  const [newN1, setNewN1] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newDni, setNewDni] = useState('');
  const [newDistrito, setNewDistrito] = useState('San Juan de Lurigancho');
  const [newDireccion, setNewDireccion] = useState('');

  // Strictly filter leads belonging ONLY to this advisor
  const myLeads = useMemo(() => {
    if (!currentUser) return [];
    const myId = currentUser.asesorAsociadoId;
    const myName = currentUser.nombreMostrar.trim().toUpperCase();
    const myUser = currentUser.usuario.trim().toUpperCase();

    return leads.filter((l) => {
      const matchId = myId && l.asesorId === myId;
      const matchName = l.asesorNombre && l.asesorNombre.trim().toUpperCase() === myName;
      // Also match if advisor user matches
      return matchId || matchName;
    });
  }, [leads, currentUser]);

  // Filtered by search and status
  const filteredLeads = useMemo(() => {
    return myLeads.filter((l) => {
      if (statusFilter && (l.tipifVendedor || 'Pendiente') !== statusFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const n1Match = l.n1.includes(q);
        const nameMatch = l.nombreCliente ? l.nombreCliente.toLowerCase().includes(q) : false;
        const dniMatch = l.dni ? l.dni.toLowerCase().includes(q) : false;
        const distMatch = l.distrito.toLowerCase().includes(q);
        const campMatch = l.campaña.toLowerCase().includes(q);
        if (!n1Match && !nameMatch && !dniMatch && !distMatch && !campMatch) {
          return false;
        }
      }
      return true;
    });
  }, [myLeads, statusFilter, searchTerm]);

  // Stats
  const totalMyLeads = myLeads.length;
  const ventasCount = myLeads.filter((l) => l.tipifVendedor === 'Venta').length;
  const pendientesCount = myLeads.filter((l) => (l.tipifVendedor || 'Pendiente') === 'Pendiente').length;
  const seguimientoCount = myLeads.filter((l) => l.tipifVendedor === 'Seguimiento').length;

  const handleQuickTipify = (leadId: string, tipif: TipifVendedor) => {
    updateLead(leadId, { tipifVendedor: tipif });
    showToast(`Lead tipificado como ${tipif}`, 'info');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copiado al portapapeles`, 'info');
  };

  const handleCreateMyLead = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanN1 = newN1.trim().replace(/\D/g, '');
    if (cleanN1.length !== 9 || !cleanN1.startsWith('9')) {
      showToast('N1 debe ser celular válido de 9 dígitos que inicie con 9', 'error');
      return;
    }

    const created = addLead({
      campaña: newCamp,
      n1: cleanN1,
      nombreCliente: newClientName.trim() || undefined,
      dni: newDni.trim() || undefined,
      departamento: 'Lima',
      provincia: 'Lima',
      distrito: newDistrito,
      direccion: newDireccion.trim() || undefined,
      tipifBack1: 'Agendado',
      tipifVendedor: 'Pendiente',
      cobertura: 'Con cobertura',
      estadoInstalacion: 'Pendiente de programar',
      asesorId: currentUser?.asesorAsociadoId || currentUser?.id,
      asesorNombre: currentUser?.nombreMostrar,
      sala: currentUser?.sala || 'SALA 1'
    });

    setShowAddModal(false);
    setNewN1('');
    setNewClientName('');
    setNewDni('');
    setNewDireccion('');
    showToast(`Lead ${created.n1} agregado a tu base personal`, 'success');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Phone className="w-5 h-5 text-red-500" />
              Mis Llamadas y Leads Asignados
            </h1>
            <span className="text-[10px] bg-red-950/70 border border-red-700/60 text-red-300 font-bold px-2 py-0.5 rounded uppercase">
              {currentUser?.sala || 'SALA ASIGNADA'}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Base personal de contactos para {currentUser?.nombreMostrar}. Solo tú tienes acceso a estos registros.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nuevo Lead a mi Base</span>
        </button>
      </div>

      {/* Mini KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-3">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
            TOTAL ASIGNADOS
          </span>
          <span className="text-xl font-bold font-mono text-white">{totalMyLeads}</span>
        </div>
        <div className="bg-[#121218] border border-emerald-900/40 rounded-xl p-3">
          <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">
            MIS VENTAS CERRADAS
          </span>
          <span className="text-xl font-bold font-mono text-emerald-400">{ventasCount}</span>
        </div>
        <div className="bg-[#121218] border border-sky-900/40 rounded-xl p-3">
          <span className="text-[10px] uppercase font-bold text-sky-400 block mb-1">
            EN SEGUIMIENTO
          </span>
          <span className="text-xl font-bold font-mono text-sky-400">{seguimientoCount}</span>
        </div>
        <div className="bg-[#121218] border border-amber-900/40 rounded-xl p-3">
          <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">
            PENDIENTES DE LLAMAR
          </span>
          <span className="text-xl font-bold font-mono text-amber-400">{pendientesCount}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative min-w-[260px] flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por teléfono, cliente, DNI, distrito..."
            className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-neutral-400">ESTADO:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="">Todos los estados</option>
            {TIPIF_VENDEDOR_LIST.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {statusFilter && (
            <button
              onClick={() => setStatusFilter('')}
              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded cursor-pointer"
            >
              <FilterX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-[#121218] border border-[#1f1f28] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto">
          <table className="w-full text-left text-[11px] whitespace-nowrap">
            <thead className="bg-[#16161f] text-neutral-400 text-[10px] uppercase font-bold sticky top-0 z-10 border-b border-[#1f1f28]">
              <tr>
                <th className="py-2.5 px-3">Campaña</th>
                <th className="py-2.5 px-3">Teléfono N1</th>
                <th className="py-2.5 px-3">Cliente / DNI</th>
                <th className="py-2.5 px-3">Ubicación</th>
                <th className="py-2.5 px-3">Acciones de Contacto</th>
                <th className="py-2.5 px-3">Tipificación de Llamada</th>
                <th className="py-2.5 px-3">Instalación</th>
                <th className="py-2.5 px-3 text-right">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f28]/60 bg-[#0b0b0f]">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => {
                  const isDupe = duplicateN1Set.has(lead.n1.trim());

                  return (
                    <tr key={lead.id} className="hover:bg-[#14141c]">
                      {/* Campaña */}
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-white">{lead.campaña}</span>
                        <div className="text-[10px] text-neutral-500 font-mono">
                          {lead.createdAt.split('T')[0]}
                        </div>
                      </td>

                      {/* N1 */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 font-mono tabular-nums">
                          <span
                            className={`font-bold ${
                              isDupe ? 'text-red-400 bg-red-950/40 px-1 rounded' : 'text-white'
                            }`}
                          >
                            {lead.n1}
                          </span>
                          <button
                            onClick={() => copyToClipboard(lead.n1, 'Número')}
                            title="Copiar N1"
                            className="text-neutral-500 hover:text-white"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        {lead.n2 && (
                          <div className="text-[10px] text-neutral-500 font-mono">
                            Alt: {lead.n2}
                          </div>
                        )}
                      </td>

                      {/* Cliente / DNI */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-neutral-200">
                          {lead.nombreCliente || 'Sin nombre registrado'}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono">
                          {lead.dni ? `DNI: ${lead.dni}` : 'Sin DNI'}
                        </div>
                      </td>

                      {/* Ubicación */}
                      <td className="py-2.5 px-3">
                        <div className="text-neutral-200">{lead.distrito}</div>
                        <div className="text-[10px] text-neutral-500 truncate max-w-[150px]">
                          {lead.direccion || lead.provincia}
                        </div>
                      </td>

                      {/* Acciones de Contacto */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:+51${lead.n1}`}
                            title="Llamar teléfono"
                            className="px-2.5 py-1 bg-sky-950/60 hover:bg-sky-900 border border-sky-700/60 text-sky-300 rounded flex items-center gap-1 text-[10px] font-semibold transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Llamar</span>
                          </a>

                          <a
                            href={`https://wa.me/51${lead.n1}?text=Hola%20${encodeURIComponent(
                              lead.nombreCliente || 'estimado(a)'
                            )}%2C%20te%20saluda%20${encodeURIComponent(
                              currentUser?.nombreMostrar || 'tu asesor'
                            )}%20de%20WIN%20Internet%20Fibra%20%C3%93ptica.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Enviar WhatsApp"
                            className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 rounded flex items-center gap-1 text-[10px] font-semibold transition-colors"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </td>

                      {/* Tipificación Vendedor */}
                      <td className="py-2.5 px-3">
                        <select
                          value={lead.tipifVendedor || 'Pendiente'}
                          onChange={(e) =>
                            handleQuickTipify(lead.id, e.target.value as TipifVendedor)
                          }
                          className={`bg-[#121218] border rounded px-2.5 py-1 text-xs font-semibold focus:outline-none ${
                            lead.tipifVendedor === 'Venta'
                              ? 'border-emerald-600 text-emerald-400 bg-emerald-950/40'
                              : lead.tipifVendedor === 'Seguimiento'
                              ? 'border-sky-600 text-sky-400 bg-sky-950/20'
                              : lead.tipifVendedor === 'Sin cobertura'
                              ? 'border-red-600 text-red-400'
                              : 'border-[#1f1f28] text-neutral-300'
                          }`}
                        >
                          {TIPIF_VENDEDOR_LIST.map((tv) => (
                            <option key={tv} value={tv}>
                              {tv}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Instalación */}
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            lead.estadoInstalacion === 'Instalada'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                              : lead.estadoInstalacion === 'Programada'
                              ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                              : 'text-neutral-500'
                          }`}
                        >
                          {lead.estadoInstalacion || 'Pendiente'}
                        </span>
                      </td>

                      {/* Detalle */}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setEditingLead(lead)}
                          title="Abrir ficha completa y notas"
                          className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded cursor-pointer transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500 text-xs">
                    No tienes leads que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Agregar Lead a mi base */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121218] border border-[#1f1f28] rounded-xl w-full max-w-md shadow-2xl p-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-red-500" />
              Nuevo Lead para mi Base
            </h2>

            <form onSubmit={handleCreateMyLead} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                  N1 (CELULAR PERUANO - 9 DÍGITOS) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={9}
                  value={newN1}
                  onChange={(e) => setNewN1(e.target.value.replace(/\D/g, ''))}
                  placeholder="9XXXXXXXX"
                  className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                  CAMPAÑA
                </label>
                <select
                  value={newCamp}
                  onChange={(e) => setNewCamp(e.target.value)}
                  className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-3 py-2 text-white focus:outline-none"
                >
                  {CAMPAÑAS_LIST.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                  NOMBRE COMPLETO DEL CLIENTE
                </label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                    DNI
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    value={newDni}
                    onChange={(e) => setNewDni(e.target.value.replace(/\D/g, ''))}
                    placeholder="8 dígitos"
                    className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-3 py-2 text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                    DISTRITO
                  </label>
                  <select
                    value={newDistrito}
                    onChange={(e) => setNewDistrito(e.target.value)}
                    className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-2 py-2 text-white focus:outline-none"
                  >
                    {UBIGEO_PERU['Lima']['Lima'].slice(0, 15).map((dst) => (
                      <option key={dst} value={dst}>
                        {dst}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                  DIRECCIÓN DE INSTALACIÓN
                </label>
                <input
                  type="text"
                  value={newDireccion}
                  onChange={(e) => setNewDireccion(e.target.value)}
                  placeholder="Av. / Calle..."
                  className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1f1f28]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
                >
                  Guardar en mi Base
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingLead && (
        <LeadEditModal
          lead={editingLead}
          onClose={() => setEditingLead(null)}
        />
      )}
    </div>
  );
};
