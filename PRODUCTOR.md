# Vista del Productor - Seguro Deportivo

Documentación completa de la vista del productor de seguros. El productor gestiona jugadores asegurados: alta, edición, eliminación, y renovación de pólizas.

---

## Estructura de Rutas

| Ruta | Descripción |
|------|-------------|
| `/dashboard/productor/jugadores` | Listado de jugadores con filtro por club |
| `/dashboard/productor/jugadores/nuevo` | Formulario de alta de nuevo jugador |
| `/dashboard/productor/jugadores/[id]` | Detalle y edición de un jugador |

---

## Funcionalidades

### 1. Listado de Jugadores (`/dashboard/productor/jugadores`)

Página principal del productor. Muestra todos los jugadores asegurados con filtro por club.

**Filtro por Club:**
- Dropdown con todos los clubs disponibles
- Opción "Todos los clubs" por defecto
- Filtra la tabla en tiempo real

**Buscador:**
- Input de búsqueda por nombre o DNI
- Filtra en tiempo real

**Tabla de Jugadores:**
- Columnas: Nombre, DNI, Club, Vigencia del Seguro, Estado, Acciones
- Estado del seguro: "Vigente" (verde) o "Vencido" (rojo), calculado automáticamente
- Ordenamiento por columnas

**Acciones por Jugador:**
- Botón "Editar": abre la página de edición
- Botón "Renovar": renueva el seguro por 1 año más (con confirmación)
- Botón "Eliminar": elimina al jugador (requiere confirmación con contraseña)

**Botón Principal:**
- "Nuevo Jugador" en la parte superior → navega a formulario de alta

---

### 2. Alta de Jugador (`/dashboard/productor/jugadores/nuevo`)

Formulario para dar de alta un nuevo jugador asegurado.

**Campos del Formulario:**
- **Nombre completo** (texto, requerido)
- **DNI** (numérico, requerido)
- **Fecha de nacimiento** (date picker, requerido)
- **Club** (dropdown con clubs disponibles, requerido)
- **Fecha de inicio del seguro** (date picker, requerido, default: hoy)
- **Fecha de finalización del seguro** (date picker, requerido, default: hoy + 1 año)

**Validaciones:**
- Todos los campos son obligatorios
- DNI debe ser numérico
- Fecha de fin debe ser posterior a fecha de inicio

**Acciones:**
- Botón "Guardar Jugador": guarda y redirige al listado
- Botón "Cancelar": vuelve al listado sin guardar

**Modal de éxito** tras guardar correctamente

---

### 3. Edición de Jugador (`/dashboard/productor/jugadores/[id]`)

Formulario pre-cargado con los datos del jugador para editar.

**Campos Editables:**
- Nombre completo
- DNI
- Fecha de nacimiento
- Club asignado
- Fecha de inicio del seguro
- Fecha de finalización del seguro

**Acciones:**
- Botón "Guardar Cambios": actualiza y redirige al listado
- Botón "Cancelar": vuelve al listado sin guardar

**Modal de éxito** tras guardar correctamente

---

### 4. Eliminación de Jugador

Se accede desde el botón "Eliminar" en el listado.

**Flujo:**
1. Click en "Eliminar"
2. Se abre modal de confirmación
3. El modal solicita la contraseña del productor
4. Si la contraseña es correcta → se elimina el jugador
5. Si la contraseña es incorrecta → se muestra error
6. Modal de éxito tras eliminar

**Seguridad:**
- Requiere ingreso de contraseña del usuario autenticado
- Valida contra el store de autenticación

---

### 5. Renovación de Seguro

Se accede desde el botón "Renovar" en el listado.

**Flujo:**
1. Click en "Renovar"
2. Modal de confirmación: "¿Renovar seguro de [nombre]?"
3. Muestra la nueva fecha de finalización (fecha actual de fin + 1 año)
4. Botón "Confirmar Renovación" → actualiza la fecha
5. Modal de éxito tras renovar

---

## Datos Mock

### Clubs Disponibles
- Atlético Plaza Huincul
- Deportivo Cutral Có
- Club Social Plottier
- Unión de Neuquén
- Racing de Allen

### Jugadores Mock
20 jugadores distribuidos entre los clubs, con datos:
- id, nombreCompleto, dni, fechaNacimiento, club, clubId, seguroInicio, seguroFin

---

## Modelo de Datos (futuro backend)

### Jugador Asegurado
```typescript
interface JugadorAsegurado {
  id: string
  nombreCompleto: string
  dni: string
  fechaNacimiento: string    // ISO date
  clubId: string
  club: string               // Nombre del club
  seguroInicio: string       // ISO date
  seguroFin: string          // ISO date
}
```

### Club
```typescript
interface Club {
  id: string
  nombre: string
}
```

---

## Navegación

El productor usa el layout con sidebar (compartido con admin y club):
- **Sidebar izquierdo** con fondo oscuro (`bg-slate-800`)
- **Items de navegación**: Inicio, Jugadores
- **Botón Cerrar Sesión** en la parte inferior

---

## Componentes Utilizados

- **NotificationModal**: para mensajes de éxito/error/info
- **Modal de Confirmación personalizado**: para eliminar y renovar
- **Modal de Contraseña**: para confirmación de eliminación

---

## Archivos

```
src/app/dashboard/productor/
└── jugadores/
    ├── page.tsx              # Listado con filtro, búsqueda y acciones
    ├── nuevo/
    │   └── page.tsx          # Formulario de alta
    └── [id]/
        └── page.tsx          # Formulario de edición
```

---

## Notas para Conexión a Base de Datos

Cuando se conecte al backend, reemplazar:

1. **`mockJugadores`** → llamada a API `GET /api/jugadores?clubId=X`
2. **`mockClubes`** → llamada a API `GET /api/clubs`
3. **Alta de jugador** → `POST /api/jugadores`
4. **Edición de jugador** → `PUT /api/jugadores/:id`
5. **Eliminación de jugador** → `DELETE /api/jugadores/:id` (enviar contraseña en body)
6. **Renovación de seguro** → `PATCH /api/jugadores/:id/renovar`

Los datos mock están centralizados en cada archivo de página para facilitar la migración.
