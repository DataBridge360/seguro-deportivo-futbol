// Mock data centralizado para toda la aplicación
// 5 equipos de la liga argentina con categorías por edad

export const EQUIPOS_NOMBRES = [
  'River Plate',
  'Boca Juniors',
  'Racing Club',
  'Independiente',
  'San Lorenzo',
] as const

export const CATEGORIAS = ['+18', '+25', '+30'] as const

export type EquipoNombre = typeof EQUIPOS_NOMBRES[number]
export type Categoria = typeof CATEGORIAS[number]

export interface Club {
  id: string
  nombre: string
}

export const MOCK_CLUBS: Club[] = [
  { id: '1', nombre: 'River Plate' },
  { id: '2', nombre: 'Boca Juniors' },
  { id: '3', nombre: 'Racing Club' },
  { id: '4', nombre: 'Independiente' },
  { id: '5', nombre: 'San Lorenzo' },
]

export interface Torneo {
  id: string
  nombre: string
  fechaInicio: string
  fechaFin: string
  equipos: string[]
  estado: 'En curso' | 'Proximo' | 'Finalizado'
  descripcion: string
  inscripcionesAbiertas: boolean
}

export const MOCK_TORNEOS: Torneo[] = [
  {
    id: '1',
    nombre: 'Liga Profesional',
    fechaInicio: '01/03/2026',
    fechaFin: '30/11/2026',
    equipos: ['River Plate', 'Boca Juniors', 'Racing Club', 'Independiente', 'San Lorenzo'],
    estado: 'En curso',
    descripcion: 'Torneo de primera división del fútbol argentino. Participan todos los equipos en formato todos contra todos durante la temporada 2026.',
    inscripcionesAbiertas: false,
  },
  {
    id: '2',
    nombre: 'Copa Argentina',
    fechaInicio: '15/04/2026',
    fechaFin: '30/08/2026',
    equipos: ['River Plate', 'Boca Juniors', 'Independiente'],
    estado: 'Proximo',
    descripcion: 'Copa nacional eliminatoria organizada por la AFA. Los equipos compiten en formato de eliminación directa en sedes neutrales.',
    inscripcionesAbiertas: true,
  },
  {
    id: '3',
    nombre: 'Torneo de Verano',
    fechaInicio: '01/01/2025',
    fechaFin: '28/02/2025',
    equipos: ['Racing Club', 'San Lorenzo', 'Boca Juniors'],
    estado: 'Finalizado',
    descripcion: 'Torneo amistoso de pretemporada disputado durante el verano 2025 con excelentes resultados para los equipos participantes.',
    inscripcionesAbiertas: false,
  },
]

export interface JugadorAsegurado {
  id: string
  nombreCompleto: string
  dni: string
  fechaNacimiento: string
  clubId: string
  club: string
  equipo: string
  categoria: Categoria
  seguroInicio: string
  seguroFin: string
  telefono: string
  direccion: string
}

// 20 jugadores distribuidos entre los 5 equipos y 3 categorías
export const MOCK_JUGADORES: JugadorAsegurado[] = [
  // River Plate
  { id: '1', nombreCompleto: 'Martín López', dni: '40123456', fechaNacimiento: '2005-03-15', clubId: '1', club: 'River Plate', equipo: 'River Plate', categoria: '+18', seguroInicio: '2025-01-01', seguroFin: '2026-01-01', telefono: '1155001001', direccion: 'Av. Figueroa Alcorta 7597' },
  { id: '2', nombreCompleto: 'Luciano Pérez', dni: '41234567', fechaNacimiento: '1998-07-22', clubId: '1', club: 'River Plate', equipo: 'River Plate', categoria: '+25', seguroInicio: '2025-02-15', seguroFin: '2026-02-15', telefono: '1155001002', direccion: 'Monroe 3456' },
  { id: '3', nombreCompleto: 'Facundo García', dni: '39876543', fechaNacimiento: '1993-11-08', clubId: '1', club: 'River Plate', equipo: 'River Plate', categoria: '+30', seguroInicio: '2024-06-01', seguroFin: '2025-06-01', telefono: '1155001003', direccion: 'Cabildo 1200' },
  { id: '4', nombreCompleto: 'Tomás Rodríguez', dni: '42345678', fechaNacimiento: '2006-01-30', clubId: '1', club: 'River Plate', equipo: 'River Plate', categoria: '+18', seguroInicio: '2025-03-01', seguroFin: '2026-03-01', telefono: '1155001004', direccion: 'Juramento 2890' },

  // Boca Juniors
  { id: '5', nombreCompleto: 'Nicolás Fernández', dni: '40567890', fechaNacimiento: '2004-09-12', clubId: '2', club: 'Boca Juniors', equipo: 'Boca Juniors', categoria: '+18', seguroInicio: '2024-12-01', seguroFin: '2025-12-01', telefono: '1155002001', direccion: 'Brandsen 805' },
  { id: '6', nombreCompleto: 'Santiago Díaz', dni: '41678901', fechaNacimiento: '1999-04-05', clubId: '2', club: 'Boca Juniors', equipo: 'Boca Juniors', categoria: '+25', seguroInicio: '2025-01-15', seguroFin: '2026-01-15', telefono: '1155002002', direccion: 'Caminito 100' },
  { id: '7', nombreCompleto: 'Agustín Martínez', dni: '39234567', fechaNacimiento: '1992-06-18', clubId: '2', club: 'Boca Juniors', equipo: 'Boca Juniors', categoria: '+30', seguroInicio: '2024-08-01', seguroFin: '2025-08-01', telefono: '1155002003', direccion: 'Almirante Brown 1350' },
  { id: '8', nombreCompleto: 'Matías González', dni: '42456789', fechaNacimiento: '2005-12-25', clubId: '2', club: 'Boca Juniors', equipo: 'Boca Juniors', categoria: '+18', seguroInicio: '2025-04-01', seguroFin: '2026-04-01', telefono: '1155002004', direccion: 'Necochea 950' },

  // Racing Club
  { id: '9', nombreCompleto: 'Joaquín Sánchez', dni: '40789012', fechaNacimiento: '2003-02-14', clubId: '3', club: 'Racing Club', equipo: 'Racing Club', categoria: '+18', seguroInicio: '2024-10-01', seguroFin: '2025-10-01', telefono: '1155003001', direccion: 'Alsina 420' },
  { id: '10', nombreCompleto: 'Emiliano Torres', dni: '41890123', fechaNacimiento: '1997-08-30', clubId: '3', club: 'Racing Club', equipo: 'Racing Club', categoria: '+25', seguroInicio: '2025-05-01', seguroFin: '2026-05-01', telefono: '1155003002', direccion: 'Mitre 780' },
  { id: '11', nombreCompleto: 'Valentín Romero', dni: '40345678', fechaNacimiento: '1994-05-20', clubId: '3', club: 'Racing Club', equipo: 'Racing Club', categoria: '+30', seguroInicio: '2024-07-01', seguroFin: '2025-07-01', telefono: '1155003003', direccion: 'Colón 560' },
  { id: '12', nombreCompleto: 'Lautaro Ruiz', dni: '42567890', fechaNacimiento: '2006-10-10', clubId: '3', club: 'Racing Club', equipo: 'Racing Club', categoria: '+18', seguroInicio: '2025-01-01', seguroFin: '2026-01-01', telefono: '1155003004', direccion: 'Pellegrini 1100' },

  // Independiente
  { id: '13', nombreCompleto: 'Bruno Álvarez', dni: '39456789', fechaNacimiento: '1991-03-28', clubId: '4', club: 'Independiente', equipo: 'Independiente', categoria: '+30', seguroInicio: '2024-09-15', seguroFin: '2025-09-15', telefono: '1155004001', direccion: 'Bochini 751' },
  { id: '14', nombreCompleto: 'Thiago Acosta', dni: '41345678', fechaNacimiento: '2000-12-01', clubId: '4', club: 'Independiente', equipo: 'Independiente', categoria: '+25', seguroInicio: '2025-02-01', seguroFin: '2026-02-01', telefono: '1155004002', direccion: 'Mitre 360' },
  { id: '15', nombreCompleto: 'Dylan Herrera', dni: '40901234', fechaNacimiento: '2005-07-07', clubId: '4', club: 'Independiente', equipo: 'Independiente', categoria: '+18', seguroInicio: '2024-11-01', seguroFin: '2025-11-01', telefono: '1155004003', direccion: 'Italia 200' },
  { id: '16', nombreCompleto: 'Gonzalo Medina', dni: '42678901', fechaNacimiento: '1998-04-15', clubId: '4', club: 'Independiente', equipo: 'Independiente', categoria: '+25', seguroInicio: '2025-06-01', seguroFin: '2026-06-01', telefono: '1155004004', direccion: 'Sarmiento 890' },

  // San Lorenzo
  { id: '17', nombreCompleto: 'Ignacio Castro', dni: '39567890', fechaNacimiento: '1993-09-22', clubId: '5', club: 'San Lorenzo', equipo: 'San Lorenzo', categoria: '+30', seguroInicio: '2024-05-01', seguroFin: '2025-05-01', telefono: '1155005001', direccion: 'Av. La Plata 1782' },
  { id: '18', nombreCompleto: 'Ramiro Flores', dni: '41456789', fechaNacimiento: '2001-01-18', clubId: '5', club: 'San Lorenzo', equipo: 'San Lorenzo', categoria: '+25', seguroInicio: '2025-03-15', seguroFin: '2026-03-15', telefono: '1155005002', direccion: 'Inclán 1050' },
  { id: '19', nombreCompleto: 'Ciro Navarro', dni: '40678901', fechaNacimiento: '2004-11-03', clubId: '5', club: 'San Lorenzo', equipo: 'San Lorenzo', categoria: '+18', seguroInicio: '2024-04-01', seguroFin: '2025-04-01', telefono: '1155005003', direccion: 'Maza 620' },
  { id: '20', nombreCompleto: 'Bautista Morales', dni: '42789012', fechaNacimiento: '2006-06-12', clubId: '5', club: 'San Lorenzo', equipo: 'San Lorenzo', categoria: '+18', seguroInicio: '2025-07-01', seguroFin: '2026-07-01', telefono: '1155005004', direccion: 'Rioja 1430' },
]

export interface Partido {
  id: string
  fecha: string
  hora: string
  equipoLocal: string
  equipoVisitante: string
  torneo: string
  ubicacion: string
}

export const MOCK_PARTIDOS: Partido[] = [
  { id: '1', fecha: '2026-02-14', hora: '15:30', equipoLocal: 'River Plate', equipoVisitante: 'Boca Juniors', torneo: 'Liga Profesional', ubicacion: 'Estadio Monumental' },
  { id: '2', fecha: '2026-02-18', hora: '17:00', equipoLocal: 'Racing Club', equipoVisitante: 'Independiente', torneo: 'Copa Argentina', ubicacion: 'Estadio Cilindro' },
  { id: '3', fecha: '2026-02-22', hora: '10:00', equipoLocal: 'San Lorenzo', equipoVisitante: 'River Plate', torneo: 'Liga Profesional', ubicacion: 'Estadio Nuevo Gasómetro' },
  { id: '4', fecha: '2026-02-28', hora: '16:00', equipoLocal: 'Boca Juniors', equipoVisitante: 'Racing Club', torneo: 'Liga Profesional', ubicacion: 'La Bombonera' },
  { id: '5', fecha: '2026-03-05', hora: '15:00', equipoLocal: 'Independiente', equipoVisitante: 'San Lorenzo', torneo: 'Liga Profesional', ubicacion: 'Estadio Libertadores de América' },
  { id: '6', fecha: '2026-03-12', hora: '11:00', equipoLocal: 'River Plate', equipoVisitante: 'Racing Club', torneo: 'Copa Argentina', ubicacion: 'Estadio Monumental' },
]

// Cupones
export interface Cupon {
  id: string
  codigo: string
  tipo: 'porcentaje' | 'monto_fijo'
  valor: number
  descripcion: string
  estado: 'disponible' | 'usado' | 'vencido'
  fechaVencimiento: string
  jugadorId: string
  canjeadoPor?: string
  fechaCanje?: string
  montoCompra?: number
}

export const MOCK_CUPONES: Cupon[] = [
  { id: '1', codigo: 'CUP-2026-A1B2', tipo: 'porcentaje', valor: 15, descripcion: '15% en indumentaria deportiva', estado: 'disponible', fechaVencimiento: '2026-06-30', jugadorId: '1' },
  { id: '2', codigo: 'CUP-2026-C3D4', tipo: 'monto_fijo', valor: 500, descripcion: '$500 en cantina del club', estado: 'disponible', fechaVencimiento: '2026-04-15', jugadorId: '1' },
  { id: '3', codigo: 'CUP-2026-E5F6', tipo: 'porcentaje', valor: 10, descripcion: '10% en suplementos', estado: 'usado', fechaVencimiento: '2026-03-01', jugadorId: '1', canjeadoPor: 'Cantina Central', fechaCanje: '2026-01-20', montoCompra: 2000 },
  { id: '4', codigo: 'CUP-2025-G7H8', tipo: 'monto_fijo', valor: 300, descripcion: '$300 en bebidas', estado: 'vencido', fechaVencimiento: '2025-12-31', jugadorId: '1' },
  { id: '5', codigo: 'CUP-2026-I9J0', tipo: 'porcentaje', valor: 20, descripcion: '20% en equipamiento', estado: 'disponible', fechaVencimiento: '2026-08-31', jugadorId: '2' },
  { id: '6', codigo: 'CUP-2026-K1L2', tipo: 'monto_fijo', valor: 1000, descripcion: '$1000 en tienda oficial', estado: 'disponible', fechaVencimiento: '2026-05-15', jugadorId: '5' },
]

// Eventos
export interface Evento {
  id: string
  titulo: string
  fecha: string
  hora: string
  tipo: 'entrenamiento' | 'evento' | 'reunion'
  descripcion: string
}

export const MOCK_EVENTOS: Evento[] = [
  { id: '1', titulo: 'Entrenamiento general', fecha: '2026-02-16', hora: '09:00', tipo: 'entrenamiento', descripcion: 'Entrenamiento de pretemporada' },
  { id: '2', titulo: 'Reunion de equipo', fecha: '2026-02-20', hora: '18:00', tipo: 'reunion', descripcion: 'Reunion con cuerpo tecnico' },
  { id: '3', titulo: 'Evento solidario', fecha: '2026-02-25', hora: '14:00', tipo: 'evento', descripcion: 'Partido a beneficio' },
  { id: '4', titulo: 'Entrenamiento tactico', fecha: '2026-03-02', hora: '10:00', tipo: 'entrenamiento', descripcion: 'Practica tactica pre-partido' },
]

// Documentos del jugador
export interface DocumentoJugador {
  id: string
  nombre: string
  tipo: 'dni' | 'ficha_medica' | 'contrato' | 'otro'
  estado: 'aprobado' | 'pendiente' | 'rechazado'
  fechaSubida: string
  jugadorId: string
}

export const MOCK_DOCUMENTOS_JUGADOR: DocumentoJugador[] = [
  { id: '1', nombre: 'DNI Frente', tipo: 'dni', estado: 'aprobado', fechaSubida: '2025-11-10', jugadorId: '1' },
  { id: '2', nombre: 'DNI Dorso', tipo: 'dni', estado: 'aprobado', fechaSubida: '2025-11-10', jugadorId: '1' },
  { id: '3', nombre: 'Ficha Medica 2026', tipo: 'ficha_medica', estado: 'pendiente', fechaSubida: '2026-01-15', jugadorId: '1' },
  { id: '4', nombre: 'Contrato seguro', tipo: 'contrato', estado: 'aprobado', fechaSubida: '2025-12-01', jugadorId: '1' },
]

// Inscripciones a torneos por jugador
export interface InscripcionTorneo {
  id: string
  torneoId: string
  jugadorId: string
  equipo: string
  categoria: Categoria
  estado: 'confirmada' | 'pendiente'
  fechaInscripcion: string
}

export const MOCK_INSCRIPCIONES_TORNEO: InscripcionTorneo[] = [
  { id: '1', torneoId: '1', jugadorId: '1', equipo: 'River Plate', categoria: '+18', estado: 'confirmada', fechaInscripcion: '2026-01-15' },
  { id: '2', torneoId: '2', jugadorId: '1', equipo: 'River Plate', categoria: '+18', estado: 'pendiente', fechaInscripcion: '2026-02-01' },
]

// Categorias del club
export interface CategoriaClub {
  id: string
  nombre: string
  edadMinima: number
  descripcion: string
  jugadoresCount: number
}

export const MOCK_CATEGORIAS_CLUB: CategoriaClub[] = [
  { id: '1', nombre: '+18', edadMinima: 18, descripcion: 'Jugadores mayores de 18 años', jugadoresCount: 8 },
  { id: '2', nombre: '+25', edadMinima: 25, descripcion: 'Jugadores mayores de 25 años', jugadoresCount: 6 },
  { id: '3', nombre: '+30', edadMinima: 30, descripcion: 'Jugadores mayores de 30 años', jugadoresCount: 4 },
]

// Helpers
export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export function isSeguroVigente(seguroFin: string): boolean {
  return new Date(seguroFin) >= new Date()
}
