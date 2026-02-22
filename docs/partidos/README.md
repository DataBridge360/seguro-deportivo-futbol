# API de Partidos - Documentación Completa

## Índice
1. [Ver Detalle Completo](#ver-detalle-completo)
2. [Actualizar Partido](#actualizar-partido)
3. [Eliminar Partido](#eliminar-partido)
4. [Cancelar Partido](#cancelar-partido)
5. [Campos Editables](#campos-editables)
6. [Estados de Partido](#estados-de-partido)

---

## Ver Detalle Completo

**Endpoint:** `GET /api/v1/clubes/partidos/:id`

**Descripción:** Obtiene toda la información del partido incluyendo:
- Datos del torneo
- Equipos (local y visitante) con colores y logos
- **Planteles completos de ambos equipos** (jugadores inscritos en ese torneo)
- Fecha, hora, ubicación
- Resultado y estado

**Headers:**
```
Authorization: Bearer {token}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "abc-123-def",
    "torneo": {
      "id": "torneo-uuid",
      "nombre": "Torneo Apertura 2024",
      "descripcion": "Torneo de apertura temporada 2024"
    },
    "equipo_local": {
      "id": "equipo-local-uuid",
      "nombre": "Los Halcones",
      "logo_url": "https://storage.supabase.co/...",
      "color_primario": "#FF0000",
      "color_secundario": "#FFFFFF",
      "plantel": [
        {
          "jugador_id": "jugador-uuid-1",
          "nombre_completo": "Juan Pérez",
          "numero_camiseta": 10,
          "posicion": "Delantero",
          "capitan": true,
          "foto_url": "https://storage.supabase.co/..."
        },
        {
          "jugador_id": "jugador-uuid-2",
          "nombre_completo": "Carlos López",
          "numero_camiseta": 7,
          "posicion": "Mediocampista",
          "capitan": false,
          "foto_url": null
        },
        {
          "jugador_id": "jugador-uuid-3",
          "nombre_completo": "Pedro Gómez",
          "numero_camiseta": 1,
          "posicion": "Arquero",
          "capitan": false,
          "foto_url": "https://storage.supabase.co/..."
        }
      ]
    },
    "equipo_visitante": {
      "id": "equipo-visitante-uuid",
      "nombre": "Las Águilas",
      "logo_url": "https://storage.supabase.co/...",
      "color_primario": "#0000FF",
      "color_secundario": "#FFFF00",
      "plantel": [
        {
          "jugador_id": "jugador-uuid-4",
          "nombre_completo": "Pedro Martínez",
          "numero_camiseta": 9,
          "posicion": "Delantero",
          "capitan": true,
          "foto_url": "https://storage.supabase.co/..."
        },
        {
          "jugador_id": "jugador-uuid-5",
          "nombre_completo": "Luis Rodríguez",
          "numero_camiseta": 5,
          "posicion": "Defensor",
          "capitan": false,
          "foto_url": null
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

**Notas Importantes:**
- El `plantel` se obtiene de la tabla `jugador_equipo_torneo`
- Solo muestra jugadores **inscritos para ese equipo en ese torneo específico**
- Si un equipo no está inscrito en el torneo, `plantel` será `[]` (array vacío)
- Los campos `numero_camiseta`, `posicion` y `foto_url` pueden ser `null`

**Errores Posibles:**
- `404` - "Partido no encontrado"
- `403` - Sin permisos (RLS o rol incorrecto)

---

## Actualizar Partido

**Endpoint:** `PATCH /api/v1/clubes/partidos/:id`

**Descripción:** Actualiza cualquier campo del partido (ver [Campos Editables](#campos-editables))

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

### Caso 1: Actualizar Resultado
```json
{
  "estado": "finalizado",
  "resultado_local": 3,
  "resultado_visitante": 2
}
```

### Caso 2: Cambiar Fecha y Hora
```json
{
  "fecha": "2024-03-15",
  "hora": "18:00"
}
```

### Caso 3: Actualizar Ubicación
```json
{
  "ubicacion": "Estadio Nuevo",
  "cancha": "Cancha 2",
  "observaciones": "Cambio de sede por lluvia"
}
```

### Caso 4: Marcar como En Curso
```json
{
  "estado": "en_curso"
}
```

### Caso 5: Actualización Completa
```json
{
  "fecha": "2024-03-20",
  "hora": "16:00",
  "ubicacion": "Complejo Deportivo Central",
  "cancha": "Cancha Principal",
  "estado": "finalizado",
  "resultado_local": 5,
  "resultado_visitante": 3,
  "observaciones": "Partido de ida - Semifinales. Gran actuación del equipo local."
}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "abc-123-def",
    "torneo_id": "torneo-uuid",
    "torneo_nombre": "Torneo Apertura 2024",
    "equipo_local_id": "equipo-local-uuid",
    "equipo_local_nombre": "Los Halcones",
    "equipo_visitante_id": "equipo-visitante-uuid",
    "equipo_visitante_nombre": "Las Águilas",
    "fecha": "2024-03-20",
    "hora": "16:00",
    "ubicacion": "Complejo Deportivo Central",
    "cancha": "Cancha Principal",
    "estado": "finalizado",
    "resultado_local": 5,
    "resultado_visitante": 3,
    "observaciones": "Partido de ida - Semifinales. Gran actuación del equipo local.",
    "club_id": "club-uuid",
    "created_at": "2024-01-15T13:00:00Z",
    "updated_at": "2024-03-20T18:30:00Z"
  }
}
```

**Validaciones:**
- `fecha`: Formato YYYY-MM-DD
- `hora`: Formato HH:MM (00:00 - 23:59)
- `estado`: Debe ser uno de: `"programado"`, `"en_curso"`, `"finalizado"`, `"suspendido"`, `"cancelado"`
- `resultado_local`: Entero >= 0
- `resultado_visitante`: Entero >= 0
- `ubicacion`: Máximo 200 caracteres
- `cancha`: Máximo 100 caracteres

**Errores Posibles:**
- `404` - "Partido no encontrado"
- `400` - Estado inválido
- `400` - Formato de fecha/hora incorrecto
- `400` - Resultado negativo

---

## Eliminar Partido

**Endpoint:** `DELETE /api/v1/clubes/partidos/:id`

**Descripción:** Elimina permanentemente el partido de la base de datos (hard delete)

**Headers:**
```
Authorization: Bearer {token}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Partido eliminado exitosamente"
}
```

**⚠️ ADVERTENCIA:**
- Esta operación es **PERMANENTE** y **NO SE PUEDE DESHACER**
- El partido desaparece completamente de la base de datos
- No se mantiene historial
- Útil solo para partidos creados por error

**Recomendación:** Para mantener el historial, mejor usa [Cancelar Partido](#cancelar-partido)

**Errores Posibles:**
- `404` - "Partido no encontrado"
- `403` - Sin permisos

---

## Cancelar Partido

**Endpoint:** `PATCH /api/v1/clubes/partidos/:id`

**Descripción:** Marca el partido como cancelado (soft delete) manteniendo el historial

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "estado": "cancelado",
  "observaciones": "Cancelado por mal tiempo"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "abc-123-def",
    "torneo_id": "torneo-uuid",
    "torneo_nombre": "Torneo Apertura 2024",
    "equipo_local_id": "equipo-local-uuid",
    "equipo_local_nombre": "Los Halcones",
    "equipo_visitante_id": "equipo-visitante-uuid",
    "equipo_visitante_nombre": "Las Águilas",
    "fecha": "2024-02-20",
    "hora": "15:30",
    "ubicacion": "Estadio Municipal",
    "cancha": "Cancha 1",
    "estado": "cancelado",
    "resultado_local": null,
    "resultado_visitante": null,
    "observaciones": "Cancelado por mal tiempo",
    "club_id": "club-uuid",
    "created_at": "2024-01-15T13:00:00Z",
    "updated_at": "2024-02-19T10:00:00Z"
  }
}
```

**✅ Ventajas:**
- Mantiene el partido en la base de datos
- Aparece en reportes históricos como "cancelado"
- Se puede reactivar después si es necesario
- Puedes agregar razón en `observaciones`

**Reactivar un Partido Cancelado:**
```json
{
  "estado": "programado",
  "observaciones": "Reprogramado para nueva fecha"
}
```

---

## Campos Editables

Según el esquema de la tabla `partidos`, estos son **TODOS** los campos que puedes actualizar:

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `fecha` | date | Fecha del partido | `"2024-03-20"` |
| `hora` | time | Hora del partido | `"15:30"` |
| `ubicacion` | string | Lugar donde se juega | `"Estadio Municipal"` |
| `cancha` | string | Número o nombre de cancha | `"Cancha 1"` |
| `estado` | enum | Estado del partido (ver abajo) | `"finalizado"` |
| `resultado_local` | integer | Goles del equipo local | `3` |
| `resultado_visitante` | integer | Goles del equipo visitante | `2` |
| `observaciones` | text | Notas adicionales | `"Partido suspendido por lluvia"` |

**Campos NO editables (automáticos o inmutables):**
- `id` - UUID generado automáticamente
- `torneo_id` - No se puede cambiar el torneo
- `equipo_local_id` - No se puede cambiar el equipo local
- `equipo_visitante_id` - No se puede cambiar el equipo visitante
- `club_id` - Asociado al club, no editable
- `created_at` - Timestamp de creación
- `updated_at` - Se actualiza automáticamente

---

## Estados de Partido

Los estados posibles según el esquema de la base de datos:

| Estado | Descripción | Cuándo usar |
|--------|-------------|-------------|
| `programado` | Partido agendado | Cuando se crea el partido |
| `en_curso` | Actualmente jugando | Al iniciar el partido |
| `finalizado` | Partido terminado | Al finalizar y cargar resultado |
| `suspendido` | Temporalmente suspendido | Por lluvia, falta de jugadores, etc. |
| `cancelado` | Cancelado definitivamente | No se jugará (soft delete) |

### Flujo Típico de Estados

```
programado → en_curso → finalizado
    ↓            ↓
suspendido   suspendido
    ↓            ↓
cancelado    cancelado
```

**Ejemplos de Transiciones:**

1. **Partido Normal:**
   ```
   programado → en_curso → finalizado
   ```

2. **Partido Suspendido y Reprogramado:**
   ```
   programado → suspendido → programado → en_curso → finalizado
   ```

3. **Partido Cancelado:**
   ```
   programado → cancelado
   ```

4. **Partido Suspendido y Cancelado:**
   ```
   en_curso → suspendido → cancelado
   ```

---

## Ejemplos de Uso con Frontend

### React Query - Ver Detalle

```typescript
import { useQuery } from '@tanstack/react-query';

const usePartidoDetalle = (partidoId: string) => {
  return useQuery({
    queryKey: ['partido', partidoId],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/clubes/partidos/${partidoId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error('Error al cargar partido');
      return response.json();
    },
  });
};

// Uso en componente
function PartidoDetalle({ partidoId }) {
  const { data, isLoading, error } = usePartidoDetalle(partidoId);

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  const partido = data.data;

  return (
    <div>
      <h1>{partido.torneo.nombre}</h1>
      <div className="equipos">
        <Equipo
          nombre={partido.equipo_local.nombre}
          logo={partido.equipo_local.logo_url}
          plantel={partido.equipo_local.plantel}
          resultado={partido.resultado_local}
        />
        <span>VS</span>
        <Equipo
          nombre={partido.equipo_visitante.nombre}
          logo={partido.equipo_visitante.logo_url}
          plantel={partido.equipo_visitante.plantel}
          resultado={partido.resultado_visitante}
        />
      </div>
      <p>Estado: {partido.estado}</p>
      <p>Fecha: {partido.fecha} - {partido.hora}</p>
    </div>
  );
}
```

### React Query - Actualizar Resultado

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

const useActualizarPartido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/v1/clubes/partidos/${id}`, {
        method: 'PATCH',
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
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['partido', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['partidos'] });
    },
  });
};

// Uso en componente
function ActualizarResultado({ partidoId }) {
  const [golesLocal, setGolesLocal] = useState(0);
  const [golesVisitante, setGolesVisitante] = useState(0);
  const actualizar = useActualizarPartido();

  const handleSubmit = () => {
    actualizar.mutate({
      id: partidoId,
      data: {
        estado: 'finalizado',
        resultado_local: golesLocal,
        resultado_visitante: golesVisitante,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="number"
        value={golesLocal}
        onChange={(e) => setGolesLocal(Number(e.target.value))}
      />
      <span>-</span>
      <input
        type="number"
        value={golesVisitante}
        onChange={(e) => setGolesVisitante(Number(e.target.value))}
      />
      <button type="submit">Guardar Resultado</button>
    </form>
  );
}
```

### React Query - Cancelar Partido

```typescript
const useCancelarPartido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, razon }) => {
      const response = await fetch(`/api/v1/clubes/partidos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          estado: 'cancelado',
          observaciones: razon,
        }),
      });
      if (!response.ok) throw new Error('Error al cancelar');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partidos'] });
    },
  });
};
```

### React Query - Eliminar Partido

```typescript
const useEliminarPartido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (partidoId: string) => {
      const response = await fetch(`/api/v1/clubes/partidos/${partidoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Error al eliminar');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partidos'] });
      // Redirigir al listado
      navigate('/partidos');
    },
  });
};
```

---

## Códigos de Error

### 400 - Bad Request
```json
{
  "success": false,
  "statusCode": 400,
  "message": "El estado debe ser: programado, en_curso, finalizado, suspendido o cancelado",
  "error": "Bad Request"
}
```

### 404 - Not Found
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Partido no encontrado"
}
```

### 403 - Forbidden (RLS)
```json
{
  "success": false,
  "statusCode": 403,
  "error": "RLS_PERMISSION_DENIED",
  "message": "Permisos insuficientes para actualizar la tabla 'partidos'...",
  "hint": "Ejecuta GRANT ALL ON TABLE public.partidos TO service_role;"
}
```

---

## Resumen de Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/clubes/partidos/:id` | Ver detalle completo con planteles |
| `PATCH` | `/clubes/partidos/:id` | Actualizar cualquier campo |
| `DELETE` | `/clubes/partidos/:id` | Eliminar permanentemente |

**Todos requieren:**
- Header `Authorization: Bearer {token}`
- Rol `CLUB`
- El partido debe pertenecer al club del usuario autenticado

---

## Notas Finales

1. **Actualización de Planteles:** Los planteles se gestionan mediante la tabla `jugador_equipo_torneo`, no mediante el endpoint de partidos

2. **Seguridad:** Todos los endpoints validan que el partido pertenezca al club del usuario autenticado

3. **Soft Delete vs Hard Delete:**
   - Usa `PATCH` con `estado: "cancelado"` para soft delete (recomendado)
   - Usa `DELETE` para hard delete (solo para errores)

4. **Actualización Parcial:** El `PATCH` acepta cualquier combinación de campos, solo se actualizan los enviados

5. **Timestamps:** `updated_at` se actualiza automáticamente en cada PATCH
