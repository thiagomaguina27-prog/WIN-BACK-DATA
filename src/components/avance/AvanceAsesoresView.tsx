import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Phone,
  MessageCircle,
  ExternalLink,
  ChevronLeft,
  CheckCircle,
  Clock,
  Edit2,
  Calendar,
  Wifi,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Asesor, Lead, TipifVendedor } from '../../types';
import { TIPIF_VENDEDOR_LIST } from '../../data/initialData';
import { LeadEditModal } from '../modals/LeadEditModal';

export const AvanceAsesoresView: React.FC = () => {
  const { currentUser } = useAuth();
  const { asesores, leads, updateLead, showToast } = useApp();

  // If user is Supervisor assigned to a specific room, restrict them strictly to that room
  const isSupervisorWithSpecificSala =
    currentUser?.rol === 'Supervisor' &&
    currentUser?.sala &&
    currentUser.sala !== 'TODAS' &&
    currentUser.sala !== 'TODAS LAS SALAS';

  const supervisorSala = isSupervisorWithSpecificSala ? currentUser.sala : null;

  // Search & filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSala, setSelectedSala] = useState(supervisorSala || '');

  // Selected advisor for call sheet modal / view
  const [activeAsesor, setActiveAsesor] = useState<Asesor | null>(null);
  const [callSheetSearch, setCallSheetSearch] = useState('');
  const [callSheetTipifFilter, setCallSheetTipifFilter] = useState('');

  // Lead currently open in full detail modal
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Salas list
  const salasUnicas = useMemo(() => {
    return Array.from(new Set(asesores.map((a) => a.sala))).sort();
  }, [asesores]);

  // Advisor metrics map
  const advisorMetrics = useMemo(() => {
    const map = new Map<string, { total: number; ventas: number; pendientes: number; seguimiento: number }>();
    for (const a of asesores) {
      map.set(a.id, { total: 0, ventas: 0, pendientes: 0, seguimiento: 0 });
    }

    for (const l of leads) {
      if (l.asesorId && map.has(l.asesorId)) {
        const item = map.get(l.asesorId)!;
        item.total++;
        if (l.tipifVendedor === 'Venta') item.ventas++;
        else if (l.tipifVendedor === 'Pendiente') item.pendientes++;
        else if (l.tipifVendedor === 'Seguimiento') item.seguimiento++;
      }
    }
    return map;
  }, [asesores, leads]);

  // Filtered advisors for grid
  const filteredAsesores = useMemo(() => {
    return asesores.filter((a) => {
      // If supervisor is restricted to a room, enforce strictly
      if (supervisorSala) {
        if (a.sala !== supervisorSala) return false;
      } else if (selectedSala && a.sala !== selectedSala) {
        return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchName = a.nombreCompleto.toLowerCase().includes(q);
        const matchUser = a.usuario.toLowerCase().includes(q);
        const matchSala = a.sala.toLowerCase().includes(q);
        if (!matchName && !matchUser && !matchSala) return false;
      }
      return true;
    });
  }, [asesores, selectedSala, supervisorSala, searchTerm]);

  // Leads for the currently opened advisor call sheet
  const activeAsesorLeads = useMemo(() => {
    if (!activeAsesor) return [];
    return leads
      .filter((l) => l.asesorId === activeAsesor.id)
      .filter((l) => {
        if (callSheetTipifFilter && l.tipifVendedor !== callSheetTipifFilter) return false;
        if (callSheetSearch.trim()) {
          const q = callSheetSearch.toLowerCase().trim();
          const matchN1 = l.n1.includes(q);
          const matchClient = l.nombreCliente?.toLowerCase().includes(q);
          const matchCamp = l.campaña.toLowerCase().includes(q);
          const matchDist = l.distrito.toLowerCase().includes(q);
          if (!matchN1 && !matchClient && !matchCamp && !matchDist) return false;
        }
        return true;
      });
  }, [leads, activeAsesor, callSheetTipifFilter, callSheetSearch]);

  const handleQuickTipify = (leadId: string, tipif: TipifVendedor) => {
    updateLead(leadId, { tipifVendedor: tipif });
    showToast(`Lead tipificado como ${tipif}`, 'info');
  };

  return (
    <div className="space-y-4">
      {/* If an advisor is selected, show their CALL SHEET (Base de llamadas) */}
      {activeAsesor ? (
        <div className="space-y-4">
          {/* Call Sheet Top Bar */}
          <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveAsesor(null)}
                className="p-2 bg-[#16161f] hover:bg-[#1f1f28] border border-[#2a2a38] text-neutral-300 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 text-xs font-semibold"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Volver a Asesores</span>
              </button>

              <div className="flex items-center gap-2.5 pl-2 border-l border-[#1f1f28]">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-inner"
                  style={{ backgroundColor: activeAsesor.color }}
                >
                  {activeAsesor.nombreCompleto
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      {activeAsesor.nombreCompleto}
                    </h2>
                    <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded font-mono">
                      {activeAsesor.sala}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Base de llamadas personal · @{activeAsesor.usuario}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick metrics inside call sheet */}
            {(() => {
              const m = advisorMetrics.get(activeAsesor.id) || { total: 0, ventas: 0, pendientes: 0, seguimiento: 0 };
              return (
                <div className="flex items-center gap-2 text-xs">
                  <div className="px-3 py-1 bg-[#0b0b0f] border border-[#1f1f28] rounded-lg">
                    <span className="text-neutral-400 text-[10px]">TOTAL: </span>
                    <strong className="text-white font-mono">{m.total}</strong>
                  </div>
                  <div className="px-3 py-1 bg-[#0b0b0f] border border-emerald-900/50 rounded-lg">
                    <span className="text-emerald-400 text-[10px]">VENTAS: </span>
                    <strong className="text-emerald-400 font-mono">{m.ventas}</strong>
                  </div>
                  <div className="px-3 py-1 bg-[#0b0b0f] border border-sky-900/50 rounded-lg">
                    <span className="text-sky-400 text-[10px]">SEGUIMIENTO: </span>
                    <strong className="text-sky-400 font-mono">{m.seguimiento}</strong>
                  </div>
                  <div className="px-3 py-1 bg-[#0b0b0f] border border-amber-900/50 rounded-lg">
                    <span className="text-amber-400 text-[10px]">PENDIENTES: </span>
                    <strong className="text-amber-400 font-mono">{m.pendientes}</strong>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Call Sheet Filters Bar */}
          <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-[240px]">
              <Search className="w-4 h-4 text-neutral-500" />
              <input
                type="text"
                value={callSheetSearch}
                onChange={(e) => setCallSheetSearch(e.target.value)}
                placeholder="Buscar por cliente, N1, distrito..."
                className="bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-600 flex-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-neutral-400">FILTRAR ESTADO:</span>
              <select
                value={callSheetTipifFilter}
                onChange={(e) => setCallSheetTipifFilter(e.target.value)}
                className="bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="">Todos los estados</option>
                {TIPIF_VENDEDOR_LIST.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Call Sheet Leads Table */}
          <div className="bg-[#121218] border border-[#1f1f28] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto max-h-[calc(100vh-260px)] overflow-y-auto">
              <table className="w-full text-left text-[11px] whitespace-nowrap">
                <thead className="bg-[#16161f] text-neutral-400 text-[10px] uppercase font-bold sticky top-0 z-10 border-b border-[#1f1f28]">
                  <tr>
                    <th className="py-2.5 px-3">Campaña</th>
                    <th className="py-2.5 px-3">Cliente / DNI</th>
                    <th className="py-2.5 px-3">Teléfono (N1)</th>
                    <th className="py-2.5 px-3">Ubicación</th>
                    <th className="py-2.5 px-3">Llamar / WhatsApp</th>
                    <th className="py-2.5 px-3">Tipificación Rápida</th>
                    <th className="py-2.5 px-3">Instalación</th>
                    <th className="py-2.5 px-3 text-right">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f1f28]/60 bg-[#0b0b0f]">
                  {activeAsesorLeads.length > 0 ? (
                    activeAsesorLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-[#14141c]">
                        {/* Campaña */}
                        <td className="py-2 px-3">
                          <span className="font-bold text-white">{lead.campaña}</span>
                          <div className="text-[10px] text-neutral-500 font-mono">
                            {lead.createdAt.split('T')[0]}
                          </div>
                        </td>

                        {/* Cliente / DNI */}
                        <td className="py-2 px-3">
                          <div className="font-semibold text-neutral-200">
                            {lead.nombreCliente || 'Sin nombre registrado'}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono">
                            {lead.dni ? `DNI: ${lead.dni}` : 'Sin DNI'}
                          </div>
                        </td>

                        {/* N1 */}
                        <td className="py-2 px-3 font-mono tabular-nums font-bold text-white">
                          {lead.n1}
                        </td>

                        {/* Ubicación */}
                        <td className="py-2 px-3 text-neutral-300">
                          <div>{lead.distrito}</div>
                          <div className="text-[10px] text-neutral-500 truncate max-w-[140px]">
                            {lead.direccion || lead.provincia}
                          </div>
                        </td>

                        {/* Contact Buttons */}
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:+51${lead.n1}`}
                              title="Llamar directamente"
                              className="px-2.5 py-1 bg-sky-950/50 hover:bg-sky-900 border border-sky-700/50 text-sky-300 rounded flex items-center gap-1 text-[10px] font-semibold transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Llamar</span>
                            </a>
                            <a
                              href={`https://wa.me/51${lead.n1}?text=Hola%20${encodeURIComponent(
                                lead.nombreCliente || 'estimado(a)'
                              )}%2C%20te%20contacto%20de%20WIN%20Internet%20Hogar.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Contactar por WhatsApp Web"
                              className="px-2.5 py-1 bg-emerald-950/50 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 rounded flex items-center gap-1 text-[10px] font-semibold transition-colors"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </td>

                        {/* Tipificación Rápida */}
                        <td className="py-2 px-3">
                          <select
                            value={lead.tipifVendedor || 'Pendiente'}
                            onChange={(e) =>
                              handleQuickTipify(lead.id, e.target.value as TipifVendedor)
                            }
                            className={`bg-[#121218] border rounded px-2 py-1 text-xs font-semibold focus:outline-none ${
                              lead.tipifVendedor === 'Venta'
                                ? 'border-emerald-600 text-emerald-400 bg-emerald-950/40'
                                : lead.tipifVendedor === 'Seguimiento'
                                ? 'border-sky-600 text-sky-400 bg-sky-950/20'
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
                        <td className="py-2 px-3">
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

                        {/* Open Modal Detail */}
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => setEditingLead(lead)}
                            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded cursor-pointer transition-colors"
                            title="Editar ficha completa y notas"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-neutral-500 text-xs">
                        No hay leads asignados para este asesor con los filtros actuales.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Advisors 5-Column Grid */
        <div className="space-y-4">
          {/* Header */}
          <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div>
              <h1 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-400" />
                {supervisorSala ? `Avance de Asesores · ${supervisorSala}` : 'Avance de Asesores'}
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                {supervisorSala
                  ? `Monitoreo de asesores asignados a tu ${supervisorSala} — abre la base de llamadas de cada uno`
                  : 'Todos los asesores de todas las salas — abre la base de llamadas de cada uno'}
              </p>
            </div>

            {/* Filter by Sala & Search Input */}
            <div className="flex flex-wrap items-center gap-2.5">
              {supervisorSala ? (
                <div className="px-3 py-1.5 bg-sky-950/60 border border-sky-700/60 rounded-lg text-xs font-bold text-sky-300">
                  {supervisorSala}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-2.5 py-1.5 text-xs">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">SALA:</span>
                  <select
                    value={selectedSala}
                    onChange={(e) => setSelectedSala(e.target.value)}
                    className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="" className="bg-[#121218]">Todas las salas</option>
                    {salasUnicas.map((s) => (
                      <option key={s} value={s} className="bg-[#121218]">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Buscador "Buscar asesor..." */}
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar asesor..."
                  className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-600"
                />
              </div>
            </div>
          </div>

          {/* 5-Column Grid with Advisor Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
            {filteredAsesores.map((asesor) => {
              const m = advisorMetrics.get(asesor.id) || { total: 0, ventas: 0, pendientes: 0, seguimiento: 0 };
              const conversion = m.total > 0 ? ((m.ventas / m.total) * 100).toFixed(0) : '0';

              return (
                <div
                  key={asesor.id}
                  className="bg-[#121218] border border-[#1f1f28] hover:border-[#2f2f42] rounded-xl p-3.5 flex flex-col justify-between transition-all hover:shadow-lg shadow-sm group"
                >
                  <div>
                    {/* Top Row: Colored Avatar with Initials */}
                    <div className="flex items-center gap-3 mb-2.5">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-inner shrink-0"
                        style={{ backgroundColor: asesor.color }}
                      >
                        {asesor.nombreCompleto
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>

                      <div className="overflow-hidden">
                        {/* Nombre en mayúsculas */}
                        <h2 className="text-xs font-bold text-white uppercase tracking-tight truncate group-hover:text-red-400 transition-colors">
                          {asesor.nombreCompleto}
                        </h2>
                        {/* @usuario · SALA N */}
                        <p className="text-[10px] text-neutral-400 font-medium truncate">
                          @{asesor.usuario} · <span className="font-bold text-neutral-300">{asesor.sala}</span>
                        </p>
                      </div>
                    </div>

                    {/* Mini metrics bar */}
                    <div className="grid grid-cols-3 gap-1 py-2 px-1 bg-[#0b0b0f] rounded-lg border border-[#1f1f28]/70 mb-3 text-center">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-neutral-400 block">
                          LEADS
                        </span>
                        <span className="text-xs font-bold font-mono text-white">
                          {m.total}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-emerald-400 block">
                          VENTAS
                        </span>
                        <span className="text-xs font-bold font-mono text-emerald-400">
                          {m.ventas}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-sky-400 block">
                          CONV %
                        </span>
                        <span className="text-xs font-bold font-mono text-sky-400">
                          {conversion}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botón azul "Ver base de llamadas" */}
                  <button
                    onClick={() => setActiveAsesor(asesor)}
                    className="w-full py-2 px-3 bg-sky-700 hover:bg-sky-600 active:bg-sky-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Ver base de llamadas</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail Edit Modal */}
      {editingLead && (
        <LeadEditModal
          lead={editingLead}
          onClose={() => setEditingLead(null)}
        />
      )}
    </div>
  );
};
