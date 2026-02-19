# 📘 Integración Frontend - Bulk Import de Jugadores

Documentación completa para integrar el módulo de carga masiva de jugadores en el frontend.

---

## 📍 Base URL

```
http://localhost:3001
```

---

## 🏢 IMPORTANTE: Selector de Club

⚠️ **El productor DEBE seleccionar un club antes de importar jugadores.**

El campo `club_id` es **REQUERIDO** en el request de confirmación. El frontend debe:
1. Cargar la lista de clubes desde `GET /clubes`
2. Mostrar un selector de club
3. Validar que se haya seleccionado un club antes de confirmar
4. Enviar el `club_id` en el request

Ver guía completa: [`CLUB_SELECTOR.md`](CLUB_SELECTOR.md)

---

## 0️⃣ GET `/clubes` - Obtener Lista de Clubes

### Descripción
Obtiene la lista de todos los clubes activos para mostrar en el selector.

### Request

**Método:** `GET`
**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

### Response (200 OK)

```typescript
{
  success: boolean;
  data: Array<{
    id: string;           // UUID del club
    nombre: string;       // Nombre del club
    slug: string;         // Slug URL-friendly
    descripcion: string;  // Descripción del club
    logo_url: string;     // URL del logo
    activo: boolean;      // true para clubes activos
  }>;
}
```

### Ejemplo de Response

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "nombre": "Club Atlético River Plate",
      "slug": "river-plate",
      "descripcion": "Club de fútbol argentino",
      "logo_url": "https://...",
      "activo": true
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "nombre": "Club Boca Juniors",
      "slug": "boca-juniors",
      "descripcion": "Club de fútbol argentino",
      "logo_url": "https://...",
      "activo": true
    }
  ]
}
```

---

## 1️⃣ POST `/bulk-import/preview`

### Descripción
Sube un archivo Excel y obtiene un preview con la lista de jugadores a importar, detectando duplicados y errores.

### Request

**Método:** `POST`
**Content-Type:** `multipart/form-data`
**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Body (FormData):**
```javascript
const formData = new FormData();
formData.append('file', archivoExcel); // File object del input
```

### Response (200 OK)

```typescript
{
  total: number;                    // Total de jugadores en el Excel
  new_players: Array<{              // Jugadores nuevos listos para importar
    row: number;                    // Número de fila en el Excel
    dni: string;                    // DNI del jugador
    nombre: string;                 // Nombre
    apellido: string;               // Apellido
    nombre_completo: string;        // Nombre completo (NOMBRE APELLIDO)
    fecha_nacimiento: string;       // Fecha en formato ISO (YYYY-MM-DD)
    status: 'new';                  // Estado: siempre 'new'
  }>;
  existing_players: Array<{         // Jugadores que ya existen en la BD
    row: number;                    // Número de fila en el Excel
    dni: string;                    // DNI del jugador
    nombre_completo: string;        // Nombre completo
    existing_id: string;            // UUID del jugador existente
    message: string;                // Mensaje descriptivo
  }>;
  errors: Array<{                   // Errores de validación
    row: number;                    // Número de fila con error
    dni: string | null;             // DNI (si está disponible)
    message: string;                // Descripción del error
  }>;
  preview_token: string;            // Token para confirmar (válido 15 min)
}
```

### Ejemplo de Response

```json
{
  "total": 100,
  "new_players": [
    {
      "row": 2,
      "dni": "28387875",
      "nombre": "CRISTIAN",
      "apellido": "ABARZUA",
      "nombre_completo": "CRISTIAN ABARZUA",
      "fecha_nacimiento": "1980-07-09T00:00:00.000Z",
      "status": "new"
    }
  ],
  "existing_players": [
    {
      "row": 45,
      "dni": "12345678",
      "nombre_completo": "MARIA GOMEZ",
      "existing_id": "550e8400-e29b-41d4-a716-446655440000",
      "message": "El jugador MARIA GOMEZ (DNI: 12345678) ya existe, ¿deseas sobreescribir?"
    }
  ],
  "errors": [
    {
      "row": 100,
      "dni": null,
      "message": "DNI vacío o inválido"
    }
  ],
  "preview_token": "abc123def456xyz789"
}
```

### Errores Posibles

| Código | Error | Descripción |
|--------|-------|-------------|
| 400 | Bad Request | No se envió archivo o formato inválido |
| 401 | Unauthorized | Token inválido o expirado |
| 403 | Forbidden | Usuario sin permisos (solo admin, productor, club) |
| 413 | Payload Too Large | Archivo mayor a 10MB |

---

## 2️⃣ POST `/bulk-import/confirm`

### Descripción
Confirma la importación de jugadores usando el token del preview.

⚠️ **IMPORTANTE:** Debes enviar el `club_id` seleccionado por el productor.

### Request

**Método:** `POST`
**Content-Type:** `application/json`
**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Body:**
```typescript
{
  preview_token: string;        // Token obtenido del /preview (REQUERIDO)
  club_id: string;              // UUID del club seleccionado (REQUERIDO)
  productor_id: string;         // UUID del productor (REQUERIDO)
  overwrite_existing: boolean;  // true = actualiza existentes, false = omite (REQUERIDO)
  test_mode?: boolean;          // true = solo carga el primer jugador, false = carga todos (OPCIONAL, default: false)
}
```

### Response (200 OK)

```typescript
{
  success: boolean;               // true si la importación fue exitosa
  inserted: number;               // Cantidad de jugadores nuevos insertados
  updated: number;                // Cantidad de jugadores actualizados
  skipped: number;                // Cantidad de jugadores omitidos
  created_players: Array<{        // ⬅️ NUEVO: Lista de jugadores creados exitosamente
    dni: string;
    nombre: string;
    apellido: string;
    nombre_completo: string;
    fecha_nacimiento: string;
    row: number;                  // Fila del Excel
  }>;
  updated_players: Array<{        // ⬅️ NUEVO: Lista de jugadores actualizados
    dni: string;
    nombre: string;
    apellido: string;
    nombre_completo: string;
    fecha_nacimiento: string;
    row: number;
  }>;
  errors: Array<{                 // Errores durante la importación
    row: number;                  // Fila con error
    dni: string;                  // DNI del jugador
    error: string;                // Descripción del error
  }>;
  summary: {
    perfiles_created: number;     // Perfiles creados
    jugadores_created: number;    // Registros en tabla jugadores
    jugador_club_created: number; // Relaciones jugador-club creadas
  };
  message: string;                // Mensaje descriptivo del resultado
}
```

### Ejemplo de Response (Modo Normal)

```json
{
  "success": true,
  "inserted": 95,
  "updated": 3,
  "skipped": 2,
  "created_players": [
    {
      "dni": "28387875",
      "nombre": "Juan",
      "apellido": "Abarzua",
      "nombre_completo": "Juan Abarzua",
      "fecha_nacimiento": "2005-03-15",
      "row": 2
    },
    {
      "dni": "12345678",
      "nombre": "María",
      "apellido": "González",
      "nombre_completo": "María González",
      "fecha_nacimiento": "2004-07-22",
      "row": 3
    }
    // ... 93 jugadores más
  ],
  "updated_players": [
    {
      "dni": "98765432",
      "nombre": "Pedro",
      "apellido": "Martínez",
      "nombre_completo": "Pedro Martínez",
      "fecha_nacimiento": "2003-12-10",
      "row": 4
    }
    // ... 2 jugadores más
  ],
  "errors": [],
  "summary": {
    "perfiles_created": 95,
    "jugadores_created": 95,
    "jugador_club_created": 98
  },
  "message": "Importación completada exitosamente"
}
```

### Ejemplo de Response (Modo Prueba)

```json
{
  "success": true,
  "inserted": 1,
  "updated": 0,
  "skipped": 0,
  "created_players": [
    {
      "dni": "28387875",
      "nombre": "Juan",
      "apellido": "Abarzua",
      "nombre_completo": "Juan Abarzua",
      "fecha_nacimiento": "2005-03-15",
      "row": 2
    }
  ],
  "updated_players": [],
  "errors": [],
  "summary": {
    "perfiles_created": 1,
    "jugadores_created": 1,
    "jugador_club_created": 1
  },
  "message": "Carga de prueba completada exitosamente (1 jugador)"
}
```

### Errores Posibles

| Código | Error | Descripción |
|--------|-------|-------------|
| 400 | Bad Request | Token inválido/expirado o datos faltantes |
| 401 | Unauthorized | Token de autenticación inválido |
| 403 | Forbidden | Usuario sin permisos |

---

## 🎨 Integración en Frontend

### Paso 1: Definir Tipos TypeScript

```typescript
// types/bulk-import.ts

export interface Club {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  logo_url: string;
  activo: boolean;
}

export interface PreviewResponse {
  total: number;
  new_players: NewPlayer[];
  existing_players: ExistingPlayer[];
  errors: ErrorItem[];
  preview_token: string;
}

export interface NewPlayer {
  row: number;
  dni: string;
  nombre: string;
  apellido: string;
  nombre_completo: string;
  fecha_nacimiento: string;
  status: 'new';
}

export interface ExistingPlayer {
  row: number;
  dni: string;
  nombre_completo: string;
  existing_id: string;
  message: string;
}

export interface ErrorItem {
  row: number;
  dni: string | null;
  message: string;
}

export interface ConfirmRequest {
  preview_token: string;
  club_id: string;           // REQUERIDO
  productor_id: string;
  overwrite_existing: boolean;
  test_mode?: boolean;
}

export interface CreatedPlayer {
  dni: string;
  nombre: string;
  apellido: string;
  nombre_completo: string;
  fecha_nacimiento: string;
  row: number;
}

export interface ImportResult {
  success: boolean;
  inserted: number;
  updated: number;
  skipped: number;
  created_players: CreatedPlayer[];  // ⬅️ NUEVO
  updated_players: CreatedPlayer[];  // ⬅️ NUEVO
  errors: ImportError[];
  summary: {
    perfiles_created: number;
    jugadores_created: number;
    jugador_club_created: number;
  };
  message: string;
}

export interface ImportError {
  row: number;
  dni: string;
  error: string;
}
```

### Paso 2: Crear Servicio de API

```typescript
// services/bulk-import.service.ts

import { PreviewResponse, ConfirmRequest, ImportResult, Club } from '@/types/bulk-import';

const API_BASE_URL = 'http://localhost:3001';

export class BulkImportService {

  /**
   * Obtiene la lista de clubes activos
   */
  static async getClubs(token: string): Promise<Club[]> {
    const response = await fetch(`${API_BASE_URL}/clubes`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener clubes');
    }

    const data = await response.json();
    return data.data; // data.data contiene el array de clubes
  }

  /**
   * Sube un archivo Excel y obtiene el preview
   */
  static async preview(file: File, token: string): Promise<PreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/bulk-import/preview`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al procesar el archivo');
    }

    return response.json();
  }

  /**
   * Confirma la importación de jugadores
   */
  static async confirm(
    data: ConfirmRequest,
    token: string
  ): Promise<ImportResult> {
    const response = await fetch(`${API_BASE_URL}/bulk-import/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al confirmar la importación');
    }

    return response.json();
  }
}
```

### Paso 3: Helper para Generar Contraseñas

```typescript
// utils/password-generator.ts

/**
 * Genera la contraseña inicial del jugador
 * Formato: Apellido (primera mayúscula) + últimos 3 dígitos del DNI
 *
 * @param apellido - Apellido del jugador
 * @param dni - DNI del jugador
 * @returns Contraseña generada
 *
 * @example
 * generatePassword("ABARZUA", "28387875") // → "Abarzua875"
 * generatePassword("gonzález", "12345678") // → "González678"
 */
export function generatePassword(apellido: string, dni: string): string {
  if (!apellido || !dni) {
    return '';
  }

  const apellidoFormatted =
    apellido.charAt(0).toUpperCase() + apellido.slice(1).toLowerCase();
  const lastThree = dni.slice(-3);

  return `${apellidoFormatted}${lastThree}`;
}
```

### Paso 4: Componente React Completo

```tsx
// components/BulkImportJugadores.tsx

import React, { useState, useEffect } from 'react';
import { BulkImportService } from '@/services/bulk-import.service';
import { PreviewResponse, ImportResult, Club } from '@/types/bulk-import';
import { generatePassword } from '@/utils/password-generator'; // ⬅️ Importar helper

export const BulkImportJugadores: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [overwriteExisting, setOverwriteExisting] = useState(false);

  const token = localStorage.getItem('auth_token'); // Tu lógica de auth
  const productorId = 'tu-productor-id'; // Obtener del contexto/usuario

  // 1. Cargar lista de clubes al montar
  useEffect(() => {
    async function loadClubs() {
      try {
        const clubsList = await BulkImportService.getClubs(token!);
        setClubs(clubsList);
      } catch (error) {
        console.error('Error al cargar clubes:', error);
        alert('Error al cargar la lista de clubes');
      }
    }
    loadClubs();
  }, [token]);

  // 2. Subir archivo y obtener preview
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);
    setPreview(null);
    setResult(null);

    try {
      const previewData = await BulkImportService.preview(selectedFile, token!);
      setPreview(previewData);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Confirmar importación (modo prueba)
  const handleTestImport = async () => {
    if (!preview || !selectedClubId) {
      alert('⚠️ Debes seleccionar un club y subir un archivo');
      return;
    }

    setLoading(true);
    try {
      const importResult = await BulkImportService.confirm(
        {
          preview_token: preview.preview_token,
          club_id: selectedClubId,     // ⬅️ Club seleccionado
          productor_id: productorId,
          overwrite_existing: overwriteExisting,
          test_mode: true,             // ⬅️ MODO PRUEBA
        },
        token!
      );
      setResult(importResult);
      alert(importResult.message);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Confirmar importación (todos)
  const handleFullImport = async () => {
    if (!preview || !selectedClubId) {
      alert('⚠️ Debes seleccionar un club y subir un archivo');
      return;
    }

    const confirmed = confirm(
      `¿Estás seguro de importar ${preview.total} jugadores al club "${clubs.find(c => c.id === selectedClubId)?.nombre}"?`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const importResult = await BulkImportService.confirm(
        {
          preview_token: preview.preview_token,
          club_id: selectedClubId,     // ⬅️ Club seleccionado
          productor_id: productorId,
          overwrite_existing: overwriteExisting,
          test_mode: false,            // ⬅️ MODO COMPLETO
        },
        token!
      );
      setResult(importResult);
      alert(importResult.message);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Carga Masiva de Jugadores</h1>

      {/* 1. Selector de Club (OBLIGATORIO) */}
      <div className="mb-6">
        <label className="block mb-2 font-bold text-gray-700">
          Seleccionar Club *
          <span className="text-sm font-normal text-gray-500 ml-2">
            Los jugadores se asignarán a este club
          </span>
        </label>
        <select
          value={selectedClubId}
          onChange={(e) => setSelectedClubId(e.target.value)}
          className="border p-2 rounded w-full"
          required
        >
          <option value="">-- Selecciona un club --</option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.nombre}
            </option>
          ))}
        </select>
        {!selectedClubId && (
          <p className="text-red-500 text-sm mt-1">
            ⚠️ Debes seleccionar un club para continuar
          </p>
        )}
      </div>

      {/* 2. Subir archivo */}
      <div className="mb-6">
        <label className="block mb-2 font-bold text-gray-700">
          Seleccionar archivo Excel (.xls, .xlsx)
        </label>
        <input
          type="file"
          accept=".xls,.xlsx"
          onChange={handleFileUpload}
          disabled={loading || !selectedClubId}
          className="border p-2 w-full disabled:opacity-50"
        />
        {!selectedClubId && (
          <p className="text-orange-600 text-sm mt-1">
            Selecciona un club primero
          </p>
        )}
      </div>

      {/* 3. Preview */}
      {preview && (
        <div className="mb-6 p-4 border rounded bg-gray-50">
          <h2 className="text-xl font-bold mb-4">Preview</h2>

          {/* Mostrar club seleccionado */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
            <p className="font-bold text-blue-700">
              📍 Club seleccionado: {clubs.find(c => c.id === selectedClubId)?.nombre}
            </p>
            <p className="text-sm text-blue-600">
              Los {preview.total} jugadores serán asignados a este club
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-green-100 p-4 rounded">
              <p className="font-bold text-2xl">{preview.new_players.length}</p>
              <p className="text-sm">Nuevos</p>
            </div>
            <div className="bg-yellow-100 p-4 rounded">
              <p className="font-bold text-2xl">{preview.existing_players.length}</p>
              <p className="text-sm">Existentes</p>
            </div>
            <div className="bg-red-100 p-4 rounded">
              <p className="font-bold text-2xl">{preview.errors.length}</p>
              <p className="text-sm">Errores</p>
            </div>
          </div>

          {/* Errores */}
          {preview.errors.length > 0 && (
            <div className="mb-4">
              <h3 className="font-bold text-red-600 mb-2">❌ Errores:</h3>
              <ul className="list-disc pl-5 max-h-40 overflow-y-auto">
                {preview.errors.map((error, idx) => (
                  <li key={idx} className="text-sm">
                    Fila {error.row}: {error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Existentes */}
          {preview.existing_players.length > 0 && (
            <div className="mb-4">
              <h3 className="font-bold text-yellow-600 mb-2">
                ⚠️ Jugadores Existentes:
              </h3>
              <ul className="list-disc pl-5 max-h-40 overflow-y-auto">
                {preview.existing_players.slice(0, 10).map((player, idx) => (
                  <li key={idx} className="text-sm">
                    {player.nombre_completo} (DNI: {player.dni})
                  </li>
                ))}
                {preview.existing_players.length > 10 && (
                  <li className="text-sm font-bold">
                    ... y {preview.existing_players.length - 10} más
                  </li>
                )}
              </ul>

              <label className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={overwriteExisting}
                  onChange={(e) => setOverwriteExisting(e.target.checked)}
                  className="mr-2"
                />
                Sobreescribir jugadores existentes
              </label>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleTestImport}
              disabled={loading || !selectedClubId}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🧪 Cargar primer jugador de prueba
            </button>

            <button
              onClick={handleFullImport}
              disabled={loading || !selectedClubId}
              className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✅ Cargar todos ({preview.total} jugadores)
            </button>
          </div>

          {!selectedClubId && (
            <p className="text-orange-600 text-sm mt-2">
              ⚠️ Selecciona un club para habilitar la importación
            </p>
          )}
        </div>
      )}

      {/* 4. Resultado */}
      {result && (
        <div className="p-4 border rounded bg-gray-50">
          <h2 className="text-xl font-bold mb-2">Resultado</h2>
          <p className="mb-4 text-lg">{result.message}</p>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="font-bold text-green-600 text-2xl">{result.inserted}</p>
              <p className="text-sm">Insertados</p>
            </div>
            <div>
              <p className="font-bold text-blue-600 text-2xl">{result.updated}</p>
              <p className="text-sm">Actualizados</p>
            </div>
            <div>
              <p className="font-bold text-gray-600 text-2xl">{result.skipped}</p>
              <p className="text-sm">Omitidos</p>
            </div>
          </div>

          {/* ✅ NUEVO: Lista de jugadores creados */}
          {result.created_players.length > 0 && (
            <div className="mt-4 bg-green-50 p-4 rounded border border-green-200">
              <h3 className="font-bold text-green-700 mb-3">
                ✅ Jugadores Creados ({result.created_players.length})
              </h3>
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-green-100 sticky top-0">
                    <tr>
                      <th className="p-2 text-left">Nombre</th>
                      <th className="p-2 text-left">DNI</th>
                      <th className="p-2 text-left">Contraseña Inicial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.created_players.map((player, idx) => {
                      // Generar contraseña en el frontend
                      const password = generatePassword(player.apellido, player.dni);

                      return (
                        <tr key={idx} className="border-b border-green-100">
                          <td className="p-2">{player.nombre_completo}</td>
                          <td className="p-2 font-mono">{player.dni}</td>
                          <td className="p-2 font-mono font-bold text-green-700">
                            {password}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-green-600 mt-2">
                💡 Los jugadores deben cambiar su contraseña al primer login
              </p>
            </div>
          )}

          {/* 🔄 NUEVO: Lista de jugadores actualizados */}
          {result.updated_players.length > 0 && (
            <div className="mt-4 bg-blue-50 p-4 rounded border border-blue-200">
              <h3 className="font-bold text-blue-700 mb-3">
                🔄 Jugadores Actualizados ({result.updated_players.length})
              </h3>
              <ul className="list-disc pl-5 max-h-40 overflow-y-auto">
                {result.updated_players.map((player, idx) => (
                  <li key={idx} className="text-sm">
                    {player.nombre_completo} (DNI: {player.dni})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="mt-4">
              <h3 className="font-bold text-red-600 mb-2">Errores:</h3>
              <ul className="list-disc pl-5">
                {result.errors.map((error, idx) => (
                  <li key={idx} className="text-sm">
                    Fila {error.row} (DNI: {error.dni}): {error.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="text-center mt-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2">Procesando...</p>
        </div>
      )}
    </div>
  );
};
```

---

## 📝 Notas Importantes

### ⚠️ Club ID es REQUERIDO

El productor **DEBE** seleccionar un club antes de confirmar la importación. El frontend debe:
1. Mostrar un selector de clubes
2. Validar que se haya seleccionado un club
3. Deshabilitar botones si no hay club seleccionado
4. Enviar el `club_id` en el request de confirmación

### Token de Preview
- ⏱️ **Válido por 15 minutos** desde que se sube el archivo
- 🔄 Si expira, hay que volver a subir el Excel
- 💾 Se guarda en memoria del servidor (se pierde si reinicia)

### Generación de Contraseñas
- 📋 **Formato**: `Apellido` (primera mayúscula) + últimos 3 dígitos del DNI
- 🔐 **Ejemplo**: ABARZUA + 28387875 → `Abarzua875`
- ⚠️ El jugador **debe cambiar su contraseña** al primer login
- 💡 **Frontend**: Podés generar las contraseñas localmente usando el helper `generatePassword(apellido, dni)` con los datos de `created_players`
- 🖨️ **Uso**: Mostrar/imprimir las credenciales después de una importación exitosa

### Modo Prueba vs Modo Normal
- 🧪 **Modo Prueba** (`test_mode: true`): Solo carga el primer jugador válido
- ✅ **Modo Normal** (`test_mode: false`): Carga todos los jugadores

### Límites
- 📦 **Tamaño máximo**: 10 MB
- 📄 **Formatos**: .xls, .xlsx
- 👥 **Permisos**: Solo `admin`, `productor`, `club`

---

## 🚀 Flujo Recomendado para el Usuario

1. **Cargar lista de clubes** → Al montar el componente
2. **Seleccionar club** → Usuario elige el club de destino
3. **Subir Excel** → Ver preview con nuevos, existentes y errores
4. **Cargar 1 jugador de prueba** → Verificar que se crea correctamente
5. **Probar login** del jugador creado con DNI y contraseña generada
6. **Si funciona**, volver a subir el Excel
7. **Cargar todos** los jugadores

---

## 📞 Soporte

Si tienes dudas sobre la integración:
- 📗 Ver README del módulo: [`src/modules/bulk-import/README.md`](../../src/modules/bulk-import/README.md)
- 📙 Ver guía del selector: [`CLUB_SELECTOR.md`](CLUB_SELECTOR.md)
- 📕 Ver template de Excel: [`TEMPLATE_JUGADORES.md`](TEMPLATE_JUGADORES.md)

---

**DATABRIDGE** - Sistema Resguarda
