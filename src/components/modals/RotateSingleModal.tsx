import React, { useState, useMemo } from 'react';
import { X, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Lead } from '../../types';
import { useApp } from '../../context/AppContext';
import { leadService } from '../../services/leadService';

interface RotateSingleModalProps {
  lead: Lead;
  onClose: () => void;
}

export const RotateSingleModal: React.FC<RotateSingleModalProps> = ({ lead, onClose }) => {
  const { asesores, rotateLeads } = useApp();
  const [selectedAsesorId, setSelectedAsesorId] = useState('');

  // Compute eligibility for each advisor
  const advisorsWithEligibility = useMemo(() => {
    return asesores.map((a) => {
      const check = leadService.isLeadEligibleForRotation(lead, a.id);
      return {
        ...a,
        isEligible: check.eligible,
        reason: check.reason
      };
    });
  }, [asesores, lead]);

  const selectedAdvisor = advisorsWithEligibility.find((a) => a.id === selectedAsesorId);

  const handleRotate = () => {
    if (!selectedAsesorId || !selectedAdvisor?.isEligible) return;
    rotateLeads([lead.id], selectedAsesorId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#121218] border border-[#1f1f28] rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1f1f28] flex items-center justify-between bg-[#16161f]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-900/30 border border-purple-700/40 flex items-center justify-center text-purple-400">
              <RefreshCw className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Rotar Lead: {lead.n1}
              </h3>
              <p className="text-[10px] text-neutral-400">
                Rotación actual: #{lead.rotaciones} · Asesor actual: {lead.asesorNombre || 'Sin asignar'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
              SELECCIONA ASESOR DESTINO
            </label>
            <select
              value={selectedAsesorId}
              onChange={(e) => setSelectedAsesorId(e.target.value)}
              className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-600"
            >
              <option value="">-- Elige un asesor disponible --</option>
              {advisorsWithEligibility.map((a) => (
                <option key={a.id} value={a.id} disabled={!a.isEligible}>
                  {a.nombreCompleto} ({a.sala}) {!a.isEligible ? `[NO APTO: ${a.reason}]` : '✓ Apto'}
                </option>
              ))}
            </select>
          </div>

          {/* Validation feedback */}
          {selectedAdvisor && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                selectedAdvisor.isEligible
                  ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                  : 'bg-red-950/30 border-red-800/40 text-red-300'
              }`}
            >
              {selectedAdvisor.isEligible ? (
                <>
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-emerald-200">Asesor Apto para Rotación</p>
                    <p className="text-[11px] text-emerald-400/80 mt-0.5">
                      No ha atendido este lead previamente y el registro se encuentra dentro del límite de rotaciones permitidas.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-200">No Apto para este Asesor</p>
                    <p className="text-[11px] text-red-400/80 mt-0.5">{selectedAdvisor.reason}</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Advisor history summary if any */}
          {lead.historialAsesores && lead.historialAsesores.length > 0 && (
            <div className="bg-[#0b0b0f] p-3 rounded-lg border border-[#1f1f28]">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                HISTORIAL PREVIO DE ASESORES
              </span>
              <ul className="text-[11px] text-neutral-300 space-y-1">
                {lead.historialAsesores.map((h, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span>{h.asesorNombre}</span>
                    <span className="text-neutral-500 font-mono text-[10px]">
                      {new Date(h.fechaAsignacion).toLocaleDateString('es-PE')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1f1f28] bg-[#16161f]/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs font-semibold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleRotate}
            disabled={!selectedAdvisor || !selectedAdvisor.isEligible}
            className="px-4 py-1.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Rotar Ahora</span>
          </button>
        </div>
      </div>
    </div>
  );
};
