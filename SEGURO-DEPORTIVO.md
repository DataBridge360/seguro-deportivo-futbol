# Seguro Deportivo - Documentacion de la Aplicacion

## Que es Seguro Deportivo

Seguro Deportivo es una plataforma web progresiva (PWA) construida con Next.js 14 que centraliza la gestion de seguros deportivos para clubes de futbol argentino. Conecta a cuatro actores clave del ecosistema: **jugadores**, **productores de seguros**, **clubes** y **administradores**, cada uno con su propio panel de control y funcionalidades especificas.

La aplicacion funciona como una app instalable en dispositivos moviles y de escritorio, con soporte offline y una interfaz adaptada a cada plataforma.

---

## Problema que soluciona

La gestion de seguros deportivos en clubes de futbol enfrenta multiples problemas:

- **Desorganizacion**: Los clubes manejan seguros de decenas o cientos de jugadores en planillas, documentos fisicos o sistemas no integrados. No existe un lugar central donde consultar el estado de cada poliza.

- **Vencimientos no controlados**: Cuando un jugador tiene el seguro vencido y sufre una lesion durante un partido, el club queda expuesto legalmente. No hay alertas automaticas ni visibilidad clara sobre quien tiene cobertura activa y quien no.

- **Fragmentacion entre actores**: El productor de seguros trabaja con sus propios registros, el club con los suyos, y el jugador no tiene forma de consultar su estado de cobertura. No hay comunicacion fluida entre las partes.

- **Falta de credencial digital**: Los jugadores no tienen una forma rapida de demostrar su cobertura vigente en un partido o evento deportivo.

- **Comunicacion ineficiente**: Los clubes no tienen un canal directo para notificar a jugadores sobre partidos, cambios de horarios, renovaciones de seguro u otras comunicaciones importantes.

Seguro Deportivo resuelve todo esto con una plataforma unica donde cada actor tiene acceso a la informacion que necesita, en tiempo real, desde cualquier dispositivo.

---

## Roles y permisos

| Rol | Descripcion | Acceso |
|-----|------------|--------|
| **Jugador** | Deportista asegurado | Ve su credencial digital, equipo, beneficios y calendario |
| **Productor** | Agente de seguros | Gestiona altas, bajas y renovaciones de polizas de jugadores |
| **Club** | Dirigente o administrativo del club | Administra jugadores, equipos, torneos, calendario y notificaciones |
| **Admin** | Administrador de la plataforma | Supervision general del sistema |

---

## Vistas de la aplicacion

### Autenticacion

#### Login (`/login`)
- Formulario de inicio de sesion con email y contrasena
- Redireccion automatica al dashboard correspondiente segun el rol del usuario
- Validacion de credenciales contra el store de autenticacion

#### Homepage (`/`)
- Pagina publica de bienvenida
- Prompt de instalacion como PWA (detecta iOS y Android)
- Redireccion a login o dashboard si el usuario ya esta autenticado

---

### Panel del Jugador

#### Dashboard (`/dashboard`)
- **Credencial digital**: Tarjeta visual con datos del jugador, club, DNI, fechas de vigencia del seguro y estado activo/inactivo
- **Codigo QR**: Modal con QR escaneable para verificar identidad en partidos
- **Atajos rapidos**: Acceso directo a equipo, beneficios, calendario y perfil
- **Proximo partido**: Vista del siguiente encuentro programado
- Layout responsivo: diseño mobile-first con tarjeta tipo credencial y atajos verticales; en desktop usa grid de 12 columnas

#### Mi Equipo (`/dashboard/jugador/equipo`)
- Lista de equipos del club del jugador
- Vista de detalle por equipo con plantel completo

#### Unirse a Equipo (`/dashboard/jugador/equipo/unirse`)
- Formulario para solicitar unirse a un equipo del club

#### Beneficios (`/dashboard/jugador/beneficios`)
- Cupones y descuentos exclusivos por tener seguro vigente

#### Calendario (`/dashboard/jugador/partidos`)
- Partidos programados y entrenamientos del jugador

#### Perfil (`/dashboard/jugador/perfil`)
- Datos personales del jugador
- Cambio de contrasena
- Configuracion de tema (claro/oscuro)

---

### Panel del Productor

#### Dashboard (`/dashboard`)
- Resumen de jugadores asegurados: total, activos y con seguro vencido
- Tabla de jugadores con seguro inactivo con accion directa de renovacion
- Modal de renovacion con selector de fecha y duracion del seguro
- Notificacion de exito al renovar

#### Jugadores (`/dashboard/productor/jugadores`)
- Listado completo de jugadores asegurados
- Filtros por club y estado del seguro (vigente/vencido)
- Busqueda por nombre o DNI
- Acciones por jugador: ver detalle, editar, renovar seguro, eliminar (con confirmacion por contrasena)
- Tabla responsiva con indicadores visuales de estado

#### Nuevo Jugador (`/dashboard/productor/jugadores/nuevo`)
- Formulario de alta de jugador asegurado
- Campos: nombre completo, DNI, fecha de nacimiento, club, fechas de seguro
- Validacion de formulario completa
- DatePicker custom para seleccion de fechas
- Calculo automatico de fecha fin (1 anio desde inicio)

#### Editar Jugador (`/dashboard/productor/jugadores/[id]`)
- Carga datos existentes del jugador por ID
- Misma estructura que el formulario de alta
- Manejo de jugador no encontrado

#### Perfil (`/dashboard/productor/perfil`)
- Datos del productor
- Toggle de tema oscuro/claro
- Opciones de configuracion

---

### Panel del Club

#### Dashboard (`/dashboard`)
- Tarjetas de resumen: jugadores totales, equipos, torneos activos, jugadores sin seguro
- Lista de proximos partidos con fecha, hora, rival y ubicacion

#### Jugadores (`/dashboard/club/jugadores`)
- Tabla de todos los jugadores del club
- Filtros por equipo, categoria (+18, +25, +30) y estado del seguro
- Busqueda por nombre o DNI
- Indicadores visuales de seguro vigente/vencido
- Vista de solo lectura (el club no edita polizas, eso es tarea del productor)

#### Equipos (`/dashboard/club/equipos`)
- Grilla de equipos del club con badges de color por equipo
- Filtro por torneo
- Modal de detalle con:
  - Jugadores agrupados por categoria
  - Torneos en los que participa el equipo
  - Conteo de jugadores
- Boton para crear nuevo equipo

#### Nuevo Equipo (`/dashboard/club/equipos/nuevo`)
- Formulario con nombre del equipo y seleccion de categoria
- Validacion y notificacion de exito

#### Torneos (`/dashboard/club/torneos`)
- Tarjetas de torneos con estado (En curso, Proximo, Finalizado)
- Badges de color segun estado
- Modal de detalle con descripcion, fechas y equipos participantes
- Boton para registrar nuevo torneo

#### Nuevo Torneo (`/dashboard/club/torneos/nuevo`)
- Formulario con nombre, fecha inicio, fecha fin
- Seleccion multiple de equipos participantes con checkboxes
- Validacion de fechas (fin debe ser posterior a inicio)

#### Calendario (`/dashboard/club/calendario`)
- Calendario mensual interactivo con navegacion entre meses
- Indicadores visuales en dias con partidos programados
- Listado lateral de partidos del mes con fecha, hora, equipos, torneo y ubicacion
- Estado vacio cuando no hay partidos en el mes
- Boton para programar nuevo partido

#### Nuevo Partido (`/dashboard/club/calendario/nuevo`)
- Formulario con equipo local, rival, fecha, horario, torneo y ubicacion
- Selects dinamicos con datos de equipos y torneos existentes
- DatePicker custom

#### Notificaciones (`/dashboard/club/notificaciones`)
- Formulario de envio de notificaciones a jugadores
- Tipos de destinatario: todos, con seguro vigente, sin seguro, por equipo, por torneo
- Seleccion condicional de equipo o torneo segun el tipo elegido
- Campo de asunto y mensaje
- Historial de notificaciones enviadas con timestamps relativos

#### Perfil (`/dashboard/club/perfil`)
- Datos del club/dirigente
- Toggle de tema
- Configuracion general

---

### Panel de Administracion

#### Dashboard (`/dashboard`)
- Vista de supervision con metricas generales: usuarios activos, polizas vigentes
- Panel de control general de la plataforma

---

## Arquitectura tecnica

### Stack tecnologico

| Tecnologia | Uso |
|-----------|-----|
| **Next.js 14** | Framework React con App Router, SSR y middleware |
| **TypeScript** | Tipado estatico en toda la aplicacion |
| **Tailwind CSS** | Sistema de estilos utility-first con tema custom |
| **Zustand** | Manejo de estado global (auth y tema) con persistencia |
| **next-pwa** | Soporte PWA para instalacion y funcionamiento offline |
| **lucide-react** | Iconos para navegacion del sidebar |
| **Material Symbols** | Iconos Google para toda la interfaz |

### Estructura del proyecto

```
src/
├── app/                          # Rutas (App Router de Next.js)
│   ├── (auth)/login/             # Autenticacion
│   ├── dashboard/                # Panel principal
│   │   ├── jugador/              # Vistas del jugador
│   │   ├── productor/            # Vistas del productor
│   │   ├── club/                 # Vistas del club
│   │   ├── layout.tsx            # Layout con sidebar/nav por rol
│   │   └── page.tsx              # Dashboard con componente por rol
│   ├── layout.tsx                # Layout raiz (fuentes, PWA, tema)
│   └── globals.css               # Estilos globales y animaciones
├── components/                   # Componentes reutilizables
│   ├── ThemeProvider.tsx          # Proveedor de tema claro/oscuro
│   └── ui/
│       ├── NotificationModal.tsx  # Modal de notificaciones animado
│       └── DatePicker.tsx         # Selector de fecha custom
├── hooks/
│   └── usePWA.ts                 # Hook de deteccion e instalacion PWA
├── lib/
│   ├── navigation.ts             # Definicion de rutas por rol
│   ├── utils.ts                  # Utilidades (cn para classnames)
│   └── mockData.ts               # Datos mock centralizados
├── stores/
│   ├── authStore.ts              # Estado de autenticacion
│   └── themeStore.ts             # Estado del tema visual
├── types/
│   └── index.ts                  # Tipos compartidos (User, UserRole, NavItem)
└── middleware.ts                  # Proteccion de rutas y control de acceso
```

### Patrones de diseno

- **Role-based access control (RBAC)**: Middleware de Next.js valida rol y ruta en cada request
- **Persistencia de sesion**: Zustand con localStorage + cookie para SSR
- **Tema oscuro/claro**: Class-based con Tailwind, toggle persistido en store
- **Componentes modulares**: Cada vista es un componente independiente, formularios con validacion local
- **Mock data centralizado**: Un unico archivo (`mockData.ts`) con todos los datos de prueba, tipos e interfaces

---

## Escalabilidad

### Estado actual (frontend con datos mock)

La aplicacion funciona completamente en el cliente con datos simulados. Esto permite:
- Prototipar rapidamente sin depender de un backend
- Validar flujos de usuario y UX con stakeholders
- Desarrollar todas las vistas en paralelo

### Camino a produccion

La arquitectura esta preparada para escalar en las siguientes dimensiones:

#### 1. Integracion con backend / API

El patron actual de datos centralizados en `mockData.ts` facilita la migracion:

- **Reemplazar imports de mock** por llamadas a API REST o GraphQL
- **Zustand ya maneja estado asincrono**: agregar `fetch` en actions del store
- **Next.js soporta Server Actions y Route Handlers**: se pueden crear endpoints en `app/api/` sin necesidad de un servidor aparte
- **Autenticacion real**: reemplazar mock users por JWT, OAuth o sesiones con NextAuth.js

#### 2. Base de datos

La estructura de tipos ya definida (`JugadorAsegurado`, `Club`, `Torneo`, `Partido`) mapea directamente a tablas/colecciones:

- **SQL** (PostgreSQL/MySQL): esquema relacional natural con relaciones club-equipo-jugador-torneo
- **NoSQL** (MongoDB/Firebase): esquema flexible para documentos anidados
- **ORM**: Prisma o Drizzle se integran nativamente con Next.js

#### 3. Funcionalidades pendientes de implementar

- **Notificaciones push reales**: usando Web Push API + Service Worker (la base PWA ya esta)
- **Carga de documentos**: subida de DNI, certificados medicos, polizas escaneadas
- **Reportes y exportacion**: generacion de PDFs con listados de jugadores asegurados
- **Historial de polizas**: seguimiento de renovaciones y cambios de cobertura
- **Multi-tenancy**: soporte para multiples clubes/productores con datos aislados
- **Panel admin completo**: gestion de usuarios, configuracion de plataforma, logs de actividad

#### 4. Rendimiento

- **ISR/SSG**: las paginas de torneos y equipos pueden pre-renderizarse
- **React Server Components**: mover componentes de solo lectura al servidor
- **Cache de API**: SWR o React Query para cache y revalidacion
- **Code splitting**: Next.js ya lo hace automatico por ruta

#### 5. Despliegue

- **Vercel**: despliegue nativo para Next.js con preview deployments por branch
- **Docker**: containerizable para despliegue en cualquier cloud
- **CI/CD**: pipeline con build + lint + tests automatizados

---

## Datos mock actuales

La aplicacion incluye datos de prueba realistas:

- **5 clubes**: River Plate, Boca Juniors, Racing Club, Independiente, San Lorenzo
- **3 categorias**: +18, +25, +30
- **20 jugadores** distribuidos entre los 5 clubes con DNI, fechas de nacimiento y polizas
- **3 torneos**: Liga Profesional (en curso), Copa Argentina (proximo), Torneo de Verano (finalizado)
- **6 partidos** programados entre febrero y marzo 2026

---

## Credenciales de prueba

| Email | Contrasena | Rol |
|-------|-----------|-----|
| `jugador@test.com` | `test` | Jugador |
| `productor@test.com` | `test` | Productor |
| `club@test.com` | `test` | Club |
| `admin@test.com` | `test` | Admin |
