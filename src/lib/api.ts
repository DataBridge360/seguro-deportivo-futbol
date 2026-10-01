import type { PreviewResponse, ConfirmRequest, ImportResult, Club, TournamentPreviewResponse, TournamentConfirmRequest, TournamentImportResult } from '@/types/bulk-import'
import type {
  CreateTorneoDTO,
  UpdateTorneoDTO,
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
    const isLoginRequest = path.startsWith('/auth/login/')
    const isCredentialError =
      isLoginRequest ||
      /credenciales|contrase(?:ñ|n)a incorrecta|contrase(?:ñ|n)a de admin incorrecta/i.test(errorMessage)

    // Si el token es inválido o expiró, hacer logout automático
    if (res.status === 401 && typeof window !== 'undefined' && !isCredentialError) {
      // Limpiar autenticación
      localStorage.removeItem('token')
      localStorage.removeItem('auth-storage')

      // CRÍTICO: También limpiar la cookie para evitar redirect loop con middleware
      document.cookie = 'auth-storage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'

      // Redirigir al login
      window.location.href = '/login'

      // Lanzar error para que el componente sepa que falló
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
    }

    if (isLoginRequest && res.status === 401) {
      throw new Error('Usuario/DNI o contraseña incorrectos')
    }

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

// Tournament Import API Functions

export async function tournamentImportPreview(
  file: File,
  sheetName?: string,
  onUploadProgress?: (progress: number) => void,
): Promise<TournamentPreviewResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const url = sheetName
    ? `${API_URL}/bulk-import/tournament-preview?sheet_name=${encodeURIComponent(sheetName)}`
    : `${API_URL}/bulk-import/tournament-preview`

  if (onUploadProgress) {
    // Use XHR for upload progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', url)
      xhr.setRequestHeader('ngrok-skip-browser-warning', 'true')
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
      }

      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.responseText)
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(json)
          } else {
            reject(new Error(json.message || 'Error al procesar el archivo'))
          }
        } catch {
          reject(new Error('Error al procesar la respuesta'))
        }
      }

      xhr.onerror = () => reject(new Error('Error de red al subir el archivo'))
      xhr.send(formData)
    })
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  const json = await res.json()

  if (!res.ok) {
    throw new Error(json.message || 'Error al procesar el archivo')
  }

  return json
}

export async function tournamentImportConfirm(data: TournamentConfirmRequest): Promise<TournamentImportResult> {
  return apiFetch('/bulk-import/tournament-confirm', {
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
  pagado: boolean
  clubes?: {
    id: string
    nombre: string
    slug: string
    activo: boolean
    fecha_alta?: string
    fecha_baja?: string
  }[]
  equipos_torneo?: {
    equipo_nombre: string
    categoria_nombre: string | null
  }[]
  created_at?: string
  updated_at?: string
}

export interface PolizaGeneral {
  id: string
  productor_id: string
  fecha_inicio: string
  fecha_fin: string
  archivo_url?: string | null
  observaciones?: string | null
  activa: boolean
  created_at: string
}

export interface JugadoresPaginados {
  data: JugadorResponse[]
  total: number
  page: number
  limit: number
  totalPages: number
  stats: { total: number; pagados: number; noPagados: number }
}

export interface JugadoresParams {
  page?: number
  limit?: number
  search?: string
  pagado?: boolean
  equipoIds?: string[]
}

function buildJugadoresQuery(params?: JugadoresParams): string {
  const qs = new URLSearchParams()
  if (params?.page) qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  if (params?.search) qs.set('search', params.search)
  if (params?.pagado !== undefined) qs.set('pagado', String(params.pagado))
  if (params?.equipoIds && params.equipoIds.length > 0) qs.set('equipo_id', params.equipoIds.join(','))
  return qs.toString() ? `?${qs.toString()}` : ''
}

export async function getJugadores(params?: JugadoresParams): Promise<JugadoresPaginados> {
  const res = await apiFetch(`/jugadores/mi-club${buildJugadoresQuery(params)}`)
  return res
}

export async function getJugadoresProductor(params?: JugadoresParams): Promise<JugadoresPaginados> {
  const res = await apiFetch(`/jugadores/mis-jugadores${buildJugadoresQuery(params)}`)
  return res
}

export async function createJugador(data: {
  nombre: string
  apellido: string
  dni: string
  fecha_nacimiento: string
  telefono?: string
  direccion?: string
  club_id: string
}): Promise<JugadorResponse> {
  const res = await apiFetch('/jugadores', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res.data
}

export type JugadorExistentePorDni =
  | { existe: false }
  | { existe: true; id: string; nombre: string; apellido: string; email: string | null; pagado: boolean }

export async function findJugadorExistenteByDni(dni: string): Promise<JugadorExistentePorDni> {
  const res = await apiFetch(`/jugadores/dni/${encodeURIComponent(dni)}/existente`)
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

export async function getJugadorById(id: string): Promise<JugadorResponse> {
  const res = await apiFetch(`/jugadores/${id}`)
  return res.data
}

export async function updateJugadorProductor(id: string, data: {
  nombre?: string
  apellido?: string
  dni?: string
  fecha_nacimiento?: string
}): Promise<JugadorResponse> {
  const res = await apiFetch(`/jugadores/${id}`, {
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

export async function loginWithUsuario(usuario: string, password: string) {
  const res = await apiFetch('/auth/login/usuario', {
    method: 'POST',
    body: JSON.stringify({ usuario, password }),
  })
  const data = res.data as {
    token: string
    user: { id: string; email: string; name: string; role: string }
    debe_cambiar_password?: boolean
  }
  return {
    token: data.token,
    user: { ...data.user, debe_cambiar_password: data.debe_cambiar_password ?? false },
  }
}

export async function loginWithDNI(dni: string, password: string) {
  const res = await apiFetch('/auth/login/dni', {
    method: 'POST',
    body: JSON.stringify({ dni, password }),
  })
  const data = res.data as {
    token: string
    user: { id: string; email: string; name: string; role: string }
    debe_cambiar_password?: boolean
  }
  return {
    token: data.token,
    user: { ...data.user, debe_cambiar_password: data.debe_cambiar_password ?? false },
  }
}

export async function completarDatos(body: {
  email?: string
  password: string
  password_confirmacion: string
}): Promise<{ debe_cambiar_password: boolean; email: string; token?: string }> {
  const res = await apiFetch('/auth/completar-datos', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return res.data
}

// Password recovery API Functions
//
// Deliberately not using apiFetch: these endpoints are public (no token) and
// must keep working for logged-out users. Mirrors the pattern used by
// registroApi.ts for other unauthenticated auth endpoints.

function extractPublicAuthErrorMessage(res: Response, json: unknown): string {
  if (res.status === 429) {
    return 'Demasiados intentos. Esperá unos minutos y probá de nuevo.'
  }

  if (json && typeof json === 'object') {
    const obj = json as Record<string, unknown>
    const errorObj = obj.error as Record<string, unknown> | undefined
    const nestedMessage = errorObj?.message
    if (typeof nestedMessage === 'string' && nestedMessage) return nestedMessage

    const message = obj.message
    if (Array.isArray(message)) {
      const joined = message.filter((m) => typeof m === 'string').join(' ')
      if (joined) return joined
    }
    if (typeof message === 'string' && message) return message
  }

  return 'Ocurrió un error. Probá de nuevo.'
}

async function publicAuthFetch(path: string, body: unknown): Promise<any> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify(body),
  })

  const json = await res.json()

  if (!res.ok) {
    throw new Error(extractPublicAuthErrorMessage(res, json))
  }

  return json
}

export interface ConsultarRecuperacionResult {
  tiene_correo: boolean
  email_enmascarado?: string
  asistencia_whatsapp: string
}

export async function consultarRecuperacion(dni: string): Promise<ConsultarRecuperacionResult> {
  const res = await publicAuthFetch('/auth/recuperar/consultar', { dni })
  return res.data
}

export async function enviarRecuperacion(dni: string): Promise<{ success: boolean; message: string }> {
  return publicAuthFetch('/auth/recuperar/enviar', { dni })
}

export async function restablecerPassword(body: {
  token: string
  password: string
  password_confirmacion: string
}): Promise<{ success: boolean; message: string }> {
  return publicAuthFetch('/auth/recuperar/restablecer', body)
}

export async function getProfile() {
  const res = await apiFetch('/auth/profile')
  return res.data
}

export async function verifyPassword(password: string): Promise<void> {
  await apiFetch('/auth/verify-password', {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
}

// Admin users API

export type AdminUserRole = 'admin' | 'productor' | 'club' | 'jugador' | 'cantina' | 'developer'
export type AdminUserKind = 'staff' | 'jugador'

export interface AdminManagedUser {
  id: string
  kind: AdminUserKind
  role: AdminUserRole
  nombre: string
  apellido: string | null
  usuario: string | null
  dni: string | null
  email: string | null
  telefono: string | null
  direccion: string | null
  fecha_nacimiento: string | null
  club_id: string | null
  club_nombre: string | null
  activo: boolean
  pagado: boolean | null
  debe_cambiar_password: boolean
  created_at: string | null
}

export interface AdminUsersPage {
  data: AdminManagedUser[]
  total: number
  page: number
  limit: number
  totalPages: number
  counts: {
    staff: number
    jugadores: number
  }
}

export interface AdminUserPayload {
  role: AdminUserRole
  nombre: string
  apellido?: string
  dni?: string
  fecha_nacimiento?: string
  usuario?: string
  email?: string
  telefono?: string
  direccion?: string
  club_id?: string
  password: string
  activo?: boolean
  admin_password: string
}

export type AdminUserUpdatePayload = Partial<Omit<AdminUserPayload, 'role' | 'password'>> & {
  pagado?: boolean
  admin_password: string
}

export async function getAdminUsers(params?: {
  search?: string
  role?: string
  page?: number
  limit?: number
}): Promise<AdminUsersPage> {
  const qs = new URLSearchParams()
  if (params?.search) qs.set('search', params.search)
  if (params?.role && params.role !== 'todos') qs.set('role', params.role)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  const res = await apiFetch(`/admin/users${qs.toString() ? `?${qs.toString()}` : ''}`)
  return res
}

export async function createAdminUser(data: AdminUserPayload): Promise<void> {
  const res = await apiFetch('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res.data
}

export async function updateAdminUser(
  kind: AdminUserKind,
  id: string,
  data: AdminUserUpdatePayload,
): Promise<void> {
  const res = await apiFetch(`/admin/users/${kind}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return res.data
}

export async function resetAdminUserPassword(
  kind: AdminUserKind,
  id: string,
  data: { password: string; admin_password: string },
): Promise<void> {
  await apiFetch(`/admin/users/${kind}/${id}/password`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export interface AdminCouponsReport {
  cantinas: {
    id: string
    nombre: string
    usuario: string | null
    club_id: string | null
    activo: boolean
  }[]
  totales: {
    total_canjes: number
    total_compras: number
    total_descuentos: number
    total_cobrado: number
  }
  por_dia: {
    fecha: string
    canjes: number
    total_compras: number
    total_descuentos: number
    total_cobrado: number
  }[]
  por_cantina: {
    cantina_id: string
    cantina_nombre: string
    canjes: number
    total_compras: number
    total_descuentos: number
    total_cobrado: number
  }[]
  cupones: {
    id: string
    codigo: string | null
    titulo: string
    usado_at: string
    monto_compra: number
    monto_descuento: number
    monto_total: number
    cantina_id: string | null
    cantina_nombre: string
  }[]
}

export async function getAdminCouponsReport(params: {
  desde: string
  hasta: string
  cantinaId?: string
}): Promise<AdminCouponsReport> {
  const qs = new URLSearchParams({
    desde: params.desde,
    hasta: params.hasta,
  })
  if (params.cantinaId && params.cantinaId !== 'todas') qs.set('cantina_id', params.cantinaId)
  const res = await apiFetch(`/admin/reports/coupons?${qs.toString()}`)
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

export async function updateTorneo(torneoId: string, data: UpdateTorneoDTO): Promise<Torneo> {
  const res = await apiFetch(`/clubes/torneos/${torneoId}`, {
    method: 'PATCH',
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

export async function toggleEliminacionDelegados(torneoId: string, permitido: boolean): Promise<Torneo> {
  const res = await apiFetch(`/clubes/torneos/${torneoId}/eliminacion-delegados`, {
    method: 'PATCH',
    body: JSON.stringify({ delegados_pueden_eliminar: permitido }),
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

export async function actualizarInhabilitacionEquipoTorneo(
  inscripcionId: string,
  data: { inhabilitado_por_deuda: boolean; motivo?: string; password: string }
): Promise<Inscripcion> {
  const res = await apiFetch(`/clubes/torneo-equipos/${inscripcionId}/inhabilitacion`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res.data
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

export interface VaciarJugadoresTorneoResult {
  jugadores_quitados: number
  delegados_mantenidos: number
  equipos_afectados: number
}

export async function vaciarJugadoresTorneo(torneoId: string, password: string): Promise<VaciarJugadoresTorneoResult> {
  const res = await apiFetch(`/clubes/torneos/${torneoId}/vaciar-jugadores`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
  return res.data
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
  delegados_pueden_eliminar: boolean
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
  inhabilitado_por_deuda: boolean
  inhabilitado_motivo?: string | null
  inhabilitado_at?: string | null
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
  dni?: string | null
  fecha_nacimiento?: string | null
  numero_camiseta?: number | null
  posicion?: string | null
  capitan: boolean
}

export interface EquipoTorneoDelegado {
  jugador_id: string
  nombre: string
  apellido: string
}

export interface EquipoTorneo {
  id: string
  torneo_id: string
  equipo_id: string
  equipo_nombre: string
  equipo_logo_url?: string | null
  categoria_id: string
  categoria_nombre: string
  inhabilitado_por_deuda: boolean
  inhabilitado_motivo?: string | null
  inhabilitado_at?: string | null
  jugadores: EquipoTorneoJugador[]
  delegados: EquipoTorneoDelegado[]
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

export async function desinscribirseEquipo(torneoId: string, torneoEquipoId: string): Promise<void> {
  await apiFetch(`/jugadores/torneos/${torneoId}/equipos/${torneoEquipoId}/desinscribirse`, {
    method: 'DELETE',
  })
}

// Delegado: gestión de jugadores (desde el lado jugador/delegado)
export interface JugadorBusqueda {
  id: string
  nombre: string
  apellido: string
  dni: string
  pagado: boolean
  equipo_en_torneo?: string | null
}

export async function buscarJugadorPorDni(dni: string, torneoId?: string): Promise<JugadorBusqueda[]> {
  if (dni.length < 3) return []
  const params = torneoId ? `?torneoId=${encodeURIComponent(torneoId)}` : ''
  const res = await apiFetch(`/jugadores/buscar-por-dni/${encodeURIComponent(dni)}${params}`)
  return res.data
}

export async function agregarJugadorPorDelegado(torneoId: string, torneoEquipoId: string, dni: string): Promise<any> {
  const res = await apiFetch(`/jugadores/torneos/${torneoId}/equipos/${torneoEquipoId}/jugadores`, {
    method: 'POST',
    body: JSON.stringify({ dni }),
  })
  return res.data
}

export async function quitarJugadorPorDelegado(torneoId: string, torneoEquipoId: string, jugadorId: string): Promise<void> {
  await apiFetch(`/jugadores/torneos/${torneoId}/equipos/${torneoEquipoId}/jugadores/${jugadorId}`, {
    method: 'DELETE',
  })
}

// Admin: gestión de delegados
export interface DelegadoEquipo {
  id: string
  jugador_id: string
  nombre: string
  apellido: string
  dni?: string | null
  created_at: string
}

export async function getDelegadosEquipoAdmin(torneoEquipoId: string): Promise<DelegadoEquipo[]> {
  const res = await apiFetch(`/clubes/torneo-equipos/${torneoEquipoId}/delegados`)
  return res.data
}

export async function asignarDelegadoAdmin(torneoEquipoId: string, jugadorId: string): Promise<DelegadoEquipo> {
  const res = await apiFetch(`/clubes/torneo-equipos/${torneoEquipoId}/delegados`, {
    method: 'POST',
    body: JSON.stringify({ jugador_id: jugadorId }),
  })
  return res.data
}

export async function quitarDelegadoAdmin(torneoEquipoId: string, jugadorId: string): Promise<void> {
  await apiFetch(`/clubes/torneo-equipos/${torneoEquipoId}/delegados/${jugadorId}`, {
    method: 'DELETE',
  })
}

// Pólizas API Functions

export async function getPolizaActiva(): Promise<PolizaGeneral | null> {
  const res = await apiFetch('/polizas/activa')
  return res.data
}

export async function getPolizas(): Promise<PolizaGeneral[]> {
  const res = await apiFetch('/polizas')
  return res.data
}

export async function createPoliza(data: { fecha_inicio: string; fecha_fin: string; observaciones?: string }): Promise<PolizaGeneral> {
  const res = await apiFetch('/polizas', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res.data
}

export async function uploadPoliza(polizaId: string, file: File): Promise<{ archivo_url: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const res = await fetch(`${API_URL}/polizas/${polizaId}/upload`, {
    method: 'POST',
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  const json = await res.json()

  if (!res.ok) {
    const errorMessage = json.error?.message || json.message || 'Error al subir la póliza'
    throw new Error(errorMessage)
  }

  return json.data
}

export async function deleteJugador(jugadorId: string): Promise<void> {
  await apiFetch(`/jugadores/${jugadorId}`, { method: 'DELETE' })
}

export async function toggleJugadorPagado(jugadorId: string, pagado: boolean): Promise<JugadorResponse> {
  const res = await apiFetch(`/jugadores/${jugadorId}/pagado`, {
    method: 'PATCH',
    body: JSON.stringify({ pagado }),
  })
  return res.data
}

export async function resetJugadorPassword(jugadorId: string, productorPassword: string): Promise<{ password: string }> {
  const res = await apiFetch(`/jugadores/${jugadorId}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ productor_password: productorPassword }),
  })
  return { password: res.password }
}

export interface VerificacionJugador {
  encontrado: boolean
  nombre?: string
  apellido?: string
  pagado?: boolean
  activo?: boolean
}

export async function verificarJugadorDNI(dni: string): Promise<VerificacionJugador> {
  const res = await apiFetch(`/jugadores/verificar/${encodeURIComponent(dni)}`)
  return res.data
}

// Auth API Functions

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; message: string; data?: { token?: string } }> {
  return apiFetch('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

// Notificaciones API Functions

export interface NotificacionDestinatarioResponse {
  id: string
  leida: boolean
  leida_at: string | null
  created_at: string
  notificaciones: {
    id: string
    titulo: string
    mensaje: string
    con_cupon: boolean
    prioridad: string
    created_at: string
  }
}

export interface NotificacionEnviadaResponse {
  id: string
  titulo: string
  mensaje: string
  tipo_filtro: string
  con_cupon: boolean
  cupon_id?: string | null
  cupon_eliminado_at?: string | null
  prioridad: string
  created_at: string
  notificacion_destinatario: { count: number }[]
}

export interface CreateNotificacionData {
  titulo: string
  mensaje: string
  tipo_filtro: 'todos' | 'equipo' | 'categoria' | 'torneo' | 'seguro_vigente' | 'seguro_vencido'
  filtro_id?: string
  prioridad?: 'baja' | 'normal' | 'alta' | 'urgente'
  con_cupon?: boolean
  cupon?: {
    titulo: string
    descripcion?: string
    tipo_descuento: 'porcentaje' | 'monto_fijo'
    valor_descuento: number
    fecha_vencimiento?: string
    color?: CouponColor
  }
}

export async function createNotificacion(data: CreateNotificacionData): Promise<any> {
  const res = await apiFetch('/notificaciones', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res.data
}

export interface MisNotificacionesPage {
  data: NotificacionDestinatarioResponse[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function getMisNotificaciones(
  page = 1,
  limit = 10,
  filtro: 'no_leidas' | 'leidas' | 'all' = 'no_leidas',
): Promise<MisNotificacionesPage> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), filtro })
  const res = await apiFetch(`/notificaciones/mis-notificaciones?${params.toString()}`)
  return {
    data: res.data ?? [],
    total: res.total ?? 0,
    page: res.page ?? page,
    limit: res.limit ?? limit,
    totalPages: res.totalPages ?? 1,
  }
}

export async function getNoLeidasCount(): Promise<number> {
  const res = await apiFetch('/notificaciones/no-leidas/count')
  return res.data.count
}

export async function marcarNotificacionLeida(id: string): Promise<void> {
  await apiFetch(`/notificaciones/${id}/leer`, { method: 'PATCH' })
}

export async function marcarTodasNotificacionesLeidas(): Promise<void> {
  await apiFetch('/notificaciones/leer-todas', { method: 'PATCH' })
}

export async function getNotificacionesEnviadas(): Promise<NotificacionEnviadaResponse[]> {
  const res = await apiFetch('/notificaciones/enviadas')
  return res.data
}

export async function eliminarCuponNotificacion(notificacionId: string): Promise<void> {
  await apiFetch(`/cupones/notificacion/${encodeURIComponent(notificacionId)}`, { method: 'DELETE' })
}

// Cupones API Functions

export interface CuponResponse {
  id: string
  club_id: string
  jugador_id: string | null
  notificacion_id: string | null
  cupon_origen_id?: string | null
  codigo: string | null
  titulo: string
  descripcion: string | null
  tipo_descuento: 'porcentaje' | 'monto_fijo'
  valor_descuento: number
  color?: CouponColor
  monto_minimo_compra: number | null
  fecha_vencimiento: string | null
  usado: boolean
  usado_at: string | null
  monto_compra: number | null
  monto_descuento: number | null
  monto_total: number | null
  canjeado_por: string | null
  es_plantilla?: boolean
  created_at: string
  jugadores?: {
    id: string
    nombre: string
    apellido: string
    dni: string
  }
}

export interface ResumenHoyResponse {
  canjes_hoy: number
  descuentos_hoy: number
  cupones_activos: number
}

export interface ResumenCuponesResponse {
  cupones: {
    id: string
    codigo: string
    titulo: string
    tipo_descuento: string
    valor_descuento: number
    color?: CouponColor
    monto_compra: number
    monto_descuento: number
    monto_total: number
    usado_at: string
    jugadores: { nombre: string; apellido: string }
  }[]
  totales: {
    total_canjes: number
    total_compras: number
    total_descuentos: number
    total_cobrado: number
  }
}

export type CouponColor = 'amber' | 'blue' | 'green' | 'red' | 'purple'

export async function getMisCupones(): Promise<CuponResponse[]> {
  const res = await apiFetch('/cupones/mis-cupones')
  return res.data
}

export async function buscarCupon(codigo: string): Promise<CuponResponse> {
  const res = await apiFetch(`/cupones/buscar/${encodeURIComponent(codigo)}`)
  return res.data
}

export async function generarCodigoCupon(id: string): Promise<CuponResponse> {
  const res = await apiFetch(`/cupones/${id}/generar-codigo`, { method: 'POST' })
  return res.data
}

export async function canjearCupon(id: string, montoCompra: number): Promise<CuponResponse> {
  const res = await apiFetch(`/cupones/${id}/canjear`, {
    method: 'POST',
    body: JSON.stringify({ monto_compra: montoCompra }),
  })
  return res.data
}

export async function getResumenCupones(desde: string, hasta: string): Promise<ResumenCuponesResponse> {
  const res = await apiFetch(`/cupones/resumen?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`)
  return res.data
}

export async function getResumenHoy(): Promise<ResumenHoyResponse> {
  const res = await apiFetch('/cupones/resumen-hoy')
  return res.data
}

// Anuncios API Functions

export interface AnuncioResponse {
  id: string
  club_id: string
  creado_por: string | null
  titulo: string
  descripcion: string | null
  imagen_url: string
  fecha_vencimiento: string
  activo: boolean
  created_at: string
  updated_at: string
}

export async function getMisAnuncios(): Promise<AnuncioResponse[]> {
  const res = await apiFetch('/anuncios/mis-anuncios')
  return res.data
}

export async function getAnuncio(id: string): Promise<AnuncioResponse> {
  const res = await apiFetch(`/anuncios/mis-anuncios/${encodeURIComponent(id)}`)
  return res.data
}

export async function getAnunciosCantina(): Promise<AnuncioResponse[]> {
  const res = await apiFetch('/anuncios/cantina')
  return res.data
}

export async function crearAnuncio(data: {
  titulo: string
  descripcion?: string
  imagen: File
  fecha_vencimiento: string
}): Promise<AnuncioResponse> {
  const formData = new FormData()
  formData.append('titulo', data.titulo)
  formData.append('descripcion', data.descripcion || '')
  formData.append('imagen', data.imagen)
  formData.append('fecha_vencimiento', data.fecha_vencimiento)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const res = await fetch(`${API_URL}/anuncios`, {
    method: 'POST',
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  const json = await res.json()

  if (!res.ok) {
    throw new Error(json.error?.message || json.message || 'Error al crear el anuncio')
  }

  return json.data
}

export async function eliminarAnuncio(id: string): Promise<void> {
  await apiFetch(`/anuncios/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// ========================================
// FCM - Firebase Cloud Messaging
// ========================================

export async function registerFCMToken(token: string): Promise<void> {
  await apiFetch('/fcm/register-token', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

// ========================================
// Puntos (cantina)
// ========================================

export interface PuntosConfigResponse {
  club_id: string
  monto_base: number
  puntos: number
  activo: boolean
}

export interface PuntosJugadorResponse {
  jugador_id: string
  nombre: string
  apellido: string
  saldo: number
}

export interface PuntosCompraResponse {
  jugador: { nombre: string; apellido: string }
  monto_compra: number
  puntos_acreditados: number
  saldo: number
}

export interface CanjearCuponConPuntosResponse {
  data: CuponResponse
  // null when crediting points failed after the redemption was committed
  puntos_acreditados: number | null
  saldo_puntos?: number
}

// Raw response (no { success, data } wrapper); null when the club has no config
export async function getPuntosConfig(): Promise<PuntosConfigResponse | null> {
  const res = await apiFetch('/puntos/config')
  return res ?? null
}

export async function getPuntosJugadorPorDni(dni: string): Promise<PuntosJugadorResponse> {
  return apiFetch(`/puntos/jugador/${encodeURIComponent(dni)}`)
}

export async function registrarCompraPuntos(dni: string, montoCompra: number): Promise<PuntosCompraResponse> {
  return apiFetch('/puntos/compra', {
    method: 'POST',
    body: JSON.stringify({ dni, monto_compra: montoCompra }),
  })
}

// Same endpoint as canjearCupon but keeps the top-level points fields
export async function canjearCuponConPuntos(id: string, montoCompra: number): Promise<CanjearCuponConPuntosResponse> {
  const res = await apiFetch(`/cupones/${id}/canjear`, {
    method: 'POST',
    body: JSON.stringify({ monto_compra: montoCompra }),
  })
  return {
    data: res.data,
    puntos_acreditados: res.puntos_acreditados ?? null,
    saldo_puntos: res.saldo_puntos,
  }
}

// ========================================
// Puntos (club config + jugador balance)
// ========================================

export interface PuntosConfigInput {
  monto_base: number
  puntos: number
  activo?: boolean
}

export interface MiSaldoPuntosResponse {
  saldo: number
  config: { monto_base: number; puntos: number; activo: boolean } | null
}

export type PuntosMovimientoTipo = 'compra' | 'canje' | 'apoyo' | 'anulacion' | 'ajuste'

export interface PuntosMovimiento {
  tipo: PuntosMovimientoTipo
  puntos: number
  monto_compra: number | null
  descripcion: string | null
  created_at: string
}

export interface MisMovimientosPuntosResponse {
  data: PuntosMovimiento[]
  total: number
  page: number
  limit: number
}

// Raw response (no { success, data } wrapper); returns the upserted row
export async function guardarPuntosConfig(input: PuntosConfigInput): Promise<PuntosConfigResponse> {
  return apiFetch('/puntos/config', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

// Numeric columns may arrive as strings from PostgREST, so they are coerced
export async function getMiSaldoPuntos(): Promise<MiSaldoPuntosResponse> {
  const res = await apiFetch('/puntos/mi-saldo')
  return {
    saldo: Number(res.saldo) || 0,
    config: res.config
      ? {
          monto_base: Number(res.config.monto_base),
          puntos: Number(res.config.puntos),
          activo: Boolean(res.config.activo),
        }
      : null,
  }
}

export async function getMisMovimientosPuntos(page = 1, limit = 20): Promise<MisMovimientosPuntosResponse> {
  const res = await apiFetch(`/puntos/mis-movimientos?page=${page}&limit=${limit}`)
  return {
    data: (res.data ?? []).map((m: PuntosMovimiento) => ({
      tipo: m.tipo,
      puntos: Number(m.puntos),
      monto_compra: m.monto_compra === null || m.monto_compra === undefined ? null : Number(m.monto_compra),
      descripcion: m.descripcion ?? null,
      created_at: m.created_at,
    })),
    total: Number(res.total) || 0,
    page: Number(res.page) || page,
    limit: Number(res.limit) || limit,
  }
}

// ========================================
// Puntos (club management: promotions, categories, rewards, redemptions)
// All responses are raw (no { success, data } wrapper); numeric columns may arrive as strings
// ========================================

export interface PuntosPromocion {
  id: string
  titulo: string
  multiplicador: number
  // 0 = Sunday ... 6 = Saturday; null = every day
  dias_semana: number[] | null
  fecha_desde: string | null
  fecha_hasta: string | null
  activo: boolean
  created_at: string
}

export interface PuntosPromocionInput {
  titulo?: string
  multiplicador?: number
  dias_semana?: number[] | null
  fecha_desde?: string | null
  fecha_hasta?: string | null
  activo?: boolean
}

export interface PuntosPromocionActiva {
  id: string
  titulo: string
  multiplicador: number
}

export interface PuntosCategoria {
  id: string
  nombre: string
  icono: string | null
  orden: number
  activo: boolean
}

export interface PuntosCategoriaInput {
  nombre?: string
  icono?: string
  orden?: number
  activo?: boolean
}

export interface PuntosRecompensa {
  id: string
  titulo: string
  descripcion: string | null
  imagen_url: string | null
  costo_puntos: number
  // null = unlimited
  stock: number | null
  activo: boolean
  orden: number
  categoria_id: string | null
  categoria_nombre: string | null
}

export interface PuntosRecompensaInput {
  titulo?: string
  descripcion?: string
  imagen_url?: string
  costo_puntos?: number
  stock?: number | null
  categoria_id?: string | null
  activo?: boolean
  orden?: number
}

export type PuntosCanjeEstado = 'pendiente' | 'entregado' | 'anulado'

export interface PuntosCanje {
  id: string
  codigo: string
  estado: PuntosCanjeEstado
  costo_puntos: number
  created_at: string
  entregado_at: string | null
  recompensa: { titulo: string; imagen_url: string | null } | null
  jugador: { nombre: string; apellido: string } | null
}

export interface PuntosCanjesResponse {
  data: PuntosCanje[]
  total: number
  page: number
  limit: number
}

export interface AnularCanjeResponse {
  canje_id: string
  puntos_devueltos: number
  saldo: number
}

function normalizePromocion(p: PuntosPromocion): PuntosPromocion {
  return {
    ...p,
    multiplicador: Number(p.multiplicador),
    dias_semana: Array.isArray(p.dias_semana) ? p.dias_semana.map(Number) : null,
    fecha_desde: p.fecha_desde ?? null,
    fecha_hasta: p.fecha_hasta ?? null,
    activo: Boolean(p.activo),
  }
}

function normalizeRecompensa(r: PuntosRecompensa): PuntosRecompensa {
  return {
    ...r,
    descripcion: r.descripcion ?? null,
    imagen_url: r.imagen_url ?? null,
    costo_puntos: Number(r.costo_puntos),
    stock: r.stock === null || r.stock === undefined ? null : Number(r.stock),
    orden: Number(r.orden) || 0,
    categoria_id: r.categoria_id ?? null,
    categoria_nombre: r.categoria_nombre ?? null,
  }
}

export async function getPuntosPromociones(): Promise<PuntosPromocion[]> {
  const res = await apiFetch('/puntos/promociones')
  return (Array.isArray(res) ? res : []).map(normalizePromocion)
}

export async function crearPuntosPromocion(input: PuntosPromocionInput): Promise<PuntosPromocion> {
  const res = await apiFetch('/puntos/promociones', { method: 'POST', body: JSON.stringify(input) })
  return normalizePromocion(res)
}

export async function actualizarPuntosPromocion(id: string, input: PuntosPromocionInput): Promise<PuntosPromocion> {
  const res = await apiFetch(`/puntos/promociones/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return normalizePromocion(res)
}

export async function eliminarPuntosPromocion(id: string): Promise<void> {
  await apiFetch(`/puntos/promociones/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function getPuntosPromocionActiva(): Promise<PuntosPromocionActiva | null> {
  const res = await apiFetch('/puntos/promocion-activa')
  return res ? { id: res.id, titulo: res.titulo, multiplicador: Number(res.multiplicador) } : null
}

export async function getPuntosCategorias(): Promise<PuntosCategoria[]> {
  const res = await apiFetch('/puntos/categorias')
  return (Array.isArray(res) ? res : []).map((c: PuntosCategoria) => ({
    ...c,
    icono: c.icono ?? null,
    orden: Number(c.orden) || 0,
    activo: Boolean(c.activo),
  }))
}

export async function crearPuntosCategoria(input: PuntosCategoriaInput): Promise<PuntosCategoria> {
  return apiFetch('/puntos/categorias', { method: 'POST', body: JSON.stringify(input) })
}

export async function actualizarPuntosCategoria(id: string, input: PuntosCategoriaInput): Promise<PuntosCategoria> {
  return apiFetch(`/puntos/categorias/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) })
}

export async function eliminarPuntosCategoria(id: string): Promise<void> {
  await apiFetch(`/puntos/categorias/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function getPuntosRecompensasAdmin(): Promise<PuntosRecompensa[]> {
  const res = await apiFetch('/puntos/recompensas/admin')
  return (Array.isArray(res) ? res : []).map(normalizeRecompensa)
}

export async function crearPuntosRecompensa(input: PuntosRecompensaInput): Promise<PuntosRecompensa> {
  const res = await apiFetch('/puntos/recompensas', { method: 'POST', body: JSON.stringify(input) })
  return normalizeRecompensa(res)
}

export async function actualizarPuntosRecompensa(id: string, input: PuntosRecompensaInput): Promise<PuntosRecompensa> {
  const res = await apiFetch(`/puntos/recompensas/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return normalizeRecompensa(res)
}

export async function eliminarPuntosRecompensa(id: string): Promise<void> {
  await apiFetch(`/puntos/recompensas/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// Multipart upload (field "imagen", max 2 MB, jpeg/png/webp); returns the public image URL
export async function subirImagenRecompensa(imagen: File): Promise<string> {
  const formData = new FormData()
  formData.append('imagen', imagen)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const res = await fetch(`${API_URL}/puntos/recompensas/imagen`, {
    method: 'POST',
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  const json = await res.json()

  if (!res.ok) {
    throw new Error(json.error?.message || json.message || 'No pudimos subir la imagen')
  }

  return json.imagen_url
}

export async function getPuntosCanjesClub(
  estado: PuntosCanjeEstado,
  page = 1,
  limit = 20
): Promise<PuntosCanjesResponse> {
  const res = await apiFetch(`/puntos/canjes?estado=${estado}&page=${page}&limit=${limit}`)
  return {
    data: (res.data ?? []).map((c: PuntosCanje) => ({
      ...c,
      costo_puntos: Number(c.costo_puntos),
      entregado_at: c.entregado_at ?? null,
      recompensa: c.recompensa ?? null,
      jugador: c.jugador ?? null,
    })),
    total: Number(res.total) || 0,
    page: Number(res.page) || page,
    limit: Number(res.limit) || limit,
  }
}

export async function anularPuntosCanje(id: string): Promise<AnularCanjeResponse> {
  const res = await apiFetch(`/puntos/canjes/${encodeURIComponent(id)}/anular`, { method: 'POST' })
  return {
    canje_id: res.canje_id,
    puntos_devueltos: Number(res.puntos_devueltos) || 0,
    saldo: Number(res.saldo) || 0,
  }
}

// ========================================
// Puntos (jugador: rewards catalog and redemptions)
// Raw responses (no { success, data } wrapper); numeric columns may arrive as strings
// ========================================

export interface PuntosCatalogoRecompensa {
  id: string
  titulo: string
  descripcion: string | null
  imagen_url: string | null
  costo_puntos: number
  // null = unlimited
  stock: number | null
  agotado: boolean
  categoria_id: string | null
  categoria_nombre: string | null
}

export interface PuntosCatalogoCategoria {
  id: string
  nombre: string
  icono: string | null
}

export interface PuntosCatalogoResponse {
  saldo: number
  promocion_activa: PuntosPromocionActiva | null
  categorias: PuntosCatalogoCategoria[]
  recompensas: PuntosCatalogoRecompensa[]
}

export interface CanjearRecompensaResponse {
  canje_id: string
  codigo: string
  costo_puntos: number
  saldo: number
  recompensa: { titulo: string; imagen_url: string | null }
}

export interface MiCanjePuntos {
  id: string
  codigo: string
  estado: PuntosCanjeEstado
  costo_puntos: number
  created_at: string
  entregado_at: string | null
  recompensa: { titulo: string; imagen_url: string | null } | null
}

export interface AnularMiCanjeResponse {
  canje_id: string
  puntos_devueltos: number
  saldo: number
}

export async function getPuntosCatalogo(): Promise<PuntosCatalogoResponse> {
  const res = await apiFetch('/puntos/catalogo')
  return {
    saldo: Number(res.saldo) || 0,
    promocion_activa: res.promocion_activa
      ? {
          id: res.promocion_activa.id,
          titulo: res.promocion_activa.titulo,
          multiplicador: Number(res.promocion_activa.multiplicador),
        }
      : null,
    categorias: (res.categorias ?? []).map((c: PuntosCatalogoCategoria) => ({
      id: c.id,
      nombre: c.nombre,
      icono: c.icono ?? null,
    })),
    recompensas: (res.recompensas ?? []).map((r: PuntosCatalogoRecompensa) => ({
      id: r.id,
      titulo: r.titulo,
      descripcion: r.descripcion ?? null,
      imagen_url: r.imagen_url ?? null,
      costo_puntos: Number(r.costo_puntos),
      stock: r.stock === null || r.stock === undefined ? null : Number(r.stock),
      agotado: Boolean(r.agotado),
      categoria_id: r.categoria_id ?? null,
      categoria_nombre: r.categoria_nombre ?? null,
    })),
  }
}

export async function canjearRecompensaPuntos(id: string): Promise<CanjearRecompensaResponse> {
  const res = await apiFetch(`/puntos/recompensas/${encodeURIComponent(id)}/canjear`, { method: 'POST' })
  return {
    canje_id: res.canje_id,
    codigo: res.codigo,
    costo_puntos: Number(res.costo_puntos) || 0,
    saldo: Number(res.saldo) || 0,
    recompensa: {
      titulo: res.recompensa?.titulo ?? '',
      imagen_url: res.recompensa?.imagen_url ?? null,
    },
  }
}

export async function getMisCanjesPuntos(estado?: PuntosCanjeEstado): Promise<MiCanjePuntos[]> {
  const res = await apiFetch(`/puntos/mis-canjes${estado ? `?estado=${estado}` : ''}`)
  return (Array.isArray(res) ? res : []).map((c: MiCanjePuntos) => ({
    id: c.id,
    codigo: c.codigo,
    estado: c.estado,
    costo_puntos: Number(c.costo_puntos) || 0,
    created_at: c.created_at,
    entregado_at: c.entregado_at ?? null,
    recompensa: c.recompensa ?? null,
  }))
}

export async function anularMiCanjePuntos(id: string): Promise<AnularMiCanjeResponse> {
  const res = await apiFetch(`/puntos/mis-canjes/${encodeURIComponent(id)}/anular`, { method: 'POST' })
  return {
    canje_id: res.canje_id,
    puntos_devueltos: Number(res.puntos_devueltos) || 0,
    saldo: Number(res.saldo) || 0,
  }
}

// Team support ranking ("Apoyá a tu equipo")

export interface RankingEquipoPuntos {
  torneo_equipo_id: string
  equipo_nombre: string
  equipo_logo_url: string | null
  categoria_nombre: string | null
  total: number
  apoyos: number
  posicion: number
}

export type EstadoCompetenciaRanking = 'abierta' | 'pausada' | 'finalizada'

export interface RankingCompetenciaPuntos {
  id: string
  inicio: string
  fin: string
  estado: EstadoCompetenciaRanking
}

export interface RankingTorneoPuntos {
  torneo_id: string
  torneo_nombre: string
  /** Current competition of the torneo; only its supports count. */
  competencia: RankingCompetenciaPuntos | null
  equipos: RankingEquipoPuntos[]
}

export interface RankingPuntosResponse {
  torneos: RankingTorneoPuntos[]
  actualizado_at: string | null
}

export interface MiApoyoPuntos {
  torneo_equipo_id: string
  total: number
}

export interface ApoyarPuntosResponse {
  saldo: number
  torneos: RankingTorneoPuntos[]
  mis_apoyos: MiApoyoPuntos[]
}

export interface ApoyarEquipoResponse {
  torneo_id: string
  torneo_equipo_id: string
  puntos: number
  saldo: number
  total_equipo: number
  equipo_nombre: string
}

export function normalizeRankingTorneosPuntos(torneos: unknown): RankingTorneoPuntos[] {
  if (!Array.isArray(torneos)) return []
  return torneos.map((t: RankingTorneoPuntos) => ({
    torneo_id: t.torneo_id,
    torneo_nombre: t.torneo_nombre ?? '',
    competencia: t.competencia
      ? {
          id: t.competencia.id,
          inicio: t.competencia.inicio,
          fin: t.competencia.fin,
          estado: t.competencia.estado,
        }
      : null,
    equipos: (Array.isArray(t.equipos) ? t.equipos : []).map((e: RankingEquipoPuntos) => ({
      torneo_equipo_id: e.torneo_equipo_id,
      equipo_nombre: e.equipo_nombre ?? '',
      equipo_logo_url: e.equipo_logo_url ?? null,
      categoria_nombre: e.categoria_nombre ?? null,
      total: Number(e.total) || 0,
      apoyos: Number(e.apoyos) || 0,
      posicion: Number(e.posicion) || 0,
    })),
  }))
}

export async function getRankingPuntos(): Promise<RankingPuntosResponse> {
  const res = await apiFetch('/puntos/ranking')
  return {
    torneos: normalizeRankingTorneosPuntos(res.torneos),
    actualizado_at: res.actualizado_at ?? null,
  }
}

export async function getApoyarPuntos(): Promise<ApoyarPuntosResponse> {
  const res = await apiFetch('/puntos/apoyar')
  return {
    saldo: Number(res.saldo) || 0,
    torneos: normalizeRankingTorneosPuntos(res.torneos),
    mis_apoyos: (Array.isArray(res.mis_apoyos) ? res.mis_apoyos : []).map((a: MiApoyoPuntos) => ({
      torneo_equipo_id: a.torneo_equipo_id,
      total: Number(a.total) || 0,
    })),
  }
}

export async function apoyarEquipoPuntos(torneoEquipoId: string, puntos: number): Promise<ApoyarEquipoResponse> {
  const res = await apiFetch('/puntos/apoyar', {
    method: 'POST',
    body: JSON.stringify({ torneo_equipo_id: torneoEquipoId, puntos }),
  })
  return {
    torneo_id: res.torneo_id,
    torneo_equipo_id: res.torneo_equipo_id,
    puntos: Number(res.puntos) || 0,
    saldo: Number(res.saldo) || 0,
    total_equipo: Number(res.total_equipo) || 0,
    equipo_nombre: res.equipo_nombre ?? '',
  }
}

// Team support competitions per torneo (club)

export type EstadoCompetencia = 'programada' | 'abierta' | 'pausada' | 'finalizada'

export interface PuntosCompetencia {
  id: string
  torneo_id: string
  inicio: string
  fin: string
  habilitada: boolean
  estado: EstadoCompetencia
}

export interface CompetenciasTorneo {
  torneo_id: string
  torneo_nombre: string
  competencias: PuntosCompetencia[]
}

export interface CompetenciasResponse {
  hoy: string
  torneos: CompetenciasTorneo[]
}

export async function getPuntosCompetencias(): Promise<CompetenciasResponse> {
  const res = await apiFetch('/puntos/competencias')
  return {
    hoy: res.hoy ?? '',
    torneos: Array.isArray(res.torneos) ? res.torneos : [],
  }
}

export async function crearPuntosCompetencia(body: {
  torneo_id: string
  inicio: string
  fin: string
  habilitada?: boolean
}): Promise<PuntosCompetencia> {
  return apiFetch('/puntos/competencias', { method: 'POST', body: JSON.stringify(body) })
}

export async function actualizarPuntosCompetencia(
  id: string,
  body: { inicio?: string; fin?: string; habilitada?: boolean }
): Promise<PuntosCompetencia> {
  return apiFetch(`/puntos/competencias/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
}

export async function eliminarPuntosCompetencia(id: string): Promise<void> {
  await apiFetch(`/puntos/competencias/${id}`, { method: 'DELETE' })
}

// ========================================
// Puntos (cantina: deliver a reward by code) and jugador saldo with active promotion
// Raw responses; numeric columns may arrive as strings
// ========================================

export interface CanjePorCodigo {
  id: string
  codigo: string
  estado: PuntosCanjeEstado
  costo_puntos: number
  created_at: string
  entregado_at: string | null
  recompensa: { titulo: string; imagen_url: string | null } | null
  jugador: { nombre: string; apellido: string; dni: string } | null
}

export interface EntregarCanjeResponse {
  id: string
  codigo: string
  estado: PuntosCanjeEstado
  entregado_at: string | null
}

export interface MiSaldoConPromocionResponse {
  saldo: number
  promocion_activa: PuntosPromocionActiva | null
}

export async function getCanjePorCodigo(codigo: string): Promise<CanjePorCodigo> {
  const res = await apiFetch(`/puntos/canjes/codigo/${encodeURIComponent(codigo)}`)
  return {
    id: res.id,
    codigo: res.codigo,
    estado: res.estado,
    costo_puntos: Number(res.costo_puntos) || 0,
    created_at: res.created_at,
    entregado_at: res.entregado_at ?? null,
    recompensa: res.recompensa ?? null,
    jugador: res.jugador ?? null,
  }
}

export async function entregarPuntosCanje(id: string): Promise<EntregarCanjeResponse> {
  const res = await apiFetch(`/puntos/canjes/${encodeURIComponent(id)}/entregar`, { method: 'POST' })
  return {
    id: res.id,
    codigo: res.codigo,
    estado: res.estado,
    entregado_at: res.entregado_at ?? null,
  }
}

export async function getMiSaldoConPromocion(): Promise<MiSaldoConPromocionResponse> {
  const res = await apiFetch('/puntos/mi-saldo')
  const p = res.promocion_activa
  return {
    saldo: Number(res.saldo) || 0,
    promocion_activa: p
      ? { id: p.id, titulo: p.titulo, multiplicador: Number(p.multiplicador) || 1 }
      : null,
  }
}

// ========================================
// Sliding session + FCM cleanup
// ========================================

export async function refreshSession(): Promise<string> {
  const res = await apiFetch('/auth/refresh', { method: 'POST' })
  return res.data.token as string
}

export async function removeFCMToken(token: string): Promise<void> {
  await apiFetch('/fcm/token', {
    method: 'DELETE',
    body: JSON.stringify({ token }),
  })
}

// ========================================
// Cantina: unified purchase registration
// ========================================

export interface RegistrarCompraBody {
  monto_compra: number
  dni?: string
  cupon_codigo?: string
  // Amount the coupon applies to (e.g. only the burgers); defaults to monto_compra
  monto_aplicable?: number
}

export interface RegistrarCompraData {
  compra_id: string
  jugador_encontrado: boolean
  jugador: { nombre: string; apellido: string } | null
  monto_compra: number
  monto_descuento: number
  monto_total: number
  puntos_acreditados: number
  cupon: { titulo: string } | null
}

export async function registrarCompra(body: RegistrarCompraBody): Promise<RegistrarCompraData> {
  const res = await apiFetch('/compras', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return res.data
}

// ========================================
// Cantina: caja history (every registered sale)
// ========================================

export interface CompraCajaItem {
  id: string
  created_at: string
  monto_compra: number
  monto_descuento: number
  monto_total: number
  puntos_acreditados: number
  dni_mascara: string | null
  jugador: { nombre: string; apellido: string } | null
  cupon: { titulo: string } | null
  cantina: { id: string; nombre: string }
}

export interface CajaTotales {
  cantidad: number
  total_vendido: number
  total_descuentos: number
  total_cobrado: number
  puntos_dados: number
  ventas_sin_app: number
}

export interface ListarComprasData {
  items: CompraCajaItem[]
  total_count: number
  totales: CajaTotales
}

export async function listarCompras(params: {
  desde: string
  hasta: string
  limit?: number
  offset?: number
  cantina_id?: string
}): Promise<ListarComprasData> {
  const qs = new URLSearchParams({ desde: params.desde, hasta: params.hasta })
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))
  if (params.cantina_id) qs.set('cantina_id', params.cantina_id)
  const res = await apiFetch(`/compras?${qs.toString()}`)
  return res.data
}

export interface CantinaCaja {
  id: string
  nombre: string
  activo: boolean
}

export async function getCantinasCaja(): Promise<CantinaCaja[]> {
  const res = await apiFetch('/compras/cantinas')
  return res.data
}
