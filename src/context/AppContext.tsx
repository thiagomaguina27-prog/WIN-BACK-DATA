import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Lead, Asesor, Plan, KPIData } from '../types';
import { leadService } from '../services/leadService';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface AppContextType {
  leads: Lead[];
  asesores: Asesor[];
  planes: Plan[];
  kpis: KPIData;
  duplicateN1Set: Set<string>;
  maxRotaciones: number;
  availableDates: string[]; // List of unique YYYY-MM-DD dates in descending order
  activeDateIndex: number;
  activeDate: string; // Current date string YYYY-MM-DD or 'ALL'
  setActiveDateIndex: (index: number) => void;
  setActiveDate: (date: string) => void;
  setMaxRotaciones: (val: number) => void;
  addLead: (leadData: Omit<Lead, 'id' | 'createdAt' | 'rotaciones' | 'historialAsesores' | 'notas'>) => Lead;
  updateLead: (id: string, updates: Partial<Lead>) => Lead | null;
  deleteLead: (id: string) => boolean;
  addNote: (leadId: string, autor: string, texto: string) => void;
  batchImport: (items: Array<Omit<Lead, 'id' | 'createdAt' | 'rotaciones' | 'historialAsesores' | 'notas'>>) => { imported: number; duplicatesSkipped: number };
  rotateLeads: (leadIds: string[], targetAsesorId: string) => { successCount: number; failedCount: number };
  resetFactoryData: () => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [maxRotaciones, setMaxRotState] = useState<number>(3);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeDateIndex, setActiveDateIndex] = useState<number>(0);

  const refreshData = useCallback(() => {
    setLeads(leadService.getLeads());
    setAsesores(leadService.getAsesores());
    setPlanes(leadService.getPlanes());
    setMaxRotState(leadService.getMaxRotaciones());
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Compute unique dates for day navigation (sorted latest to oldest)
  const availableDates = useMemo(() => {
    const datesSet = new Set<string>();
    for (const l of leads) {
      if (l.createdAt) {
        const d = l.createdAt.split('T')[0];
        datesSet.add(d);
      }
    }
    const arr = Array.from(datesSet).sort().reverse();
    return arr.length > 0 ? arr : ['2026-09-24'];
  }, [leads]);

  const activeDate = useMemo(() => {
    if (activeDateIndex < 0 || activeDateIndex >= availableDates.length) {
      return availableDates[0] || '2026-09-24';
    }
    return availableDates[activeDateIndex];
  }, [availableDates, activeDateIndex]);

  const setActiveDateByString = useCallback((dateStr: string) => {
    const idx = availableDates.indexOf(dateStr);
    if (idx !== -1) {
      setActiveDateIndex(idx);
    }
  }, [availableDates]);

  // Live KPIs across all leads
  const kpis = useMemo(() => {
    return leadService.computeKPIs(leads);
  }, [leads]);

  // Duplicate N1 lookup
  const duplicateN1Set = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of leads) {
      const num = l.n1?.trim();
      if (num) {
        counts.set(num, (counts.get(num) || 0) + 1);
      }
    }
    const dupes = new Set<string>();
    for (const [num, count] of counts.entries()) {
      if (count > 1) dupes.add(num);
    }
    return dupes;
  }, [leads]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setMaxRotaciones = useCallback((val: number) => {
    leadService.setMaxRotaciones(val);
    setMaxRotState(val);
  }, []);

  const addLead = useCallback(
    (leadData: Omit<Lead, 'id' | 'createdAt' | 'rotaciones' | 'historialAsesores' | 'notas'>) => {
      const created = leadService.addLead(leadData);
      refreshData();
      showToast(`Lead ${created.n1} agregado a campaña ${created.campaña}`, 'success');
      return created;
    },
    [refreshData, showToast]
  );

  const updateLead = useCallback(
    (id: string, updates: Partial<Lead>) => {
      const updated = leadService.updateLead(id, updates);
      if (updated) {
        refreshData();
      }
      return updated;
    },
    [refreshData]
  );

  const deleteLead = useCallback(
    (id: string) => {
      const ok = leadService.deleteLead(id);
      if (ok) {
        refreshData();
        showToast('Lead eliminado correctamente', 'info');
      }
      return ok;
    },
    [refreshData, showToast]
  );

  const addNote = useCallback(
    (leadId: string, autor: string, texto: string) => {
      leadService.addNote(leadId, autor, texto);
      refreshData();
      showToast('Nota de llamada registrada', 'success');
    },
    [refreshData, showToast]
  );

  const batchImport = useCallback(
    (items: Array<Omit<Lead, 'id' | 'createdAt' | 'rotaciones' | 'historialAsesores' | 'notas'>>) => {
      const res = leadService.batchImportLeads(items);
      refreshData();
      showToast(
        `Importación completa: ${res.imported} nuevos leads ingresados (${res.duplicatesSkipped} duplicados omitidos)`,
        'success'
      );
      return res;
    },
    [refreshData, showToast]
  );

  const rotateLeads = useCallback(
    (leadIds: string[], targetAsesorId: string) => {
      const res = leadService.rotateLeadsToAdvisor(leadIds, targetAsesorId);
      refreshData();
      if (res.successCount > 0) {
        showToast(`Se rotaron ${res.successCount} leads exitosamente`, 'success');
      } else {
        showToast('Ningún lead seleccionado cumplió las condiciones de aptitud', 'error');
      }
      return res;
    },
    [refreshData, showToast]
  );

  const resetFactoryData = useCallback(() => {
    leadService.resetToFactorySeeds();
    refreshData();
    showToast('Base de datos restablecida a 876 registros de fábrica', 'info');
  }, [refreshData, showToast]);

  return (
    <AppContext.Provider
      value={{
        leads,
        asesores,
        planes,
        kpis,
        duplicateN1Set,
        maxRotaciones,
        availableDates,
        activeDateIndex,
        activeDate,
        setActiveDateIndex,
        setActiveDate: setActiveDateByString,
        setMaxRotaciones,
        addLead,
        updateLead,
        deleteLead,
        addNote,
        batchImport,
        rotateLeads,
        resetFactoryData,
        toasts,
        showToast,
        removeToast,
        refreshData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
