// Tipos locales para la vista de torneos del jugador.
//
// El backend (commit 056d3ba) agregó `es_mi_equipo` a la respuesta de
// `GET /jugadores/torneos/:torneoId/equipos` y, para equipos ajenos, recorta
// los datos sensibles de jugadores y delegados. `src/lib/api.ts` todavía no
// declara estos campos (no lo editamos acá), así que extendemos los tipos
// localmente para las pantallas del jugador.
import type { EquipoTorneo, EquipoTorneoJugador, EquipoTorneoDelegado } from '@/lib/api'

/**
 * Delegado de un equipo tal como lo puede ver un jugador.
 * En equipos ajenos el backend NO envía `jugador_id`, por lo tanto no puede
 * usarse como identificador único (ni como `key` de React) para delegados
 * en general.
 */
export type EquipoTorneoDelegadoVisible = Omit<EquipoTorneoDelegado, 'jugador_id'> & {
  jugador_id?: string
}

/**
 * Equipo de torneo con el campo de visibilidad agregado por el backend y
 * los delegados con `jugador_id` opcional (recortado en equipos ajenos).
 */
export type EquipoTorneoConVisibilidad = Omit<EquipoTorneo, 'delegados'> & {
  es_mi_equipo?: boolean
  delegados: EquipoTorneoDelegadoVisible[]
}

export type EquipoTorneoJugadorVisible = EquipoTorneoJugador
