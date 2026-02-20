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
