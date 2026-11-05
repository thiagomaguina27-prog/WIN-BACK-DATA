import React, { useState } from 'react';
import { X, Save, MessageSquare, Send, CheckCircle, MapPin, User, Calendar, Zap, AlertCircle } from 'lucide-react';
import { Lead, Cobertura, EstadoInstalacion, TipifBack, TipifVendedor } from '../../types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { TIPIF_BACK_LIST, TIPIF_VENDEDOR_LIST, CAMPAÑAS_LIST } from '../../data/initialData';

interface LeadEditModalProps {
  lead: Lead;
  onClose: () => void;
}

export const LeadEditModal: React.FC<LeadEditModalProps> = ({ lead, onClose }) => {
  const { updateLead, planes, asesores, addNote, duplicateN1Set } = useApp();
  const { currentUser } = useAuth();

  // Form fields
  const [campaña, setCampaña] = useState(lead.campaña);
  const [n1, setN1] = useState(lead.n1);
  const [n2, setN2] = useState(lead.n2 || '');
  const [usuarioWhatsapp, setUsuarioWhatsapp] = useState(lead.usuarioWhatsapp || '');
  const [departamento, setDepartamento] = useState(lead.departamento);
  const [provincia, setProvincia] = useState(lead.provincia);
  const [distrito, setDistrito] = useState(lead.distrito);

  // Fiber specific fields
  const [dni, setDni] = useState(lead.dni || '');
  const [nombreCliente, setNombreCliente] = useState(lead.nombreCliente || '');
  const [direccion, setDireccion] = useState(lead.direccion || '');
  const [referencia, setReferencia] = useState(lead.referencia || '');
  const [planId, setPlanId] = useState(lead.planId || planes[0]?.id || '');
  const [cobertura, setCobertura] = useState<Cobertura>(lead.cobertura || 'Con cobertura');
  const [estadoInstalacion, setEstadoInstalacion] = useState<EstadoInstalacion>(
    lead.estadoInstalacion || 'Pendiente de programar'
  );
  const [fechaInstalacion, setFechaInstalacion] = useState(lead.fechaInstalacion || '');

  // Tipifications
  const [tipifBack1, setTipifBack1] = useState<TipifBack | undefined>(lead.tipifBack1);
  const [tipifBack2, setTipifBack2] = useState<TipifBack | undefined>(lead.tipifBack2);
  const [tipifVendedor, setTipifVendedor] = useState<TipifVendedor>(lead.tipifVendedor || 'Pendiente');
  const [asesorId, setAsesorId] = useState(lead.asesorId || '');

  // Call note input
  const [newNoteText, setNewNoteText] = useState('');

  const isDuplicate = duplicateN1Set.has(n1.trim());

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateLead(lead.id, {
      campaña,
      n1: n1.trim(),
      n2: n2.trim() || undefined,
      usuarioWhatsapp: usuarioWhatsapp.trim() || undefined,
      departamento,
      provincia,
      distrito,
      dni: dni.trim() || undefined,
      nombreCliente: nombreCliente.trim() || undefined,
      direccion: direccion.trim() || undefined,
      referencia: referencia.trim() || undefined,
      planId,
      cobertura,
      estadoInstalacion,
      fechaInstalacion: fechaInstalacion || undefined,
      tipifBack1,
      tipifBack2,
      tipifVendedor,
      asesorId: asesorId || undefined
    });
    onClose();
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const authorName = currentUser?.nombreMostrar || 'Operador';
    addNote(lead.id, authorName, newNoteText);
    setNewNoteText('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#121218] border border-[#1f1f28] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#1f1f28] flex items-center justify-between bg-[#16161f]/60 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600/15 border border-red-600/30 flex items-center justify-center text-red-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Detalles del Lead: {n1}
                </h2>
                {isDuplicate && (
                  <span className="text-[10px] bg-red-950/60 border border-red-700/60 text-red-400 font-bold px-2 py-0.5 rounded">
                    DUPLICADO
                  </span>
                )}
                <span className="text-[10px] bg-neutral-800 text-neutral-300 font-medium px-2 py-0.5 rounded">
                  Camp: {lead.campaña}
                </span>
                <span className="text-[10px] bg-purple-950/50 border border-purple-800/40 text-purple-300 font-medium px-2 py-0.5 rounded">
                  {lead.rotaciones} Rotac.
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Creado: {new Date(lead.createdAt).toLocaleString('es-PE')} · Ubigeo: {lead.distrito}, {lead.provincia}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md bg-neutral-800/70 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <form id="lead-edit-form" onSubmit={handleSave} className="space-y-5">
            {/* Seccion 1: Contacto y Campaña */}
            <div>
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-red-500" />
                1. Datos de Contacto y Campaña
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#0b0b0f] p-3.5 rounded-lg border border-[#1f1f28]">
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                    CAMPAÑA
                  </label>
                  <select
                    value={campaña}
                    onChange={(e) => setCampaña(e.target.value)}
                    className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-600"
                  >
                    {CAMPAÑAS_LIST.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                    N1 (CELULAR PRINCIPAL)
                  </label>
                  <input
                    type="text"
                    maxLength={9}
                    value={n1}
                    onChange={(e) => setN1(e.target.value.replace(/\D/g, ''))}
                    className={`w-full bg-[#16161f] border rounded px-2.5 py-1.5 text-xs font-mono tabular-nums text-white focus:outline-none ${
                      isDuplicate ? 'border-red-600 text-red-400' : 'border-[#1f1f28] focus:border-red-600'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                    N2 (CELULAR SECUNDARIO)
                  </label>
                  <input
                    type="text"
                    maxLength={9}
                    value={n2}
                    onChange={(e) => setN2(e.target.value.replace(/\D/g, ''))}
                    placeholder="Opcional"
                    className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-2.5 py-1.5 text-xs font-mono tabular-nums text-white focus:outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                    USUARIO WHATSAPP
                  </label>
                  <input
                    type="text"
                    value={usuarioWhatsapp}
                    onChange={(e) => setUsuarioWhatsapp(e.target.value)}
                    placeholder="@usuario"
                    className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>
            </div>

            {/* Seccion 2: Datos del Cliente e Instalación de Fibra Óptica */}
            <div>
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                2. Cliente y Factibilidad de Fibra Óptica
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#0b0b0f] p-3.5 rounded-lg border border-[#1f1f28]">
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                    DNI DEL CLIENTE (8 DÍGITOS)
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    value={dni}
                    onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                    placeholder="87654321"
                    className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-2.5 py-1.5 text-xs font-mono tabular-nums text-white focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                    NOMBRE COMPLETO DEL CLIENTE
                  </label>
                  <input
                    type="text"
                    value={nombreCliente}
                    onChange={(e) => setNombreCliente(e.target.value)}
                    placeholder="Nombre y Apellidos"
                    className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                    DIRECCIÓN EXACTA DE INSTALACIÓN
                  </label>
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Av. / Calle / Jr. / Mz. Lt. / Dpto"
                    className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                    DISTRITO / CIUDAD
                  </label>
                  <input
                    type="text"
                    value={`${distrito}, ${provincia}`}
                    disabled
                    className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-2.5 py-1.5 text-xs text-neutral-400 opacity-80"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                    REFERENCIA DE UBICACIÓN
                  </label>
                  <input
                    type="text"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    placeholder="Frente a parque, altura de paradero..."
                    className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>
            </div>

            {/* Seccion 3: Plan, Cobertura y Programación */}
            <div>
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-red-500" />
                3. Plan WIN y Estado de Instalación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#0b0b0f] p-3.5 rounded-lg border border-[#1f1f28]">
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                    PLAN OFERTADO / VENDIDO
                  </label>
                  <select
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                    className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-600"
                  >
                    {planes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} (S/ {p.precio.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                    COBERTURA TÉCNICA
                  </label>
                  <select
                    value={cobertura}
                    onChange={(e) => setCobertura(e.target.value as Cobertura)}
                    className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-600"
                  >
                    <option value="Con cobertura">Con cobertura (Aprobado)</option>
                    <option value="Sin cobertura">Sin cobertura</option>
                    <option value="Por validar">Por validar (En estudio)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                    ESTADO DE INSTALACIÓN
                  </label>
                  <select
                    value={estadoInstalacion}
                    onChange={(e) => setEstadoInstalacion(e.target.value as EstadoInstalacion)}
                    className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-600"
                  >
                    <option value="Pendiente de programar">Pendiente de programar</option>
                    <option value="Programada">Programada</option>
                    <option value="Instalada">Instalada (Activo)</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                    FECHA DE INSTALACIÓN
                  </label>
                  <input
                    type="date"
                    value={fechaInstalacion}
                    onChange={(e) => setFechaInstalacion(e.target.value)}
                    className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>
            </div>

            {/* Seccion 4: Asignación y Tipificaciones */}
            <div>
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-red-500" />
                4. Asignación a Asesor y Tipificaciones
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#0b0b0f] p-3.5 rounded-lg border border-[#1f1f28]">
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                    ASESOR ASIGNADO
                  </label>
                  <select
                    value={asesorId}
                    onChange={(e) => setAsesorId(e.target.value)}
                    className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-600 truncate"
                  >
                    <option value="">(Sin asignar)</option>
                    {asesores.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombreCompleto} · {a.sala}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                    TIPIF. BACK 1
                  </label>
                  <select
                    value={tipifBack1 || ''}
                    onChange={(e) => setTipifBack1((e.target.value as TipifBack) || undefined)}
                    className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-600"
                  >
                    <option value="">(Sin tipificar)</option>
                    {TIPIF_BACK_LIST.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                    TIPIF. BACK 2
                  </label>
                  <select
                    value={tipifBack2 || ''}
                    onChange={(e) => setTipifBack2((e.target.value as TipifBack) || undefined)}
                    className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-600"
                  >
                    <option value="">(Sin tipificar)</option>
                    {TIPIF_BACK_LIST.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                    TIPIF. VENDEDOR
                  </label>
                  <select
                    value={tipifVendedor}
                    onChange={(e) => setTipifVendedor(e.target.value as TipifVendedor)}
                    className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-600"
                  >
                    {TIPIF_VENDEDOR_LIST.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </form>

          {/* Seccion 5: Historial de Notas de Llamada */}
          <div className="border-t border-[#1f1f28] pt-4">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-red-500" />
              Historial de Notas y Bitácora de Llamadas
            </h3>

            {/* Add note input */}
            <form onSubmit={handleAddNote} className="flex gap-2 mb-3">
              <input
                type="text"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Escribe una observación de llamada (ej. Cliente pide llamar mañana 3pm)..."
                className="flex-1 bg-[#0b0b0f] border border-[#1f1f28] rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-600"
              />
              <button
                type="submit"
                disabled={!newNoteText.trim()}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Send className="w-3 h-3" />
                <span>Agregar Nota</span>
              </button>
            </form>

            {/* Notes list */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {lead.notas && lead.notas.length > 0 ? (
                lead.notas.map((nota) => (
                  <div
                    key={nota.id}
                    className="bg-[#0b0b0f] border border-[#1f1f28] rounded-lg p-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                      <span className="font-semibold text-neutral-200">{nota.autor}</span>
                      <span className="font-mono text-neutral-500">{nota.fechaHora}</span>
                    </div>
                    <p className="text-neutral-300 leading-relaxed">{nota.texto}</p>
                  </div>
                ))
              ) : (
                <p className="text-neutral-500 text-xs italic py-2">
                  No hay observaciones registradas para este lead todavía.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#1f1f28] bg-[#16161f]/60 rounded-b-xl flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="lead-edit-form"
            className="px-5 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-md shadow-red-950/40"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>
    </div>
  );
};
