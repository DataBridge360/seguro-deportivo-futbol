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
  },
  {
    id: '2',
    nombre: 'Copa Argentina',
    fechaInicio: '15/04/2026',
    fechaFin: '30/08/2026',
    equipos: ['River Plate', 'Boca Juniors', 'Independiente'],
    estado: 'Proximo',
    descripcion: 'Copa nacional eliminatoria organizada por la AFA. Los equipos compiten en formato de eliminación directa en sedes neutrales.',
  },
  {
    id: '3',
    nombre: 'Torneo de Verano',
    fechaInicio: '01/01/2025',
    fechaFin: '28/02/2025',
    equipos: ['Racing Club', 'San Lorenzo', 'Boca Juniors'],
    estado: 'Finalizado',
    descripcion: 'Torneo amistoso de pretemporada disputado durante el verano 2025 con excelentes resultados para los equipos participantes.',
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
}

// 20 jugadores distribuidos entre los 5 equipos y 3 categorías
export const MOCK_JUGADORES: JugadorAsegurado[] = [
  // River Plate
  { id: '1', nombreCompleto: 'Martín López', dni: '40123456', fechaNacimiento: '2005-03-15', clubId: '1', club: 'River Plate', equipo: 'River Plate', categoria: '+18', seguroInicio: '2025-01-01', seguroFin: '2026-01-01' },
  { id: '2', nombreCompleto: 'Luciano Pérez', dni: '41234567', fechaNacimiento: '1998-07-22', clubId: '1', club: 'River Plate', equipo: 'River Plate', categoria: '+25', seguroInicio: '2025-02-15', seguroFin: '2026-02-15' },
  { id: '3', nombreCompleto: 'Facundo García', dni: '39876543', fechaNacimiento: '1993-11-08', clubId: '1', club: 'River Plate', equipo: 'River Plate', categoria: '+30', seguroInicio: '2024-06-01', seguroFin: '2025-06-01' },
  { id: '4', nombreCompleto: 'Tomás Rodríguez', dni: '42345678', fechaNacimiento: '2006-01-30', clubId: '1', club: 'River Plate', equipo: 'River Plate', categoria: '+18', seguroInicio: '2025-03-01', seguroFin: '2026-03-01' },

  // Boca Juniors
  { id: '5', nombreCompleto: 'Nicolás Fernández', dni: '40567890', fechaNacimiento: '2004-09-12', clubId: '2', club: 'Boca Juniors', equipo: 'Boca Juniors', categoria: '+18', seguroInicio: '2024-12-01', seguroFin: '2025-12-01' },
  { id: '6', nombreCompleto: 'Santiago Díaz', dni: '41678901', fechaNacimiento: '1999-04-05', clubId: '2', club: 'Boca Juniors', equipo: 'Boca Juniors', categoria: '+25', seguroInicio: '2025-01-15', seguroFin: '2026-01-15' },
  { id: '7', nombreCompleto: 'Agustín Martínez', dni: '39234567', fechaNacimiento: '1992-06-18', clubId: '2', club: 'Boca Juniors', equipo: 'Boca Juniors', categoria: '+30', seguroInicio: '2024-08-01', seguroFin: '2025-08-01' },
  { id: '8', nombreCompleto: 'Matías González', dni: '42456789', fechaNacimiento: '2005-12-25', clubId: '2', club: 'Boca Juniors', equipo: 'Boca Juniors', categoria: '+18', seguroInicio: '2025-04-01', seguroFin: '2026-04-01' },

  // Racing Club
  { id: '9', nombreCompleto: 'Joaquín Sánchez', dni: '40789012', fechaNacimiento: '2003-02-14', clubId: '3', club: 'Racing Club', equipo: 'Racing Club', categoria: '+18', seguroInicio: '2024-10-01', seguroFin: '2025-10-01' },
  { id: '10', nombreCompleto: 'Emiliano Torres', dni: '41890123', fechaNacimiento: '1997-08-30', clubId: '3', club: 'Racing Club', equipo: 'Racing Club', categoria: '+25', seguroInicio: '2025-05-01', seguroFin: '2026-05-01' },
  { id: '11', nombreCompleto: 'Valentín Romero', dni: '40345678', fechaNacimiento: '1994-05-20', clubId: '3', club: 'Racing Club', equipo: 'Racing Club', categoria: '+30', seguroInicio: '2024-07-01', seguroFin: '2025-07-01' },
  { id: '12', nombreCompleto: 'Lautaro Ruiz', dni: '42567890', fechaNacimiento: '2006-10-10', clubId: '3', club: 'Racing Club', equipo: 'Racing Club', categoria: '+18', seguroInicio: '2025-01-01', seguroFin: '2026-01-01' },

  // Independiente
  { id: '13', nombreCompleto: 'Bruno Álvarez', dni: '39456789', fechaNacimiento: '1991-03-28', clubId: '4', club: 'Independiente', equipo: 'Independiente', categoria: '+30', seguroInicio: '2024-09-15', seguroFin: '2025-09-15' },
  { id: '14', nombreCompleto: 'Thiago Acosta', dni: '41345678', fechaNacimiento: '2000-12-01', clubId: '4', club: 'Independiente', equipo: 'Independiente', categoria: '+25', seguroInicio: '2025-02-01', seguroFin: '2026-02-01' },
  { id: '15', nombreCompleto: 'Dylan Herrera', dni: '40901234', fechaNacimiento: '2005-07-07', clubId: '4', club: 'Independiente', equipo: 'Independiente', categoria: '+18', seguroInicio: '2024-11-01', seguroFin: '2025-11-01' },
  { id: '16', nombreCompleto: 'Gonzalo Medina', dni: '42678901', fechaNacimiento: '1998-04-15', clubId: '4', club: 'Independiente', equipo: 'Independiente', categoria: '+25', seguroInicio: '2025-06-01', seguroFin: '2026-06-01' },

  // San Lorenzo
  { id: '17', nombreCompleto: 'Ignacio Castro', dni: '39567890', fechaNacimiento: '1993-09-22', clubId: '5', club: 'San Lorenzo', equipo: 'San Lorenzo', categoria: '+30', seguroInicio: '2024-05-01', seguroFin: '2025-05-01' },
  { id: '18', nombreCompleto: 'Ramiro Flores', dni: '41456789', fechaNacimiento: '2001-01-18', clubId: '5', club: 'San Lorenzo', equipo: 'San Lorenzo', categoria: '+25', seguroInicio: '2025-03-15', seguroFin: '2026-03-15' },
  { id: '19', nombreCompleto: 'Ciro Navarro', dni: '40678901', fechaNacimiento: '2004-11-03', clubId: '5', club: 'San Lorenzo', equipo: 'San Lorenzo', categoria: '+18', seguroInicio: '2024-04-01', seguroFin: '2025-04-01' },
  { id: '20', nombreCompleto: 'Bautista Morales', dni: '42789012', fechaNacimiento: '2006-06-12', clubId: '5', club: 'San Lorenzo', equipo: 'San Lorenzo', categoria: '+18', seguroInicio: '2025-07-01', seguroFin: '2026-07-01' },
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

// Helpers
export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export function isSeguroVigente(seguroFin: string): boolean {
  return new Date(seguroFin) >= new Date()
}
