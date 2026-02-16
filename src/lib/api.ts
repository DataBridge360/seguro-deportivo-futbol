import type { PreviewResponse, ConfirmRequest, ImportResult, Club } from '@/types/bulk-import'

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
    throw new Error(json.message || 'Error en la solicitud')
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
