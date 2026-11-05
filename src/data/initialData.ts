import { Asesor, Plan, Lead, TipifBack, TipifVendedor, Cobertura, EstadoInstalacion } from '../types';

export const INITIAL_ASESORES: Asesor[] = [
  { id: 'as-1', nombreCompleto: 'RENZO MENDOZA VEGA', usuario: 'rmendoza', sala: 'SALA 1', color: '#ef4444', activo: true, telefono: '984123451' },
  { id: 'as-2', nombreCompleto: 'KIARA TORRES CASTILLO', usuario: 'ktorres', sala: 'SALA 1', color: '#f97316', activo: true, telefono: '984123452' },
  { id: 'as-3', nombreCompleto: 'DIEGO QUISPE FLORES', usuario: 'dquispe', sala: 'SALA 1', color: '#eab308', activo: true, telefono: '984123453' },
  { id: 'as-4', nombreCompleto: 'ANDREA FLORES RAMOS', usuario: 'aflores', sala: 'SALA 1', color: '#10b981', activo: true, telefono: '984123454' },
  { id: 'as-5', nombreCompleto: 'GIANCARLO PAREDES ROJAS', usuario: 'gparedes', sala: 'SALA 1', color: '#06b6d4', activo: true, telefono: '984123455' },
  
  { id: 'as-6', nombreCompleto: 'CAMILA RAMOS CHÁVEZ', usuario: 'cramos', sala: 'SALA 2', color: '#3b82f6', activo: true, telefono: '984123456' },
  { id: 'as-7', nombreCompleto: 'SEBASTIÁN DÍAZ ROMERO', usuario: 'sdiaz', sala: 'SALA 2', color: '#6366f1', activo: true, telefono: '984123457' },
  { id: 'as-8', nombreCompleto: 'VALERIA CASTILLO SILVA', usuario: 'vcastillo', sala: 'SALA 2', color: '#8b5cf6', activo: true, telefono: '984123458' },
  { id: 'as-9', nombreCompleto: 'RODRIGO SANCHEZ HUAMÁN', usuario: 'rsanchez', sala: 'SALA 2', color: '#ec4899', activo: true, telefono: '984123459' },
  { id: 'as-10', nombreCompleto: 'LUCÍA GARCÍA VILLANUEVA', usuario: 'lgarcia', sala: 'SALA 2', color: '#14b8a6', activo: true, telefono: '984123460' },

  { id: 'as-11', nombreCompleto: 'BRUNO ESPINOZA VARGAS', usuario: 'bespinoza', sala: 'SALA 3', color: '#f43f5e', activo: true, telefono: '984123461' },
  { id: 'as-12', nombreCompleto: 'MELISSA ALVARADO PEÑA', usuario: 'malvarado', sala: 'SALA 3', color: '#84cc16', activo: true, telefono: '984123462' },
  { id: 'as-13', nombreCompleto: 'CHRISTIAN VÁSQUEZ MEZA', usuario: 'cvasquez', sala: 'SALA 3', color: '#a855f7', activo: true, telefono: '984123463' },
  { id: 'as-14', nombreCompleto: 'FIORELLA ROJAS CORDOVA', usuario: 'frojas', sala: 'SALA 3', color: '#0ea5e9', activo: true, telefono: '984123464' },
  { id: 'as-15', nombreCompleto: 'JORGE LUIS SOTO NAVARRO', usuario: 'jsoto', sala: 'SALA 3', color: '#d97706', activo: true, telefono: '984123465' },

  { id: 'as-16', nombreCompleto: 'PATRICIA HUAMANI TITO', usuario: 'phuamani', sala: 'SALA 4', color: '#059669', activo: true, telefono: '984123466' },
  { id: 'as-17', nombreCompleto: 'KEVIN AGUILAR RÍOS', usuario: 'kaguilar', sala: 'SALA 4', color: '#2563eb', activo: true, telefono: '984123467' },
  { id: 'as-18', nombreCompleto: 'STEPHANIE GÓMEZ BUSTAMANTE', usuario: 'sgomez', sala: 'SALA 4', color: '#7c3aed', activo: true, telefono: '984123468' },
  { id: 'as-19', nombreCompleto: 'ALONSO MORALES QUINTANA', usuario: 'amorales', sala: 'SALA 4', color: '#db2777', activo: true, telefono: '984123469' },
  { id: 'as-20', nombreCompleto: 'DANIELA RIVERA MEDINA', usuario: 'drivera', sala: 'SALA 4', color: '#475569', activo: true, telefono: '984123470' },

  { id: 'as-21', nombreCompleto: 'LEONARDO CÁRDENAS SOLÍS', usuario: 'lcardenas', sala: 'SALA 5', color: '#ea580c', activo: true, telefono: '984123471' },
  { id: 'as-22', nombreCompleto: 'MARÍA FE LOZANO PAZ', usuario: 'mlozano', sala: 'SALA 5', color: '#16a34a', activo: true, telefono: '984123472' },
  { id: 'as-23', nombreCompleto: 'GABRIEL ZAPATA NÚÑEZ', usuario: 'gzapata', sala: 'SALA 5', color: '#0284c7', activo: true, telefono: '984123473' },
  { id: 'as-24', nombreCompleto: 'CLAUDIA PALACIOS CRUZ', usuario: 'cpalacios', sala: 'SALA 5', color: '#9333ea', activo: true, telefono: '984123474' },
  { id: 'as-25', nombreCompleto: 'FABRIZIO HERRERA LÓPEZ', usuario: 'fherrera', sala: 'SALA VIP', color: '#b91c1c', activo: true, telefono: '984123475' }
];

export const INITIAL_PLANES: Plan[] = [
  { id: 'plan-100', nombre: 'WIN Fibra 100 Mbps', velocidadMbps: 100, precio: 69.00, activo: true },
  { id: 'plan-200', nombre: 'WIN Fibra 200 Mbps (Promo)', velocidadMbps: 200, precio: 89.00, activo: true },
  { id: 'plan-300', nombre: 'WIN Fibra 300 Mbps Gamer', velocidadMbps: 300, precio: 109.00, activo: true },
  { id: 'plan-500', nombre: 'WIN Fibra 500 Mbps Ultra', velocidadMbps: 500, precio: 149.00, activo: true },
  { id: 'plan-1000', nombre: 'WIN Fibra 1 Gbps Pro', velocidadMbps: 1000, precio: 199.00, activo: true },
  { id: 'plan-duo-tv', nombre: 'WIN Dúo 500 Mbps + WIN TV', velocidadMbps: 500, precio: 189.00, incluyeTv: true, activo: true },
  { id: 'plan-duo-1g-tv', nombre: 'WIN Dúo 1 Gbps + WIN TV Max', velocidadMbps: 1000, precio: 249.00, incluyeTv: true, activo: true }
];

export const CAMPAÑAS_LIST = [
  'NXO3', 'NXO4', 'K3', 'K9', 'NX7', 'E2', 'M3', 'E3', 'F2', 'FABIAN', 'ADRII'
];

export const TIPIF_BACK_LIST: TipifBack[] = [
  'No contesta',
  'No califica',
  'No desea',
  'Contacto con terceros',
  'Sin cobertura',
  'Corta llamada',
  'Servicio activo (ya es cliente WIN)',
  'Ya tiene otro operador',
  'Agendado',
  'Venta',
  'Número equivocado'
];

export const TIPIF_VENDEDOR_LIST: TipifVendedor[] = [
  'Pendiente',
  'Venta',
  'Seguimiento',
  'No interesado',
  'Reagendado',
  'Sin cobertura',
  'Cliente con deuda'
];

// Helper to generate 876 realistic Peruvian leads
export function generateInitialLeads(): Lead[] {
  const nombresPeruanos = [
    'Carlos Alberto Quispe Mamani', 'Rosa Elena Flores Rodriguez', 'Juan José Sánchez Rojas',
    'María Isabel García Díaz', 'Luis Enrique Torres Chávez', 'Carmen Rosa Mendoza Ramos',
    'Jorge Luis Castillo Romero', 'Ana María Silva Espinoza', 'Miguel Ángel Alvarado Meza',
    'Patricia Elizabeth Vásquez Rivas', 'Pedro Pablo Rojas Córdova', 'Gloria Esperanza Soto Navarro',
    'Fernando David Huamaní Tito', 'Luz Marina Aguilar Ríos', 'Víctor Hugo Gómez Bustamante',
    'Diana Carolina Morales Quintana', 'César Augusto Rivera Medina', 'Mónica Beatriz Cárdenas Solís',
    'Alejandro Daniel Lozano Paz', 'Milagros del Pilar Zapata Núñez', 'Walter Javier Palacios Cruz',
    'Rocío del Carmen Herrera López', 'Guillermo Alfonso Paredes Vega', 'Jessica Marlene Torres Castillo',
    'Renzo Fabrizio Díaz Romero', 'Claudia Vanessa Silva Huamán', 'Christian Omar Alvarado Peña',
    'Vanessa Tatiana Vásquez Meza', 'Héctor Manuel Soto Navarro', 'Brenda Fiorella Aguilar Ríos'
  ];

  const distritosLima = [
    { dep: 'Lima', prov: 'Lima', dist: 'San Juan de Lurigancho' },
    { dep: 'Lima', prov: 'Lima', dist: 'Santiago de Surco' },
    { dep: 'Lima', prov: 'Lima', dist: 'Miraflores' },
    { dep: 'Lima', prov: 'Lima', dist: 'Los Olivos' },
    { dep: 'Lima', prov: 'Lima', dist: 'San Borja' },
    { dep: 'Lima', prov: 'Lima', dist: 'Ate' },
    { dep: 'Lima', prov: 'Lima', dist: 'Chorrillos' },
    { dep: 'Lima', prov: 'Lima', dist: 'San Miguel' },
    { dep: 'Lima', prov: 'Lima', dist: 'Villa El Salvador' },
    { dep: 'Lima', prov: 'Lima', dist: 'Jesús María' },
    { dep: 'Callao', prov: 'Callao', dist: 'Bellavista' },
    { dep: 'Callao', prov: 'Callao', dist: 'La Perla' },
    { dep: 'Arequipa', prov: 'Arequipa', dist: 'Cayma' },
    { dep: 'La Libertad', prov: 'Trujillo', dist: 'Víctor Larco Herrera' }
  ];

  const streets = [
    'Av. Próceres de la Independencia', 'Av. Benavides', 'Av. Larco', 'Av. Javier Prado Este',
    'Jr. Las Flores', 'Av. Universitaria', 'Av. La Marina', 'Av. Tomás Marsano',
    'Calle Los Pinos', 'Av. Brasil', 'Av. Primavera', 'Av. Perú', 'Jr. Junín', 'Av. Arequipa'
  ];

  // Specific baseline active date mentioned in prompt: 2026-09-24
  const baseDate = new Date('2026-09-24T10:00:00');
  const leads: Lead[] = [];

  // Seed with pseudo-random generator for reproducible high quality data
  let seed = 42;
  function random(): number {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  // A set of numbers to introduce a few realistic duplicates as requested by prompt
  const duplicatePool = [
    '987112233', '991223344', '984556677', '972889900', '993112244'
  ];

  for (let i = 1; i <= 876; i++) {
    const isDup = i % 85 === 0;
    const n1 = isDup
      ? duplicatePool[Math.floor(random() * duplicatePool.length)]
      : `9${Math.floor(10000000 + random() * 89999999)}`;

    const hasN2 = random() > 0.65;
    const n2 = hasN2 ? `9${Math.floor(10000000 + random() * 89999999)}` : undefined;

    const camp = CAMPAÑAS_LIST[Math.floor(random() * CAMPAÑAS_LIST.length)];
    const distObj = distritosLima[Math.floor(random() * distritosLima.length)];
    const nombre = nombresPeruanos[Math.floor(random() * nombresPeruanos.length)];
    const dni = `${Math.floor(10000000 + random() * 89999999)}`;
    const street = streets[Math.floor(random() * streets.length)];
    const streetNum = Math.floor(100 + random() * 2500);
    const dpto = random() > 0.5 ? ` Dpto. ${Math.floor(101 + random() * 800)}` : '';
    const direccion = `${street} #${streetNum}${dpto}`;

    // Distribution across recent days (the majority on 2026-09-24, rest over preceding days)
    const daysAgo = random() < 0.55 ? 0 : Math.floor(random() * 55);
    const leadDate = new Date(baseDate.getTime() - daysAgo * 86400000 + (random() * 28800000));
    const leadDateStr = leadDate.toISOString().split('T')[0];
    const createdAt = leadDate.toISOString();

    // Assignment distribution: ~75% assigned, ~25% unassigned
    const isAssigned = random() < 0.78;
    const asesor = isAssigned ? INITIAL_ASESORES[Math.floor(random() * INITIAL_ASESORES.length)] : undefined;
    
    // Rotations: some 0, some 1, some 2, rare 3
    const rotRand = random();
    const rotaciones = !isAssigned ? 0 : rotRand < 0.6 ? 0 : rotRand < 0.85 ? 1 : rotRand < 0.96 ? 2 : 3;

    // Tipif Vendedor
    let tipifVendedor: TipifVendedor = 'Pendiente';
    let estadoInst: EstadoInstalacion = 'Pendiente de programar';
    let cobertura: Cobertura = 'Con cobertura';
    const plan = INITIAL_PLANES[Math.floor(random() * INITIAL_PLANES.length)];

    if (isAssigned) {
      const vRand = random();
      if (vRand < 0.19) {
        tipifVendedor = 'Venta';
        estadoInst = random() < 0.4 ? 'Instalada' : 'Programada';
        cobertura = 'Con cobertura';
      } else if (vRand < 0.45) {
        tipifVendedor = 'Seguimiento';
        estadoInst = 'Pendiente de programar';
      } else if (vRand < 0.65) {
        tipifVendedor = 'Reagendado';
      } else if (vRand < 0.82) {
        tipifVendedor = 'No interesado';
      } else if (vRand < 0.92) {
        tipifVendedor = 'Sin cobertura';
        cobertura = 'Sin cobertura';
      } else {
        tipifVendedor = 'Cliente con deuda';
      }
    }

    // Tipif Back
    const bRand = random();
    let tipifBack1: TipifBack;
    if (tipifVendedor === 'Venta') {
      tipifBack1 = 'Venta';
    } else if (bRand < 0.25) {
      tipifBack1 = 'Agendado';
    } else if (bRand < 0.45) {
      tipifBack1 = 'No contesta';
    } else if (bRand < 0.6) {
      tipifBack1 = 'Contacto con terceros';
    } else if (bRand < 0.75) {
      tipifBack1 = 'No desea';
    } else if (bRand < 0.85) {
      tipifBack1 = 'Ya tiene otro operador';
    } else if (bRand < 0.93) {
      tipifBack1 = 'Corta llamada';
    } else {
      tipifBack1 = 'No califica';
    }

    const hasBack2 = random() > 0.7;
    const tipifBack2: TipifBack | undefined = hasBack2 ? TIPIF_BACK_LIST[Math.floor(random() * TIPIF_BACK_LIST.length)] : undefined;

    // Build advisor history if rotated
    const historialAsesores = [];
    if (rotaciones > 0 && isAssigned) {
      for (let r = 0; r < rotaciones; r++) {
        const prevAsesor = INITIAL_ASESORES[(INITIAL_ASESORES.indexOf(asesor!) + r + 3) % INITIAL_ASESORES.length];
        historialAsesores.push({
          asesorId: prevAsesor.id,
          asesorNombre: prevAsesor.nombreCompleto,
          fechaAsignacion: new Date(leadDate.getTime() - (rotaciones - r) * 7200000).toISOString(),
          tipifResultado: 'No contesta'
        });
      }
    }

    // Assign time
    const fechaHoraAsignacion = isAssigned
      ? new Date(leadDate.getTime() + Math.floor(random() * 3600000)).toISOString()
      : undefined;

    // Notes
    const notas = [];
    if (isAssigned && random() > 0.4) {
      notas.push({
        id: `nota-${i}-1`,
        autor: asesor ? asesor.nombreCompleto.split(' ')[0] : 'Back Office',
        texto: tipifVendedor === 'Venta'
          ? `Venta cerrada: ${plan.nombre}. Solicita instalación en turno tarde.`
          : tipifVendedor === 'Seguimiento'
          ? 'Interesado en promo 200Mbps, consultar con su pareja. Llamar mañana 4pm.'
          : 'Cliente consultó precio y factibilidad técnica.',
        fechaHora: leadDateStr + ' 11:35'
      });
    }

    leads.push({
      id: `lead-${i}`,
      campaña: camp,
      n1,
      n2,
      usuarioWhatsapp: random() > 0.4 ? `@${nombre.toLowerCase().split(' ')[0]}_win${Math.floor(random() * 90 + 10)}` : undefined,
      departamento: distObj.dep,
      provincia: distObj.prov,
      distrito: distObj.dist,
      dni,
      nombreCliente: nombre,
      direccion,
      referencia: `A 2 cuadras de ${street}, frente a parque`,
      planId: plan.id,
      cobertura,
      estadoInstalacion: estadoInst,
      fechaInstalacion: tipifVendedor === 'Venta' ? '2026-09-28' : undefined,
      tipifBack1,
      tipifBack2,
      asesorId: asesor?.id,
      asesorNombre: asesor?.nombreCompleto,
      tipifVendedor,
      sala: asesor?.sala,
      fechaHoraAsignacion,
      rotaciones,
      historialAsesores,
      notas,
      createdAt
    });
  }

  return leads;
}
