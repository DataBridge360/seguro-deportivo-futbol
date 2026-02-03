# Convenciones del Proyecto - Seguro Deportivo

## UI/UX

### Notificaciones y Alertas
- **NUNCA usar `alert()`, `confirm()` o `prompt()` nativos del navegador**
- Siempre usar modals de notificación personalizados para feedback al usuario
- Mantener consistencia con el diseño glass/blur del proyecto

### Estilos
- Usar Tailwind CSS para todos los estilos
- Seguir el sistema de diseño con efectos glass (`backdrop-blur`, `bg-white/50`, etc.)
- Usar Material Symbols para iconos (`material-symbols-outlined`)

## Estructura

### Rutas del Dashboard
- `/dashboard` - Página principal
- `/dashboard/jugador/*` - Secciones del jugador
- `/dashboard/admin/*` - Panel de administración
