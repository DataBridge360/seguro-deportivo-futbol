export interface Club {
  id: string
  nombre: string
  slug: string
  descripcion: string
  logo_url: string
  activo: boolean
}

export interface PreviewResponse {
  total: number
  new_players: NewPlayer[]
  existing_players: ExistingPlayer[]
  dni_conflicts: DniConflict[]
  birth_date_conflicts: BirthDateConflict[]
  name_conflicts: NameConflict[]
  errors: ErrorItem[]
  preview_token: string
}

export interface NewPlayer {
  row: number
  dni: string
  nombre: string
  apellido: string
  nombre_completo: string
  fecha_nacimiento: string
  status: 'new'
}

export interface ExistingPlayer {
  row: number
  dni: string
  nombre_completo: string
  existing_id: string
  message: string
}

export interface DniConflict {
  row: number
  dni: string
  nombre_nuevo: string
  nombre_existente: string
  existing_id: string
  message: string
}

export interface BirthDateConflict {
  row: number
  dni: string
  nombre_completo: string
  fecha_nacimiento_nueva: string
  fecha_nacimiento_existente: string
  existing_id: string
  message: string
}

export interface NameConflict {
  row: number
  dni_nuevo: string
  dni_existente: string
  nombre_completo: string
  existing_id: string
  message: string
}

export interface ErrorItem {
  row: number
  dni: string | null
  message: string
}

export interface ConfirmRequest {
  preview_token: string
  productor_id: string
  club_id: string // REQUERIDO - club al que se asignarán los jugadores
  overwrite_existing: boolean
  accepted_conflict_ids?: string[]
  test_mode?: boolean
}

export interface CreatedPlayer {
  dni: string
  nombre: string
  apellido: string
  nombre_completo: string
  fecha_nacimiento: string
  row: number
}

export interface ImportResult {
  success: boolean
  inserted: number
  updated: number
  skipped: number
  created_players: CreatedPlayer[]
  updated_players: CreatedPlayer[]
  errors: ImportError[]
  summary: {
    jugadores_created: number
    jugador_club_created: number
  }
  message: string
}

export interface ImportError {
  row: number
  dni: string
  error: string
}

// Tournament Import Types

export interface TournamentPreviewResponse {
  sheet_names: string[]
  selected_sheet: string
  total_players: number
  categories: { name: string; player_count: number }[]
  teams: { name: string; category: string; player_count: number }[]
  new_players: TournamentNewPlayer[]
  existing_players: TournamentExistingPlayer[]
  errors: ErrorItem[]
  preview_token: string
}

export interface TournamentNewPlayer {
  row: number
  dni: string
  nombre: string
  apellido: string
  nombre_completo: string
  fecha_nacimiento: string
  categoria: string
  equipo: string
}

export interface TournamentExistingPlayer {
  row: number
  dni: string
  nombre_completo: string
  existing_id: string
  categoria: string
  equipo: string
}

export interface TournamentConfirmRequest {
  preview_token: string
  productor_id: string
  club_id: string
  torneo: {
    nombre: string
    fecha_inicio: string
    fecha_fin: string
    inscripcion_inicio?: string
    inscripcion_fin?: string
    max_jugadores_por_equipo: number
  }
}

export interface TournamentImportResult {
  success: boolean
  categories_created: number
  teams_created: number
  players_created: number
  players_assigned: number
  torneo_id: string
  torneo_nombre: string
  created_players: CreatedPlayer[]
  errors: ImportError[]
}
