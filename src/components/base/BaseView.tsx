import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  FilterX,
  CheckCircle2,
  Copy,
  Edit2,
  RefreshCw,
  MoreVertical,
  Trash2,
  Phone,
  UserCheck,
  Eye,
  SlidersHorizontal,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import { Lead, TipifBack, TipifVendedor } from '../../types';
import { TIPIF_BACK_LIST, TIPIF_VENDEDOR_LIST } from '../../data/initialData';
import { LeadEditModal } from '../modals/LeadEditModal';
import { RotateSingleModal } from '../modals/RotateSingleModal';

export const BaseView: React.FC = () => {
  const {
    leads,
    asesores,
    updateLead,
    deleteLead,
    duplicateN1Set,
    availableDates,
    activeDateIndex,
    setActiveDateIndex,
    showToast
  } = useApp();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDesde, setFilterDesde] = useState('');
  const [filterHasta, setFilterHasta] = useState('');
  const [buscarGlobal, setBuscarGlobal] = useState(false);
  const [soloDuplicados, setSoloDuplicados] = useState(false);
  const [ordenDiarioActivo, setOrdenDiarioActivo] = useState(true);

  // Sorting
  const [sortField, setSortField] = useState<keyof Lead>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);

  // Modals state
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [rotatingLead, setRotatingLead] = useState<Lead | null>(null);
  const [actionsMenuLeadId, setActionsMenuLeadId] = useState<string | null>(null);

  // Current active date string
  const currentDateStr = availableDates[activeDateIndex] || '2026-09-24';

  // Navigation handlers
  const handlePrevDay = () => {
    if (activeDateIndex < availableDates.length - 1) {
      setActiveDateIndex(activeDateIndex + 1);
    }
  };

  const handleNextDay = () => {
    if (activeDateIndex > 0) {
      setActiveDateIndex(activeDateIndex - 1);
    }
  };

  // Count leads on active day
  const activeDayCount = useMemo(() => {
    return leads.filter((l) => l.createdAt?.startsWith(currentDateStr)).length;
  }, [leads, currentDateStr]);

  // Clean filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterDesde('');
    setFilterHasta('');
    setBuscarGlobal(false);
    setSoloDuplicados(false);
  };

  // Filter pipeline
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Date filter (unless Buscar Global is enabled or range is set)
      if (!buscarGlobal) {
        if (filterDesde || filterHasta) {
          const leadDate = lead.createdAt.split('T')[0];
          if (filterDesde && leadDate < filterDesde) return false;
          if (filterHasta && leadDate > filterHasta) return false;
        } else {
          // Fall back to active single day
          if (!lead.createdAt?.startsWith(currentDateStr)) {
            return false;
          }
        }
      }

      // Duplicates filter
      if (soloDuplicados && !duplicateN1Set.has(lead.n1.trim())) {
        return false;
      }

      // Search term filter (N1, N2, Usuario Whatsapp, Nombre, DNI)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const n1Match = lead.n1.toLowerCase().includes(query);
        const n2Match = lead.n2 ? lead.n2.toLowerCase().includes(query) : false;
        const wsMatch = lead.usuarioWhatsapp ? lead.usuarioWhatsapp.toLowerCase().includes(query) : false;
        const nameMatch = lead.nombreCliente ? lead.nombreCliente.toLowerCase().includes(query) : false;
        const dniMatch = lead.dni ? lead.dni.toLowerCase().includes(query) : false;
        const campMatch = lead.campaña.toLowerCase().includes(query);

        if (!n1Match && !n2Match && !wsMatch && !nameMatch && !dniMatch && !campMatch) {
          return false;
        }
      }

      return true;
    });
  }, [leads, currentDateStr, buscarGlobal, filterDesde, filterHasta, soloDuplicados, searchTerm, duplicateN1Set]);

  // Sort pipeline
  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      if (ordenDiarioActivo) {
        // Priority: Unassigned first, then by createdAt desc
        if (!a.asesorId && b.asesorId) return -1;
        if (a.asesorId && !b.asesorId) return 1;
      }

      const valA = a[sortField];
      const valB = b[sortField];

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortAsc ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredLeads, sortField, sortAsc, ordenDiarioActivo]);

  const handleSort = (field: keyof Lead) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copiado al portapapeles`, 'info');
  };

  const handleInlineAdvisorChange = (leadId: string, newAdvisorId: string) => {
    updateLead(leadId, { asesorId: newAdvisorId || undefined });
  };

  const handleInlineTipifBackChange = (leadId: string, field: 'tipifBack1' | 'tipifBack2', val: string) => {
    updateLead(leadId, { [field]: val ? (val as TipifBack) : undefined });
  };

  const handleInlineTipifVendedorChange = (leadId: string, val: string) => {
    updateLead(leadId, { tipifVendedor: val as TipifVendedor });
  };

  const exportCurrentViewToExcel = () => {
    const dataToExport = sortedLeads.map((l, index) => ({
      '#': index + 1,
      Campaña: l.campaña,
      N1: l.n1,
      N2: l.n2 || '',
      'Usuario WhatsApp': l.usuarioWhatsapp || '',
      Departamento: l.departamento,
      Provincia: l.provincia,
      Distrito: l.distrito,
      Cliente: l.nombreCliente || '',
      DNI: l.dni || '',
      'Tipif Back 1': l.tipifBack1 || '',
      'Tipif Back 2': l.tipifBack2 || '',
      'Asesor Asignado': l.asesorNombre || 'Sin asignar',
      Sala: l.sala || '',
      'Tipif Vendedor': l.tipifVendedor || 'Pendiente',
      Rotaciones: l.rotaciones,
      'Fecha Asignación': l.fechaHoraAsignacion || '',
      'Fecha Creación': l.createdAt
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Base WIN');
    XLSX.writeFile(wb, `WIN_BACK_DATA_${currentDateStr}.xlsx`);
    showToast('Base exportada a Excel', 'success');
  };

  // Format date display (DD/MM/YYYY)
  const formattedDate = useMemo(() => {
    const parts = currentDateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return currentDateStr;
  }, [currentDateStr]);

  return (
    <div className="space-y-3">
      {/* Top Filter Bar */}
      <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        {/* Left: Date navigation + Day page badge */}
        <div className="flex items-center gap-2">
          {/* Active Date with arrows */}
          <div className="flex items-center bg-[#0b0b0f] border border-[#1f1f28] rounded-lg p-0.5">
            <button
              onClick={handlePrevDay}
              disabled={activeDateIndex >= availableDates.length - 1 || buscarGlobal}
              title="Día anterior"
              className="p-1.5 hover:bg-[#1a1a24] disabled:opacity-30 disabled:hover:bg-transparent text-neutral-300 rounded cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2.5 py-1 text-xs font-bold font-mono tabular-nums text-white min-w-[130px] text-center">
              {formattedDate} ({activeDayCount})
            </span>

            <button
              onClick={handleNextDay}
              disabled={activeDateIndex <= 0 || buscarGlobal}
              title="Día siguiente"
              className="p-1.5 hover:bg-[#1a1a24] disabled:opacity-30 disabled:hover:bg-transparent text-neutral-300 rounded cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Badge de página de días "1/56" */}
          <div className="px-2.5 py-1 bg-[#1a1a24] border border-[#262635] rounded-md text-[11px] font-mono tabular-nums font-semibold text-neutral-300">
            {activeDateIndex + 1}/{availableDates.length}
          </div>

          {/* Buscador por N1/N2/WhatsApp */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar N1, N2, @whatsapp..."
              className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-600"
            />
          </div>
        </div>

        {/* Center: Rango DESDE / HASTA */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-2 py-1 text-xs">
            <span className="text-[10px] uppercase font-bold text-neutral-400">DESDE</span>
            <input
              type="date"
              value={filterDesde}
              onChange={(e) => setFilterDesde(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-2 py-1 text-xs">
            <span className="text-[10px] uppercase font-bold text-neutral-400">HASTA</span>
            <input
              type="date"
              value={filterHasta}
              onChange={(e) => setFilterHasta(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Right: Checkboxes + Action buttons */}
        <div className="flex items-center gap-3">
          {/* Checkbox "Buscar global" */}
          <label className="flex items-center gap-1.5 cursor-pointer text-xs select-none">
            <input
              type="checkbox"
              checked={buscarGlobal}
              onChange={(e) => setBuscarGlobal(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-[#0b0b0f] border-[#1f1f28] text-red-600 accent-red-600 cursor-pointer"
            />
            <span className={buscarGlobal ? 'text-red-400 font-semibold' : 'text-neutral-300'}>
              Buscar global
            </span>
          </label>

          {/* Checkbox "Números duplicados" */}
          <label className="flex items-center gap-1.5 cursor-pointer text-xs select-none">
            <input
              type="checkbox"
              checked={soloDuplicados}
              onChange={(e) => setSoloDuplicados(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-[#0b0b0f] border-[#1f1f28] text-red-600 accent-red-600 cursor-pointer"
            />
            <span className={soloDuplicados ? 'text-red-400 font-semibold' : 'text-neutral-300'}>
              Números duplicados
            </span>
          </label>

          {/* Botón Limpiar filtros */}
          <button
            onClick={handleClearFilters}
            title="Limpiar filtros"
            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs cursor-pointer transition-colors"
          >
            <FilterX className="w-3.5 h-3.5" />
          </button>

          {/* Botón verde "✓ Orden diario activo" */}
          <button
            onClick={() => setOrdenDiarioActivo(!ordenDiarioActivo)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              ordenDiarioActivo
                ? 'bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-600/30'
                : 'bg-neutral-800 border border-neutral-700 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>✓ Orden diario activo</span>
          </button>

          {/* Export to Excel */}
          <button
            onClick={exportCurrentViewToExcel}
            title="Exportar vista a Excel"
            className="p-1.5 bg-[#16161f] hover:bg-[#1f1f28] border border-[#262635] text-neutral-300 rounded-lg text-xs cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Table with sticky header */}
      <div className="bg-[#121218] border border-[#1f1f28] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto max-h-[calc(100vh-220px)] overflow-y-auto">
          <table className="w-full text-left border-collapse text-[11px] whitespace-nowrap">
            {/* Table Sticky Header */}
            <thead className="bg-[#16161f] text-neutral-400 uppercase tracking-wider font-bold text-[10px] sticky top-0 z-20 border-b border-[#1f1f28]">
              <tr>
                <th className="py-2.5 px-2.5 w-10 text-center">#</th>
                <th
                  onClick={() => handleSort('campaña')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  Campaña
                </th>
                <th
                  onClick={() => handleSort('n1')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  N1 / N2
                </th>
                <th className="py-2.5 px-3">Tipif. Back 1</th>
                <th className="py-2.5 px-3">Tipif. Back 2</th>
                <th
                  onClick={() => handleSort('asesorNombre')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  Asesor asignado
                </th>
                <th
                  onClick={() => handleSort('tipifVendedor')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  Tipif. Vendedor
                </th>
                <th className="py-2.5 px-2.5">Sala</th>
                <th
                  onClick={() => handleSort('fechaHoraAsignacion')}
                  className="py-2.5 px-2.5 cursor-pointer hover:text-white transition-colors"
                >
                  Fecha/hora
                </th>
                <th
                  onClick={() => handleSort('rotaciones')}
                  className="py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors"
                >
                  Rots.
                </th>
                <th className="py-2.5 px-3 text-right">Acciones</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-[#1f1f28]/60 font-medium">
              {sortedLeads.length > 0 ? (
                sortedLeads.map((lead, idx) => {
                  const isDupe = duplicateN1Set.has(lead.n1.trim());
                  const isAssigned = Boolean(lead.asesorId);

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-[#171720] transition-colors group select-text"
                    >
                      {/* # Index */}
                      <td className="py-2 px-2.5 text-center text-neutral-400 font-mono tabular-nums text-[10px]">
                        {idx + 1}
                      </td>

                      {/* Campaña */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white tracking-wide">
                            {lead.campaña}
                          </span>
                          <button
                            onClick={() => copyToClipboard(lead.campaña, 'Campaña')}
                            title="Copiar campaña"
                            className="text-neutral-400 hover:text-neutral-200 cursor-pointer"
                          >
                            <Copy className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </td>

                      {/* N1 / N2 */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5 font-mono tabular-nums">
                          <span
                            className={`font-semibold ${
                              isDupe ? 'text-red-400 bg-red-950/40 px-1 py-0.5 rounded' : 'text-neutral-200'
                            }`}
                          >
                            {lead.n1}
                          </span>
                          <button
                            onClick={() => copyToClipboard(lead.n1, 'N1')}
                            title="Copiar N1"
                            className="text-neutral-400 hover:text-neutral-200 cursor-pointer"
                          >
                            <Copy className="w-2.5 h-2.5" />
                          </button>
                          {lead.n2 && (
                            <span className="text-[10px] text-neutral-300">/ {lead.n2}</span>
                          )}
                        </div>
                        {lead.usuarioWhatsapp && (
                          <div className="text-[10px] text-neutral-400 tracking-tight">
                            {lead.usuarioWhatsapp}
                          </div>
                        )}
                      </td>

                      {/* Tipif Back 1 */}
                      <td className="py-2 px-3">
                        <select
                          value={lead.tipifBack1 || ''}
                          onChange={(e) =>
                            handleInlineTipifBackChange(lead.id, 'tipifBack1', e.target.value)
                          }
                          className="bg-[#0b0b0f] border border-[#1f1f28] rounded px-2 py-1 text-[11px] text-neutral-200 focus:outline-none focus:border-red-600 max-w-[140px] truncate"
                        >
                          <option value="">(Sin tipificar)</option>
                          {TIPIF_BACK_LIST.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Tipif Back 2 */}
                      <td className="py-2 px-3">
                        <select
                          value={lead.tipifBack2 || ''}
                          onChange={(e) =>
                            handleInlineTipifBackChange(lead.id, 'tipifBack2', e.target.value)
                          }
                          className="bg-[#0b0b0f] border border-[#1f1f28] rounded px-2 py-1 text-[11px] text-neutral-200 focus:outline-none focus:border-red-600 max-w-[140px] truncate"
                        >
                          <option value="">-</option>
                          {TIPIF_BACK_LIST.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Asesor Asignado (autocompleta sala y fecha/hora) */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          <select
                            value={lead.asesorId || ''}
                            onChange={(e) => handleInlineAdvisorChange(lead.id, e.target.value)}
                            className={`bg-[#0b0b0f] border rounded px-2 py-1 text-[11px] font-semibold max-w-[160px] truncate focus:outline-none ${
                              isAssigned
                                ? 'border-[#1f1f28] text-sky-400'
                                : 'border-red-800/60 text-red-400 bg-red-950/20'
                            }`}
                          >
                            <option value="">sin asig.</option>
                            {asesores.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.nombreCompleto}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Tipif Vendedor */}
                      <td className="py-2 px-3">
                        <select
                          value={lead.tipifVendedor || 'Pendiente'}
                          onChange={(e) => handleInlineTipifVendedorChange(lead.id, e.target.value)}
                          className={`bg-[#0b0b0f] border rounded px-2 py-1 text-[11px] font-semibold focus:outline-none ${
                            lead.tipifVendedor === 'Venta'
                              ? 'border-emerald-600 text-emerald-400 bg-emerald-950/30'
                              : lead.tipifVendedor === 'Seguimiento'
                              ? 'border-sky-600 text-sky-400'
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

                      {/* Sala */}
                      <td className="py-2 px-2.5">
                        <span className="text-[10px] font-semibold text-neutral-300">
                          {lead.sala || '-'}
                        </span>
                      </td>

                      {/* Fecha / Hora */}
                      <td className="py-2 px-2.5 font-mono tabular-nums text-[10px] text-neutral-400">
                        {lead.fechaHoraAsignacion
                          ? new Date(lead.fechaHoraAsignacion).toLocaleTimeString('es-PE', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'}
                      </td>

                      {/* Rots. */}
                      <td className="py-2 px-2 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold font-mono ${
                            lead.rotaciones > 0
                              ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {lead.rotaciones}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón morado de rotar */}
                          <button
                            onClick={() => setRotatingLead(lead)}
                            title="Rotar lead a otro asesor"
                            className="p-1.5 bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 border border-purple-700/40 rounded cursor-pointer transition-colors"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>

                          {/* Editar completo */}
                          <button
                            onClick={() => setEditingLead(lead)}
                            title="Editar detalle de fibra y cliente"
                            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded cursor-pointer transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>

                          {/* Copiar toda la info */}
                          <button
                            onClick={() => {
                              const text = `WIN Lead - N1: ${lead.n1} | Camp: ${lead.campaña} | Cliente: ${
                                lead.nombreCliente || 'S/N'
                              } | Distrito: ${lead.distrito}`;
                              copyToClipboard(text, 'Ficha del Lead');
                            }}
                            title="Copiar ficha rápida"
                            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded cursor-pointer transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                          </button>

                          {/* Eliminar */}
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar lead ${lead.n1}?`)) {
                                deleteLead(lead.id);
                              }
                            }}
                            title="Eliminar lead"
                            className="p-1.5 bg-neutral-800 hover:bg-red-900/50 text-neutral-400 hover:text-red-400 rounded cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-neutral-500 text-xs">
                    No se encontraron registros con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="px-4 py-2.5 bg-[#16161f] border-t border-[#1f1f28] flex items-center justify-between text-xs text-neutral-400">
          <div>
            Mostrando <span className="font-bold text-white font-mono">{sortedLeads.length}</span> leads
            {buscarGlobal ? ' (Búsqueda global)' : ` en la fecha ${formattedDate}`}
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>
              Duplicados en vista:{' '}
              <strong className="text-red-400 font-mono">
                {sortedLeads.filter((l) => duplicateN1Set.has(l.n1.trim())).length}
              </strong>
            </span>
            <span>
              Ventas:{' '}
              <strong className="text-emerald-400 font-mono">
                {sortedLeads.filter((l) => l.tipifVendedor === 'Venta').length}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingLead && (
        <LeadEditModal
          lead={editingLead}
          onClose={() => setEditingLead(null)}
        />
      )}

      {/* Rotate Modal */}
      {rotatingLead && (
        <RotateSingleModal
          lead={rotatingLead}
          onClose={() => setRotatingLead(null)}
        />
      )}
    </div>
  );
};
