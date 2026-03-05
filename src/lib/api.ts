import type { PreviewResponse, ConfirmRequest, ImportResult, Club, TournamentPreviewResponse, TournamentConfirmRequest, TournamentImportResult } from '@/types/bulk-import'
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

export async function getJugadores(): Promise<JugadorResponse[]> {
  const res = await apiFetch('/jugadores/mi-club')
  return res.data
}

export async function getJugadoresProductor(): Promise<JugadorResponse[]> {
  const res = await apiFetch('/jugadores/mis-jugadores')
  return res.data
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

export async function loginWithUsuario(usuario: string, password: string) {
  const res = await apiFetch('/auth/login/usuario', {
    method: 'POST',
    body: JSON.stringify({ usuario, password }),
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

export async function verifyPassword(password: string): Promise<void> {
  await apiFetch('/auth/verify-password', {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
}

// Torneos API Functions

export async function createTorneo(data: CreateTorneoDTO): Promise<Torneo> {
  const res = await apiFetch('/clubes/torneos', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res.data
}

export async function updateTorneo(torneoId: string, data: Partial<CreateTorneoDTO>): Promise<Torneo> {
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
  dni?: string | null
  fecha_nacimiento?: string | null
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

export async function desinscribirseEquipo(torneoId: string, torneoEquipoId: string): Promise<void> {
  await apiFetch(`/jugadores/torneos/${torneoId}/equipos/${torneoEquipoId}/desinscribirse`, {
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

export async function toggleJugadorPagado(jugadorId: string, pagado: boolean): Promise<JugadorResponse> {
  const res = await apiFetch(`/jugadores/${jugadorId}/pagado`, {
    method: 'PATCH',
    body: JSON.stringify({ pagado }),
  })
  return res.data
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

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
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
  }
}

export async function createNotificacion(data: CreateNotificacionData): Promise<any> {
  const res = await apiFetch('/notificaciones', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res.data
}

export async function getMisNotificaciones(): Promise<NotificacionDestinatarioResponse[]> {
  const res = await apiFetch('/notificaciones/mis-notificaciones')
  return res.data
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

// Cupones API Functions

export interface CuponResponse {
  id: string
  club_id: string
  jugador_id: string
  notificacion_id: string | null
  codigo: string
  titulo: string
  descripcion: string | null
  tipo_descuento: 'porcentaje' | 'monto_fijo'
  valor_descuento: number
  monto_minimo_compra: number | null
  fecha_vencimiento: string | null
  usado: boolean
  usado_at: string | null
  monto_compra: number | null
  monto_descuento: number | null
  monto_total: number | null
  canjeado_por: string | null
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

export async function getMisCupones(): Promise<CuponResponse[]> {
  const res = await apiFetch('/cupones/mis-cupones')
  return res.data
}

export async function buscarCupon(codigo: string): Promise<CuponResponse> {
  const res = await apiFetch(`/cupones/buscar/${encodeURIComponent(codigo)}`)
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
