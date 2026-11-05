import React, { useState, useMemo } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Filter,
  FilterX,
  Users,
  Clock,
  ArrowRight,
  ShieldCheck,
  Settings
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Lead, TipifBack } from '../../types';
import { leadService } from '../../services/leadService';
import { TIPIF_BACK_LIST } from '../../data/initialData';

export const RotacionView: React.FC = () => {
  const {
    leads,
    asesores,
    maxRotaciones,
    setMaxRotaciones,
    rotateLeads,
    showToast
  } = useApp();

  // Target advisor & quantity
  const [targetAsesorId, setTargetAsesorId] = useState<string>(asesores[0]?.id || '');
  const [maxLeadsToRotate, setMaxLeadsToRotate] = useState<number>(10);
  const [isRotating, setIsRotating] = useState(false);

  // Filters for available leads
  const [filterFecha, setFilterFecha] = useState<string>('');
  const [filterTipif, setFilterTipif] = useState<string>('');
  const [filterRotaciones, setFilterRotaciones] = useState<string>(''); // '', '0', '1', '2'

  // Selected lead IDs
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Target advisor object
  const targetAsesor = useMemo(() => {
    return asesores.find((a) => a.id === targetAsesorId);
  }, [asesores, targetAsesorId]);

  // Format relative time: "Hace 5 min", "Hace 2h", "Hace 1 día"
  const getRelativeTime = (isoString?: string): string => {
    if (!isoString) return 'Sin fecha';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) return `Hace ${Math.max(1, diffMins)} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  };

  // Check if date is "today"
  const isToday = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    const leadDate = dateStr.split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return leadDate === today || leadDate === '2026-09-24';
  };

  // Base list of candidate leads
  const candidateLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Date filter
      if (filterFecha) {
        if (!lead.createdAt.startsWith(filterFecha)) return false;
      }
      // Tipif filter
      if (filterTipif) {
        if (lead.tipifBack1 !== filterTipif && lead.tipifVendedor !== filterTipif) return false;
      }
      // Rotations filter
      if (filterRotaciones !== '') {
        if (lead.rotaciones !== parseInt(filterRotaciones, 10)) return false;
      }
      return true;
    });
  }, [leads, filterFecha, filterTipif, filterRotaciones]);

  // Compute eligibility for each candidate against the selected target advisor
  const evaluatedLeads = useMemo(() => {
    return candidateLeads.map((lead) => {
      const eligibility = leadService.isLeadEligibleForRotation(lead, targetAsesorId);
      const previouslyHandled = lead.historialAsesores?.some((h) => h.asesorId === targetAsesorId);
      const isCurrentlyAssigned = lead.asesorId === targetAsesorId;

      return {
        ...lead,
        isEligible: eligibility.eligible,
        ineligibleReason: eligibility.reason,
        sinRepetir: !previouslyHandled && !isCurrentlyAssigned
      };
    });
  }, [candidateLeads, targetAsesorId]);

  // Total apt leads count
  const aptosCount = useMemo(() => {
    return evaluatedLeads.filter((l) => l.isEligible).length;
  }, [evaluatedLeads]);

  // Handle select all / deselect all
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Only select eligible leads up to maxLeadsToRotate or all eligible
      const eligibleIds = evaluatedLeads.filter((l) => l.isEligible).map((l) => l.id);
      setSelectedIds(new Set(eligibleIds.slice(0, maxLeadsToRotate)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string, isEligible: boolean) => {
    if (!isEligible) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleClearFilters = () => {
    setFilterFecha('');
    setFilterTipif('');
    setFilterRotaciones('');
  };

  // Perform rotation
  const handleExecuteRotation = async () => {
    if (!targetAsesorId) {
      showToast('Selecciona un asesor destino', 'error');
      return;
    }

    let leadsToRotateIds: string[] = [];
    if (selectedIds.size > 0) {
      // Rotate selected leads that are eligible
      leadsToRotateIds = Array.from(selectedIds).filter((id) => {
        const lead = evaluatedLeads.find((l) => l.id === id);
        return lead?.isEligible;
      });
    } else {
      // Take first N eligible leads automatically
      const eligible = evaluatedLeads.filter((l) => l.isEligible);
      leadsToRotateIds = eligible.slice(0, maxLeadsToRotate).map((l) => l.id);
    }

    if (leadsToRotateIds.length === 0) {
      showToast('No hay leads aptos seleccionados para rotar', 'error');
      return;
    }

    setIsRotating(true);
    await new Promise((r) => setTimeout(r, 250));

    const res = rotateLeads(leadsToRotateIds, targetAsesorId);
    setSelectedIds(new Set());
    setIsRotating(false);
  };

  return (
    <div className="space-y-4">
      {/* Title & Section Header */}
      <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-4 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-purple-400" />
            Rotación Inteligente de Leads
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Reasigna leads no concretados a nuevos asesores asegurando alternancia, trazabilidad y control de topes.
          </p>
        </div>

        {/* Max rotations config badge */}
        <div className="flex items-center gap-2 bg-[#0b0b0f] border border-[#1f1f28] px-3 py-1.5 rounded-lg text-xs">
          <Settings className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-neutral-400 font-medium">Tope de rotaciones:</span>
          <select
            value={maxRotaciones}
            onChange={(e) => setMaxRotaciones(parseInt(e.target.value, 10))}
            className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
          >
            <option value={2} className="bg-[#121218]">2 rotaciones</option>
            <option value={3} className="bg-[#121218]">3 rotaciones</option>
            <option value={4} className="bg-[#121218]">4 rotaciones</option>
            <option value={5} className="bg-[#121218]">5 rotaciones</option>
          </select>
        </div>
      </div>

      {/* Action Box: "Rotar leads a un asesor" */}
      <div className="bg-[#121218] border border-purple-900/40 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Rotar leads a un asesor:
          </span>

          {/* Asesor selector */}
          <div className="min-w-[240px]">
            <select
              value={targetAsesorId}
              onChange={(e) => {
                setTargetAsesorId(e.target.value);
                setSelectedIds(new Set()); // reset selection on advisor change
              }}
              className="w-full bg-[#0b0b0f] border border-[#2a2a38] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-600 font-medium"
            >
              {asesores.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombreCompleto} ({a.sala})
                </option>
              ))}
            </select>
          </div>

          {/* Leads max input */}
          <div className="flex items-center gap-2 bg-[#0b0b0f] border border-[#2a2a38] rounded-lg px-3 py-1.5 text-xs">
            <span className="text-[10px] uppercase font-bold text-neutral-400">LEADS MÁX.</span>
            <input
              type="number"
              min={1}
              max={100}
              value={maxLeadsToRotate}
              onChange={(e) => setMaxLeadsToRotate(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-14 bg-transparent text-right font-mono font-bold text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Purple "Rotar ahora" button */}
        <button
          onClick={handleExecuteRotation}
          disabled={isRotating || aptosCount === 0}
          className="px-6 py-2.5 bg-purple-700 hover:bg-purple-600 active:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg flex items-center gap-2 cursor-pointer transition-colors shadow-lg shadow-purple-950/50"
        >
          <RefreshCw className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} />
          <span>
            {selectedIds.size > 0
              ? `Rotar ${selectedIds.size} seleccionados`
              : `Rotar ${Math.min(maxLeadsToRotate, aptosCount)} aptos ahora`}
          </span>
        </button>
      </div>

      {/* "Leads disponibles" Header & Filters */}
      <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-3.5 space-y-3 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Leads disponibles
            </h2>

            {/* Badge verde "130 aptos" */}
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-950/70 border border-emerald-600/50 text-emerald-300">
              {aptosCount} aptos
            </span>

            {/* Texto "Mostrando X · seleccionados Y/Z" */}
            <span className="text-xs text-neutral-400">
              Mostrando <strong className="text-white font-mono">{evaluatedLeads.length}</strong> · seleccionados{' '}
              <strong className="text-purple-300 font-mono">
                {selectedIds.size}/{Math.min(maxLeadsToRotate, aptosCount)}
              </strong>
            </span>
          </div>

          {/* Filters: Fecha, Tipificación, Rotaciones, Limpiar */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Filter Fecha */}
            <div className="flex items-center gap-1 bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-2 py-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400">FECHA</span>
              <input
                type="date"
                value={filterFecha}
                onChange={(e) => setFilterFecha(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
              />
            </div>

            {/* Filter Tipificación */}
            <div className="flex items-center gap-1 bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-2 py-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400">TIPIF.</span>
              <select
                value={filterTipif}
                onChange={(e) => setFilterTipif(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-[#121218]">Todas</option>
                {TIPIF_BACK_LIST.map((t) => (
                  <option key={t} value={t} className="bg-[#121218]">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Rotaciones */}
            <div className="flex items-center gap-1 bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-2 py-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400">ROTAC.</span>
              <select
                value={filterRotaciones}
                onChange={(e) => setFilterRotaciones(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-[#121218]">Todas</option>
                <option value="0" className="bg-[#121218]">0 rotaciones</option>
                <option value="1" className="bg-[#121218]">1 rotación</option>
                <option value="2" className="bg-[#121218]">2 rotaciones</option>
                <option value="3" className="bg-[#121218]">3 rotaciones</option>
              </select>
            </div>

            {/* Clean */}
            <button
              onClick={handleClearFilters}
              title="Limpiar filtros"
              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg cursor-pointer transition-colors"
            >
              <FilterX className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Table of Available Leads */}
        <div className="overflow-x-auto border border-[#1f1f28] rounded-lg">
          <table className="w-full text-left text-[11px] whitespace-nowrap">
            <thead className="bg-[#16161f] text-neutral-400 text-[10px] uppercase font-bold border-b border-[#1f1f28]">
              <tr>
                <th className="py-2.5 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.size > 0 &&
                      selectedIds.size === Math.min(maxLeadsToRotate, aptosCount) &&
                      aptosCount > 0
                    }
                    onChange={handleSelectAll}
                    disabled={aptosCount === 0}
                    className="w-3.5 h-3.5 rounded bg-[#0b0b0f] border-[#1f1f28] text-purple-600 accent-purple-600 cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-3">N1 / Campaña</th>
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Tipificación</th>
                <th className="py-2.5 px-3">Asesor actual</th>
                <th className="py-2.5 px-3 text-center">Rotac.</th>
                <th className="py-2.5 px-3">Día/Hora asig.</th>
                <th className="py-2.5 px-3">Tiempo</th>
                <th className="py-2.5 px-3 text-center">Sin repetir</th>
                <th className="py-2.5 px-3 text-right">Aptitud</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#1f1f28]/60 bg-[#0b0b0f]">
              {evaluatedLeads.length > 0 ? (
                evaluatedLeads.map((lead) => {
                  const isSelected = selectedIds.has(lead.id);

                  // Extract previous advisors text: "Tuvo: [asesor 1, 2]"
                  const prevAsesoresNames = lead.historialAsesores?.map((h) => h.asesorNombre.split(' ')[0]).join(', ');

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => handleToggleSelect(lead.id, lead.isEligible)}
                      className={`transition-colors cursor-pointer select-none ${
                        isSelected
                          ? 'bg-purple-950/20'
                          : lead.isEligible
                          ? 'hover:bg-[#14141c]'
                          : 'opacity-50 hover:bg-[#101015]'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!lead.isEligible}
                          onChange={() => handleToggleSelect(lead.id, lead.isEligible)}
                          className="w-3.5 h-3.5 rounded bg-[#0b0b0f] border-[#1f1f28] text-purple-600 accent-purple-600 cursor-pointer disabled:opacity-30"
                        />
                      </td>

                      {/* N1 / Campaña */}
                      <td className="py-2 px-3">
                        <div className="font-bold text-white font-mono">{lead.n1}</div>
                        <div className="text-[10px] text-neutral-400 font-semibold">{lead.campaña}</div>
                      </td>

                      {/* Fecha (badge verde "HOY" o fecha) */}
                      <td className="py-2 px-3">
                        {isToday(lead.createdAt) ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 border border-emerald-600/40 text-emerald-400">
                            HOY
                          </span>
                        ) : (
                          <span className="font-mono text-neutral-400 text-[10px]">
                            {lead.createdAt.split('T')[0]}
                          </span>
                        )}
                      </td>

                      {/* Tipificación */}
                      <td className="py-2 px-3">
                        <div className="font-semibold text-neutral-200">
                          {lead.tipifVendedor || lead.tipifBack1 || 'Pendiente'}
                        </div>
                        {lead.tipifBack1 && lead.tipifBack1 !== lead.tipifVendedor && (
                          <div className="text-[10px] text-neutral-400">Back: {lead.tipifBack1}</div>
                        )}
                      </td>

                      {/* Asesor actual ("Tuvo: [asesor anterior]") */}
                      <td className="py-2 px-3">
                        <div className="text-neutral-200 font-medium">
                          {lead.asesorNombre || 'Sin asignar'}
                        </div>
                        {prevAsesoresNames && (
                          <div className="text-[10px] text-purple-300">
                            Tuvo: {prevAsesoresNames}
                          </div>
                        )}
                      </td>

                      {/* Rotac. (badge amarillo circular) */}
                      <td className="py-2 px-3 text-center">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold font-mono bg-amber-950/60 text-amber-300 border border-amber-600/50">
                          {lead.rotaciones}
                        </span>
                      </td>

                      {/* Día/Hora asig. (rojo) */}
                      <td className="py-2 px-3 font-mono text-[10px] text-red-400 font-semibold">
                        {lead.fechaHoraAsignacion
                          ? new Date(lead.fechaHoraAsignacion).toLocaleString('es-PE', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'}
                      </td>

                      {/* Tiempo ("Hace 3 min") */}
                      <td className="py-2 px-3 text-[10px] text-neutral-400 font-mono">
                        {getRelativeTime(lead.fechaHoraAsignacion || lead.createdAt)}
                      </td>

                      {/* Sin repetir ("OK" green badge) */}
                      <td className="py-2 px-3 text-center">
                        {lead.sinRepetir ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-700/40">
                            OK
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950/60 text-red-400 border border-red-700/40">
                            REPETIDO
                          </span>
                        )}
                      </td>

                      {/* Aptitud (badge "Apto" verde / "No apto" rojo) */}
                      <td className="py-2 px-3 text-right">
                        {lead.isEligible ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/70 border border-emerald-600/60 text-emerald-300">
                            Apto
                          </span>
                        ) : (
                          <span
                            title={lead.ineligibleReason}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/70 border border-red-700/60 text-red-300 cursor-help"
                          >
                            No apto ({lead.ineligibleReason})
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-neutral-500 text-xs">
                    No hay leads que coincidan con los filtros de rotación.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
