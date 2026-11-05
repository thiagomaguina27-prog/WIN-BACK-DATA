import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Download,
  Filter,
  FilterX,
  Target,
  Award,
  Layers,
  CheckCircle,
  Wifi
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { CAMPAÑAS_LIST } from '../../data/initialData';

const SALA_COLORS: Record<string, string> = {
  'SALA 1': '#ef4444',
  'SALA 2': '#3b82f6',
  'SALA 3': '#8b5cf6',
  'SALA 4': '#10b981',
  'SALA 5': '#f59e0b',
  'SALA VIP': '#ec4899'
};

const PALETTE = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];

export const RendimientoView: React.FC = () => {
  const { currentUser } = useAuth();
  const { leads, asesores, showToast } = useApp();

  const isSupervisorWithSpecificSala =
    currentUser?.rol === 'Supervisor' &&
    currentUser?.sala &&
    currentUser.sala !== 'TODAS' &&
    currentUser.sala !== 'TODAS LAS SALAS';

  const supervisorSala = isSupervisorWithSpecificSala ? currentUser.sala : null;

  // Filters
  const [filterDesde, setFilterDesde] = useState('');
  const [filterHasta, setFilterHasta] = useState('');
  const [filterSala, setFilterSala] = useState(supervisorSala || '');
  const [filterCampaña, setFilterCampaña] = useState('');

  // Available Salas
  const salasUnicas = useMemo(() => {
    return Array.from(new Set(asesores.map((a) => a.sala))).sort();
  }, [asesores]);

  // Clean filters
  const handleClear = () => {
    setFilterDesde('');
    setFilterHasta('');
    setFilterSala('');
    setFilterCampaña('');
  };

  // Filtered dataset
  const filteredDataset = useMemo(() => {
    return leads.filter((l) => {
      const d = l.createdAt.split('T')[0];
      if (filterDesde && d < filterDesde) return false;
      if (filterHasta && d > filterHasta) return false;
      if (supervisorSala) {
        if (l.sala !== supervisorSala) return false;
      } else if (filterSala && l.sala !== filterSala) {
        return false;
      }
      if (filterCampaña && l.campaña !== filterCampaña) return false;
      return true;
    });
  }, [leads, filterDesde, filterHasta, filterSala, supervisorSala, filterCampaña]);

  // Overall KPIs
  const totalLeads = filteredDataset.length;
  const ventasCount = filteredDataset.filter((l) => l.tipifVendedor === 'Venta').length;
  const asignadosCount = filteredDataset.filter((l) => l.asesorId).length;
  const instaladosCount = filteredDataset.filter((l) => l.estadoInstalacion === 'Instalada').length;
  const conCoberturaCount = filteredDataset.filter((l) => l.cobertura === 'Con cobertura').length;

  const conversionRate = asignadosCount > 0 ? ((ventasCount / asignadosCount) * 100).toFixed(1) : '0.0';
  const coberturaRate = totalLeads > 0 ? ((conCoberturaCount / totalLeads) * 100).toFixed(1) : '0.0';
  const instalacionRate = ventasCount > 0 ? ((instaladosCount / ventasCount) * 100).toFixed(1) : '0.0';

  // 1. Embudo de conversión
  // Total -> Contactados -> Agendados -> Ventas -> Instalados
  const funnelData = useMemo(() => {
    const contactados = filteredDataset.filter(
      (l) => l.tipifBack1 && !['No contesta', 'Corta llamada', 'Número equivocado'].includes(l.tipifBack1)
    ).length;
    const agendados = filteredDataset.filter(
      (l) => l.tipifBack1 === 'Agendado' || l.tipifVendedor === 'Reagendado'
    ).length;

    return [
      { etapa: '1. Leads Totales', cantidad: totalLeads, fill: '#3b82f6' },
      { etapa: '2. Contactados', cantidad: contactados, fill: '#06b6d4' },
      { etapa: '3. Agendados / Interesados', cantidad: agendados, fill: '#8b5cf6' },
      { etapa: '4. Ventas Concretadas', cantidad: ventasCount, fill: '#10b981' },
      { etapa: '5. Instalaciones Realizadas', cantidad: instaladosCount, fill: '#22c55e' }
    ];
  }, [filteredDataset, totalLeads, ventasCount, instaladosCount]);

  // 2. Ventas por Sala
  const salesBySalaData = useMemo(() => {
    const map = new Map<string, { sala: string; leads: number; ventas: number }>();
    for (const sala of salasUnicas) {
      map.set(sala, { sala, leads: 0, ventas: 0 });
    }

    for (const l of filteredDataset) {
      if (l.sala && map.has(l.sala)) {
        const item = map.get(l.sala)!;
        item.leads++;
        if (l.tipifVendedor === 'Venta') {
          item.ventas++;
        }
      }
    }
    return Array.from(map.values());
  }, [filteredDataset, salasUnicas]);

  // 3. Ventas por Campaña
  const salesByCampañaData = useMemo(() => {
    const map = new Map<string, { campaña: string; total: number; ventas: number }>();
    for (const camp of CAMPAÑAS_LIST) {
      map.set(camp, { campaña: camp, total: 0, ventas: 0 });
    }

    for (const l of filteredDataset) {
      if (map.has(l.campaña)) {
        const item = map.get(l.campaña)!;
        item.total++;
        if (l.tipifVendedor === 'Venta') {
          item.ventas++;
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.ventas - a.ventas);
  }, [filteredDataset]);

  // 4. Top 10 Asesores
  const topAsesores = useMemo(() => {
    const map = new Map<string, { id: string; nombre: string; sala: string; asignados: number; ventas: number }>();
    for (const a of asesores) {
      map.set(a.id, { id: a.id, nombre: a.nombreCompleto, sala: a.sala, asignados: 0, ventas: 0 });
    }

    for (const l of filteredDataset) {
      if (l.asesorId && map.has(l.asesorId)) {
        const item = map.get(l.asesorId)!;
        item.asignados++;
        if (l.tipifVendedor === 'Venta') {
          item.ventas++;
        }
      }
    }

    return Array.from(map.values())
      .filter((a) => a.asignados > 0)
      .map((a) => ({
        ...a,
        tasaConversion: a.asignados > 0 ? ((a.ventas / a.asignados) * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.ventas - a.ventas)
      .slice(0, 10);
  }, [filteredDataset, asesores]);

  // 5. Evolución diaria: Asignados vs Ventas
  const dailyEvolution = useMemo(() => {
    const dateMap = new Map<string, { date: string; asignados: number; ventas: number }>();

    for (const l of filteredDataset) {
      const d = l.createdAt.split('T')[0];
      if (!dateMap.has(d)) {
        dateMap.set(d, { date: d, asignados: 0, ventas: 0 });
      }
      const cur = dateMap.get(d)!;
      if (l.asesorId) cur.asignados++;
      if (l.tipifVendedor === 'Venta') cur.ventas++;
    }

    // Sort chronologically and take last 14 days
    return Array.from(dateMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)
      .map((item) => ({
        ...item,
        displayDate: item.date.slice(5) // MM-DD
      }));
  }, [filteredDataset]);

  // Export report to Excel
  const handleExportExcel = () => {
    const summarySheetData = topAsesores.map((a, i) => ({
      Ranking: i + 1,
      Asesor: a.nombre,
      Sala: a.sala,
      'Leads Asignados': a.asignados,
      Ventas: a.ventas,
      'Conversión %': `${a.tasaConversion}%`
    }));

    const campaignSheetData = salesByCampañaData.map((c) => ({
      Campaña: c.campaña,
      'Total Leads': c.total,
      Ventas: c.ventas,
      'Conversión %': c.total > 0 ? `${((c.ventas / c.total) * 100).toFixed(1)}%` : '0%'
    }));

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(summarySheetData);
    const ws2 = XLSX.utils.json_to_sheet(campaignSheetData);

    XLSX.utils.book_append_sheet(wb, ws1, 'Top Asesores');
    XLSX.utils.book_append_sheet(wb, ws2, 'Ventas por Campaña');
    XLSX.writeFile(wb, 'Reporte_Rendimiento_WIN.xlsx');
    showToast('Reporte de rendimiento exportado a Excel', 'success');
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter Bar */}
      <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div>
          <h1 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-red-500" />
            Reporte de Rendimiento Comercial
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Métricas de conversión, evolución de ventas de fibra y ranking de asesores por sala.
          </p>
        </div>

        {/* Filters & Export */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Desde */}
          <div className="flex items-center gap-1 bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-2 py-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400">DESDE</span>
            <input
              type="date"
              value={filterDesde}
              onChange={(e) => setFilterDesde(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            />
          </div>

          {/* Hasta */}
          <div className="flex items-center gap-1 bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-2 py-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400">HASTA</span>
            <input
              type="date"
              value={filterHasta}
              onChange={(e) => setFilterHasta(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            />
          </div>

          {/* Sala */}
          {supervisorSala ? (
            <div className="px-3 py-1 bg-sky-950/60 border border-sky-700/60 rounded-lg text-xs font-bold text-sky-300">
              {supervisorSala}
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-2 py-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400">SALA</span>
              <select
                value={filterSala}
                onChange={(e) => setFilterSala(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-[#121218]">Todas</option>
                {salasUnicas.map((s) => (
                  <option key={s} value={s} className="bg-[#121218]">
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Campaña */}
          <div className="flex items-center gap-1 bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-2 py-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400">CAMP.</span>
            <select
              value={filterCampaña}
              onChange={(e) => setFilterCampaña(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-[#121218]">Todas</option>
              {CAMPAÑAS_LIST.map((c) => (
                <option key={c} value={c} className="bg-[#121218]">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Clean */}
          <button
            onClick={handleClear}
            title="Limpiar filtros"
            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg cursor-pointer transition-colors"
          >
            <FilterX className="w-3.5 h-3.5" />
          </button>

          {/* Export button */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400">
              TASA DE CONVERSIÓN
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {conversionRate}%
          </div>
          <span className="text-[10px] text-neutral-400">
            {ventasCount} ventas de {asignadosCount} asignados
          </span>
        </div>

        <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400">
              FACTIBILIDAD / COBERTURA
            </span>
            <Wifi className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-sky-400">
            {coberturaRate}%
          </div>
          <span className="text-[10px] text-neutral-400">
            {conCoberturaCount} con fibra confirmada
          </span>
        </div>

        <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400">
              TASA DE INSTALACIÓN
            </span>
            <CheckCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {instalacionRate}%
          </div>
          <span className="text-[10px] text-neutral-400">
            {instaladosCount} instalados de {ventasCount} ventas
          </span>
        </div>

        <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400">
              TOTAL LEADS FILTRADOS
            </span>
            <Target className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {totalLeads.toLocaleString()}
          </div>
          <span className="text-[10px] text-neutral-400">
            En base activa
          </span>
        </div>
      </div>

      {/* Charts Grid - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Embudo de Conversión */}
        <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-4 shadow-md">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-red-500" />
            Embudo de Conversión (Funnel)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={funnelData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f28" horizontal={false} />
                <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 10 }} />
                <YAxis
                  dataKey="etapa"
                  type="category"
                  stroke="#9ca3af"
                  tick={{ fontSize: 10 }}
                  width={140}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121218',
                    borderColor: '#2a2a38',
                    fontSize: '11px',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="cantidad" fill="#dc2626" radius={[0, 4, 4, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evolución Diaria: Asignados vs Ventas */}
        <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-4 shadow-md">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Evolución Diaria (Asignados vs Ventas)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyEvolution} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAsignados" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f28" />
                <XAxis dataKey="displayDate" stroke="#6b7280" tick={{ fontSize: 10 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121218',
                    borderColor: '#2a2a38',
                    fontSize: '11px',
                    borderRadius: '8px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area
                  type="monotone"
                  dataKey="asignados"
                  name="Leads Asignados"
                  stroke="#38bdf8"
                  fillOpacity={1}
                  fill="url(#colorAsignados)"
                />
                <Area
                  type="monotone"
                  dataKey="ventas"
                  name="Ventas Concretadas"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorVentas)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Grid - Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ventas por Sala */}
        <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-4 shadow-md">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
            Ventas por Sala
          </h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesBySalaData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f28" />
                <XAxis dataKey="sala" stroke="#6b7280" tick={{ fontSize: 10 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121218',
                    borderColor: '#2a2a38',
                    fontSize: '11px',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="ventas" name="Ventas" fill="#dc2626" radius={[4, 4, 0, 0]}>
                  {salesBySalaData.map((entry, index) => (
                    <Cell
                      key={`sala-${index}`}
                      fill={SALA_COLORS[entry.sala] || PALETTE[index % PALETTE.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leads y Ventas por Campaña */}
        <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-4 shadow-md lg:col-span-2">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
            Rendimiento por Campaña (Total Leads vs Ventas)
          </h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={salesByCampañaData}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f28" />
                <XAxis dataKey="campaña" stroke="#6b7280" tick={{ fontSize: 10 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121218',
                    borderColor: '#2a2a38',
                    fontSize: '11px',
                    borderRadius: '8px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="total" name="Total Leads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ventas" name="Ventas" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top 10 Asesores Leaderboard Table */}
      <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            Top 10 Asesores en Cierres de Venta
          </h2>
          <span className="text-xs text-neutral-400 font-mono">
            Ranking general por efectividad
          </span>
        </div>

        <div className="overflow-x-auto border border-[#1f1f28] rounded-lg">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#16161f] text-neutral-400 text-[10px] uppercase font-bold border-b border-[#1f1f28]">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">Puesto</th>
                <th className="py-2.5 px-3">Asesor</th>
                <th className="py-2.5 px-3">Sala</th>
                <th className="py-2.5 px-3 text-right">Leads Asignados</th>
                <th className="py-2.5 px-3 text-right">Ventas Concretadas</th>
                <th className="py-2.5 px-3 text-right">Conversión %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f28]/60 bg-[#0b0b0f]">
              {topAsesores.map((asesor, idx) => (
                <tr key={asesor.id} className="hover:bg-[#14141c]">
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full font-bold font-mono text-[10px] ${
                        idx === 0
                          ? 'bg-amber-400 text-black shadow-sm shadow-amber-400/50'
                          : idx === 1
                          ? 'bg-neutral-300 text-black'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-bold text-white">{asesor.nombre}</td>
                  <td className="py-2 px-3">
                    <span className="text-[10px] font-semibold text-neutral-300">
                      {asesor.sala}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-neutral-300">
                    {asesor.asignados}
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-emerald-400 font-bold">
                    {asesor.ventas}
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-white font-bold">
                    {asesor.tasaConversion}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
