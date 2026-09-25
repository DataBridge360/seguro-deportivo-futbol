// Cliente para el registro público de jugadores (/auth/dni-disponible, /auth/register).
// Deliberadamente separado de src/lib/api.ts: son endpoints públicos (sin token)
// consumidos antes de que exista una sesión. Construye la URL base de la misma
// forma que api.ts (NEXT_PUBLIC_API_URL + path, ya incluye el prefijo api/v1).

const API_URL = process.env.NEXT_PUBLIC_API_URL

function extractErrorMessage(json: unknown, fallback: string): string {
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
  return fallback
}

export async function checkDniDisponible(dni: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/auth/dni-disponible/${encodeURIComponent(dni)}`, {
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
  })

  const json = await res.json()

  if (!res.ok) {
    throw new Error(extractErrorMessage(json, 'No se pudo verificar el DNI'))
  }

  return json.disponible === true
}

export interface RegisterJugadorPayload {
  dni: string
  nombre: string
  apellido: string
  fecha_nacimiento: string
  email: string
  telefono?: string
  password: string
  password_confirmacion: string
}

export interface RegisterJugadorResult {
  token: string
  user: {
    id: string
    email: string
    name: string
    role: string
  }
  debe_cambiar_password: boolean
}

export async function registerJugador(data: RegisterJugadorPayload): Promise<RegisterJugadorResult> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify(data),
  })

  const json = await res.json()

  if (!res.ok) {
    throw new Error(extractErrorMessage(json, 'No se pudo crear la cuenta'))
  }

  return json.data as RegisterJugadorResult
}
