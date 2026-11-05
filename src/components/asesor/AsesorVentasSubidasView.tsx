import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Plus,
  Search,
  Calendar,
  Wifi,
  Edit2,
  Clock,
  FilterX,
  FileCheck,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Lead, EstadoInstalacion } from '../../types';
import { LeadEditModal } from '../modals/LeadEditModal';
import { CAMPAÑAS_LIST } from '../../data/initialData';
import { UBIGEO_PERU } from '../../data/ubigeo';

export const AsesorVentasSubidasView: React.FC = () => {
  const { currentUser } = useAuth();
  const { leads, planes, addLead, updateLead, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstadoInstalacion, setFilterEstadoInstalacion] = useState('');
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showNewVentaModal, setShowNewVentaModal] = useState(false);

  // Form state for Subir Nueva Venta
  const [n1, setN1] = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  const [dni, setDni] = useState('');
  const [campaña, setCampaña] = useState(CAMPAÑAS_LIST[0]);
  const [distrito, setDistrito] = useState('San Juan de Lurigancho');
  const [direccion, setDireccion] = useState('');
  const [referencia, setReferencia] = useState('');
  const [planId, setPlanId] = useState(planes[1]?.id || planes[0]?.id || '');
  const [fechaInstalacion, setFechaInstalacion] = useState('');
  const [estadoInstalacion, setEstadoInstalacion] = useState<EstadoInstalacion>('Programada');

  // Filter ONLY sales made by this advisor
  const myVentas = useMemo(() => {
    if (!currentUser) return [];
    const myId = currentUser.asesorAsociadoId;
    const myName = currentUser.nombreMostrar.trim().toUpperCase();

    return leads.filter((l) => {
      const matchId = myId && l.asesorId === myId;
      const matchName = l.asesorNombre && l.asesorNombre.trim().toUpperCase() === myName;
      const isVenta = l.tipifVendedor === 'Venta' || l.tipifBack1 === 'Venta';
      return (matchId || matchName) && isVenta;
    });
  }, [leads, currentUser]);

  // Filtered by search and installation status
  const filteredVentas = useMemo(() => {
    return myVentas.filter((v) => {
      if (filterEstadoInstalacion && v.estadoInstalacion !== filterEstadoInstalacion) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchClient = v.nombreCliente?.toLowerCase().includes(q);
        const matchN1 = v.n1.includes(q);
        const matchDni = v.dni?.includes(q);
        const matchDist = v.distrito.toLowerCase().includes(q);
        if (!matchClient && !matchN1 && !matchDni && !matchDist) return false;
      }
      return true;
    });
  }, [myVentas, filterEstadoInstalacion, searchTerm]);

  // Counts
  const totalVentas = myVentas.length;
  const instaladasCount = myVentas.filter((v) => v.estadoInstalacion === 'Instalada').length;
  const programadasCount = myVentas.filter((v) => v.estadoInstalacion === 'Programada').length;
  const pendientesProgCount = myVentas.filter(
    (v) => (v.estadoInstalacion || 'Pendiente de programar') === 'Pendiente de programar'
  ).length;

  const handleSubirVentaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanN1 = n1.trim().replace(/\D/g, '');
    if (cleanN1.length !== 9 || !cleanN1.startsWith('9')) {
      showToast('N1 debe ser celular peruano válido de 9 dígitos que inicie con 9', 'error');
      return;
    }

    if (!nombreCliente.trim()) {
      showToast('Ingresa el nombre del cliente', 'error');
      return;
    }

    const created = addLead({
      campaña,
      n1: cleanN1,
      nombreCliente: nombreCliente.trim(),
      dni: dni.trim() || undefined,
      departamento: 'Lima',
      provincia: 'Lima',
      distrito,
      direccion: direccion.trim() || undefined,
      referencia: referencia.trim() || undefined,
      planId,
      cobertura: 'Con cobertura',
      tipifBack1: 'Venta',
      tipifVendedor: 'Venta',
      estadoInstalacion,
      fechaInstalacion: fechaInstalacion || undefined,
      asesorId: currentUser?.asesorAsociadoId || currentUser?.id,
      asesorNombre: currentUser?.nombreMostrar,
      sala: currentUser?.sala || 'SALA 1'
    });

    setShowNewVentaModal(false);
    setN1('');
    setNombreCliente('');
    setDni('');
    setDireccion('');
    setReferencia('');
    setFechaInstalacion('');
    showToast(`¡Venta de fibra óptica registrada con éxito para ${created.nombreCliente}!`, 'success');
  };

  const handleUpdateEstadoInstalacion = (leadId: string, nuevoEstado: EstadoInstalacion) => {
    updateLead(leadId, { estadoInstalacion: nuevoEstado });
    showToast(`Estado de instalación actualizado a ${nuevoEstado}`, 'info');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Mis Ventas Subidas
            </h1>
            <span className="text-[10px] bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 font-bold px-2 py-0.5 rounded uppercase">
              {currentUser?.sala || 'SALA'}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Registro, programación y seguimiento de tus contratos de fibra óptica cerrados.
          </p>
        </div>

        <button
          onClick={() => setShowNewVentaModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-lg shadow-emerald-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>+ Subir / Registrar Venta</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-3">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
            TOTAL VENTAS SUBIDAS
          </span>
          <span className="text-xl font-bold font-mono text-white">{totalVentas}</span>
        </div>

        <div className="bg-[#121218] border border-emerald-900/40 rounded-xl p-3">
          <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">
            INSTALADAS (CONCRETADAS)
          </span>
          <span className="text-xl font-bold font-mono text-emerald-400">{instaladasCount}</span>
        </div>

        <div className="bg-[#121218] border border-amber-900/40 rounded-xl p-3">
          <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">
            PROGRAMADAS
          </span>
          <span className="text-xl font-bold font-mono text-amber-400">{programadasCount}</span>
        </div>

        <div className="bg-[#121218] border border-sky-900/40 rounded-xl p-3">
          <span className="text-[10px] uppercase font-bold text-sky-400 block mb-1">
            PENDIENTE PROGRAMAR
          </span>
          <span className="text-xl font-bold font-mono text-sky-400">{pendientesProgCount}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative min-w-[260px] flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar venta por cliente, DNI, teléfono o distrito..."
            className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-neutral-400">ESTADO INSTALACIÓN:</span>
          <select
            value={filterEstadoInstalacion}
            onChange={(e) => setFilterEstadoInstalacion(e.target.value)}
            className="bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="">Todos los estados</option>
            <option value="Instalada">Instalada</option>
            <option value="Programada">Programada</option>
            <option value="Pendiente de programar">Pendiente de programar</option>
            <option value="Cancelada">Cancelada</option>
          </select>

          {filterEstadoInstalacion && (
            <button
              onClick={() => setFilterEstadoInstalacion('')}
              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded cursor-pointer"
            >
              <FilterX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Ventas Table */}
      <div className="bg-[#121218] border border-[#1f1f28] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto">
          <table className="w-full text-left text-[11px] whitespace-nowrap">
            <thead className="bg-[#16161f] text-neutral-400 text-[10px] uppercase font-bold sticky top-0 z-10 border-b border-[#1f1f28]">
              <tr>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3">DNI / Celular</th>
                <th className="py-2.5 px-3">Plan WIN Vendido</th>
                <th className="py-2.5 px-3">Dirección / Distrito</th>
                <th className="py-2.5 px-3">Estado Instalación</th>
                <th className="py-2.5 px-3">Fecha Instalación</th>
                <th className="py-2.5 px-3 text-right">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f28]/60 bg-[#0b0b0f]">
              {filteredVentas.length > 0 ? (
                filteredVentas.map((venta) => {
                  const plan = planes.find((p) => p.id === venta.planId);

                  return (
                    <tr key={venta.id} className="hover:bg-[#14141c]">
                      {/* Cliente */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white text-xs">
                          {venta.nombreCliente || 'Cliente no registrado'}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          Campaña: {venta.campaña}
                        </div>
                      </td>

                      {/* DNI / Celular */}
                      <td className="py-2.5 px-3 font-mono tabular-nums">
                        <div className="font-bold text-neutral-200">{venta.n1}</div>
                        <div className="text-[10px] text-neutral-500">
                          {venta.dni ? `DNI: ${venta.dni}` : 'Sin DNI'}
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-emerald-400">
                          {plan?.nombre || 'WIN Fibra 200 Mbps'}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          S/ {plan?.precio.toFixed(2) || '89.00'} / mes
                        </div>
                      </td>

                      {/* Dirección / Distrito */}
                      <td className="py-2.5 px-3">
                        <div className="text-neutral-200">{venta.distrito}</div>
                        <div className="text-[10px] text-neutral-500 max-w-[160px] truncate">
                          {venta.direccion || 'Sin dirección registrada'}
                        </div>
                      </td>

                      {/* Estado Instalación */}
                      <td className="py-2.5 px-3">
                        <select
                          value={venta.estadoInstalacion || 'Pendiente de programar'}
                          onChange={(e) =>
                            handleUpdateEstadoInstalacion(
                              venta.id,
                              e.target.value as EstadoInstalacion
                            )
                          }
                          className={`bg-[#121218] border rounded px-2 py-1 text-xs font-semibold focus:outline-none ${
                            venta.estadoInstalacion === 'Instalada'
                              ? 'border-emerald-600 text-emerald-400 bg-emerald-950/40'
                              : venta.estadoInstalacion === 'Programada'
                              ? 'border-amber-600 text-amber-400 bg-amber-950/30'
                              : venta.estadoInstalacion === 'Cancelada'
                              ? 'border-red-600 text-red-400'
                              : 'border-[#1f1f28] text-sky-400'
                          }`}
                        >
                          <option value="Pendiente de programar">Pendiente de programar</option>
                          <option value="Programada">Programada</option>
                          <option value="Instalada">Instalada</option>
                          <option value="Cancelada">Cancelada</option>
                        </select>
                      </td>

                      {/* Fecha Instalación */}
                      <td className="py-2.5 px-3 font-mono text-xs text-neutral-300">
                        {venta.fechaInstalacion ? (
                          <span className="flex items-center gap-1.5 text-emerald-400">
                            <Calendar className="w-3.5 h-3.5" />
                            {venta.fechaInstalacion}
                          </span>
                        ) : (
                          <span className="text-neutral-500 italic text-[10px]">Por definir</span>
                        )}
                      </td>

                      {/* Ficha */}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setEditingLead(venta)}
                          className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded cursor-pointer transition-colors"
                          title="Editar detalles de la venta"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500 text-xs">
                    No tienes ventas subidas con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Subir / Registrar Nueva Venta */}
      {showNewVentaModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121218] border border-[#1f1f28] rounded-xl w-full max-w-lg shadow-2xl p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              Subir / Registrar Venta de Fibra Óptica
            </h2>

            <form onSubmit={handleSubirVentaSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                    N1 (CELULAR) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={9}
                    value={n1}
                    onChange={(e) => setN1(e.target.value.replace(/\D/g, ''))}
                    placeholder="9XXXXXXXX"
                    className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                    DNI DEL CLIENTE (8 DÍGITOS)
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    value={dni}
                    onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                    placeholder="8 dígitos"
                    className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                  NOMBRE COMPLETO DEL CLIENTE *
                </label>
                <input
                  type="text"
                  required
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                  placeholder="Nombre y Apellidos del titular"
                  className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                    PLAN WIN VENDIDO
                  </label>
                  <select
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                    className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-3 py-2 text-white focus:outline-none"
                  >
                    {planes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} (S/ {p.precio.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                    DISTRITO
                  </label>
                  <select
                    value={distrito}
                    onChange={(e) => setDistrito(e.target.value)}
                    className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-3 py-2 text-white focus:outline-none truncate"
                  >
                    {UBIGEO_PERU['Lima']['Lima'].map((dst) => (
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
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Av. / Calle / Jr. / Mz. Lt. / Dpto"
                  className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                  REFERENCIA DE UBICACIÓN
                </label>
                <input
                  type="text"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="Frente a parque, altura de paradero..."
                  className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                    ESTADO DE INSTALACIÓN
                  </label>
                  <select
                    value={estadoInstalacion}
                    onChange={(e) => setEstadoInstalacion(e.target.value as EstadoInstalacion)}
                    className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="Programada">Programada</option>
                    <option value="Pendiente de programar">Pendiente de programar</option>
                    <option value="Instalada">Instalada</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                    FECHA PROGRAMADA
                  </label>
                  <input
                    type="date"
                    value={fechaInstalacion}
                    onChange={(e) => setFechaInstalacion(e.target.value)}
                    className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1f1f28]">
                <button
                  type="button"
                  onClick={() => setShowNewVentaModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
                >
                  Guardar y Subir Venta
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
