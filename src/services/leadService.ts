/**
 * WIN BACK DATA - Capa de Servicio de Leads y Asesores
 * Persistencia en localStorage con fallback a inicialización de 876 leads peruanos.
 * Arquitectura desacoplada lista para conectar con API REST / Firebase Firestore.
 */

import { Lead, Asesor, Plan, KPIData, TipifBack, TipifVendedor, HistorialAsesorItem } from '../types';
import { INITIAL_ASESORES, INITIAL_PLANES, generateInitialLeads } from '../data/initialData';

const LEADS_STORAGE_KEY = 'win_back_leads';
const ASESORES_STORAGE_KEY = 'win_back_asesores';
const PLANES_STORAGE_KEY = 'win_back_planes';
const MAX_ROTACIONES_CONFIG_KEY = 'win_back_max_rotaciones';

class LeadService {
  private leads: Lead[] = [];
  private asesores: Asesor[] = [];
  private planes: Plan[] = [];
  private maxRotaciones: number = 3;

  constructor() {
    this.initData();
  }

  private initData(): void {
    // 1. Asesores
    const rawAsesores = localStorage.getItem(ASESORES_STORAGE_KEY);
    if (rawAsesores) {
      try {
        this.asesores = JSON.parse(rawAsesores);
      } catch {
        this.asesores = INITIAL_ASESORES;
        this.saveAsesores();
      }
    } else {
      this.asesores = INITIAL_ASESORES;
      this.saveAsesores();
    }

    // 2. Planes
    const rawPlanes = localStorage.getItem(PLANES_STORAGE_KEY);
    if (rawPlanes) {
      try {
        this.planes = JSON.parse(rawPlanes);
      } catch {
        this.planes = INITIAL_PLANES;
        this.savePlanes();
      }
    } else {
      this.planes = INITIAL_PLANES;
      this.savePlanes();
    }

    // 3. Leads (876 items)
    const rawLeads = localStorage.getItem(LEADS_STORAGE_KEY);
    if (rawLeads) {
      try {
        this.leads = JSON.parse(rawLeads);
      } catch {
        this.leads = generateInitialLeads();
        this.saveLeads();
      }
    } else {
      this.leads = generateInitialLeads();
      this.saveLeads();
    }

    // 4. Max rotaciones config
    const rawMax = localStorage.getItem(MAX_ROTACIONES_CONFIG_KEY);
    if (rawMax) {
      this.maxRotaciones = parseInt(rawMax, 10) || 3;
    }
  }

  private saveLeads(): void {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(this.leads));
  }

  private saveAsesores(): void {
    localStorage.setItem(ASESORES_STORAGE_KEY, JSON.stringify(this.asesores));
  }

  private savePlanes(): void {
    localStorage.setItem(PLANES_STORAGE_KEY, JSON.stringify(this.planes));
  }

  public getLeads(): Lead[] {
    return [...this.leads];
  }

  public getAsesores(): Asesor[] {
    return [...this.asesores];
  }

  public getAsesoresBySala(sala?: string): Asesor[] {
    if (!sala || sala === 'TODAS' || sala === 'TODAS LAS SALAS') {
      return [...this.asesores];
    }
    return this.asesores.filter((a) => a.sala === sala);
  }

  public addOrUpdateAsesor(asesor: Asesor): Asesor {
    const existingIndex = this.asesores.findIndex(
      (a) => a.id === asesor.id || a.usuario.toLowerCase() === asesor.usuario.toLowerCase()
    );
    if (existingIndex !== -1) {
      this.asesores[existingIndex] = { ...this.asesores[existingIndex], ...asesor };
      this.saveAsesores();
      return this.asesores[existingIndex];
    } else {
      this.asesores.push(asesor);
      this.saveAsesores();
      return asesor;
    }
  }

  public getPlanes(): Plan[] {
    return [...this.planes];
  }

  public getMaxRotaciones(): number {
    return this.maxRotaciones;
  }

  public setMaxRotaciones(val: number): void {
    this.maxRotaciones = val;
    localStorage.setItem(MAX_ROTACIONES_CONFIG_KEY, val.toString());
  }

  /**
   * Returns a map of N1 -> frequency to easily check duplicates
   */
  public getDuplicateN1Set(): Set<string> {
    const counts = new Map<string, number>();
    for (const lead of this.leads) {
      const num = lead.n1.trim();
      counts.set(num, (counts.get(num) || 0) + 1);
    }
    const dupes = new Set<string>();
    for (const [num, count] of counts.entries()) {
      if (count > 1) dupes.add(num);
    }
    return dupes;
  }

  public isN1Duplicate(n1: string, excludeId?: string): boolean {
    const clean = n1.trim();
    return this.leads.some((l) => l.n1.trim() === clean && l.id !== excludeId);
  }

  /**
   * Adds a new lead manually from the sidebar form
   */
  public addLead(leadData: Omit<Lead, 'id' | 'createdAt' | 'rotaciones' | 'historialAsesores' | 'notas'>): Lead {
    const newLead: Lead = {
      ...leadData,
      id: `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      rotaciones: 0,
      historialAsesores: [],
      notas: [],
      createdAt: new Date().toISOString()
    };

    // If an advisor is assigned immediately, fill sala and assignment timestamp
    if (newLead.asesorId) {
      const asesor = this.asesores.find((a) => a.id === newLead.asesorId);
      if (asesor) {
        newLead.asesorNombre = asesor.nombreCompleto;
        newLead.sala = asesor.sala;
        newLead.fechaHoraAsignacion = new Date().toISOString();
      }
    }

    this.leads.unshift(newLead);
    this.saveLeads();
    return newLead;
  }

  /**
   * Updates an existing lead.
   * If advisor is changed, automatically updates sala and fechaHoraAsignacion.
   */
  public updateLead(id: string, updates: Partial<Lead>): Lead | null {
    const index = this.leads.findIndex((l) => l.id === id);
    if (index === -1) return null;

    const existing = this.leads[index];
    const updated: Lead = { ...existing, ...updates };

    // Check if advisor changed
    if (updates.asesorId !== undefined && updates.asesorId !== existing.asesorId) {
      if (updates.asesorId) {
        const asesor = this.asesores.find((a) => a.id === updates.asesorId);
        if (asesor) {
          updated.asesorNombre = asesor.nombreCompleto;
          updated.sala = asesor.sala;
          updated.fechaHoraAsignacion = new Date().toISOString();

          // Log previous advisor in history if had one
          if (existing.asesorId && existing.asesorNombre) {
            const histItem: HistorialAsesorItem = {
              asesorId: existing.asesorId,
              asesorNombre: existing.asesorNombre,
              fechaAsignacion: existing.fechaHoraAsignacion || existing.createdAt,
              tipifResultado: existing.tipifVendedor || existing.tipifBack1
            };
            updated.historialAsesores = [...(existing.historialAsesores || []), histItem];
          }
        }
      } else {
        // Unassigned
        updated.asesorNombre = undefined;
        updated.sala = undefined;
        updated.fechaHoraAsignacion = undefined;
      }
    }

    this.leads[index] = updated;
    this.saveLeads();
    return updated;
  }

  public deleteLead(id: string): boolean {
    const prevLen = this.leads.length;
    this.leads = this.leads.filter((l) => l.id !== id);
    if (this.leads.length !== prevLen) {
      this.saveLeads();
      return true;
    }
    return false;
  }

  /**
   * Adds a call note to a lead
   */
  public addNote(leadId: string, autor: string, texto: string): Lead | null {
    const lead = this.leads.find((l) => l.id === leadId);
    if (!lead) return null;

    const newNote = {
      id: `nota-${Date.now()}`,
      autor,
      texto: texto.trim(),
      fechaHora: new Date().toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    lead.notas = [newNote, ...(lead.notas || [])];
    this.saveLeads();
    return lead;
  }

  /**
   * Batch imports leads parsed from Excel/CSV
   */
  public batchImportLeads(
    newLeads: Array<Omit<Lead, 'id' | 'createdAt' | 'rotaciones' | 'historialAsesores' | 'notas'>>
  ): { imported: number; duplicatesSkipped: number } {
    const existingN1s = new Set(this.leads.map((l) => l.n1.trim()));
    const leadsToInsert: Lead[] = [];
    let duplicatesSkipped = 0;

    for (const item of newLeads) {
      const cleanN1 = item.n1.trim();
      if (existingN1s.has(cleanN1)) {
        duplicatesSkipped++;
        continue;
      }

      existingN1s.add(cleanN1);
      const lead: Lead = {
        ...item,
        id: `lead-imp-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        rotaciones: 0,
        historialAsesores: [],
        notas: [],
        createdAt: new Date().toISOString()
      };

      if (lead.asesorId) {
        const asesor = this.asesores.find((a) => a.id === lead.asesorId);
        if (asesor) {
          lead.asesorNombre = asesor.nombreCompleto;
          lead.sala = asesor.sala;
          lead.fechaHoraAsignacion = new Date().toISOString();
        }
      }

      leadsToInsert.push(lead);
    }

    this.leads = [...leadsToInsert, ...this.leads];
    this.saveLeads();

    return {
      imported: leadsToInsert.length,
      duplicatesSkipped
    };
  }

  /**
   * Rotation rules verification:
   * A lead is "Apto" for rotation to target advisor IF:
   * 1. rotaciones < maxRotaciones
   * 2. Not in a final typification (Venta, Agendado, Servicio activo, Número equivocado, Sin cobertura)
   * 3. Target advisor has NOT handled it before (not in historialAsesores and not current asesorId)
   */
  public isLeadEligibleForRotation(lead: Lead, targetAsesorId: string): { eligible: boolean; reason?: string } {
    if (lead.rotaciones >= this.maxRotaciones) {
      return { eligible: false, reason: `Superó límite (${this.maxRotaciones} rotac.)` };
    }

    // Check final typifications in Back or Vendedor
    const finalBackTipifs: TipifBack[] = [
      'Venta',
      'Agendado',
      'Servicio activo (ya es cliente WIN)',
      'Número equivocado',
      'Sin cobertura'
    ];

    if (lead.tipifVendedor === 'Venta') {
      return { eligible: false, reason: 'Ya es Venta' };
    }
    if (lead.tipifVendedor === 'Sin cobertura') {
      return { eligible: false, reason: 'Sin cobertura' };
    }
    if (lead.tipifBack1 && finalBackTipifs.includes(lead.tipifBack1)) {
      return { eligible: false, reason: `Tipif. final: ${lead.tipifBack1}` };
    }

    // Check advisor repetition
    if (lead.asesorId === targetAsesorId) {
      return { eligible: false, reason: 'Actualmente asignado a este asesor' };
    }

    const previouslyHandled = lead.historialAsesores?.some((h) => h.asesorId === targetAsesorId);
    if (previouslyHandled) {
      return { eligible: false, reason: 'Asesor ya tuvo este lead previamente' };
    }

    return { eligible: true };
  }

  /**
   * Rotates a set of leads to a target advisor
   */
  public rotateLeadsToAdvisor(leadIds: string[], targetAsesorId: string): { successCount: number; failedCount: number } {
    const targetAsesor = this.asesores.find((a) => a.id === targetAsesorId);
    if (!targetAsesor) return { successCount: 0, failedCount: leadIds.length };

    let successCount = 0;
    let failedCount = 0;

    for (const id of leadIds) {
      const lead = this.leads.find((l) => l.id === id);
      if (!lead) {
        failedCount++;
        continue;
      }

      const eligibility = this.isLeadEligibleForRotation(lead, targetAsesorId);
      if (!eligibility.eligible) {
        failedCount++;
        continue;
      }

      // Record in history
      if (lead.asesorId && lead.asesorNombre) {
        lead.historialAsesores = [
          ...(lead.historialAsesores || []),
          {
            asesorId: lead.asesorId,
            asesorNombre: lead.asesorNombre,
            fechaAsignacion: lead.fechaHoraAsignacion || lead.createdAt,
            tipifResultado: lead.tipifVendedor || lead.tipifBack1
          }
        ];
      }

      // Reassign to target advisor
      lead.asesorId = targetAsesor.id;
      lead.asesorNombre = targetAsesor.nombreCompleto;
      lead.sala = targetAsesor.sala;
      lead.fechaHoraAsignacion = new Date().toISOString();
      lead.rotaciones = (lead.rotaciones || 0) + 1;
      lead.tipifVendedor = 'Pendiente'; // Reset vendedor typification to Pendiente for new advisor

      // Add audit note
      lead.notas = [
        {
          id: `nota-rot-${Date.now()}-${Math.random()}`,
          autor: 'Sistema Rotación',
          texto: `Lead rotado automáticamente a ${targetAsesor.nombreCompleto} (${targetAsesor.sala}). Rotación #${lead.rotaciones}.`,
          fechaHora: new Date().toLocaleString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        },
        ...(lead.notas || [])
      ];

      successCount++;
    }

    if (successCount > 0) {
      this.saveLeads();
    }

    return { successCount, failedCount };
  }

  /**
   * Computes live KPIs across current leads
   */
  public computeKPIs(filteredLeads?: Lead[]): KPIData {
    const dataset = filteredLeads || this.leads;
    const total = dataset.length;
    let ventas = 0;
    let asignados = 0;
    let rotaciones = 0;
    let conCobertura = 0;

    for (const lead of dataset) {
      if (lead.tipifVendedor === 'Venta' || lead.tipifBack1 === 'Venta') {
        ventas++;
      }
      if (lead.asesorId) {
        asignados++;
      }
      if (lead.rotaciones > 0) {
        rotaciones += lead.rotaciones;
      }
      if (lead.cobertura === 'Con cobertura') {
        conCobertura++;
      }
    }

    const sinAsignar = total - asignados;
    const conversionRate = asignados > 0 ? (ventas / asignados) * 100 : 0;
    const coberturaRate = total > 0 ? (conCobertura / total) * 100 : 0;

    return {
      total,
      ventas,
      asignados,
      sinAsignar,
      rotaciones,
      conversionRate,
      coberturaRate
    };
  }

  /**
   * Reset data to default seeds if requested
   */
  public resetToFactorySeeds(): void {
    this.leads = generateInitialLeads();
    this.asesores = INITIAL_ASESORES;
    this.planes = INITIAL_PLANES;
    this.maxRotaciones = 3;
    this.saveLeads();
    this.saveAsesores();
    this.savePlanes();
    this.setMaxRotaciones(3);
  }
}

export const leadService = new LeadService();
