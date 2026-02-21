# API Categorías, Inscripciones y Partidos - Integración Frontend

## Índice
1. [Categorías](#categorías)
2. [Inscripciones (Torneo-Equipo)](#inscripciones-torneo-equipo)
3. [Partidos](#partidos)
4. [Códigos de Error](#códigos-de-error)

---

## Categorías

### 1. Crear Categoría
**Endpoint:** `POST /api/v1/clubes/categorias`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "nombre": "Sub-16",
  "descripcion": "Categoría para jugadores menores de 16 años",
  "edad_minima": 12,
  "edad_maxima": 16
}
```

**Response Success (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nombre": "Sub-16",
    "descripcion": "Categoría para jugadores menores de 16 años",
    "edad_minima": 12,
    "edad_maxima": 16,
    "club_id": "uuid",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Validaciones:**
- `nombre`: Requerido, máximo 100 caracteres
- `descripcion`: Opcional, máximo 500 caracteres
- `edad_minima`: Opcional, entre 5 y 100
- `edad_maxima`: Opcional, entre 5 y 100
- Si se proporcionan ambas edades, `edad_minima` debe ser menor que `edad_maxima`

**Errores Posibles:**
- `400` - "La edad máxima debe ser mayor a la edad mínima"
- `400` - Validaciones de class-validator (nombre vacío, formato incorrecto)
- `401` - Token inválido o expirado
- `403` - Usuario no tiene rol CLUB

---

### 2. Listar Categorías
**Endpoint:** `GET /api/v1/clubes/categorias`

**Headers:**
```
Authorization: Bearer {token}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nombre": "Sub-16",
      "descripcion": "Categoría para jugadores menores de 16 años",
      "edad_minima": 12,
      "edad_maxima": 16,
      "club_id": "uuid",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "uuid2",
      "nombre": "Sub-18",
      "descripcion": null,
      "edad_minima": 16,
      "edad_maxima": 18,
      "club_id": "uuid",
      "created_at": "2024-01-15T11:00:00Z"
    }
  ]
}
```

**Notas:**
- Las categorías se ordenan alfabéticamente por nombre
- Solo devuelve categorías del club autenticado

---

### 3. Actualizar Categoría
**Endpoint:** `PATCH /api/v1/clubes/categorias/:id`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "nombre": "Sub-16 Modificada",
  "edad_maxima": 17
}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nombre": "Sub-16 Modificada",
    "descripcion": "Categoría para jugadores menores de 16 años",
    "edad_minima": 12,
    "edad_maxima": 17,
    "club_id": "uuid",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Notas:**
- Todos los campos son opcionales (PartialType)
- Solo se actualizan los campos enviados

**Errores Posibles:**
- `404` - "Categoría no encontrada" (no existe o no pertenece al club)
- `400` - Validación de edades

---

### 4. Eliminar Categoría
**Endpoint:** `DELETE /api/v1/clubes/categorias/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Categoría eliminada exitosamente"
}
```

**Errores Posibles:**
- `404` - "Categoría no encontrada"
- Puede fallar si hay equipos asociados a esta categoría (foreign key constraint)

---

## Inscripciones (Torneo-Equipo)

### 1. Inscribir Equipo a Torneo
**Endpoint:** `POST /api/v1/clubes/torneos/:torneoId/equipos`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "equipo_id": "uuid-del-equipo",
  "categoria_id": "uuid-de-categoria"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "torneo_id": "uuid-del-torneo",
    "torneo_nombre": "Torneo Apertura 2024",
    "equipo_id": "uuid-del-equipo",
    "equipo_nombre": "Los Halcones",
    "categoria_id": "uuid-de-categoria",
    "categoria_nombre": "Sub-16",
    "created_at": "2024-01-15T12:00:00Z"
  }
}
```

**Validaciones:**
- `equipo_id`: Requerido, debe ser UUID válido
- `categoria_id`: Requerido, debe ser UUID válido
- El torneo debe existir y pertenecer al club
- El equipo debe existir y pertenecer al club
- La categoría debe existir y pertenecer al club
- El equipo no puede estar ya inscrito en ese torneo

**Errores Posibles:**
- `404` - "Torneo no encontrado"
- `404` - "Equipo no encontrado"
- `404` - "Categoría no encontrada"
- `400` - "Este equipo ya está inscrito en el torneo"
- `400` - Validación de UUIDs

---

### 2. Listar Equipos Inscritos en Torneo
**Endpoint:** `GET /api/v1/clubes/torneos/:torneoId/equipos`

**Headers:**
```
Authorization: Bearer {token}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "torneo_id": "uuid-del-torneo",
      "torneo_nombre": "Torneo Apertura 2024",
      "equipo_id": "uuid-del-equipo",
      "equipo_nombre": "Los Halcones",
      "categoria_id": "uuid-de-categoria",
      "categoria_nombre": "Sub-16",
      "created_at": "2024-01-15T12:00:00Z"
    }
  ]
}
```

**Notas:**
- Se ordenan por fecha de inscripción (más recientes primero)
- Solo devuelve inscripciones del torneo especificado

**Errores Posibles:**
- `404` - "Torneo no encontrado"

---

### 3. Desinscribir Equipo de Torneo
**Endpoint:** `DELETE /api/v1/clubes/torneo-equipos/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Equipo desinscrito del torneo exitosamente"
}
```

**Errores Posibles:**
- `404` - "Inscripción no encontrada"

---

## Partidos

### 1. Generar Partidos Automáticamente
**Endpoint:** `POST /api/v1/clubes/torneos/:id/generar-partidos`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "fecha_inicio": "2024-03-01",
  "intervalo_dias": 7,
  "hora_inicio": "15:00",
  "diferencia_horaria": 120,
  "ida_vuelta": false,
  "ubicacion": "Estadio Principal",
  "cancha": "Cancha 1"
}
```

**Parámetros:**
- `fecha_inicio`: Fecha de inicio de los partidos (YYYY-MM-DD)
- `intervalo_dias`: Días entre jornadas (ej: 7 = partidos cada semana)
- `hora_inicio`: Hora del primer partido del día (HH:MM)
- `diferencia_horaria`: Minutos entre partidos del mismo día (ej: 120 = 2 horas)
- `ida_vuelta`: `true` para todos contra todos ida y vuelta, `false` para solo ida
- `ubicacion`: Ubicación por defecto (opcional)
- `cancha`: Cancha por defecto (opcional)

**Response Success (201):**
```json
{
  "success": true,
  "data": {
    "partidos_creados": 24,
    "por_categoria": [
      {
        "categoria_nombre": "Sub-16",
        "partidos": 12,
        "equipos": 4
      },
      {
        "categoria_nombre": "Sub-18",
        "partidos": 12,
        "equipos": 4
      }
    ]
  }
}
```

**Funcionamiento:**
1. Obtiene todos los equipos inscritos en el torneo
2. Los agrupa por categoría
3. Para cada categoría genera enfrentamientos usando algoritmo Round-Robin (todos contra todos)
4. Distribuye los partidos en fechas automáticamente
5. Si `ida_vuelta` es `true`, duplica los enfrentamientos invirtiendo local/visitante
6. Todos los partidos se crean con estado "programado"

**Notas:**
- Si un día tiene muchos partidos y la hora supera las 22:00, continúa en el siguiente día según `intervalo_dias`
- Si una categoría tiene solo 1 equipo, se omite (no se pueden generar partidos)
- Los partidos se distribuyen equitativamente en el tiempo

**Validaciones:**
- `fecha_inicio`: Requerida, formato YYYY-MM-DD
- `intervalo_dias`: Requerido, mínimo 1
- `hora_inicio`: Requerida, formato HH:MM
- `diferencia_horaria`: Requerida, mínimo 30 minutos
- `ida_vuelta`: Requerido (boolean)
- El torneo debe tener equipos inscritos

**Errores Posibles:**
- `404` - "Torneo no encontrado"
- `400` - "No hay equipos inscritos en este torneo"
- `400` - Validaciones de formato (fecha, hora)

---

### 2. Crear Partido Manual
**Endpoint:** `POST /api/v1/clubes/partidos`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "torneo_id": "uuid-del-torneo",
  "equipo_local_id": "uuid-equipo-local",
  "equipo_visitante_id": "uuid-equipo-visitante",
  "fecha": "2024-02-20",
  "hora": "15:30",
  "ubicacion": "Estadio Municipal",
  "cancha": "Cancha 1",
  "observaciones": "Partido de ida"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "torneo_id": "uuid-del-torneo",
    "torneo_nombre": "Torneo Apertura 2024",
    "equipo_local_id": "uuid-equipo-local",
    "equipo_local_nombre": "Los Halcones",
    "equipo_visitante_id": "uuid-equipo-visitante",
    "equipo_visitante_nombre": "Las Águilas",
    "fecha": "2024-02-20",
    "hora": "15:30",
    "ubicacion": "Estadio Municipal",
    "cancha": "Cancha 1",
    "estado": "programado",
    "resultado_local": null,
    "resultado_visitante": null,
    "observaciones": "Partido de ida",
    "club_id": "uuid",
    "created_at": "2024-01-15T13:00:00Z",
    "updated_at": "2024-01-15T13:00:00Z"
  }
}
```

**Validaciones:**
- `torneo_id`: Requerido, UUID válido
- `equipo_local_id`: Requerido, UUID válido
- `equipo_visitante_id`: Requerido, UUID válido
- `fecha`: Requerida, formato YYYY-MM-DD
- `hora`: Requerida, formato HH:MM (00:00 - 23:59)
- `ubicacion`: Opcional, máximo 200 caracteres
- `cancha`: Opcional, máximo 100 caracteres
- `observaciones`: Opcional
- El torneo debe pertenecer al club
- Ambos equipos deben pertenecer al club
- Equipo local y visitante deben ser diferentes

**Errores Posibles:**
- `404` - "Torneo no encontrado"
- `404` - "Uno o ambos equipos no encontrados"
- `400` - "El equipo local y visitante no pueden ser el mismo"
- `400` - "La hora debe tener formato HH:MM (ej: 14:30)"
- `400` - "La fecha debe ser válida (YYYY-MM-DD)"

---

### 3. Listar Partidos
**Endpoint:** `GET /api/v1/clubes/partidos?torneo_id=uuid`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `torneo_id` (opcional): Filtrar por torneo específico

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "torneo_id": "uuid-del-torneo",
      "torneo_nombre": "Torneo Apertura 2024",
      "equipo_local_id": "uuid-equipo-local",
      "equipo_local_nombre": "Los Halcones",
      "equipo_visitante_id": "uuid-equipo-visitante",
      "equipo_visitante_nombre": "Las Águilas",
      "fecha": "2024-02-20",
      "hora": "15:30",
      "ubicacion": "Estadio Municipal",
      "cancha": "Cancha 1",
      "estado": "programado",
      "resultado_local": null,
      "resultado_visitante": null,
      "observaciones": "Partido de ida",
      "club_id": "uuid",
      "created_at": "2024-01-15T13:00:00Z",
      "updated_at": "2024-01-15T13:00:00Z"
    }
  ]
}
```

**Notas:**
- Se ordenan por fecha (más próximos primero)
- Sin filtro devuelve todos los partidos del club
- Con `torneo_id` devuelve solo partidos de ese torneo

**Estados Posibles:**
- `programado`: Partido agendado, aún no comienza
- `en_curso`: Partido actualmente en juego
- `finalizado`: Partido terminado
- `suspendido`: Partido suspendido temporalmente
- `cancelado`: Partido cancelado

---

### 4. Ver Detalle de Partido (con Planteles)
**Endpoint:** `GET /api/v1/clubes/partidos/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "torneo": {
      "id": "uuid-torneo",
      "nombre": "Torneo Apertura 2024",
      "descripcion": "Torneo de apertura temporada 2024"
    },
    "equipo_local": {
      "id": "uuid-equipo-local",
      "nombre": "Los Halcones",
      "logo_url": "https://...",
      "color_primario": "#FF0000",
      "color_secundario": "#FFFFFF",
      "plantel": [
        {
          "jugador_id": "uuid-jugador",
          "nombre_completo": "Juan Pérez",
          "numero_camiseta": 10,
          "posicion": "Delantero",
          "capitan": true,
          "foto_url": "https://..."
        },
        {
          "jugador_id": "uuid-jugador2",
          "nombre_completo": "Carlos López",
          "numero_camiseta": 7,
          "posicion": "Mediocampista",
          "capitan": false,
          "foto_url": null
        }
      ]
    },
    "equipo_visitante": {
      "id": "uuid-equipo-visitante",
      "nombre": "Las Águilas",
      "logo_url": "https://...",
      "color_primario": "#0000FF",
      "color_secundario": "#FFFF00",
      "plantel": [
        {
          "jugador_id": "uuid-jugador3",
          "nombre_completo": "Pedro Martínez",
          "numero_camiseta": 9,
          "posicion": "Arquero",
          "capitan": false,
          "foto_url": "https://..."
        }
      ]
    },
    "fecha": "2024-02-20",
    "hora": "15:30",
    "ubicacion": "Estadio Municipal",
    "cancha": "Cancha 1",
    "estado": "programado",
    "resultado_local": null,
    "resultado_visitante": null,
    "observaciones": "Partido de ida",
    "created_at": "2024-01-15T13:00:00Z",
    "updated_at": "2024-01-15T13:00:00Z"
  }
}
```

**Notas:**
- El plantel se obtiene de la tabla `jugador_equipo_torneo`
- Solo muestra jugadores inscritos para ese equipo en ese torneo
- Si el equipo no está inscrito en el torneo, `plantel` será un array vacío

**Errores Posibles:**
- `404` - "Partido no encontrado"

---

### 5. Actualizar Partido
**Endpoint:** `PATCH /api/v1/clubes/partidos/:id`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body (todos los campos opcionales):**
```json
{
  "estado": "finalizado",
  "resultado_local": 3,
  "resultado_visitante": 2,
  "ubicacion": "Estadio Actualizado",
  "cancha": "Cancha 2",
  "observaciones": "Partido muy reñido"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "torneo_id": "uuid-del-torneo",
    "torneo_nombre": "Torneo Apertura 2024",
    "equipo_local_id": "uuid-equipo-local",
    "equipo_local_nombre": "Los Halcones",
    "equipo_visitante_id": "uuid-equipo-visitante",
    "equipo_visitante_nombre": "Las Águilas",
    "fecha": "2024-02-20",
    "hora": "15:30",
    "ubicacion": "Estadio Actualizado",
    "cancha": "Cancha 2",
    "estado": "finalizado",
    "resultado_local": 3,
    "resultado_visitante": 2,
    "observaciones": "Partido muy reñido",
    "club_id": "uuid",
    "created_at": "2024-01-15T13:00:00Z",
    "updated_at": "2024-01-20T18:00:00Z"
  }
}
```

**Validaciones:**
- `estado`: Debe ser uno de: "programado", "en_curso", "finalizado", "suspendido", "cancelado"
- `resultado_local`: Entero mayor o igual a 0
- `resultado_visitante`: Entero mayor o igual a 0
- `ubicacion`: Máximo 200 caracteres
- `cancha`: Máximo 100 caracteres

**Errores Posibles:**
- `404` - "Partido no encontrado"
- `400` - Estado inválido
- `400` - Resultado negativo

---

## Códigos de Error

### Errores de Autenticación (401)
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Errores de Permisos (403)
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

### Errores de Validación (400)
```json
{
  "statusCode": 400,
  "message": [
    "El nombre de la categoría es requerido",
    "El ID del equipo debe ser un UUID válido"
  ],
  "error": "Bad Request"
}
```

### Errores de Negocio (400)
```json
{
  "statusCode": 400,
  "message": "La edad máxima debe ser mayor a la edad mínima"
}
```

### Errores de No Encontrado (404)
```json
{
  "statusCode": 404,
  "message": "Categoría no encontrada"
}
```

### Errores de Servidor (500)
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## Ejemplo de Integración con React Query

### Crear Categoría
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

const useCreateCategoria = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCategoriaDto) => {
      const response = await fetch('/api/v1/clubes/categorias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    },
  });
};
```

### Listar Partidos con Filtro
```typescript
import { useQuery } from '@tanstack/react-query';

const usePartidos = (torneoId?: string) => {
  return useQuery({
    queryKey: ['partidos', torneoId],
    queryFn: async () => {
      const url = torneoId
        ? `/api/v1/clubes/partidos?torneo_id=${torneoId}`
        : '/api/v1/clubes/partidos';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar partidos');
      }

      return response.json();
    },
  });
};
```

---

## Notas Importantes

1. **Autenticación**: Todos los endpoints requieren token Bearer válido con rol CLUB
2. **club_id**: Se extrae automáticamente del token, no se envía en el body
3. **Validación de Pertenencia**: Todas las entidades se validan que pertenezcan al club autenticado
4. **Foreign Keys**: Al eliminar, verificar que no haya referencias (ej: equipos con esa categoría)
5. **Planteles**: Solo se muestran en el detalle del partido, no en el listado
6. **Estados**: Los partidos siempre se crean con estado "programado"
7. **Ordenamiento**:
   - Categorías: Alfabético por nombre
   - Partidos: Por fecha ascendente (próximos primero)
   - Inscripciones: Por fecha de creación descendente (recientes primero)

---

## Flujo Típico de Uso

### Opción A: Generación Automática (Recomendada)
1. **Crear Categorías** (`POST /categorias`)
2. **Crear Torneos** (ya implementado en Phase 1)
3. **Crear Equipos** (ya implementado en Phase 1)
4. **Inscribir Equipos a Torneos** (`POST /torneos/:id/equipos`) - asignar categoría
5. **Generar Partidos Automáticamente** (`POST /torneos/:id/generar-partidos`)
6. **Listar Partidos** (`GET /partidos` o con filtro `?torneo_id=`)
7. **Ver Detalle** (`GET /partidos/:id`)
8. **Actualizar Resultado** (`PATCH /partidos/:id`)

### Opción B: Creación Manual
1-4. (Igual que Opción A)
5. **Crear Partidos Manualmente** (`POST /partidos`) - uno por uno
6-8. (Igual que Opción A)
