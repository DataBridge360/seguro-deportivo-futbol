// Tipos para Categorías

export interface CreateCategoriaDTO {
  nombre: string
}

export interface UpdateCategoriaDTO {
  nombre?: string
}

export interface Categoria {
  id: string
  nombre: string
  club_id: string
  created_at: string
}

// Tipos para Torneos

export interface CreateTorneoDTO {
  nombre: string
  descripcion?: string
  fecha_inicio: string
  fecha_fin: string
  inscripcion_inicio?: string
  inscripcion_fin?: string
  max_jugadores_por_equipo: number
  categoria_ids?: string[]
}

export interface Torneo {
  id: string
  nombre: string
  descripcion?: string | null
  fecha_inicio: string
  fecha_fin: string
  estado: 'proximo' | 'en_curso' | 'finalizado' | 'cancelado'
  inscripcion_inicio?: string | null
  inscripcion_fin?: string | null
  inscripciones_abiertas: boolean
  max_jugadores_por_equipo: number
  club_id: string
  categorias?: Categoria[]
  created_at: string
  updated_at: string
}

// Tipos para Equipos

export interface CreateEquipoDTO {
  nombre: string
  logo_url?: string
  categoria_ids?: string[]
}

export interface UpdateEquipoDTO {
  nombre?: string
  logo_url?: string
  categoria_ids?: string[]
}

export interface Equipo {
  id: string
  nombre: string
  club_id: string
  logo_url?: string | null
  activo: boolean
  categorias: Categoria[]
  created_at: string
  updated_at: string
}

// Tipos para Inscripciones (Torneo-Equipo)

export interface InscribirEquipoDTO {
  equipo_id: string
  categoria_id: string
}

export interface Inscripcion {
  id: string
  torneo_id: string
  torneo_nombre: string
  equipo_id: string
  equipo_nombre: string
  categoria_id: string
  categoria_nombre: string
  created_at: string
}

// Tipos para Partidos

export interface CreatePartidoDTO {
  torneo_id: string
  equipo_local_id: string
  equipo_visitante_id: string
  fecha: string
  hora: string
  ubicacion?: string
  cancha?: string
  observaciones?: string
}

export interface UpdatePartidoDTO {
  fecha?: string
  hora?: string
  ubicacion?: string
  cancha?: string
  estado?: 'programado' | 'en_curso' | 'finalizado' | 'suspendido' | 'cancelado'
  resultado_local?: number
  resultado_visitante?: number
  observaciones?: string
}

export interface GenerarPartidosDTO {
  fecha_inicio: string
  intervalo_dias: number
  hora_inicio: string
  diferencia_horaria: number
  ida_vuelta: boolean
  ubicacion?: string
  cancha?: string
}

export interface GenerarPartidosResponse {
  partidos_creados: number
  por_categoria: {
    categoria_nombre: string
    partidos: number
    equipos: number
  }[]
}

export interface Partido {
  id: string
  torneo_id: string
  torneo_nombre: string
  equipo_local_id: string
  equipo_local_nombre: string
  equipo_visitante_id: string
  equipo_visitante_nombre: string
  fecha: string
  hora: string
  ubicacion?: string | null
  cancha?: string | null
  estado: 'programado' | 'en_curso' | 'finalizado' | 'suspendido' | 'cancelado'
  resultado_local?: number | null
  resultado_visitante?: number | null
  observaciones?: string | null
  club_id: string
  created_at: string
  updated_at: string
}

// Tipos para Jugadores en Plantel

export interface JugadorPlantel {
  jugador_id: string
  nombre_completo: string
  numero_camiseta?: number | null
  posicion?: string | null
  capitan: boolean
  foto_url?: string | null
}

// Tipos para Detalle Completo de Partido (incluye planteles)

export interface TorneoDetalle {
  id: string
  nombre: string
  descripcion?: string | null
}

export interface EquipoDetalle {
  id: string
  nombre: string
  logo_url?: string | null
  plantel: JugadorPlantel[]
}

export interface PartidoDetalle {
  id: string
  torneo: TorneoDetalle
  equipo_local: EquipoDetalle
  equipo_visitante: EquipoDetalle
  fecha: string
  hora: string
  ubicacion?: string | null
  cancha?: string | null
  estado: 'programado' | 'en_curso' | 'finalizado' | 'suspendido' | 'cancelado'
  resultado_local?: number | null
  resultado_visitante?: number | null
  observaciones?: string | null
  created_at: string
  updated_at: string
}

// Tipos para Jugadores en Equipo-Torneo

export interface AgregarJugadorEquipoDTO {
  jugador_id: string
  numero_camiseta?: number
  posicion?: string
  capitan?: boolean
}

export interface JugadorEquipoTorneo {
  id: string
  jugador_id: string
  nombre_completo: string
  nombre?: string | null
  apellido?: string | null
  numero_camiseta?: number | null
  posicion?: string | null
  capitan: boolean
  foto_url?: string | null
  dni?: string | null
  fecha_nacimiento?: string | null
}
