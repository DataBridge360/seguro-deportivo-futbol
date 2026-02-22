# Guía de Integración Frontend - Panel del Club

## Resumen

Esta guía explica cómo consumir los endpoints del backend para crear y listar torneos y equipos. **No incluye código de UI**, solo la lógica de integración con la API.

---

## Endpoints Disponibles

| Método | Endpoint | Descripción | Requiere Auth |
|--------|----------|-------------|---------------|
| POST | `/api/v1/clubes/torneos` | Crear torneo | Sí (rol CLUB) |
| GET | `/api/v1/clubes/torneos` | Listar torneos del club | Sí (rol CLUB) |
| POST | `/api/v1/clubes/equipos` | Crear equipo | Sí (rol CLUB) |
| GET | `/api/v1/clubes/equipos` | Listar equipos del club | Sí (rol CLUB) |

---

## 1. CREAR TORNEO

### Request

```http
POST /api/v1/clubes/torneos
Content-Type: application/json
Authorization: Bearer <tu_token_jwt>
```

**Body (JSON):**
```json
{
  "nombre": "Apertura 2026",
  "descripcion": "Torneo de apertura del club",
  "fecha_inicio": "2026-03-01",
  "fecha_fin": "2026-08-31",
  "estado": "proximo",
  "inscripciones_abiertas": false,
  "max_jugadores_por_equipo": 22
}
```

**Campos:**

| Campo | Tipo | Requerido | Descripción | Ejemplo |
|-------|------|-----------|-------------|---------|
| `nombre` | string | ✅ Sí | Nombre del torneo (máx 200 chars) | "Apertura 2026" |
| `descripcion` | string | ❌ No | Descripción (máx 1000 chars) | "Torneo de apertura" |
| `fecha_inicio` | string | ✅ Sí | Fecha ISO (YYYY-MM-DD) | "2026-03-01" |
| `fecha_fin` | string | ✅ Sí | Fecha ISO (YYYY-MM-DD) | "2026-08-31" |
| `estado` | string | ❌ No | "proximo", "en_curso", "finalizado", "cancelado" | "proximo" |
| `inscripciones_abiertas` | boolean | ❌ No | Default: false | false |
| `max_jugadores_por_equipo` | number | ❌ No | Límite de jugadores | 22 |

**⚠️ Validaciones importantes:**
- `fecha_fin` debe ser posterior a `fecha_inicio`
- `nombre` es obligatorio
- Fechas deben estar en formato `YYYY-MM-DD`

### Response Exitosa (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nombre": "Apertura 2026",
    "descripcion": "Torneo de apertura del club",
    "fecha_inicio": "2026-03-01",
    "fecha_fin": "2026-08-31",
    "estado": "proximo",
    "inscripciones_abiertas": false,
    "max_jugadores_por_equipo": 22,
    "club_id": "club-uuid-here",
    "created_at": "2026-02-21T10:30:00.000Z",
    "updated_at": "2026-02-21T10:30:00.000Z"
  }
}
```

**Nota:** El `club_id` se asigna automáticamente desde el token JWT, NO lo envíes en el body.

### Errores Posibles

**400 Bad Request - Validación fallida:**
```json
{
  "statusCode": 400,
  "message": [
    "El nombre del torneo es requerido",
    "La fecha de inicio debe ser una fecha válida",
    "La fecha de fin debe ser posterior a la fecha de inicio"
  ],
  "error": "Bad Request"
}
```

**401 Unauthorized - Token inválido o expirado:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**403 Forbidden - Usuario no tiene rol "club":**
```json
{
  "statusCode": 403,
  "message": "No tienes permisos para acceder a torneos",
  "error": "Forbidden"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Error al crear el torneo",
  "error": "Internal Server Error"
}
```

---

## 2. LISTAR TORNEOS

### Request

```http
GET /api/v1/clubes/torneos
Authorization: Bearer <tu_token_jwt>
```

**Sin parámetros**. El backend filtra automáticamente por el `club_id` del usuario autenticado.

### Response Exitosa (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "nombre": "Apertura 2026",
      "descripcion": "Torneo de apertura",
      "fecha_inicio": "2026-03-01",
      "fecha_fin": "2026-08-31",
      "estado": "proximo",
      "inscripciones_abiertas": false,
      "max_jugadores_por_equipo": 22,
      "club_id": "club-uuid",
      "created_at": "2026-02-21T10:30:00.000Z",
      "updated_at": "2026-02-21T10:30:00.000Z"
    },
    {
      "id": "uuid-2",
      "nombre": "Clausura 2026",
      "descripcion": null,
      "fecha_inicio": "2026-09-01",
      "fecha_fin": "2026-12-31",
      "estado": "proximo",
      "inscripciones_abiertas": true,
      "max_jugadores_por_equipo": null,
      "club_id": "club-uuid",
      "created_at": "2026-02-21T11:00:00.000Z",
      "updated_at": "2026-02-21T11:00:00.000Z"
    }
  ]
}
```

**Orden:** Los torneos se devuelven ordenados por `fecha_inicio` descendente (más recientes primero).

### Errores Posibles

Mismos errores de autenticación/autorización que el POST (401, 403, 500).

---

## 3. CREAR EQUIPO

### Request

```http
POST /api/v1/clubes/equipos
Content-Type: application/json
Authorization: Bearer <tu_token_jwt>
```

**Body (JSON):**

**Ejemplo SIN categorías:**
```json
{
  "nombre": "Los Halcones",
  "color_primario": "#0000FF",
  "color_secundario": "#FFFFFF"
}
```

**Ejemplo CON categorías:**
```json
{
  "nombre": "Los Halcones",
  "logo_url": "https://storage.example.com/logos/halcones.png",
  "color_primario": "#0000FF",
  "color_secundario": "#FFFFFF",
  "activo": true,
  "categoria_ids": [
    "cat-uuid-1",
    "cat-uuid-2"
  ]
}
```

**Campos:**

| Campo | Tipo | Requerido | Descripción | Ejemplo |
|-------|------|-----------|-------------|---------|
| `nombre` | string | ✅ Sí | Nombre del equipo (máx 200 chars) | "Los Halcones" |
| `logo_url` | string | ❌ No | URL del logo | "https://..." |
| `color_primario` | string | ❌ No | Color hexadecimal (#RRGGBB) | "#0000FF" |
| `color_secundario` | string | ❌ No | Color hexadecimal (#RRGGBB) | "#FFFFFF" |
| `activo` | boolean | ❌ No | Default: true | true |
| `categoria_ids` | array | ❌ No | Array de UUIDs de categorías | ["uuid1", "uuid2"] |

**⚠️ Validaciones importantes:**
- Colores deben ser formato hexadecimal: `#RRGGBB` (ej: `#FF5733`)
- Categorías deben existir y pertenecer al club del usuario
- `nombre` es obligatorio

### Response Exitosa (201 Created)

**Con categorías:**
```json
{
  "success": true,
  "data": {
    "id": "equipo-uuid",
    "nombre": "Los Halcones",
    "club_id": "club-uuid",
    "logo_url": "https://storage.example.com/logos/halcones.png",
    "color_primario": "#0000FF",
    "color_secundario": "#FFFFFF",
    "activo": true,
    "categorias": [
      {
        "id": "cat-uuid-1",
        "nombre": "Sub-15",
        "descripcion": "Categoría sub-15",
        "edad_minima": 13,
        "edad_maxima": 15
      },
      {
        "id": "cat-uuid-2",
        "nombre": "Sub-17",
        "descripcion": "Categoría sub-17",
        "edad_minima": 15,
        "edad_maxima": 17
      }
    ],
    "created_at": "2026-02-21T10:30:00.000Z",
    "updated_at": "2026-02-21T10:30:00.000Z"
  }
}
```

**Sin categorías:**
```json
{
  "success": true,
  "data": {
    "id": "equipo-uuid",
    "nombre": "Los Halcones",
    "club_id": "club-uuid",
    "logo_url": null,
    "color_primario": "#0000FF",
    "color_secundario": "#FFFFFF",
    "activo": true,
    "categorias": [],
    "created_at": "2026-02-21T10:30:00.000Z",
    "updated_at": "2026-02-21T10:30:00.000Z"
  }
}
```

### Errores Posibles

**400 Bad Request - Validación de color:**
```json
{
  "statusCode": 400,
  "message": [
    "El color primario debe ser un código hexadecimal válido (ej: #FF5733)"
  ],
  "error": "Bad Request"
}
```

**400 Bad Request - Categorías inválidas:**
```json
{
  "statusCode": 400,
  "message": "Una o más categorías no existen o no pertenecen a este club",
  "error": "Bad Request"
}
```

**400 Bad Request - UUID inválido:**
```json
{
  "statusCode": 400,
  "message": [
    "Cada categoría debe ser un UUID válido"
  ],
  "error": "Bad Request"
}
```

Mismos errores de auth: 401, 403, 500.

---

## 4. LISTAR EQUIPOS

### Request

```http
GET /api/v1/clubes/equipos
Authorization: Bearer <tu_token_jwt>
```

**Sin parámetros**. El backend filtra automáticamente por el `club_id` del usuario.

### Response Exitosa (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "equipo-uuid-1",
      "nombre": "Los Halcones",
      "club_id": "club-uuid",
      "logo_url": "https://storage.example.com/logos/halcones.png",
      "color_primario": "#0000FF",
      "color_secundario": "#FFFFFF",
      "activo": true,
      "categorias": [
        {
          "id": "cat-uuid-1",
          "nombre": "Sub-15",
          "descripcion": "Categoría sub-15",
          "edad_minima": 13,
          "edad_maxima": 15
        }
      ],
      "created_at": "2026-02-21T10:30:00.000Z",
      "updated_at": "2026-02-21T10:30:00.000Z"
    },
    {
      "id": "equipo-uuid-2",
      "nombre": "Las Águilas",
      "club_id": "club-uuid",
      "logo_url": null,
      "color_primario": "#FF0000",
      "color_secundario": "#000000",
      "activo": true,
      "categorias": [],
      "created_at": "2026-02-21T11:00:00.000Z",
      "updated_at": "2026-02-21T11:00:00.000Z"
    }
  ]
}
```

**Orden:** Los equipos se devuelven ordenados por `nombre` ascendente (alfabético).

---

## Manejo de Errores - Guía Completa

### Códigos de Estado HTTP

| Código | Tipo | Cuándo ocurre | Acción recomendada |
|--------|------|---------------|-------------------|
| 200 | OK | GET exitoso | Mostrar datos |
| 201 | Created | POST exitoso | Mostrar mensaje de éxito, limpiar formulario |
| 400 | Bad Request | Validación fallida | Mostrar errores en el formulario |
| 401 | Unauthorized | Token inválido/expirado/faltante | Redireccionar a login |
| 403 | Forbidden | Usuario sin permisos (no es rol CLUB) | Mostrar "Sin permisos" |
| 500 | Internal Server Error | Error del servidor | Mostrar "Error del servidor, intenta de nuevo" |

### Estructura de Errores

**Validación (400):**
```json
{
  "statusCode": 400,
  "message": [
    "Error 1",
    "Error 2"
  ],
  "error": "Bad Request"
}
```

- `message` puede ser **string** o **array de strings**
- Siempre revisar si es array antes de mostrar

**Otros errores (401, 403, 500):**
```json
{
  "statusCode": 403,
  "message": "Mensaje descriptivo",
  "error": "Forbidden"
}
```

- `message` es **string**

---

## Ejemplo de Integración con React Query

### Setup de API Client

```typescript
// api/client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = {
  async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token'); // O tu método de almacenamiento

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw response; // React Query manejará el error
    }

    return response.json();
  },
};
```

### Hooks para Torneos

```typescript
// hooks/useTorneos.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

interface CreateTorneoDTO {
  nombre: string;
  descripcion?: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado?: string;
  inscripciones_abiertas?: boolean;
  max_jugadores_por_equipo?: number;
}

export const useCreateTorneo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTorneoDTO) =>
      apiClient.request('/clubes/torneos', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['torneos'] });
    },

    onError: async (error: Response) => {
      const errorData = await error.json();

      if (error.status === 400) {
        const messages = Array.isArray(errorData.message)
          ? errorData.message
          : [errorData.message];
        console.error('Errores de validación:', messages);
      } else if (error.status === 401) {
        window.location.href = '/login';
      }
    },
  });
};

export const useTorneos = () => {
  return useQuery({
    queryKey: ['torneos'],
    queryFn: () => apiClient.request('/clubes/torneos'),
    select: (response) => response.data,
  });
};
```

### Hooks para Equipos

```typescript
// hooks/useEquipos.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

interface CreateEquipoDTO {
  nombre: string;
  logo_url?: string;
  color_primario?: string;
  color_secundario?: string;
  activo?: boolean;
  categoria_ids?: string[];
}

export const useCreateEquipo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEquipoDTO) =>
      apiClient.request('/clubes/equipos', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
    },

    onError: async (error: Response) => {
      const errorData = await error.json();

      if (error.status === 400) {
        const messages = Array.isArray(errorData.message)
          ? errorData.message
          : [errorData.message];
        console.error('Errores de validación:', messages);
      } else if (error.status === 401) {
        window.location.href = '/login';
      }
    },
  });
};

export const useEquipos = () => {
  return useQuery({
    queryKey: ['equipos'],
    queryFn: () => apiClient.request('/clubes/equipos'),
    select: (response) => response.data,
  });
};
```

---

## Validaciones en Frontend (Opcionales)

### Validar Fechas

```typescript
const validarFechas = (fechaInicio: string, fechaFin: string): boolean => {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  return fin > inicio;
};
```

### Validar Color Hexadecimal

```typescript
const validarColorHex = (color: string): boolean => {
  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  return hexRegex.test(color);
};
```

### Formatear Fecha para API

```typescript
const formatearFecha = (date: Date): string => {
  return date.toISOString().split('T')[0]; // "2026-03-01"
};
```

---

## Schema Zod (Validación Frontend)

### Torneo Schema

```typescript
import { z } from 'zod';

export const createTorneoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200),
  descripcion: z.string().max(1000).optional(),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
  fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
  estado: z.enum(['proximo', 'en_curso', 'finalizado', 'cancelado']).optional(),
  inscripciones_abiertas: z.boolean().optional(),
  max_jugadores_por_equipo: z.number().int().min(1).optional(),
}).refine((data) => {
  return new Date(data.fecha_fin) > new Date(data.fecha_inicio);
}, {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  path: ['fecha_fin'],
});
```

### Equipo Schema

```typescript
import { z } from 'zod';

export const createEquipoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200),
  logo_url: z.string().url('URL inválida').max(1000).optional(),
  color_primario: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Debe ser un color hexadecimal (#FF5733)')
    .optional(),
  color_secundario: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Debe ser un color hexadecimal (#FF5733)')
    .optional(),
  activo: z.boolean().optional(),
  categoria_ids: z.array(z.string().uuid('UUID inválido')).optional(),
});
```

---

## Notas Importantes

**Autenticación:**
- Todos los endpoints requieren token JWT
- El `club_id` se extrae automáticamente del token
- NUNCA envíes `club_id` en el body

**Fechas:**
- Formato: `YYYY-MM-DD` (ISO 8601)
- Backend valida que `fecha_fin > fecha_inicio`

**Colores:**
- Formato: `#RRGGBB` (hexadecimal de 6 dígitos)

**Categorías:**
- Opcionales al crear equipo
- Deben existir y pertenecer al club
- Deben ser UUIDs válidos

**Respuestas:**
- Formato exitoso: `{ success: true, data: {...} }`
- Accede a datos con `response.data`
