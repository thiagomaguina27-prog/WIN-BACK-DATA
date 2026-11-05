import React, { useState, useRef, useMemo } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Check,
  AlertCircle,
  ArrowRight,
  Download,
  RefreshCw,
  Database,
  ClipboardList,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import { Lead } from '../../types';
import { CAMPAÑAS_LIST } from '../../data/initialData';
import { UBIGEO_PERU } from '../../data/ubigeo';

interface ColumnMapping {
  campaña: string;
  n1: string;
  n2: string;
  usuarioWhatsapp: string;
  departamento: string;
  provincia: string;
  distrito: string;
}

export const CargaMasivaView: React.FC = () => {
  const { batchImport, duplicateN1Set, asesores, showToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab mode: 'paste' (Pegar lista N1) or 'file' (Excel / CSV)
  const [activeTab, setActiveTab] = useState<'paste' | 'file'>('paste');

  // ---------------- STATE PARA PEGAR LISTA N1 ----------------
  const [pastedText, setPastedText] = useState('');
  const [pasteCampaña, setPasteCampaña] = useState(CAMPAÑAS_LIST[0]);
  const [pasteDepartamento, setPasteDepartamento] = useState('Lima');
  const [pasteProvincia, setPasteProvincia] = useState('Lima');
  const [pasteDistrito, setPasteDistrito] = useState('San Juan de Lurigancho');
  const [pasteAsesorId, setPasteAsesorId] = useState('');

  // Ubigeo lists for paste mode
  const departamentosList = useMemo(() => Object.keys(UBIGEO_PERU), []);
  const provinciasList = useMemo(() => {
    return UBIGEO_PERU[pasteDepartamento] ? Object.keys(UBIGEO_PERU[pasteDepartamento]) : [];
  }, [pasteDepartamento]);
  const distritosList = useMemo(() => {
    return UBIGEO_PERU[pasteDepartamento]?.[pasteProvincia] || [];
  }, [pasteDepartamento, pasteProvincia]);

  const handlePasteDeptChange = (newDept: string) => {
    setPasteDepartamento(newDept);
    const provs = Object.keys(UBIGEO_PERU[newDept] || {});
    const firstProv = provs[0] || '';
    setPasteProvincia(firstProv);
    const dists = UBIGEO_PERU[newDept]?.[firstProv] || [];
    setPasteDistrito(dists[0] || '');
  };

  const handlePasteProvChange = (newProv: string) => {
    setPasteProvincia(newProv);
    const dists = UBIGEO_PERU[pasteDepartamento]?.[newProv] || [];
    setPasteDistrito(dists[0] || '');
  };

  // Live analysis of pasted N1 numbers
  const pasteAnalysis = useMemo(() => {
    if (!pastedText.trim()) {
      return { totalFound: 0, validNew: [], duplicatesInBase: [], invalid: [] };
    }

    // Split by newlines, commas, semicolons or spaces
    const tokens = pastedText
      .split(/[\r\n,;\t]+/)
      .map((t) => t.trim().replace(/\D/g, ''))
      .filter((t) => t.length > 0);

    const validNew: string[] = [];
    const duplicatesInBase: string[] = [];
    const invalid: string[] = [];
    const seenInText = new Set<string>();

    for (const num of tokens) {
      if (num.length !== 9 || !num.startsWith('9')) {
        invalid.push(num);
        continue;
      }

      if (duplicateN1Set.has(num) || seenInText.has(num)) {
        duplicatesInBase.push(num);
      } else {
        validNew.push(num);
        seenInText.add(num);
      }
    }

    return {
      totalFound: tokens.length,
      validNew,
      duplicatesInBase,
      invalid
    };
  }, [pastedText, duplicateN1Set]);

  const handleImportPastedN1 = () => {
    if (pasteAnalysis.validNew.length === 0) {
      showToast('No se encontraron números N1 válidos nuevos para importar', 'error');
      return;
    }

    const leadsToImport: Array<
      Omit<Lead, 'id' | 'createdAt' | 'rotaciones' | 'historialAsesores' | 'notas'>
    > = pasteAnalysis.validNew.map((num) => ({
      campaña: pasteCampaña,
      n1: num,
      departamento: pasteDepartamento,
      provincia: pasteProvincia,
      distrito: pasteDistrito,
      tipifBack1: 'Agendado',
      tipifVendedor: 'Pendiente',
      cobertura: 'Con cobertura',
      estadoInstalacion: 'Pendiente de programar',
      asesorId: pasteAsesorId || undefined
    }));

    batchImport(leadsToImport);
    setPastedText('');
  };

  const handleLoadSamplePastedNumbers = () => {
    const sample = [
      '984556677',
      '972112233',
      '981998877',
      '995443322',
      '991223344', // will flag if duplicate
      '983776655',
      '979665544',
      '988112299'
    ].join('\n');
    setPastedText(sample);
  };

  // ---------------- STATE PARA ARCHIVO EXCEL/CSV ----------------
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({
    campaña: '',
    n1: '',
    n2: '',
    usuarioWhatsapp: '',
    departamento: '',
    provincia: '',
    distrito: ''
  });
  const [isDragging, setIsDragging] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    validNew: number;
    duplicates: number;
  } | null>(null);

  // Parse Excel or CSV
  const handleProcessFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });

        if (!json || json.length < 2) {
          showToast('El archivo no contiene filas de datos suficientes', 'error');
          return;
        }

        const headers: string[] = (json[0] as string[]).map((h) => String(h || '').trim());
        const dataRows = json.slice(1).filter((r) => r.length > 0);

        setRawHeaders(headers);
        setRawRows(dataRows);

        // Auto-detect mappings based on header names
        const autoMap: ColumnMapping = {
          campaña: headers.find((h) => /camp|origen/i.test(h)) || headers[0] || '',
          n1: headers.find((h) => /n1|celular|telefono|movil|fono/i.test(h)) || headers[1] || '',
          n2: headers.find((h) => /n2|alt|segundo/i.test(h)) || '',
          usuarioWhatsapp: headers.find((h) => /whats|ws|app/i.test(h)) || '',
          departamento: headers.find((h) => /dep|ciudad/i.test(h)) || '',
          provincia: headers.find((h) => /prov/i.test(h)) || '',
          distrito: headers.find((h) => /dist/i.test(h)) || ''
        };
        setMapping(autoMap);

        analyzeRows(dataRows, autoMap.n1, headers);
      } catch {
        showToast('Error al leer el archivo Excel/CSV', 'error');
      }
    };

    reader.readAsBinaryString(file);
  };

  const analyzeRows = (rows: any[], n1Header: string, headers: string[]) => {
    const n1Index = headers.indexOf(n1Header);
    if (n1Index === -1) {
      setImportSummary({ total: rows.length, validNew: rows.length, duplicates: 0 });
      return;
    }

    let dupCount = 0;
    let newCount = 0;
    const seenInBatch = new Set<string>();

    for (const row of rows) {
      const val = String(row[n1Index] || '').replace(/\D/g, '');
      if (val) {
        if (duplicateN1Set.has(val) || seenInBatch.has(val)) {
          dupCount++;
        } else {
          newCount++;
          seenInBatch.add(val);
        }
      }
    }

    setImportSummary({ total: rows.length, validNew: newCount, duplicates: dupCount });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    const updated = { ...mapping, [field]: value };
    setMapping(updated);
    if (rawRows.length > 0 && rawHeaders.length > 0) {
      analyzeRows(rawRows, updated.n1, rawHeaders);
    }
  };

  const handleImportFile = () => {
    if (!mapping.n1) {
      showToast('Debes mapear al menos la columna N1 (Celular)', 'error');
      return;
    }

    const n1Idx = rawHeaders.indexOf(mapping.n1);
    const n2Idx = mapping.n2 ? rawHeaders.indexOf(mapping.n2) : -1;
    const campIdx = mapping.campaña ? rawHeaders.indexOf(mapping.campaña) : -1;
    const wsIdx = mapping.usuarioWhatsapp ? rawHeaders.indexOf(mapping.usuarioWhatsapp) : -1;
    const depIdx = mapping.departamento ? rawHeaders.indexOf(mapping.departamento) : -1;
    const provIdx = mapping.provincia ? rawHeaders.indexOf(mapping.provincia) : -1;
    const distIdx = mapping.distrito ? rawHeaders.indexOf(mapping.distrito) : -1;

    const leadsToImport: Array<
      Omit<Lead, 'id' | 'createdAt' | 'rotaciones' | 'historialAsesores' | 'notas'>
    > = [];

    for (const row of rawRows) {
      const cleanN1 = String(row[n1Idx] || '').replace(/\D/g, '');
      if (!cleanN1 || cleanN1.length !== 9 || !cleanN1.startsWith('9')) {
        continue;
      }

      const cleanN2 = n2Idx !== -1 ? String(row[n2Idx] || '').replace(/\D/g, '') : undefined;
      const camp = campIdx !== -1 && row[campIdx] ? String(row[campIdx]).trim() : 'NXO3';
      const ws = wsIdx !== -1 && row[wsIdx] ? String(row[wsIdx]).trim() : undefined;
      const dep = depIdx !== -1 && row[depIdx] ? String(row[depIdx]).trim() : 'Lima';
      const prov = provIdx !== -1 && row[provIdx] ? String(row[provIdx]).trim() : 'Lima';
      const dist = distIdx !== -1 && row[distIdx] ? String(row[distIdx]).trim() : 'San Juan de Lurigancho';

      leadsToImport.push({
        campaña: camp,
        n1: cleanN1,
        n2: cleanN2 && cleanN2.length === 9 ? cleanN2 : undefined,
        usuarioWhatsapp: ws,
        departamento: dep,
        provincia: prov,
        distrito: dist,
        tipifBack1: 'Agendado',
        tipifVendedor: 'Pendiente',
        cobertura: 'Con cobertura',
        estadoInstalacion: 'Pendiente de programar'
      });
    }

    if (leadsToImport.length === 0) {
      showToast('No se encontraron registros con celulares válidos de 9 dígitos', 'error');
      return;
    }

    batchImport(leadsToImport);
    setRawHeaders([]);
    setRawRows([]);
    setFileName(null);
    setImportSummary(null);
  };

  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        Campaña: 'NXO3',
        N1: '984556677',
        N2: '981223344',
        'Usuario WhatsApp': '@carlos_win',
        Departamento: 'Lima',
        Provincia: 'Lima',
        Distrito: 'Santiago de Surco'
      },
      {
        Campaña: 'K9',
        N1: '992334455',
        N2: '',
        'Usuario WhatsApp': '@maria_hogar',
        Departamento: 'Lima',
        Provincia: 'Lima',
        Distrito: 'San Borja'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Leads WIN');
    XLSX.writeFile(wb, 'Plantilla_Carga_Masiva_WIN.xlsx');
    showToast('Plantilla Excel descargada', 'info');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div>
          <h1 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-red-500" />
            Carga Masiva de Leads
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Pega una lista directa de números N1 o sube archivos Excel/CSV para alimentar la Base General.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-[#0b0b0f] p-1 border border-[#1f1f28] rounded-lg">
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-colors ${
              activeTab === 'paste'
                ? 'bg-[#dc2626] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Pegar Lista de N1</span>
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-colors ${
              activeTab === 'file'
                ? 'bg-[#dc2626] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Archivo Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* ---------------- PESTAÑA: PEGAR LISTA N1 ---------------- */}
      {activeTab === 'paste' && (
        <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f1f28] pb-3">
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-red-500" />
                Pegado Directo de Celulares N1 (Línea o Separados por Coma)
              </h2>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Copia y pega desde WhatsApp, bloc de notas o Excel. El sistema extraerá y validará automáticamente cada número de 9 dígitos.
              </p>
            </div>

            <button
              onClick={handleLoadSamplePastedNumbers}
              className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1 bg-[#16161f] px-2.5 py-1 rounded border border-[#2a2a38] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Cargar ejemplo rápido</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Textarea input */}
            <div className="lg:col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider block">
                PEGA AQUÍ LA LISTA DE CELULARES N1:
              </label>
              <textarea
                rows={10}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Ejemplo:&#10;984123456&#10;991887766&#10;972554433, 988776655&#10;979112233"
                className="w-full bg-[#0b0b0f] border border-[#1f1f28] rounded-xl p-3 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-red-600 resize-none tabular-nums"
              />
            </div>

            {/* Right: Default configuration */}
            <div className="bg-[#0b0b0f] border border-[#1f1f28] rounded-xl p-4 space-y-3 text-xs">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider block border-b border-[#1f1f28] pb-2">
                CONFIGURACIÓN DE ASIGNACIÓN
              </span>

              {/* Campaña */}
              <div>
                <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                  CAMPAÑA
                </label>
                <select
                  value={pasteCampaña}
                  onChange={(e) => setPasteCampaña(e.target.value)}
                  className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                >
                  {CAMPAÑAS_LIST.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ubigeo en cascada */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                    DEPARTAMENTO
                  </label>
                  <select
                    value={pasteDepartamento}
                    onChange={(e) => handlePasteDeptChange(e.target.value)}
                    className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                  >
                    {departamentosList.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                    PROVINCIA
                  </label>
                  <select
                    value={pasteProvincia}
                    onChange={(e) => handlePasteProvChange(e.target.value)}
                    className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-2 py-1.5 text-xs text-white focus:outline-none"
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
                <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                  DISTRITO
                </label>
                <select
                  value={pasteDistrito}
                  onChange={(e) => setPasteDistrito(e.target.value)}
                  className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none truncate"
                >
                  {distritosList.map((dst) => (
                    <option key={dst} value={dst}>
                      {dst}
                    </option>
                  ))}
                </select>
              </div>

              {/* Asesor Opcional */}
              <div>
                <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                  ASIGNAR A ASESOR (OPCIONAL)
                </label>
                <select
                  value={pasteAsesorId}
                  onChange={(e) => setPasteAsesorId(e.target.value)}
                  className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none truncate"
                >
                  <option value="">(Dejar sin asignar para distribución)</option>
                  {asesores.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombreCompleto} ({a.sala})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Analysis Badges Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-[#1f1f28]">
            <div className="p-3 bg-[#0b0b0f] border border-[#1f1f28] rounded-lg">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">
                NÚMEROS DETECTADOS
              </span>
              <span className="text-xl font-bold font-mono text-white">
                {pasteAnalysis.totalFound}
              </span>
            </div>

            <div className="p-3 bg-[#0b0b0f] border border-emerald-900/40 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">
                NUEVOS APTOS PARA IMPORTAR
              </span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {pasteAnalysis.validNew.length}
              </span>
            </div>

            <div className="p-3 bg-[#0b0b0f] border border-red-900/40 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-red-400 block mb-0.5">
                DUPLICADOS (OMITIDOS)
              </span>
              <span className="text-xl font-bold font-mono text-red-400">
                {pasteAnalysis.duplicatesInBase.length}
              </span>
            </div>

            <div className="p-3 bg-[#0b0b0f] border border-amber-900/40 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-amber-400 block mb-0.5">
                FORMATO INVÁLIDO (&ne; 9 dígitos)
              </span>
              <span className="text-xl font-bold font-mono text-amber-400">
                {pasteAnalysis.invalid.length}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-neutral-400">
              {pasteAnalysis.validNew.length > 0
                ? `Listo para ingresar ${pasteAnalysis.validNew.length} leads a campaña ${pasteCampaña}`
                : 'Pega la lista de números arriba para habilitar la importación'}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPastedText('')}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Limpiar Texto
              </button>
              <button
                onClick={handleImportPastedN1}
                disabled={pasteAnalysis.validNew.length === 0}
                className="px-6 py-2 bg-[#dc2626] hover:bg-[#b91c1c] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer transition-colors shadow-lg shadow-red-950/40"
              >
                <Database className="w-4 h-4" />
                <span>Importar {pasteAnalysis.validNew.length} Leads a Base General</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- PESTAÑA: ARCHIVO EXCEL / CSV ---------------- */}
      {activeTab === 'file' && (
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <button
              onClick={downloadSampleTemplate}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-[#16161f] hover:bg-[#1a1a24] border border-[#262635] text-neutral-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-neutral-400" />
              <span>Descargar Plantilla Excel</span>
            </button>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`bg-[#121218] border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-red-500 bg-red-950/10'
                : 'border-[#1f1f28] hover:border-[#2f2f3d] hover:bg-[#15151e]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleProcessFile(e.target.files[0]);
                }
              }}
            />

            <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-600/30 flex items-center justify-center text-red-400 mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>

            <p className="text-sm font-bold text-white mb-1">
              {fileName ? `Archivo cargado: ${fileName}` : 'Arrastra y suelta tu archivo Excel o CSV aquí'}
            </p>
            <p className="text-xs text-neutral-400">
              O haz clic para seleccionar desde tu computadora
            </p>
          </div>

          {/* Mapping and Duplicate Summary if file loaded */}
          {rawRows.length > 0 && (
            <div className="bg-[#121218] border border-[#1f1f28] rounded-xl p-5 space-y-5 shadow-xl">
              {importSummary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-[#0b0b0f] border border-[#1f1f28] rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                      TOTAL FILAS EN ARCHIVO
                    </span>
                    <span className="text-xl font-bold font-mono text-white">
                      {importSummary.total.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 bg-[#0b0b0f] border border-emerald-900/40 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">
                      LEADS NUEVOS APTOS
                    </span>
                    <span className="text-xl font-bold font-mono text-emerald-400">
                      {importSummary.validNew.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 bg-[#0b0b0f] border border-red-900/40 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-red-400 block mb-1">
                      DUPLICADOS DETECTADOS
                    </span>
                    <span className="text-xl font-bold font-mono text-red-400">
                      {importSummary.duplicates.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Column Mapping Selectors */}
              <div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                  Mapeo de Columnas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#0b0b0f] p-4 rounded-lg border border-[#1f1f28]">
                  <div>
                    <label className="text-[10px] font-bold text-red-400 block mb-1">
                      N1 (CELULAR PRINCIPAL) *
                    </label>
                    <select
                      value={mapping.n1}
                      onChange={(e) => handleMappingChange('n1', e.target.value)}
                      className="w-full bg-[#16161f] border border-red-700/60 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="">-- Selecciona columna --</option>
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                      CAMPAÑA
                    </label>
                    <select
                      value={mapping.campaña}
                      onChange={(e) => handleMappingChange('campaña', e.target.value)}
                      className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="">-- Selecciona columna --</option>
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                      DEPARTAMENTO
                    </label>
                    <select
                      value={mapping.departamento}
                      onChange={(e) => handleMappingChange('departamento', e.target.value)}
                      className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="">-- Selecciona columna --</option>
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                      DISTRITO
                    </label>
                    <select
                      value={mapping.distrito}
                      onChange={(e) => handleMappingChange('distrito', e.target.value)}
                      className="w-full bg-[#16161f] border border-[#1f1f28] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="">-- Selecciona columna --</option>
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1f1f28]">
                <button
                  onClick={() => {
                    setRawRows([]);
                    setRawHeaders([]);
                    setFileName(null);
                    setImportSummary(null);
                  }}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImportFile}
                  className="px-6 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer transition-colors shadow-lg shadow-red-950/40"
                >
                  <Database className="w-4 h-4" />
                  <span>Importar a Base WIN</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
