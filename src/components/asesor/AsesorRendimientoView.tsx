import React, { useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  CheckCircle,
  Clock,
  Wifi,
  DollarSign,
  Calendar,
  Layers
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

const STATUS_COLORS: Record<string, string> = {
  Venta: '#10b981',
  Seguimiento: '#38bdf8',
  Pendiente: '#f59e0b',
  Reagendado: '#8b5cf6',
  'No interesado': '#6b7280',
  'Sin cobertura': '#ef4444',
  'Cliente con deuda': '#dc2626'
};

export const AsesorRendimientoView: React.FC = () => {
  const { currentUser } = useAuth();
  const { leads, planes } = useApp();

  // Strictly filter leads belonging ONLY to this advisor
  const myLeads = useMemo(() => {
    if (!currentUser) return [];
    const myId = currentUser.asesorAsociadoId;
    const myName = currentUser.nombreMostrar.trim().toUpperCase();

    return leads.filter((l) => {
      const matchId = myId && l.asesorId === myId;
      const matchName = l.asesorNombre && l.asesorNombre.trim().toUpperCase() === myName;
      return matchId || matchName;
    });
  }, [leads, currentUser]);

  // Overall advisor metrics
  const totalLeads = myLeads.length;
  const ventas = myLeads.filter((l) => l.tipifVendedor === 'Venta');
  const ventasCount = ventas.length;
  const pendientesCount = myLeads.filter((l) => (l.tipifVendedor || 'Pendiente') === 'Pendiente').length;
  const seguimientoCount = myLeads.filter((l) => l.tipifVendedor === 'Seguimiento').length;
  const instaladosCount = myLeads.filter((l) => l.estadoInstalacion === 'Instalada').length;

  const conversionRate = totalLeads > 0 ? ((ventasCount / totalLeads) * 100).toFixed(1) : '0.0';

  // Calculate total billing value of sold plans
  const totalFacturacion = useMemo(() => {
    let sum = 0;
    for (const v of ventas) {
      const plan = planes.find((p) => p.id === v.planId);
      sum += plan?.precio || 89.0;
    }
    return sum;
  }, [ventas, planes]);

  // 1. Daily Evolution of my leads and sales
  const dailyData = useMemo(() => {
    const map = new Map<string, { date: string; asignados: number; ventas: number }>();
    for (const l of myLeads) {
      const d = l.createdAt.split('T')[0];
      if (!map.has(d)) {
        map.set(d, { date: d, asignados: 0, ventas: 0 });
      }
      const item = map.get(d)!;
      item.asignados++;
      if (l.tipifVendedor === 'Venta') {
        item.ventas++;
      }
    }

    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)
      .map((item) => ({
        ...item,
        displayDate: item.date.slice(5) // MM-DD
      }));
  }, [myLeads]);

  // 2. Status distribution
  const statusPieData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of myLeads) {
      const st = l.tipifVendedor || 'Pendiente';
      counts.set(st, (counts.get(st) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([name, value]) => ({
      name,
      value,
      color: STATUS_COLORS[name] || '#94a3b8'
    }));
  }, [myLeads]);

  // 3. Plan breakdown of closed sales
  const plansData = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of ventas) {
      const plan = planes.find((p) => p.id === v.planId);
      const planName = plan ? plan.nombre.replace('WIN Fibra ', '') : 'Otros Planes';
      map.set(planName, (map.get(planName) || 0) + 1);
    }
    return Array.from(map.entries()).map(([plan, count]) => ({
      plan,
      ventas: count
    }));
  }, [ventas, planes]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Mi Rendimiento Comercial
            </h1>
            <span className="text-[10px] bg-sky-950/70 border border-sky-700/60 text-sky-300 font-bold px-2 py-0.5 rounded uppercase">
              {currentUser?.nombreMostrar} · {currentUser?.sala || 'SALA'}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Métricas personales de llamadas, tasa de cierre y facturación estimada.
          </p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400">
              MI CONVERSIÓN
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {conversionRate}%
          </div>
          <span className="text-[10px] text-neutral-400">
            {ventasCount} ventas de {totalLeads} leads
          </span>
        </div>

        <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400">
              VENTAS CERRADAS
            </span>
            <CheckCircle className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {ventasCount}
          </div>
          <span className="text-[10px] text-neutral-400">
            {instaladosCount} ya instaladas
          </span>
        </div>

        <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400">
              FACTURACIÓN GENERADA
            </span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            S/ {totalFacturacion.toFixed(2)}
          </div>
          <span className="text-[10px] text-neutral-400">
            Total en planes contratados
          </span>
        </div>

        <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400">
              POR ATENDER
            </span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400">
            {pendientesCount + seguimientoCount}
          </div>
          <span className="text-[10px] text-neutral-400">
            {pendientesCount} pend. / {seguimientoCount} seg.
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Evolution */}
        <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-4 shadow-md">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            Evolución de mis Asignaciones y Ventas (Últimos días)
          </h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAsignadosAsesor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorVentasAsesor" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#colorAsignadosAsesor)"
                />
                <Area
                  type="monotone"
                  dataKey="ventas"
                  name="Ventas Concretadas"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorVentasAsesor)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown Pie */}
        <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-4 shadow-md">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            Distribución de Mis Tipificaciones
          </h2>
          <div className="h-60 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121218',
                    borderColor: '#2a2a38',
                    fontSize: '11px',
                    borderRadius: '8px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
