import type { PreviewResponse, ConfirmRequest, ImportResult, Club } from '@/types/bulk-import'
import type {
  CreateTorneoDTO,
  Torneo,
  CreateEquipoDTO,
  UpdateEquipoDTO,
  Equipo,
  CreateCategoriaDTO,
  UpdateCategoriaDTO,
  Categoria,
  InscribirEquipoDTO,
  Inscripcion,
  CreatePartidoDTO,
  UpdatePartidoDTO,
  GenerarPartidosDTO,
  GenerarPartidosResponse,
  Partido,
  PartidoDetalle,
  AgregarJugadorEquipoDTO,
  JugadorEquipoTorneo,
} from '@/types/club'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const json = await res.json()

  if (!res.ok) {
    // El backend puede devolver errores en dos formatos:
    // 1. { success: false, error: { message, code, details, hint } }
    // 2. { message: '...' } (formato simple)
    const errorMessage = json.error?.message || json.message || 'Error en la solicitud'
    throw new Error(errorMessage)
  }

  return json
}

// Bulk Import API Functions

export async function bulkImportPreview(file: File): Promise<PreviewResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const res = await fetch(`${API_URL}/bulk-import/preview`, {
    method: 'POST',
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // NO incluir Content-Type - el navegador lo establece con boundary para FormData
    },
    body: formData,
  })

  const json = await res.json()

  if (!res.ok) {
    throw new Error(json.message || 'Error al procesar el archivo')
  }

  return json
}

export async function bulkImportConfirm(data: ConfirmRequest): Promise<ImportResult> {
  return apiFetch('/bulk-import/confirm', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Jugadores API Functions

export interface JugadorResponse {
  id: string
  dni: string
  nombre: string
  apellido: string
  nombre_completo: string
  fecha_nacimiento: string
  direccion?: string
  foto_url?: string
  telefono?: string
  email?: string
  activo: boolean
  clubes?: {
    id: string
    nombre: string
    slug: string
    activo: boolean
    fecha_alta?: string
    fecha_baja?: string
  }[]
  poliza_inicio?: string | null
  poliza_fin?: string | null
  created_at?: string
  updated_at?: string
}

export async function getJugadores(): Promise<JugadorResponse[]> {
  const res = await apiFetch('/jugadores/mi-club')
  return res.data
}

export async function getJugadorPerfil(): Promise<JugadorResponse> {
  const res = await apiFetch('/jugadores/mi-perfil')
  return res.data
}

export async function updateJugadorPerfil(data: { telefono?: string; email?: string; direccion?: string }): Promise<JugadorResponse> {
  const res = await apiFetch('/jugadores/mi-perfil', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return res.data
}

export async function getClubs(): Promise<Club[]> {
  const res = await apiFetch('/clubes')
  return res.data // La respuesta tiene formato { success: true, data: Club[] }
}

export async function loginWithEmail(email: string, password: string) {
  const res = await apiFetch('/auth/login/email', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return res.data as { token: string; user: { id: string; email: string; name: string; role: string } }
}

export async function loginWithDNI(dni: string, password: string) {
  const res = await apiFetch('/auth/login/dni', {
    method: 'POST',
    body: JSON.stringify({ dni, password }),
  })
  return res.data as { token: string; user: { id: string; email: string; name: string; role: string } }
}

export async function getProfile() {
  const res = await apiFetch('/auth/profile')
  return res.data
}

// Torneos API Functions

export async function createTorneo(data: CreateTorneoDTO): Promise<Torneo> {
  const res = await apiFetch('/clubes/torneos', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res.data
}

export async function deleteTorneo(torneoId: string, password: string): Promise<void> {
  await apiFetch(`/clubes/torneos/${torneoId}`, {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  })
}

export async function toggleInscripciones(torneoId: string, abiertas: boolean): Promise<Torneo> {
  const res = await apiFetch(`/clubes/torneos/${torneoId}/inscripciones`, {
    method: 'PATCH',
    body: JSON.stringify({ inscripciones_abiertas: abiertas }),
  })
  return res.data
}

export async function getTorneos(): Promise<Torneo[]> {
  const res = await apiFetch('/clubes/torneos')
  return res.data
}

// Equipos API Functions

export async function createEquipo(data: CreateEquipoDTO): Promise<Equipo> {
  const res = await apiFetch('/clubes/equipos', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res.data
}

export async function getEquipos(): Promise<Equipo[]> {
  const res = await apiFetch('/clubes/equipos')
  return res.data
}

export async function uploadEquipoLogo(file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const res = await fetch(`${API_URL}/clubes/upload-logo`, {
    method: 'POST',
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  const json = await res.json()

  if (!res.ok) {
    const errorMessage = json.error?.message || json.message || 'Error al subir la imagen'
    throw new Error(errorMessage)
  }

  return json.data
}

export async function updateEquipo(id: string, data: UpdateEquipoDTO): Promise<Equipo> {
  const res = await apiFetch(`/clubes/equipos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return res.data
}

export async function deleteEquipo(id: string, password: string): Promise<void> {
  await apiFetch(`/clubes/equipos/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  })
}

// Categorías API Functions

export async function createCategoria(data: CreateCategoriaDTO): Promise<Categoria> {
  const res = await apiFetch('/clubes/categorias', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res.data
}

export async function getCategorias(): Promise<Categoria[]> {
  const res = await apiFetch('/clubes/categorias')
  return res.data
}

export async function updateCategoria(id: string, data: UpdateCategoriaDTO): Promise<Categoria> {
  const res = await apiFetch(`/clubes/categorias/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return res.data
}

export async function deleteCategoria(id: string): Promise<void> {
  await apiFetch(`/clubes/categorias/${id}`, {
    method: 'DELETE',
  })
}

// Inscripciones API Functions

export async function inscribirEquipo(torneoId: string, data: InscribirEquipoDTO): Promise<Inscripcion> {
  const res = await apiFetch(`/clubes/torneos/${torneoId}/equipos`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res.data
}

export async function getEquiposInscritos(torneoId: string): Promise<Inscripcion[]> {
  const res = await apiFetch(`/clubes/torneos/${torneoId}/equipos`)
  return res.data
}

export async function desinscribirEquipo(inscripcionId: string): Promise<void> {
  await apiFetch(`/clubes/torneo-equipos/${inscripcionId}`, {
    method: 'DELETE',
  })
}

// Jugadores en Equipo-Torneo API Functions

export async function getJugadoresEquipoTorneo(torneoId: string, equipoId: string): Promise<JugadorEquipoTorneo[]> {
  const res = await apiFetch(`/clubes/torneos/${torneoId}/equipos/${equipoId}/jugadores`)
  return res.data
}

export async function agregarJugadorEquipoTorneo(torneoId: string, equipoId: string, data: AgregarJugadorEquipoDTO): Promise<JugadorEquipoTorneo> {
  const res = await apiFetch(`/clubes/torneos/${torneoId}/equipos/${equipoId}/jugadores`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res.data
}

export async function quitarJugadorEquipoTorneo(torneoId: string, equipoId: string, jugadorId: string): Promise<void> {
  await apiFetch(`/clubes/torneos/${torneoId}/equipos/${equipoId}/jugadores/${jugadorId}`, {
    method: 'DELETE',
  })
}

// Partidos API Functions

export async function createPartido(data: CreatePartidoDTO): Promise<Partido> {
  const res = await apiFetch('/clubes/partidos', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res.data
}

export async function getPartidos(torneoId?: string): Promise<Partido[]> {
  const endpoint = torneoId ? `/clubes/partidos?torneo_id=${torneoId}` : '/clubes/partidos'
  const res = await apiFetch(endpoint)
  return res.data
}

export async function getPartido(id: string): Promise<Partido> {
  const res = await apiFetch(`/clubes/partidos/${id}`)
  return res.data
}

export async function getPartidoDetalle(id: string): Promise<PartidoDetalle> {
  const res = await apiFetch(`/clubes/partidos/${id}`)
  return res.data
}

export async function updatePartido(id: string, data: UpdatePartidoDTO): Promise<Partido> {
  const res = await apiFetch(`/clubes/partidos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return res.data
}

export async function generarPartidos(torneoId: string, data: GenerarPartidosDTO): Promise<GenerarPartidosResponse> {
  const res = await apiFetch(`/clubes/torneos/${torneoId}/generar-partidos`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res.data
}

export async function deletePartido(id: string): Promise<void> {
  await apiFetch(`/clubes/partidos/${id}`, {
    method: 'DELETE',
  })
}

// Jugador Torneos API Functions

export interface JugadorTorneo {
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
  created_at: string
  updated_at: string
}

export interface JugadorInscripcion {
  id: string
  torneo_equipo_id: string
  torneo_id: string
  torneo_nombre: string
  torneo_estado: string
  torneo_fecha_inicio: string
  torneo_fecha_fin: string
  torneo_descripcion: string
  equipo_id: string
  equipo_nombre: string
  equipo_logo_url?: string | null
  categoria_id: string
  categoria_nombre: string
  numero_camiseta?: number | null
  posicion?: string | null
  capitan: boolean
  created_at: string
}

export async function getJugadorTorneos(): Promise<JugadorTorneo[]> {
  const res = await apiFetch('/jugadores/torneos')
  return res.data
}

export async function getJugadorInscripciones(): Promise<JugadorInscripcion[]> {
  const res = await apiFetch('/jugadores/mis-inscripciones')
  return res.data
}

export interface EquipoTorneoJugador {
  id: string
  nombre: string
  apellido: string
  numero_camiseta?: number | null
  posicion?: string | null
  capitan: boolean
}

export interface EquipoTorneo {
  id: string
  torneo_id: string
  equipo_id: string
  equipo_nombre: string
  equipo_logo_url?: string | null
  categoria_id: string
  categoria_nombre: string
  jugadores: EquipoTorneoJugador[]
}

export async function getEquiposTorneo(torneoId: string): Promise<EquipoTorneo[]> {
  const res = await apiFetch(`/jugadores/torneos/${torneoId}/equipos`)
  return res.data
}

export async function inscribirseEquipo(torneoId: string, torneoEquipoId: string): Promise<any> {
  const res = await apiFetch(`/jugadores/torneos/${torneoId}/equipos/${torneoEquipoId}/inscribirse`, {
    method: 'POST',
  })
  return res.data
}

export async function desinscribirseEquipo(torneoId: string): Promise<void> {
  await apiFetch(`/jugadores/torneos/${torneoId}/desinscribirse`, {
    method: 'DELETE',
  })
}

// Auth API Functions

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  return apiFetch('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}
