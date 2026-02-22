import type { PreviewResponse, ConfirmRequest, ImportResult, Club } from '@/types/bulk-import'
import type {
  CreateTorneoDTO,
  Torneo,
  CreateEquipoDTO,
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
  PartidoDetalle
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
  activo: boolean
  poliza_inicio?: string | null
  poliza_fin?: string | null
}

export async function getJugadores(): Promise<JugadorResponse[]> {
  const res = await apiFetch('/jugadores/mis-jugadores')
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
