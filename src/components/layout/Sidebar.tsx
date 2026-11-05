import React, { useState, useMemo } from 'react';
import {
  Database,
  UploadCloud,
  RefreshCw,
  BarChart3,
  Users,
  ShieldAlert,
  Plus,
  RotateCcw,
  AlertTriangle,
  Phone,
  CheckCircle2,
  Award,
  Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { CAMPAÑAS_LIST } from '../../data/initialData';
import { UBIGEO_PERU } from '../../data/ubigeo';

export interface SidebarProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const { currentUser, canAccessRoute } = useAuth();
  const { addLead, duplicateN1Set } = useApp();

  // "AGREGAR REGISTRO" Form state
  const [campaña, setCampaña] = useState(CAMPAÑAS_LIST[0]);
  const [n1, setN1] = useState('');
  const [n2, setN2] = useState('');
  const [usuarioWhatsapp, setUsuarioWhatsapp] = useState('');
  const [departamento, setDepartamento] = useState('Lima');
  const [provincia, setProvincia] = useState('Lima');
  const [distrito, setDistrito] = useState('San Juan de Lurigancho');
  const [formError, setFormError] = useState<string | null>(null);

  // Cascading ubigeo
  const departamentosList = useMemo(() => Object.keys(UBIGEO_PERU), []);
  const provinciasList = useMemo(() => {
    return UBIGEO_PERU[departamento] ? Object.keys(UBIGEO_PERU[departamento]) : [];
  }, [departamento]);
  const distritosList = useMemo(() => {
    return UBIGEO_PERU[departamento]?.[provincia] || [];
  }, [departamento, provincia]);

  const handleDeptChange = (newDept: string) => {
    setDepartamento(newDept);
    const provs = Object.keys(UBIGEO_PERU[newDept] || {});
    const firstProv = provs[0] || '';
    setProvincia(firstProv);
    const dists = UBIGEO_PERU[newDept]?.[firstProv] || [];
    setDistrito(dists[0] || '');
  };

  const handleProvChange = (newProv: string) => {
    setProvincia(newProv);
    const dists = UBIGEO_PERU[departamento]?.[newProv] || [];
    setDistrito(dists[0] || '');
  };

  // Duplicate N1 check live
  const isDuplicateN1 = useMemo(() => {
    const clean = n1.trim();
    if (clean.length < 9) return false;
    return duplicateN1Set.has(clean);
  }, [n1, duplicateN1Set]);

  const handleClearForm = () => {
    setN1('');
    setN2('');
    setUsuarioWhatsapp('');
    setFormError(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanN1 = n1.trim();
    if (!cleanN1 || cleanN1.length !== 9 || !cleanN1.startsWith('9')) {
      setFormError('N1 debe ser celular peruano de 9 dígitos (inicia con 9)');
      return;
    }

    const cleanN2 = n2.trim();
    if (cleanN2 && (cleanN2.length !== 9 || !cleanN2.startsWith('9'))) {
      setFormError('N2 debe ser celular de 9 dígitos');
      return;
    }

    const isAsesor = currentUser?.rol === 'Asesor';

    addLead({
      campaña,
      n1: cleanN1,
      n2: cleanN2 || undefined,
      usuarioWhatsapp: usuarioWhatsapp.trim() || undefined,
      departamento,
      provincia,
      distrito,
      tipifBack1: 'Agendado',
      tipifVendedor: 'Pendiente',
      cobertura: 'Con cobertura',
      estadoInstalacion: 'Pendiente de programar',
      asesorId: isAsesor ? currentUser?.asesorAsociadoId || currentUser?.id : undefined,
      asesorNombre: isAsesor ? currentUser?.nombreMostrar : undefined,
      sala: isAsesor ? currentUser?.sala || 'SALA 1' : undefined
    });

    handleClearForm();
  };

  return (
    <aside className="fixed top-14 left-0 bottom-0 w-[205px] bg-[#121218] border-r border-[#1f1f28] z-30 flex flex-col justify-between overflow-y-auto select-none">
      {/* Navigation Groups */}
      <div className="p-2 space-y-4">
        {/* ROL ASESOR MENU: LLAMADAS, RENDIMIENTO, VENTAS SUBIDAS */}
        {currentUser?.rol === 'Asesor' && (
          <div>
            <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center justify-between">
              <span>MI TRABAJO</span>
              <span className="text-red-400 font-mono text-[9px]">{currentUser.sala || 'SALA'}</span>
            </div>
            <div className="mt-1 space-y-0.5">
              <button
                onClick={() => onNavigate('llamadas')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer text-left ${
                  currentView === 'llamadas'
                    ? 'bg-[#dc2626] text-white shadow-sm'
                    : 'text-neutral-300 hover:bg-[#1a1a24] hover:text-white'
                }`}
              >
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span>Llamadas</span>
              </button>

              <button
                onClick={() => onNavigate('rendimiento')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer text-left ${
                  currentView === 'rendimiento'
                    ? 'bg-[#dc2626] text-white shadow-sm'
                    : 'text-neutral-300 hover:bg-[#1a1a24] hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5 shrink-0" />
                <span>Rendimiento</span>
              </button>

              <button
                onClick={() => onNavigate('ventas-subidas')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer text-left ${
                  currentView === 'ventas-subidas'
                    ? 'bg-[#dc2626] text-white shadow-sm'
                    : 'text-neutral-300 hover:bg-[#1a1a24] hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span>Ventas Subidas</span>
              </button>
            </div>
          </div>
        )}

        {/* ROL SUPERVISOR MENU: RENDIMIENTO Y AVANCE ASESORES DE SU SALA */}
        {currentUser?.rol === 'Supervisor' && (
          <div>
            <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center justify-between">
              <span>SUPERVISIÓN</span>
              <span className="text-sky-400 font-mono text-[9px]">{currentUser.sala || 'SALA'}</span>
            </div>
            <div className="mt-1 space-y-0.5">
              <button
                onClick={() => onNavigate('rendimiento')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer text-left ${
                  currentView === 'rendimiento'
                    ? 'bg-[#dc2626] text-white shadow-sm'
                    : 'text-neutral-300 hover:bg-[#1a1a24] hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                <span>Rendimiento Sala</span>
              </button>

              <button
                onClick={() => onNavigate('avance')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer text-left ${
                  currentView === 'avance'
                    ? 'bg-[#dc2626] text-white shadow-sm'
                    : 'text-neutral-300 hover:bg-[#1a1a24] hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Mis Asesores</span>
              </button>
            </div>
          </div>
        )}

        {/* ROL ADMIN Y BACK MENU */}
        {(currentUser?.rol === 'Admin' || currentUser?.rol === 'Back') && (
          <>
            <div>
              <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                {currentUser?.rol === 'Back' ? 'OPERACIONES BACK DATA' : 'PRINCIPAL'}
              </div>
              <div className="mt-1 space-y-0.5">
                <button
                  onClick={() => onNavigate('base')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer text-left ${
                    currentView === 'base'
                      ? 'bg-[#dc2626] text-white shadow-sm'
                      : 'text-neutral-300 hover:bg-[#1a1a24] hover:text-white'
                  }`}
                >
                  <Database className="w-3.5 h-3.5 shrink-0" />
                  <span>Base General</span>
                </button>

                <button
                  onClick={() => onNavigate('carga-masiva')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer text-left ${
                    currentView === 'carga-masiva'
                      ? 'bg-[#dc2626] text-white shadow-sm'
                      : 'text-neutral-300 hover:bg-[#1a1a24] hover:text-white'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5 shrink-0" />
                  <span>Carga Masiva N1</span>
                </button>

                <button
                  onClick={() => onNavigate('rotacion')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer text-left ${
                    currentView === 'rotacion'
                      ? 'bg-[#dc2626] text-white shadow-sm'
                      : 'text-neutral-300 hover:bg-[#1a1a24] hover:text-white'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                  <span>Rotación inteligente</span>
                </button>
              </div>
            </div>

            <div>
              <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                REPORTES Y SALAS
              </div>
              <div className="mt-1 space-y-0.5">
                <button
                  onClick={() => onNavigate('rendimiento')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer text-left ${
                    currentView === 'rendimiento'
                      ? 'bg-[#dc2626] text-white shadow-sm'
                      : 'text-neutral-300 hover:bg-[#1a1a24] hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                  <span>Rendimiento Global</span>
                </button>

                <button
                  onClick={() => onNavigate('avance')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer text-left ${
                    currentView === 'avance'
                      ? 'bg-[#dc2626] text-white shadow-sm'
                      : 'text-neutral-300 hover:bg-[#1a1a24] hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span>Avance Asesores</span>
                </button>
              </div>
            </div>

            {currentUser?.rol === 'Admin' && (
              <div>
                <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  ADMINISTRACIÓN
                </div>
                <div className="mt-1 space-y-0.5">
                  <button
                    onClick={() => onNavigate('usuarios')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer text-left ${
                      currentView === 'usuarios'
                        ? 'bg-[#dc2626] text-white shadow-sm'
                        : 'text-neutral-300 hover:bg-[#1a1a24] hover:text-white'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>Usuarios y Salas</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Formulario fijo "AGREGAR REGISTRO" al final (para Admin, Back y Asesor en su base) */}
      {currentUser?.rol !== 'Supervisor' && (
        <div className="p-2.5 border-t border-[#1f1f28] bg-[#0d0d12]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">
              {currentUser?.rol === 'Asesor' ? 'REGISTRAR A MI BASE' : 'AGREGAR REGISTRO'}
            </span>
            {currentUser?.rol === 'Asesor' && (
              <span className="text-[9px] text-red-400 font-mono font-bold">
                {currentUser?.sala || 'SALA'}
              </span>
            )}
          </div>

          <form onSubmit={handleAddSubmit} className="space-y-1.5 text-[11px]">
            {/* Campaña */}
            <div>
              <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-0.5">
                CAMPAÑA
              </label>
              <select
                value={campaña}
                onChange={(e) => setCampaña(e.target.value)}
                className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-red-600"
              >
                {CAMPAÑAS_LIST.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* N1 */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[9px] uppercase font-bold text-neutral-400">
                  N1 (CELULAR)
                </label>
                {isDuplicateN1 && (
                  <span className="text-[9px] text-red-400 font-bold flex items-center gap-0.5">
                    <AlertTriangle className="w-2.5 h-2.5" /> DUPLICADO
                  </span>
                )}
              </div>
              <input
                type="text"
                maxLength={9}
                value={n1}
                onChange={(e) => setN1(e.target.value.replace(/\D/g, ''))}
                placeholder="9XXXXXXXX"
                className={`w-full bg-[#16161f] border rounded px-2 py-1 text-[11px] font-mono tabular-nums focus:outline-none ${
                  isDuplicateN1
                    ? 'border-red-600 text-red-400 bg-red-950/20'
                    : 'border-[#1f1f28] text-white focus:border-red-600'
                }`}
              />
            </div>

            {/* N2 (opcional) */}
            <div>
              <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-0.5">
                N2 (OPCIONAL)
              </label>
              <input
                type="text"
                maxLength={9}
                value={n2}
                onChange={(e) => setN2(e.target.value.replace(/\D/g, ''))}
                placeholder="9XXXXXXXX"
                className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-2 py-1 text-[11px] text-white font-mono tabular-nums focus:outline-none focus:border-red-600"
              />
            </div>

            {/* Usuario WhatsApp */}
            <div>
              <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-0.5">
                USUARIO WHATSAPP
              </label>
              <input
                type="text"
                value={usuarioWhatsapp}
                onChange={(e) => setUsuarioWhatsapp(e.target.value)}
                placeholder="@usuario_win"
                className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-red-600"
              />
            </div>

            {/* Ubigeo Cascada */}
            <div className="grid grid-cols-2 gap-1">
              <div>
                <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-0.5">
                  DEPTO
                </label>
                <select
                  value={departamento}
                  onChange={(e) => handleDeptChange(e.target.value)}
                  className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-1.5 py-1 text-[10px] text-white focus:outline-none"
                >
                  {departamentosList.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-0.5">
                  PROV
                </label>
                <select
                  value={provincia}
                  onChange={(e) => handleProvChange(e.target.value)}
                  className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-1.5 py-1 text-[10px] text-white focus:outline-none"
                >
                  {provinciasList.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-0.5">
                DISTRITO
              </label>
              <select
                value={distrito}
                onChange={(e) => setDistrito(e.target.value)}
                className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-1.5 py-1 text-[10px] text-white focus:outline-none truncate"
              >
                {distritosList.map((dst) => (
                  <option key={dst} value={dst}>
                    {dst}
                  </option>
                ))}
              </select>
            </div>

            {formError && (
              <p className="text-[10px] text-red-400 leading-tight pt-0.5">{formError}</p>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={handleClearForm}
                className="flex-1 py-1 px-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Limpiar</span>
              </button>
              <button
                type="submit"
                className="flex-1 py-1 px-1.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
              >
                <Plus className="w-3 h-3" />
                <span>+ Agregar</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </aside>
  );
};
