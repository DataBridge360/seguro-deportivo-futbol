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

## Comandos

### "Guarda los cambios"
Cuando el usuario diga "guarda los cambios", ejecutar en orden:
1. `npm run build` - Compilar el proyecto
1.1. Si hay errores, corregirlos
2. `npm run lint` - Verificar código
2.1. Si hay errores, corregirlos
3. `git add <archivos modificados>` - Agregar archivos
4. `git commit -m "mensaje descriptivo"` - Commit SIN mencionar a Claude/Co-Authored-By
5. `git push` - Subir cambios al repositorio
