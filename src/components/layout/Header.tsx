import React, { useMemo } from 'react';
import { Wifi, LogOut, Shield, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { leads, kpis } = useApp();

  // Role-aware and Sala-aware live KPIs calculation
  const displayedKPIs = useMemo(() => {
    if (!currentUser) return kpis;

    // Asesor: only his/her leads
    if (currentUser.rol === 'Asesor') {
      const myId = currentUser.asesorAsociadoId;
      const myName = currentUser.nombreMostrar.trim().toUpperCase();

      const myLeads = leads.filter((l) => {
        const matchId = myId && l.asesorId === myId;
        const matchName = l.asesorNombre && l.asesorNombre.trim().toUpperCase() === myName;
        return matchId || matchName;
      });

      const total = myLeads.length;
      const ventas = myLeads.filter((l) => l.tipifVendedor === 'Venta').length;
      const asignados = total;
      const pendientes = myLeads.filter((l) => (l.tipifVendedor || 'Pendiente') === 'Pendiente').length;
      const rotaciones = myLeads.reduce((acc, l) => acc + (l.rotaciones || 0), 0);

      return {
        total,
        ventas,
        asignados,
        sinAsignar: pendientes,
        rotaciones,
        conversionRate: total > 0 ? (ventas / total) * 100 : 0,
        coberturaRate: 0
      };
    }

    // Supervisor: filtered by their specific room if assigned
    if (
      currentUser.rol === 'Supervisor' &&
      currentUser.sala &&
      currentUser.sala !== 'TODAS' &&
      currentUser.sala !== 'TODAS LAS SALAS'
    ) {
      const salaLeads = leads.filter((l) => l.sala === currentUser.sala);
      const total = salaLeads.length;
      const ventas = salaLeads.filter((l) => l.tipifVendedor === 'Venta').length;
      const asignados = salaLeads.filter((l) => l.asesorId).length;
      const sinAsignar = total - asignados;
      const rotaciones = salaLeads.reduce((acc, l) => acc + (l.rotaciones || 0), 0);

      return {
        total,
        ventas,
        asignados,
        sinAsignar,
        rotaciones,
        conversionRate: asignados > 0 ? (ventas / asignados) * 100 : 0,
        coberturaRate: 0
      };
    }

    // Admin & Back: global KPIs
    return kpis;
  }, [currentUser, leads, kpis]);

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-[#121218] border-b border-[#1f1f28] z-40 px-4 flex items-center justify-between select-none">
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-3 shrink-0 min-w-[210px]">
        <div className="w-8 h-8 rounded-lg bg-red-600/15 border border-red-600/40 flex items-center justify-center">
          <Wifi className="w-4 h-4 text-red-500" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm tracking-wider text-white">WIN</span>
            <span className="font-semibold text-xs tracking-wider text-neutral-300">BACK DATA</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-medium tracking-tight">
            FIBRA ÓPTICA HOGAR
          </span>
        </div>
      </div>

      {/* Center: 5 Live KPI Cards */}
      <div className="hidden lg:flex items-center gap-2 xl:gap-3">
        {/* TOTAL (Blanco) */}
        <div className="px-3 py-1 bg-[#0b0b0f] border border-[#1f1f28] rounded-md flex items-center gap-2 min-w-[86px]">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">
            {currentUser?.rol === 'Asesor' ? 'MIS LEADS' : 'TOTAL'}
          </span>
          <span className="text-sm font-bold text-white tabular-nums ml-auto">
            {displayedKPIs.total.toLocaleString()}
          </span>
        </div>

        {/* VENTAS (Verde) */}
        <div className="px-3 py-1 bg-[#0b0b0f] border border-[#1f1f28] rounded-md flex items-center gap-2 min-w-[86px]">
          <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-medium">VENTAS</span>
          <span className="text-sm font-bold text-emerald-400 tabular-nums ml-auto">
            {displayedKPIs.ventas.toLocaleString()}
          </span>
        </div>

        {/* ASIGNADOS (Azul) */}
        <div className="px-3 py-1 bg-[#0b0b0f] border border-[#1f1f28] rounded-md flex items-center gap-2 min-w-[86px]">
          <span className="text-[10px] uppercase tracking-wider text-sky-400 font-medium">ASIGNADOS</span>
          <span className="text-sm font-bold text-sky-400 tabular-nums ml-auto">
            {displayedKPIs.asignados.toLocaleString()}
          </span>
        </div>

        {/* SIN ASIGNAR / PENDIENTES (Naranja) */}
        <div className="px-3 py-1 bg-[#0b0b0f] border border-[#1f1f28] rounded-md flex items-center gap-2 min-w-[86px]">
          <span className="text-[10px] uppercase tracking-wider text-amber-400 font-medium">
            {currentUser?.rol === 'Asesor' ? 'PENDIENTES' : 'SIN ASIG.'}
          </span>
          <span className="text-sm font-bold text-amber-400 tabular-nums ml-auto">
            {displayedKPIs.sinAsignar.toLocaleString()}
          </span>
        </div>

        {/* ROTACIONES (Morado) */}
        <div className="px-3 py-1 bg-[#0b0b0f] border border-[#1f1f28] rounded-md flex items-center gap-2 min-w-[86px]">
          <span className="text-[10px] uppercase tracking-wider text-purple-400 font-medium">ROTAC.</span>
          <span className="text-sm font-bold text-purple-400 tabular-nums ml-auto">
            {displayedKPIs.rotaciones.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Right: User profile and Red Logout button */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#1f1f28]">
          <div className="w-7 h-7 rounded-full bg-neutral-800 border border-[#1f1f28] flex items-center justify-center text-[11px] font-bold text-neutral-300">
            {currentUser?.nombreMostrar
              ? currentUser.nombreMostrar.split(' ').map((n) => n[0]).slice(0, 2).join('')
              : 'WH'}
          </div>
          <div className="flex flex-col text-right">
            <span className="text-xs font-bold text-white tracking-wide">
              {currentUser?.nombreMostrar || 'MATEO HIGA'}
            </span>
            <div className="flex items-center justify-end gap-1">
              <Shield className="w-2.5 h-2.5 text-red-400" />
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                {currentUser?.rol || 'Admin'}
                {currentUser?.sala && currentUser.sala !== 'TODAS' && currentUser.sala !== 'TODAS LAS SALAS'
                  ? ` · ${currentUser.sala}`
                  : ''}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          title="Cerrar sesión"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#dc2626] hover:bg-[#b91c1c] active:bg-red-800 text-white rounded-md text-xs font-semibold tracking-wide transition-colors cursor-pointer shadow-sm"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Salir</span>
        </button>
      </div>
    </header>
  );
};
