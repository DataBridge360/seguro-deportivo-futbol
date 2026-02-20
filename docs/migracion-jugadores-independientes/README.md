# Migracion: Jugadores Independientes

## Objetivo

Separar los jugadores de la tabla `perfiles` para que tengan su propia tabla `jugadores` con autenticacion independiente (DNI + password_hash). La tabla `perfiles` queda exclusivamente para staff (admin, productor, club, cantina).

---

## Estado Actual de la Base de Datos

La DB se encuentra en un estado intermedio producto de una migracion parcial anterior que:

- **Elimino** la tabla `jugadores` original
- **Renombro** tablas dependientes:
  - `jugador_club` → `perfil_club` (columna `jugador_id` → `perfil_id`)
  - `documentos_jugador` → `documentos_perfil` (columna `jugador_id` → `perfil_id`)
  - `jugador_equipo_torneo` → `perfil_equipo_torneo` (columna `jugador_id` → `perfil_id`)
- **Renombro** columnas en otras tablas:
  - `polizas`: `jugador_id` → `perfil_id`, `jugador_club_id` → `perfil_club_id`
  - `cupones`: `jugador_id` → `perfil_id`
- **Movio** datos de jugadores a `perfiles` (con `rol = 'jugador'`)

### Esquema actual de `perfiles`

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID | PK |
| auth_id | UUID | FK a auth.users (NULL para jugadores) |
| dni | VARCHAR(20) | Documento de identidad |
| password_hash | TEXT | Hash bcrypt de la password |
| debe_cambiar_password | BOOLEAN | Flag primer login |
| ultimo_acceso | TIMESTAMPTZ | Ultimo login |
| nombre | VARCHAR(255) | Nombre |
| apellido | VARCHAR(255) | Apellido |
| rol | rol_enum | admin, productor, club, jugador, cantina |
| telefono | VARCHAR(50) | Telefono |
| email | VARCHAR(255) | Email |
| avatar_url | TEXT | Avatar |
| club_id | UUID | FK a clubes |
| activo | BOOLEAN | Estado |
| fecha_nacimiento | DATE | Fecha de nacimiento |
| direccion | VARCHAR(255) | Direccion |
| foto_url | TEXT | Foto |
| created_at | TIMESTAMPTZ | Creacion |
| updated_at | TIMESTAMPTZ | Actualizacion |

---

## Que Hace la Migracion

### Paso 1 - Crear tabla `jugadores`

Crea la tabla `jugadores` con todos los campos necesarios, incluyendo autenticacion:

- Datos personales: nombre, apellido, fecha_nacimiento, direccion, foto_url, telefono, email
- Autenticacion: dni (UNIQUE, NOT NULL), password_hash (NOT NULL), debe_cambiar_password, ultimo_acceso
- Estado: activo
- Timestamps: created_at, updated_at

### Paso 2 - Migrar datos de `perfiles` a `jugadores`

Copia todos los registros de `perfiles WHERE rol = 'jugador'` a la nueva tabla `jugadores`, **conservando los mismos UUIDs** para no romper relaciones existentes.

Incluye verificacion automatica de que las cantidades coinciden.

### Paso 3 - Revertir nombres de tablas dependientes

Revierte los renombramientos de la migracion parcial anterior:

| Actual | Nuevo (revertido) | Columna |
|--------|-------------------|---------|
| `perfil_club` | `jugador_club` | `perfil_id` → `jugador_id` |
| `documentos_perfil` | `documentos_jugador` | `perfil_id` → `jugador_id` |
| `perfil_equipo_torneo` | `jugador_equipo_torneo` | `perfil_id` → `jugador_id` |
| `polizas` | (no cambia nombre) | `perfil_id` → `jugador_id`, `perfil_club_id` → `jugador_club_id` |
| `cupones` | (no cambia nombre) | `perfil_id` → `jugador_id` |

Actualiza las FK constraints para apuntar a `jugadores(id)` en vez de `perfiles(id)`.

### Paso 3.6 - Notificaciones

Agrega columna `jugador_id` a `notificacion_destinatario` y migra las notificaciones que apuntaban a perfiles con `rol = 'jugador'`.

### Paso 4 - Limpiar `perfiles`

- Elimina todos los registros de `perfiles` con `rol = 'jugador'`
- Elimina constraint `chk_auth_dual` (ya no aplica)
- Agrega constraint `chk_staff_auth` para asegurar que todo staff tenga `auth_id`

### Paso 5 - Recrear vista `jugadores_con_seguro`

Vista que cruza jugadores con clubes y polizas vigentes. Ya no depende de `perfiles`.

### Paso 6 - Actualizar funcion `verificar_cupon`

La funcion ahora busca en `jugadores` directamente en vez de `perfiles`.

### Paso 7 - Indices

Crea indices de rendimiento en las tablas principales.

### Paso 8 - Trigger `updated_at`

Crea trigger para actualizar automaticamente `updated_at` en jugadores.

### Paso 9 - Deprecar rol `jugador` en enum

Agrega comentario al tipo `rol_enum` indicando que el valor `jugador` esta deprecado.

---

## Instrucciones de Ejecucion

### Pre-requisitos

- Acceso al SQL Editor de Supabase (proyecto `gzgpvugcjqkdfvfctmrx`)
- La base de datos debe estar en el estado descrito en "Estado Actual"

### Pasos

1. **Hacer backup** de la base de datos antes de ejecutar:
   ```sql
   -- Desde Supabase Dashboard > Settings > Database > Backups
   -- O usando pg_dump si tienes acceso directo
   ```

2. **Abrir el SQL Editor** en Supabase Dashboard

3. **Copiar y pegar** el contenido completo de `migracion.sql`

4. **Ejecutar** el script completo

5. **Verificar** los mensajes NOTICE en la salida:
   ```
   Perfiles jugador: X | Jugadores creados: X     -- Deben coincidir
   ========= VERIFICACION =========
   Total jugadores: X
   Con DNI: X                                      -- Debe ser igual a total
   Con password: X                                  -- Debe ser igual a total
   Perfiles jugador (debe ser 0): 0                 -- DEBE ser 0
   Relaciones jugador_club: X
   ========= MIGRACION EXITOSA =========
   Vista jugadores_con_seguro: X registros
   ```

6. Si hay errores, la transaccion se revierte automaticamente (todo esta dentro de `BEGIN`/`COMMIT`)

### Verificacion Manual Post-Migracion

Ejecutar estas queries para confirmar que todo quedo correcto:

```sql
-- 1. Verificar que jugadores existe y tiene datos
SELECT COUNT(*) AS total_jugadores FROM jugadores;

-- 2. Verificar que todos tienen DNI y password
SELECT COUNT(*) AS sin_dni FROM jugadores WHERE dni IS NULL;        -- Debe ser 0
SELECT COUNT(*) AS sin_pass FROM jugadores WHERE password_hash IS NULL; -- Debe ser 0

-- 3. Verificar que no quedan jugadores en perfiles
SELECT COUNT(*) AS jugadores_en_perfiles FROM perfiles WHERE rol = 'jugador'; -- Debe ser 0

-- 4. Verificar tablas renombradas
SELECT COUNT(*) FROM jugador_club;
SELECT COUNT(*) FROM documentos_jugador;
SELECT COUNT(*) FROM jugador_equipo_torneo;

-- 5. Verificar FK en polizas
SELECT column_name FROM information_schema.columns
WHERE table_name = 'polizas' AND column_name IN ('jugador_id', 'jugador_club_id');

-- 6. Verificar FK en cupones
SELECT column_name FROM information_schema.columns
WHERE table_name = 'cupones' AND column_name = 'jugador_id';

-- 7. Verificar vista
SELECT * FROM jugadores_con_seguro LIMIT 5;

-- 8. Verificar funcion verificar_cupon
SELECT verificar_cupon('CODIGO_TEST');
```

---

## Esquema Final Post-Migracion

### Tabla `jugadores` (NUEVA - independiente)

| Columna | Tipo | Constraints | Descripcion |
|---------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | ID unico |
| nombre | VARCHAR(255) | NOT NULL | Nombre |
| apellido | VARCHAR(255) | | Apellido |
| fecha_nacimiento | DATE | | Fecha de nacimiento |
| direccion | VARCHAR(255) | | Direccion |
| foto_url | TEXT | | Foto |
| telefono | VARCHAR(50) | | Telefono |
| email | VARCHAR(255) | | Email |
| dni | VARCHAR(20) | NOT NULL, UNIQUE | Documento (login) |
| password_hash | TEXT | NOT NULL | Hash bcrypt |
| debe_cambiar_password | BOOLEAN | DEFAULT TRUE | Primer login |
| ultimo_acceso | TIMESTAMPTZ | | Ultimo login |
| activo | BOOLEAN | DEFAULT TRUE | Estado |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creacion |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Actualizacion |

### Tabla `perfiles` (SOLO STAFF)

Se mantiene igual pero sin registros con `rol = 'jugador'`. Solo contiene:
- admin
- productor
- club
- cantina

### Relaciones

```
jugadores
  ├── jugador_club (jugador_id → jugadores.id)
  │     └── polizas (jugador_club_id → jugador_club.id)
  ├── polizas (jugador_id → jugadores.id)
  ├── documentos_jugador (jugador_id → jugadores.id)
  ├── jugador_equipo_torneo (jugador_id → jugadores.id)
  ├── cupones (jugador_id → jugadores.id)
  └── notificacion_destinatario (jugador_id → jugadores.id)

perfiles (solo staff)
  └── notificacion_destinatario (perfil_id → perfiles.id)
```

### Autenticacion

| Tipo | Tabla | Login | Password |
|------|-------|-------|----------|
| **Jugadores** | `jugadores` | DNI | bcrypt hash en `password_hash` |
| **Staff** | `perfiles` | Email (Supabase Auth) | Gestionado por Supabase Auth (`auth_id`) |

---

## Rollback

Si algo sale mal y la transaccion no se revirtio automaticamente, se puede revertir manualmente:

```sql
-- ATENCION: Solo usar si la migracion fallo parcialmente
-- y la transaccion no se revirtio

-- 1. Eliminar tabla jugadores si se creo
DROP TABLE IF EXISTS jugadores CASCADE;

-- 2. Revertir nombres de tablas (si se renombraron)
ALTER TABLE IF EXISTS jugador_club RENAME TO perfil_club;
ALTER TABLE IF EXISTS perfil_club RENAME COLUMN jugador_id TO perfil_id;

ALTER TABLE IF EXISTS documentos_jugador RENAME TO documentos_perfil;
ALTER TABLE IF EXISTS documentos_perfil RENAME COLUMN jugador_id TO perfil_id;

ALTER TABLE IF EXISTS jugador_equipo_torneo RENAME TO perfil_equipo_torneo;
ALTER TABLE IF EXISTS perfil_equipo_torneo RENAME COLUMN jugador_id TO perfil_id;

-- 3. Revertir columnas en polizas
ALTER TABLE polizas RENAME COLUMN jugador_id TO perfil_id;
ALTER TABLE polizas RENAME COLUMN jugador_club_id TO perfil_club_id;

-- 4. Revertir columnas en cupones
ALTER TABLE cupones RENAME COLUMN jugador_id TO perfil_id;

-- 5. Eliminar columna jugador_id de notificacion_destinatario
ALTER TABLE notificacion_destinatario DROP COLUMN IF EXISTS jugador_id;
```

> **Nota**: El rollback asume que los datos en `perfiles` no fueron eliminados. Si se ejecuto el Paso 4 (DELETE), los datos de jugadores en perfiles se perdieron y habria que restaurar desde backup.

---

## Cambios Frontend Asociados

Los siguientes archivos del frontend fueron actualizados para reflejar la nueva estructura:

| Archivo | Cambio |
|---------|--------|
| `src/types/bulk-import.ts` | Eliminado `perfiles_created` de `ImportResult.summary` |
| `src/components/bulk-import/ResultsSection.tsx` | Eliminado card "Perfiles creados" del resumen |
| `docs/bulkimport/README.md` | Eliminadas referencias a `perfiles_created` |
