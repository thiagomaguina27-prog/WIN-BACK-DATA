export type UserRole = 'Admin' | 'Back' | 'Supervisor' | 'Asesor';

export type TipifBack =
  | 'No contesta'
  | 'No califica'
  | 'No desea'
  | 'Contacto con terceros'
  | 'Sin cobertura'
  | 'Corta llamada'
  | 'Servicio activo (ya es cliente WIN)'
  | 'Ya tiene otro operador'
  | 'Agendado'
  | 'Venta'
  | 'Número equivocado';

export type TipifVendedor =
  | 'Pendiente'
  | 'Venta'
  | 'Seguimiento'
  | 'No interesado'
  | 'Reagendado'
  | 'Sin cobertura'
  | 'Cliente con deuda';

export type Cobertura = 'Con cobertura' | 'Sin cobertura' | 'Por validar';

export type EstadoInstalacion = 'Pendiente de programar' | 'Programada' | 'Instalada' | 'Cancelada';

export interface NotaHistorial {
  id: string;
  autor: string;
  texto: string;
  fechaHora: string;
}

export interface HistorialAsesorItem {
  asesorId: string;
  asesorNombre: string;
  fechaAsignacion: string;
  tipifResultado?: string;
}

export interface Lead {
  id: string;
  campaña: string;
  n1: string; // Celular de 9 dígitos que empieza con 9
  n2?: string; // Celular alternativo opcional
  usuarioWhatsapp?: string;
  departamento: string;
  provincia: string;
  distrito: string;
  dni?: string; // DNI 8 dígitos
  nombreCliente?: string;
  direccion?: string;
  referencia?: string;
  planId?: string;
  cobertura?: Cobertura;
  estadoInstalacion?: EstadoInstalacion;
  fechaInstalacion?: string;
  tipifBack1?: TipifBack;
  tipifBack2?: TipifBack;
  asesorId?: string;
  asesorNombre?: string;
  tipifVendedor?: TipifVendedor;
  sala?: string;
  fechaHoraAsignacion?: string;
  rotaciones: number;
  historialAsesores: HistorialAsesorItem[];
  notas: NotaHistorial[];
  createdAt: string; // ISO date string or YYYY-MM-DD
}

export interface Asesor {
  id: string;
  nombreCompleto: string;
  usuario: string;
  sala: string; // SALA 1, SALA 2, SALA 3, SALA 4, SALA 5, SALA VIP
  color: string;
  activo: boolean;
  telefono?: string;
}

export interface Plan {
  id: string;
  nombre: string;
  velocidadMbps: number;
  precio: number;
  incluyeTv?: boolean;
  activo: boolean;
}

export interface Usuario {
  id: string;
  usuario: string; // case-insensitive username
  nombreMostrar: string;
  passwordHash: string; // bcrypt hash
  rol: UserRole;
  sala?: string; // e.g. 'SALA 1', 'SALA 2', 'SALA 3', 'SALA 4', 'SALA 5', 'SALA VIP', 'TODAS'
  activo: boolean;
  createdAt: string;
  asesorAsociadoId?: string; // if role is 'Asesor', links to their Asesor ID
}

export interface KPIData {
  total: number;
  ventas: number;
  asignados: number;
  sinAsignar: number;
  rotaciones: number;
  conversionRate: number;
  coberturaRate: number;
}
