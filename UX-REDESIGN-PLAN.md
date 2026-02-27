# Plan de Rediseño UX/UI — Seguro Deportivo

## Resumen ejecutivo

El sistema es funcionalmente completo pero sufre de **ruido visual excesivo**, **flujos con pasos innecesarios**, y **duplicación masiva de código** entre los roles club/productor. Las páginas de torneo concentran 23 variables de estado y 7 modals, los formularios de equipos tienen un modal de detalle que no aporta valor, y las categorías no validan duplicados. El rediseño busca simplificar cada interacción al mínimo de clics necesario, eliminar decoración que no comunica información, y unificar componentes compartidos.

## Principios de diseño

1. **Una acción principal por pantalla** — Cada vista tiene un objetivo claro. Las acciones secundarias van en menús o son contextuales.
2. **Cero clics innecesarios** — Si un modal solo repite información visible, se elimina. Si un flujo puede resolverse inline, no se abre página nueva.
3. **Feedback inmediato** — Toda acción muestra su estado: loading en el botón, éxito inline, error junto al campo.
4. **Menos es más** — Sin gradientes decorativos, iconos gigantes ni badges redundantes. El contenido ES la interfaz.
5. **Un componente, un lugar** — Club y productor comparten la misma UI. Diferencias solo en permisos y rutas.

---

## Sección 1: Crear Equipos

### Estado actual

**Flujo:** El usuario va a `/equipos`, ve una grilla de cards. Para crear un equipo hace clic en "Nuevo Equipo" y navega a `/equipos/nuevo` (página separada). El formulario tiene nombre (requerido), logo (opcional con dropzone) y checkboxes de categorías. Al guardar, hay un redirect automático de 2 segundos.

**Problemas encontrados:**

- **Modal de detalle inútil**: Al hacer clic en una card se abre un modal que muestra la misma información de la card. Luego tiene un botón "Editar" que abre OTRO modal. Son 2 clics para llegar a editar.
- **Gestión de categorías incrustada**: La página de equipos tiene un acordeón de categorías con CRUD completo. Mezcla dos responsabilidades en una vista.
- **Duplicación total club/productor**: Los 4 archivos (listado + nuevo × 2 roles) son 99% idénticos. Solo cambian las rutas.
- **Auto-redirect de 2 segundos**: Después de crear un equipo, el usuario pierde control — no puede quedarse en la página ni navegar manualmente.
- **Dropzone confusa**: La zona punteada grande parece un campo requerido. No queda claro que el logo es opcional.
- **Validación inconsistente**: El formulario de creación valida nombre + longitud máxima, pero el modal de edición solo valida que no esté vacío.

### Propuesta de mejora UX

1. **Eliminar el modal de detalle** — Clic en card = abrir modal de edición directamente. Un clic menos.
2. **Separar categorías** — Las categorías se gestionan desde su propia página (`/categorias`), no desde equipos.
3. **Componente compartido** — Un solo `EquiposPage` y `NuevoEquipoPage` que reciben el role como prop.
4. **Reemplazar redirect por navegación manual** — Después de crear, mostrar notificación con botón "Volver a equipos".
5. **Logo como botón simple** — Reemplazar dropzone grande por un botón "Subir logo" compacto con preview circular.
6. **Validación unificada** — Mismas reglas en creación y edición (nombre requerido, máx 200 chars).

### Cambios de UI

- Cards: remover hover elevación excesiva, simplificar a borde sutil
- Menú de 3 puntos: hacerlo más visible (no solo on-hover)
- Formulario nuevo: reducir espaciado (`space-y-5` → `space-y-4`), marcar campos opcionales explícitamente
- Dropzone: reemplazar por input de archivo con preview inline (48×48px circular)
- Checkboxes de categorías: pills seleccionables en vez de checkboxes clásicos

### Prioridad: Alta

---

## Sección 2: Crear Categorías

### Estado actual

**Flujo:** El usuario abre un modal desde la página de equipos (actualmente incrustado). Escribe un nombre, hace clic en "Crear". Para editar hace clic en un ícono de lápiz en la card de categoría.

**Problemas encontrados:**

- **Sin validación de duplicados**: Se pueden crear dos categorías con el mismo nombre.
- **Placeholder confuso**: Dice "Ej: 30, 40, 50" pero acepta cualquier texto. No queda claro qué tipo de valor se espera.
- **Texto helper críptico**: "Se mostrará como +{nombre}" — el "+" no se explica en ningún lado.
- **Modal de eliminación sin loading**: El botón "Eliminar" no tiene estado de carga. Se puede hacer clic múltiples veces. El modal se puede cerrar durante la operación.
- **Íconos de acción invisibles**: Los botones de editar/eliminar en cada card son `text-slate-400` — casi invisibles hasta hover.

### Propuesta de mejora UX

1. **Página propia** — Mover categorías a `/categorias` como sección independiente en el sidebar.
2. **Edición inline** — En vez de modal, clic en categoría → input inline editable → Enter para guardar.
3. **Validación de duplicados** — Chequear nombre contra lista existente antes de guardar.
4. **Loading en eliminación** — Agregar estado `deletingId` para deshabilitar el botón y mostrar spinner.
5. **Placeholder claro** — Cambiar a "Ej: Sub-20, Primera, Femenino" para indicar que es texto libre.
6. **Eliminar texto helper del "+"** — No aporta claridad, genera confusión.

### Cambios de UI

- Cards de categoría: hacer acciones visibles siempre (no solo on-hover), alinear a la derecha
- Modal de creación: agregar contador de caracteres cerca del límite (50 chars)
- Modal de eliminación: agregar spinner al botón, deshabilitar backdrop-click durante operación
- Tamaño de modal: mantener `max-w-sm`, es apropiado para un solo campo

### Prioridad: Media

---

## Sección 3: Visualización de Equipos en Torneo

### Estado actual

**Flujo:** En la página de detalle del torneo (`/torneos/[id]`), los equipos inscritos se muestran como acordeones expandibles. Al expandir un equipo, se cargan sus jugadores con lazy-loading. Cada jugador tiene botón de eliminar individual, y hay un botón "Agregar jugador" al final.

**Problemas encontrados:**

- **Lazy-loading obliga a expandir**: No se puede ver la composición de un equipo sin hacer clic. El conteo de jugadores se muestra pero no la información relevante.
- **Gestión de jugadores dispersa**: Eliminar jugador = botón en cada fila + modal de confirmación. Agregar = botón al final + modal de selección con búsqueda. Demasiados sub-flujos.
- **Lista scrolleable corta**: `max-h-64` (256px) es poco para equipos de 15+ jugadores. El scroll interno compite con el scroll de la página.
- **Sin indicador de equipo incompleto**: No se muestra si un equipo tiene menos jugadores que el máximo permitido.

### Propuesta de mejora UX

1. **Mostrar jugadores resumidos sin expandir** — Preview de los primeros 3-4 jugadores (solo nombre) visible en la card, con "y X más".
2. **Expandir = gestionar** — Al expandir, la lista muestra jugadores con acciones inline (X para quitar), sin modal de confirmación para cada uno.
3. **Agregar jugadores con búsqueda integrada** — Input de búsqueda directamente en la card expandida, resultados debajo. Sin modal separado.
4. **Indicador de capacidad** — Barra o texto "5/11 jugadores" que muestre visualmente el completado.

### Cambios de UI

- Card de equipo: reducir el ícono de 14×14 a 10×10, agregar preview de jugadores
- Lista expandida: remover `max-h-64`, usar altura dinámica con límite razonable
- Botones de acción por jugador: solo ícono X en hover, no botón completo
- Agregar jugador: inline search input en vez de modal

### Prioridad: Alta

---

## Sección 4: Visualización del Torneo

### Estado actual

**Flujo:** La página de detalle muestra un grid de 3 columnas: 2/3 para info + equipos, 1/3 para panel lateral con toggle de inscripciones. El header tiene 4 botones de acción. La card de info tiene un gradiente decorativo grande con ícono de trofeo.

**Problemas encontrados:**

- **23 variables de estado**: La página gestiona torneo, inscripciones, equipos, categorías, 7 modals, formularios, búsqueda, PDF, notificaciones. Es inmantenible.
- **7 modals en una página**: Inscripción, desinscripción, eliminar torneo, agregar jugadores, quitar jugador, editar torneo, descargar PDF. Cada uno con su propio estado.
- **Gradiente decorativo**: 128px de gradiente con ícono de trofeo gigante (`text-6xl`). Pura decoración que empuja el contenido útil hacia abajo.
- **4 botones en el header**: Editar, Eliminar, PDF, Inscribir. Sin jerarquía clara — todos parecen iguales.
- **Panel lateral subutilizado**: El toggle de inscripciones y el botón de inscribir ocupan 1/3 de la pantalla con muy poco contenido.
- **Duplicación club/productor**: La página de detalle es idéntica (1576 líneas × 2).

### Propuesta de mejora UX

1. **Eliminar gradiente decorativo** — Reemplazar con card limpia: título, descripción, datos en grid compacto.
2. **Jerarquía de acciones** — Botón primario: "Inscribir Equipo". Botón secundario: "PDF". Menú desplegable (⋯): Editar, Eliminar.
3. **Absorber panel lateral** — El toggle de inscripciones puede ser un switch en el header. El botón de inscribir ya está en los botones de acción. Eliminar la 3ra columna.
4. **Reducir modals** — Inscripción: inline en la página. Edición: página separada o drawer. PDF: inline (ver Sección 5). Solo mantener modals para confirmaciones destructivas.
5. **Componente compartido** — Un solo `TorneoDetailPage` para club y productor.

### Cambios de UI

- Info card: sin gradiente, sin ícono decorativo. Datos en 2×2 grid compacto con labels
- Layout: single column en mobile, 2 columnas en desktop (main + equipos side by side O stacked)
- Header: título + badge de estado a la izquierda, acción primaria + menú ⋯ a la derecha
- Status badges: simplificar colores (verde=activo, gris=finalizado, rojo=cancelado)
- Descripción: colapsable si es larga (>2 líneas)

### Prioridad: Alta

---

## Sección 5: Selección de Equipos para PDF

### Estado actual

**Flujo:**
1. Usuario hace clic en "Descargar PDF" (botón en el header)
2. El sistema pre-carga jugadores de TODOS los equipos en background (invisible para el usuario)
3. Se abre modal con checkboxes de equipos
4. Usuario selecciona equipos
5. Clic en "Descargar" genera PDF con html2pdf
6. Notificación de éxito

**Problemas encontrados:**

- **Pre-carga invisible**: Al hacer clic en PDF, el sistema carga jugadores de todos los equipos sin indicar progreso. Si hay muchos equipos, el modal aparece vacío o con delay.
- **Selección sin contexto**: Los checkboxes muestran nombre + categoría + conteo de jugadores, pero no si un equipo tiene datos completos para el PDF.
- **Sin preview**: El usuario no puede ver cómo se verá el PDF antes de descargarlo.
- **Select All confuso**: El checkbox de "Seleccionar todos" cambia texto pero visualmente se ve igual.
- **Modal para algo que podría ser inline**: La selección de equipos podría estar directamente en la página.

### Propuesta de mejora UX

1. **Selección inline** — Agregar checkboxes a las cards de equipo directamente en la página. Cuando hay al menos 1 seleccionado, aparece un botón flotante "Descargar PDF (3 equipos)".
2. **Loading explícito** — Cuando se inicia la generación, mostrar un progress bar o al menos un estado claro.
3. **Pre-carga al expandir** — Cargar jugadores cuando el usuario expande un equipo (ya se hace). Para el PDF, usar los datos ya cargados + cargar los faltantes con indicador.
4. **Eliminar modal** — Todo el flujo sucede inline en la página del torneo.

### Cambios de UI

- Checkbox en cada card de equipo (aparece en modo "selección PDF")
- Botón flotante o sticky bar: "Descargar PDF de X equipos" con loading
- Eliminar modal de selección de PDF completamente
- Feedback: notificación al completar descarga

### Prioridad: Media

---

## Orden de implementación recomendado

1. **Componentes compartidos club/productor** — Eliminar la duplicación primero. Esto reduce a la mitad el trabajo de los siguientes pasos. Afecta: equipos (listado + nuevo), torneos (listado + nuevo + detalle), categorías.

2. **Torneo detail (Sección 4)** — Es la página más compleja y la más usada. Simplificar layout, eliminar gradiente, reorganizar acciones, reducir modals.

3. **Equipos en torneo (Sección 3)** — Depende de que el detalle del torneo esté limpio. Mejorar lazy-loading, preview de jugadores, gestión inline.

4. **Crear equipos (Sección 1)** — Eliminar modal de detalle, simplificar formulario de creación, mejorar upload de logo.

5. **PDF (Sección 5)** — Mover selección inline una vez que las cards de equipo estén rediseñadas.

6. **Categorías (Sección 2)** — El cambio más simple. Puede hacerse en cualquier momento.

## Componentes compartidos a crear/refactorizar

| Componente | Uso | Reemplaza |
|---|---|---|
| `EquiposListPage` | Listado de equipos (club + productor) | 2 páginas idénticas |
| `NuevoEquipoForm` | Formulario de creación de equipo | 2 páginas idénticas |
| `TorneosListPage` | Listado de torneos (club + productor) | 2 páginas idénticas |
| `NuevoTorneoForm` | Formulario de creación de torneo | 2 páginas idénticas |
| `TorneoDetailPage` | Detalle de torneo con equipos y PDF | 2 páginas de 1576 líneas cada una |
| `ConfirmModal` | Modal de confirmación reutilizable (eliminar, desinscribir, etc.) | 5+ modals ad-hoc repetidos |
| `InlineSearch` | Input de búsqueda con resultados dropdown | Modals de agregar jugador |
| `TeamCard` | Card de equipo expandible con preview de jugadores | Cards ad-hoc en torneo y listado |
| `ActionMenu` | Menú de acciones (⋯) con dropdown | Botones sueltos en headers |
