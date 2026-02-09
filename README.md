# Seguro Deportivo

Plataforma web progresiva (PWA) para la gestión centralizada de seguros deportivos en clubes de fútbol argentino. Conecta jugadores, productores de seguros, clubes, cantinas y administradores en un único sistema con paneles específicos por rol.

---

## Problema que resuelve

Los clubes manejan seguros de jugadores con planillas dispersas, sin control de vencimientos ni comunicación entre las partes. Cuando un jugador tiene el seguro vencido y sufre una lesión, el club queda expuesto legalmente.

Seguro Deportivo centraliza: estado de pólizas en tiempo real, credencial digital con QR, alertas de vencimiento, gestión de equipos/torneos, cupones de descuento y comunicación directa entre todas las partes.

---

## Roles del sistema

Todos los usuarios pertenecen a un club. Cada perfil tiene un `club_id` obligatorio.

| Rol | Actor | Descripción |
|-----|-------|-------------|
| `admin` | Administrador del club | Supervisión general, gestión de usuarios y reportes del club |
| `productor` | Agente de seguros | Da de alta jugadores y gestiona sus pólizas |
| `club` | Dirigente del club | Gestiona equipos, categorías, torneos, partidos, eventos y notificaciones |
| `jugador` | Deportista | Ve su credencial, se inscribe a torneos, sube documentos |
| `cantina` | Operador de cantina | Valida y canjea cupones, envía notificaciones y cupones |

---

## Flujos de negocio

### 1. Alta de jugador y seguro (Productor)

El productor es quien da de alta a los jugadores en el sistema y les genera su seguro.

**Paso a paso:**

1. El productor ingresa los datos del jugador: nombre completo, DNI, fecha de nacimiento, teléfono, dirección.
2. Al crear el jugador, se genera automáticamente la vinculación con el club (`jugador_club`) quedando registrado qué productor lo dio de alta.
3. Inmediatamente se crea la póliza de seguro asociada. El productor selecciona el tipo de período:
   - **Mensual** (1 mes)
   - **Trimestral** (3 meses)
   - **Semestral** (6 meses)
   - **Anual** (12 meses)
4. El sistema calcula automáticamente la `fecha_fin` a partir de la `fecha_inicio` y el tipo de período.
5. El jugador aparece en el panel del club y puede acceder con su credencial digital.

> **Nota:** El jugador puede o no tener una cuenta en el sistema (`perfil_id` es nullable). El productor puede crear jugadores que aún no se registraron.

### 2. Renovación de seguro (Productor)

Cuando el seguro de un jugador vence y el jugador paga la renovación:

1. El productor accede al listado de jugadores y filtra por seguro vencido.
2. Selecciona el jugador y crea una **nueva póliza** (no se edita la anterior).
3. La nueva póliza guarda referencia a la póliza anterior (`poliza_anterior_id`), formando una cadena de historial.
4. La póliza anterior se marca como `renovada = true`.
5. La credencial digital del jugador se actualiza automáticamente mostrando la nueva vigencia.

**Historial del jugador:** En el perfil del jugador se puede ver toda la cadena de pólizas: cuándo se creó cada una, quién la gestionó, qué tipo de período tenía, y si fue renovada o no. Esto da trazabilidad completa.

### 3. Gestión de equipos y categorías (Club)

El club organiza sus equipos y categorías:

1. **Crear equipo:** El club crea equipos con nombre y logo.
2. **Crear categorías:** El club define categorías (ej: `+18`, `+25`, `+30`, `Senior`, `Libre`).
3. **Asignar categorías a equipos:** Un equipo puede tener una o más categorías. Por ejemplo, "Los Halcones" puede competir en categorías `+25` y `+30`.

### 4. Torneos e inscripción de jugadores (Club + Jugador)

Esta es la parte más importante del sistema. **Los equipos no tienen jugadores fijos**: la composición del equipo cambia según el torneo.

**Creación del torneo (Club):**

1. El club crea un torneo con nombre, descripción, fechas y estado (`próximo`, `en_curso`, `finalizado`).
2. Agrega equipos al torneo, especificando con qué categoría participa cada equipo.
3. Puede agregar o eliminar equipos del torneo en cualquier momento.

**Inscripción de jugadores:**

Los jugadores se asignan a equipos **dentro de un torneo específico**, no de forma permanente. Esto permite que:

- Un equipo tenga diferentes jugadores en cada torneo.
- Un jugador esté en un equipo para un torneo anual y en otro equipo (o el mismo) para un torneo relámpago que surja.
- Dos torneos estén activos simultáneamente con distintas formaciones.

**Flujo de inscripción:**

1. El club activa el botón **"Habilitar inscripciones"** en el torneo (`inscripciones_abiertas = true`).
2. Mientras las inscripciones están abiertas:
   - Los **jugadores** pueden auto-inscribirse a un equipo dentro del torneo (filtrando por torneo y equipo).
   - El **club** puede agregar o eliminar jugadores de los equipos del torneo.
3. Cuando el club desactiva las inscripciones (`inscripciones_abiertas = false`):
   - Ningún jugador puede inscribirse ni salir por su cuenta.
   - Solo el club puede hacer modificaciones.

**Ejemplo práctico:**

> "Los Halcones" juegan en el Torneo Anual 2025 (categoría +30) con 15 jugadores. Surge un Torneo Relámpago de Verano. "Los Halcones" se inscribe también ahí (categoría +30) pero solo con 8 jugadores distintos. Ambos torneos coexisten con formaciones diferentes.

### 5. Partidos y eventos (Club)

**Partidos:**

1. El club crea partidos dentro de un torneo: equipo local vs equipo visitante.
2. Cada partido tiene fecha, hora, ubicación y estado (`programado`, `en_curso`, `finalizado`, `suspendido`).
3. Se pueden registrar resultados.

**Eventos:**

1. El club puede crear eventos independientes de torneos (ej: "2x1 en cervezas", "Asado de fin de temporada", entrenamientos).
2. Cada evento tiene título, descripción, fecha, hora, ubicación y tipo.
3. Tanto partidos como eventos aparecen en el **calendario** visible para los jugadores.

### 6. Notificaciones (Club + Cantina)

Tanto el club como la cantina pueden enviar notificaciones segmentadas. Los destinatarios se filtran por:

| Filtro | Descripción |
|--------|-------------|
| `todos` | Todos los jugadores del club |
| `equipo` | Jugadores de un equipo específico |
| `categoria` | Jugadores de una categoría específica |
| `torneo` | Jugadores inscritos en un torneo específico |
| `seguro_vigente` | Solo jugadores con seguro al día |
| `seguro_vencido` | Solo jugadores con seguro vencido |

Cada notificación genera un registro individual por jugador destinatario, lo que permite trackear si fue leída o no.

**Notificaciones con cupón:** Al enviar una notificación, se puede incluir un cupón personalizado. En ese caso, se genera un cupón con código único para cada jugador destinatario (ver sección de cupones).

### 7. Cupones y sistema de cantina (Cantina)

Los cupones son personalizados, de un solo uso y con código único. Reemplazan el concepto de "beneficios".

**Creación de cupones:**

1. El club o la cantina envían una notificación con cupón incluido.
2. El sistema genera automáticamente un código único por cada jugador destinatario.
3. Cada cupón tiene:
   - **Código único** (ej: `CLUB-ABC123`)
   - **Tipo de descuento:** porcentaje (ej: 15%) o monto fijo (ej: $500)
   - **Valor del descuento**
   - **Fecha de vencimiento** (opcional)
   - **Jugador asignado**

**Canje de cupones (Cantina):**

1. El jugador presenta su código de cupón en la cantina.
2. El operador de cantina ingresa el código en el sistema.
3. El sistema **verifica**:
   - ¿Existe el cupón? → Si no, error.
   - ¿Ya fue usado? → Si sí, error (muestra cuándo se usó).
   - ¿Está vencido? → Si sí, error.
4. Si es válido, muestra los datos del cupón y del jugador (preview).
5. El operador ingresa el **monto de la compra**.
6. El sistema calcula automáticamente:
   - Si es porcentaje: `monto_descuento = monto_compra × valor_descuento / 100`
   - Si es monto fijo: `monto_descuento = valor_descuento` (sin superar el monto de compra)
   - `monto_total = monto_compra - monto_descuento`
7. Se confirma el canje y queda registrado:
   - Fecha y hora de uso
   - Monto original de la compra
   - Monto del descuento aplicado
   - Total pagado por el jugador
   - Quién procesó el canje (usuario cantina)

**Cierre de caja:**

La cantina tiene acceso a un reporte diario que muestra:
- Total de cupones canjeados en el día
- Suma total de compras brutas
- Suma total de descuentos aplicados
- Total neto (lo que efectivamente se cobró)

Esto permite descontar los descuentos del cierre de caja diario.

### 8. Perfil del jugador (Jugador)

El jugador tiene acceso a:

- **Credencial digital:** Muestra sus datos, foto, estado del seguro y código QR verificable.
- **Foto de perfil:** Puede subir una foto (con compresor de imagen, máximo 5MB).
- **Cambio de contraseña:** Puede actualizar su contraseña desde el perfil.
- **Documentos personales:** Puede subir archivos que el club le solicite (DNI, ficha médica, autorizaciones, etc.). Se guardan en Supabase Storage con referencia en la base de datos.
- **Calendario:** Ve partidos y eventos del club.
- **Inscripción a torneos:** Cuando las inscripciones están abiertas, puede unirse a equipos filtrando por torneo.
- **Notificaciones:** Recibe las notificaciones segmentadas que le correspondan.
- **Cupones:** Ve sus cupones disponibles con código y estado.

---

## Modelo de datos

### Tablas principales

| # | Tabla | Descripción |
|---|-------|-------------|
| 1 | `perfiles` | Extiende `auth.users` de Supabase. Todos tienen `club_id`. |
| 2 | `clubes` | Datos del club. |
| 3 | `categorias` | Categorías de juego (ej: +18, +30). Pertenecen a un club. |
| 4 | `equipos` | Equipos del club. Tienen nombre y logo. |
| 5 | `equipo_categoria` | Relación N:N entre equipos y categorías. |
| 6 | `jugadores` | Datos personales del deportista. Independiente del club. |
| 7 | `jugador_club` | Relación N:N entre jugadores y clubes. Registra qué productor lo dio de alta. |
| 8 | `documentos_jugador` | Archivos subidos por el jugador (referencia a Supabase Storage). |
| 9 | `polizas` | Historial de seguros. Inmutables, con cadena de renovación. |
| 10 | `torneos` | Torneos del club con flag de inscripciones abiertas. |
| 11 | `torneo_equipo` | Equipos inscritos en un torneo con categoría específica. |
| 12 | `jugador_equipo_torneo` | ⭐ Tabla clave: jugadores asignados a equipos POR TORNEO. |
| 13 | `partidos` | Partidos dentro de un torneo. |
| 14 | `eventos` | Eventos del club (independientes de torneos). |
| 15 | `notificaciones` | Notificaciones segmentadas enviadas por club o cantina. |
| 16 | `notificacion_destinatario` | Tracking de lectura por jugador. |
| 17 | `cupones` | Cupones personalizados con código único y trazabilidad de uso. |

### Relaciones clave

```
auth.users (1) ──── (1) perfiles
perfiles   (N) ──── (1) clubes              # todos pertenecen a un club

clubes     (1) ──── (N) categorias
clubes     (1) ──── (N) equipos
clubes     (1) ──── (N) torneos
clubes     (1) ──── (N) partidos
clubes     (1) ──── (N) eventos
clubes     (1) ──── (N) notificaciones
clubes     (1) ──── (N) cupones

jugadores  (N) ──── (N) clubes              # via jugador_club
jugadores  (1) ──── (N) polizas             # historial de seguros
jugadores  (1) ──── (N) documentos_jugador
jugadores  (1) ──── (N) cupones

equipos    (N) ──── (N) categorias          # via equipo_categoria
equipos    (N) ──── (N) torneos             # via torneo_equipo

torneos    (1) ──── (N) torneo_equipo
torneo_equipo (1) ── (N) jugador_equipo_torneo   # ⭐ jugadores por equipo por torneo
```

### Concepto clave: jugadores por torneo

```
Torneo Anual 2025
  └── Los Halcones (categoría +30)
        ├── Juan Pérez (#10)
        ├── Carlos López (#5)
        └── ... (15 jugadores)

Torneo Relámpago Verano
  └── Los Halcones (categoría +30)
        ├── Juan Pérez (#10)      ← mismo jugador, distinto torneo
        ├── Miguel Torres (#7)     ← jugador diferente
        └── ... (8 jugadores)
```

La tabla `jugador_equipo_torneo` vincula a un jugador con un registro de `torneo_equipo` (que es la combinación torneo + equipo + categoría). Así cada torneo tiene su propia formación independiente.

---

## Funciones de base de datos

| Función | Descripción |
|---------|-------------|
| `calcular_fecha_fin_poliza(fecha, tipo)` | Calcula automáticamente la fecha de fin según el tipo de período |
| `verificar_cupon(codigo)` | Valida un cupón sin canjearlo. Devuelve datos del cupón y jugador |
| `canjear_cupon(codigo, monto, usuario)` | Valida, calcula descuento y registra el canje atómicamente |

---

## Vistas útiles

| Vista | Descripción |
|-------|-------------|
| `jugadores_con_seguro` | Jugadores con estado de seguro vigente/vencido, datos de la última póliza y club |
| `resumen_cupones_diario` | Totales de cupones canjeados por día, agrupados por club y operador (para cierre de caja) |
| `jugadores_por_torneo` | Jugadores con datos del equipo, torneo, categoría y estado de inscripción |

---

## Seguridad (RLS)

Todas las tablas tienen Row Level Security habilitado. Las políticas aseguran que:

- Cada usuario solo ve datos de **su club**.
- El **productor** ve los jugadores que dio de alta.
- El **club** ve todos los jugadores, equipos, torneos y partidos de su club.
- El **jugador** ve su propio perfil, credencial, documentos y cupones.
- La **cantina** ve y gestiona cupones de su club.
- El **admin** tiene supervisión de todo dentro de su club.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/login/              # Login (Supabase Auth)
│   ├── dashboard/
│   │   ├── page.tsx               # Dashboard por rol
│   │   ├── layout.tsx             # Layout con nav por rol
│   │   ├── jugador/               # Credencial, equipo, cupones, calendario, documentos
│   │   ├── productor/             # CRUD jugadores, pólizas, renovaciones
│   │   ├── club/                  # Equipos, categorías, torneos, calendario, notificaciones
│   │   ├── cantina/               # Validar cupones, cierre de caja, notificaciones
│   │   └── admin/                 # Usuarios, reportes, configuración
│   └── middleware.ts              # RBAC
├── components/ui/
├── hooks/
├── lib/
│   ├── supabase.ts                # Cliente de Supabase
│   └── navigation.ts              # Rutas por rol
├── stores/                        # Zustand (auth, tema)
└── types/                         # Tipos compartidos
```

---

## Desarrollo local

```bash
npm install
npm run dev
# http://localhost:3000
```

---

## Próximos pasos

1. Crear proyecto en Supabase y ejecutar `seguro_deportivo_schema.sql`
2. Configurar Supabase Auth con email/password
3. Crear cliente Supabase en `lib/supabase.ts`
4. Implementar las queries reemplazando datos mock
5. Completar políticas RLS para cada tabla
6. Configurar Supabase Storage para fotos y documentos (con límite de 5MB)
7. Activar Realtime para notificaciones en vivo
8. Implementar compresor de imagen en el frontend para fotos de perfil
