# Vista del Jugador - Seguro Deportivo

Documentación completa de todas las pantallas, funcionalidades y componentes disponibles en la vista del jugador.

---

## Estructura de Rutas

| Ruta | Descripción |
|------|-------------|
| `/dashboard` | Página principal con credencial digital |
| `/dashboard/jugador/beneficios` | Beneficios y cupones de descuento |
| `/dashboard/jugador/equipo` | Listado de equipos del jugador |
| `/dashboard/jugador/equipo/[id]` | Detalle de un equipo (plantel) |
| `/dashboard/jugador/equipo/unirse` | Formulario para unirse a un equipo |
| `/dashboard/jugador/partidos` | Calendario de partidos |
| `/dashboard/jugador/perfil` | Perfil, configuración y cierre de sesión |

---

## Páginas

### 1. Dashboard Principal (`/dashboard`)

Página de inicio del jugador. Muestra la credencial digital y accesos rápidos.

**Credencial Digital:**
- Nombre del jugador, club, N° de socio, DNI, fecha de nacimiento
- Validez del seguro con fechas
- Badge de estado "ACTIVO"
- Botón para abrir código QR en modal
- Diseño con fondo degradado azul

**Accesos Rápidos:**
- Móvil: lista vertical de 3 ítems
- Desktop: grilla 2x2
- Enlaces a: Equipo, Beneficios, Calendario, Perfil

**Próximo Partido (solo desktop):**
- Equipos, competición, hora y ubicación del siguiente partido

---

### 2. Beneficios (`/dashboard/jugador/beneficios`)

Listado de beneficios y cupones de descuento disponibles para el jugador.

**Listado:**
- Header con cantidad de beneficios disponibles
- Tarjetas con: ícono de color, título, tienda, fecha de vencimiento
- Botón "Ver cupón" en cada tarjeta

**Modal de Cupón:**
- Código de descuento en fuente monoespaciada
- Botón "Copiar código" con funcionalidad de copiar al portapapeles
- Animación de confirmación al copiar (botón se pone verde con checkmark)
- Fechas de validez

**Datos mock (4 beneficios):**
- 20% OFF en Indumentaria (SportShop)
- 15% OFF en Suplementos (NutriStore)
- 2x1 en Bebidas (HidraMax)
- 30% OFF en Calzado (RunnersPro)

---

### 3. Mi Equipo (`/dashboard/jugador/equipo`)

Muestra los equipos a los que pertenece el jugador.

**Estado vacío (sin equipos):**
- Ícono con badge
- Título: "Todavía no tienes un equipo asignado"
- Botón principal: "Unirse a un equipo"
- Enlace secundario: "Contactar soporte"

**Estado con equipos:**
- Botón "Unirse a otro equipo" en la parte superior
- Lista de equipos como tarjetas clickeables
- Cada tarjeta muestra: ícono del deporte, nombre, categoría, tipo de deporte
- Colores diferenciados por deporte (azul fútbol, naranja básquet, verde tenis)

**Datos mock (3 equipos):**
- Leones FC (Sub 18, Fútbol Masculino)
- Titanes Básquet (Básquetbol Mixto)
- Club Tenis Elite (Tenis Individual)

---

### 4. Detalle del Equipo (`/dashboard/jugador/equipo/[id]`)

Información detallada de un equipo específico con su plantel.

**Header:**
- Escudo del equipo con fondo degradado
- Nombre del equipo y badge de categoría
- Cantidad de jugadores (tarjeta glass)

**Plantel:**
- Lista de jugadores con: ícono, nombre, número de camiseta (#)
- Estilo glassmorphism con blur

**Acciones:**
- Botón "Salir del equipo" (rojo con ícono de advertencia)
- Modal de confirmación: "¿Salir del equipo?"
  - Botón "Sí, salir del equipo" (rojo)
  - Botón "Cancelar"
- Modal de éxito tras confirmar, redirige al listado de equipos

---

### 5. Unirse a un Equipo (`/dashboard/jugador/equipo/unirse`)

Formulario para seleccionar categoría y equipo al cual unirse.

**Campos del formulario:**

1. **Categoría** (dropdown):
   - 8 categorías: Primera División, Reserva, Sub-20, Sub-17, Sub-15, Sub-13, Femenino A, Femenino B
   - Checkmark en la opción seleccionada
   - Al cambiar categoría se resetea la selección de equipo

2. **Nombre del Equipo** (búsqueda):
   - Input con ícono de búsqueda
   - Filtra equipos por categoría seleccionada y texto ingresado
   - Dropdown con resultados: nombre del equipo y categoría
   - Mensaje "No se encontraron equipos" si no hay resultados

**Botón Confirmar:**
- Deshabilitado hasta completar ambos campos
- Muestra estado de carga al enviar

**Modal de éxito** tras confirmar, redirige al listado de equipos

**Datos mock:** 26 equipos distribuidos en múltiples categorías

---

### 6. Calendario de Partidos (`/dashboard/jugador/partidos`)

Calendario interactivo con detalle de partidos por fecha.

**Calendario (panel izquierdo):**
- Navegación por mes (botones anterior/siguiente)
- Grilla de días (7 columnas)
- Indicadores: punto azul en días con partido, resaltado azul en el día actual
- Leyenda: "Partido programado"
- Resumen mensual (desktop): cantidad de partidos en el mes

**Detalle de Partidos (panel derecho):**
- Fecha seleccionada con badge de cantidad de partidos
- Por cada partido:
  - Competición (ícono y nombre)
  - Equipos con escudos (resaltado azul para equipo local)
  - Separador "VS"
  - Hora y ubicación
- Estado vacío: "Sin partidos" si no hay partidos ese día

**Vista Desktop:**
- Layout de dos columnas (5 + 7)
- Sección adicional: "Todos los partidos del mes"
- Lista con fecha, equipos, competición y hora (clickeable)

**Datos mock:** 11 partidos distribuidos en 3 meses

---

### 7. Perfil (`/dashboard/jugador/perfil`)

Configuración del perfil del jugador.

**Header del Perfil:**
- Avatar circular con ícono de persona
- Nombre y email del usuario (desde auth store)
- Badge de rol "JUGADOR"

**Tema (Apariencia):**
- Toggle para modo claro/oscuro
- Ícono que cambia según el tema activo
- Texto de estado (Activado/Desactivado)

**Menú de Configuración (5 opciones):**
1. Datos personales
2. Cambiar contraseña
3. Notificaciones
4. Ayuda y soporte
5. Términos y condiciones

Cada opción es una tarjeta clickeable con ícono, texto y chevron.

**Cerrar Sesión:**
- Botón rojo separado
- Limpia cookie de autenticación
- Cierra sesión del store
- Redirige a `/login`

---

## Navegación

### Desktop (Header Superior)
- Header sticky con glassmorphism
- Items de navegación centrados: Inicio, Beneficios, Mi Equipo, Perfil
- Ícono de notificaciones con indicador rojo
- Botón de retroceso cuando no está en dashboard principal

### Móvil (Barra Inferior)
- Barra fija en la parte inferior
- 4 ítems: Home, Beneficios, Mi Equipo, Perfil
- Estado activo: azul primario con ícono relleno
- Estado inactivo: gris con ícono outlined

### Retroceso
- Rutas principales → `/dashboard`
- Sub-rutas → ruta padre
- Default → `/dashboard`

---

## Componentes Compartidos

### NotificationModal
Modal reutilizable con 4 variantes de tipo:
- **success**: ícono verde (check_circle)
- **error**: ícono rojo (error)
- **info**: ícono azul (info)
- **warning**: ícono ámbar (warning)

Funcionalidades: cerrar con Escape, cerrar al click fuera, bloqueo de scroll del body.

---

## Estado Global

### Auth Store (Zustand)
- Usuario autenticado (nombre, email, rol)
- Login/logout
- Persistencia en localStorage como `auth-storage`
- Usuario mock: `jugador@test.com` / `test` → Carlos Jugador

### Theme Store (Zustand)
- Toggle entre modo `light` y `dark`
- Aplica clase al `document.documentElement`
- Persistencia en localStorage como `theme-storage`
- Tema por defecto: `dark`

---

## Sistema de Diseño

### Patrones
- **Glassmorphism**: `backdrop-blur` + fondos semi-transparentes
- **Tarjetas Glass**: `bg-white/70 dark:bg-slate-800/50 backdrop-blur-md`
- **Bordes redondeados**: `rounded-2xl` (24px)
- **Sombras sutiles**: `shadow-[0_4px_16px_rgba(0,0,0,0.04)]`
- **Íconos**: Material Symbols (`material-symbols-outlined`)

### Paleta de Colores
- **Primario**: azul (`primary`)
- **Texto**: `#111518` (oscuro), `#617989` (gris)
- **Acentos**: naranja, verde, púrpura, índigo

### Breakpoints
- Móvil: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Modo Oscuro
- Toggle en la sección de perfil
- Usa prefijo `dark:` de Tailwind
- Aplicado a todas las páginas

---

## Archivos Principales

```
src/
├── app/dashboard/
│   ├── page.tsx                          # Home/dashboard
│   ├── layout.tsx                        # Layout con navegación
│   └── jugador/
│       ├── beneficios/page.tsx           # Beneficios
│       ├── equipo/
│       │   ├── page.tsx                  # Listado de equipos
│       │   ├── [id]/page.tsx             # Detalle del equipo
│       │   └── unirse/page.tsx           # Unirse a un equipo
│       ├── partidos/page.tsx             # Calendario de partidos
│       └── perfil/page.tsx               # Perfil y configuración
├── components/
│   ├── ui/NotificationModal.tsx          # Modal reutilizable
│   └── ThemeProvider.tsx                 # Proveedor de tema
├── stores/
│   ├── authStore.ts                      # Estado de autenticación
│   └── themeStore.ts                     # Estado del tema
└── types/
    └── index.ts                          # Definiciones de tipos
```
