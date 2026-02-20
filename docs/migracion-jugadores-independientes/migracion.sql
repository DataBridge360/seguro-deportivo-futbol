-- ============================================================
-- MIGRACION: Recrear Jugadores Independientes
-- Seguro Deportivo - Sistema Resguarda
--
-- ESTADO ACTUAL DE LA DB (post-migracion parcial anterior):
--   - tabla jugadores NO EXISTE (fue eliminada)
--   - perfiles tiene: id, auth_id, dni, password_hash,
--     debe_cambiar_password, ultimo_acceso, nombre, rol,
--     telefono, email, avatar_url, club_id, activo,
--     apellido, fecha_nacimiento, direccion, foto_url,
--     created_at, updated_at
--   - jugador_club -> renombrada a perfil_club (col perfil_id)
--   - documentos_jugador -> renombrada a documentos_perfil (col perfil_id)
--   - jugador_equipo_torneo -> renombrada a perfil_equipo_torneo (col perfil_id)
--   - polizas: jugador_id -> perfil_id, jugador_club_id -> perfil_club_id
--   - cupones: jugador_id -> perfil_id
--   - notificacion_destinatario: perfil_id (sin cambios)
--
-- OBJETIVO: Recrear tabla jugadores independiente con
-- autenticacion propia (dni + password_hash).
-- perfiles queda solo para staff.
-- ============================================================

BEGIN;

-- ============================================================
-- PASO 1: Crear tabla jugadores con auth integrado
-- ============================================================

CREATE TABLE jugadores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Datos personales
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255),
    fecha_nacimiento DATE,
    direccion VARCHAR(255),
    foto_url TEXT,
    telefono VARCHAR(50),
    email VARCHAR(255),
    -- Autenticacion
    dni VARCHAR(20) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    debe_cambiar_password BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMPTZ,
    -- Estado
    activo BOOLEAN DEFAULT TRUE,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE jugadores IS 'Jugadores con autenticacion independiente (DNI + password). No depende de perfiles.';

-- ============================================================
-- PASO 2: Migrar datos de perfiles (rol=jugador) a jugadores
-- ============================================================

INSERT INTO jugadores (
    id, nombre, apellido, fecha_nacimiento, direccion, foto_url,
    telefono, email, dni, password_hash, debe_cambiar_password,
    ultimo_acceso, activo, created_at, updated_at
)
SELECT
    id, nombre, apellido, fecha_nacimiento, direccion, foto_url,
    telefono, email, dni, password_hash, debe_cambiar_password,
    ultimo_acceso, activo, created_at, updated_at
FROM perfiles
WHERE rol = 'jugador';

-- Verificar que se migraron
DO $$
DECLARE
    v_perfiles INTEGER;
    v_jugadores INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_perfiles FROM perfiles WHERE rol = 'jugador';
    SELECT COUNT(*) INTO v_jugadores FROM jugadores;
    RAISE NOTICE 'Perfiles jugador: % | Jugadores creados: %', v_perfiles, v_jugadores;
    IF v_perfiles != v_jugadores THEN
        RAISE EXCEPTION 'ERROR: No coinciden las cantidades (% vs %)', v_perfiles, v_jugadores;
    END IF;
END $$;

-- ============================================================
-- PASO 3: Revertir tablas dependientes a jugador_*
-- ============================================================
-- Los datos ya apuntan al ID correcto (es el mismo ID que
-- tenian los perfiles con rol=jugador, que ahora son jugadores).

-- 3.1 perfil_club -> jugador_club
ALTER TABLE perfil_club RENAME TO jugador_club;
ALTER TABLE jugador_club RENAME COLUMN perfil_id TO jugador_id;
ALTER TABLE jugador_club DROP CONSTRAINT IF EXISTS perfil_club_perfil_id_fkey;
ALTER TABLE jugador_club ADD CONSTRAINT jugador_club_jugador_id_fkey
    FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE;

-- 3.2 polizas: perfil_id -> jugador_id, perfil_club_id -> jugador_club_id
ALTER TABLE polizas RENAME COLUMN perfil_id TO jugador_id;
ALTER TABLE polizas RENAME COLUMN perfil_club_id TO jugador_club_id;
ALTER TABLE polizas DROP CONSTRAINT IF EXISTS polizas_perfil_id_fkey;
ALTER TABLE polizas DROP CONSTRAINT IF EXISTS polizas_perfil_club_id_fkey;
ALTER TABLE polizas ADD CONSTRAINT polizas_jugador_id_fkey
    FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE;
ALTER TABLE polizas ADD CONSTRAINT polizas_jugador_club_id_fkey
    FOREIGN KEY (jugador_club_id) REFERENCES jugador_club(id) ON DELETE CASCADE;

-- 3.3 documentos_perfil -> documentos_jugador
ALTER TABLE documentos_perfil RENAME TO documentos_jugador;
ALTER TABLE documentos_jugador RENAME COLUMN perfil_id TO jugador_id;
ALTER TABLE documentos_jugador DROP CONSTRAINT IF EXISTS documentos_perfil_perfil_id_fkey;
ALTER TABLE documentos_jugador ADD CONSTRAINT documentos_jugador_jugador_id_fkey
    FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE;

-- 3.4 perfil_equipo_torneo -> jugador_equipo_torneo
ALTER TABLE perfil_equipo_torneo RENAME TO jugador_equipo_torneo;
ALTER TABLE jugador_equipo_torneo RENAME COLUMN perfil_id TO jugador_id;
ALTER TABLE jugador_equipo_torneo DROP CONSTRAINT IF EXISTS perfil_equipo_torneo_perfil_id_fkey;
ALTER TABLE jugador_equipo_torneo ADD CONSTRAINT jugador_equipo_torneo_jugador_id_fkey
    FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE;

-- 3.5 cupones: perfil_id -> jugador_id
ALTER TABLE cupones RENAME COLUMN perfil_id TO jugador_id;
ALTER TABLE cupones DROP CONSTRAINT IF EXISTS cupones_perfil_id_fkey;
ALTER TABLE cupones ADD CONSTRAINT cupones_jugador_id_fkey
    FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE;

-- 3.6 notificacion_destinatario: agregar jugador_id
-- Esta tabla ya tiene perfil_id para staff. Agregamos jugador_id para jugadores.
ALTER TABLE notificacion_destinatario
    ADD COLUMN IF NOT EXISTS jugador_id UUID;

-- Migrar notificaciones que apuntan a perfiles con rol=jugador
UPDATE notificacion_destinatario nd
SET jugador_id = p.id, perfil_id = NULL
FROM perfiles p
WHERE nd.perfil_id = p.id
  AND p.rol = 'jugador';

ALTER TABLE notificacion_destinatario
    ALTER COLUMN perfil_id DROP NOT NULL;

ALTER TABLE notificacion_destinatario
    ADD CONSTRAINT notificacion_destinatario_jugador_id_fkey
    FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE;

-- ============================================================
-- PASO 4: Limpiar perfiles (eliminar jugadores, dejar solo staff)
-- ============================================================

DELETE FROM perfiles WHERE rol = 'jugador';

-- Eliminar constraint que ya no aplica
ALTER TABLE perfiles DROP CONSTRAINT IF EXISTS chk_auth_dual;

-- Staff siempre debe tener auth_id
-- (solo si todos los staff actuales lo tienen)
DO $$
DECLARE
    v_sin_auth INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_sin_auth FROM perfiles WHERE auth_id IS NULL;
    IF v_sin_auth = 0 THEN
        ALTER TABLE perfiles ADD CONSTRAINT chk_staff_auth CHECK (auth_id IS NOT NULL);
        RAISE NOTICE 'OK: Constraint chk_staff_auth agregado';
    ELSE
        RAISE NOTICE 'AVISO: % perfiles sin auth_id, no se agrego constraint', v_sin_auth;
    END IF;
END $$;

-- ============================================================
-- PASO 5: Recrear vista jugadores_con_seguro
-- ============================================================

DROP VIEW IF EXISTS jugadores_con_seguro CASCADE;
DROP VIEW IF EXISTS perfiles_con_seguro CASCADE;

CREATE VIEW jugadores_con_seguro AS
SELECT
    j.id AS jugador_id,
    j.nombre || ' ' || COALESCE(j.apellido, '') AS nombre_completo,
    j.dni,
    j.fecha_nacimiento,
    calcular_edad(j.fecha_nacimiento) AS edad,
    j.foto_url,
    j.telefono,
    j.email,
    j.activo,
    jc.id AS jugador_club_id,
    c.id AS club_id,
    c.nombre AS club_nombre,
    c.logo_url AS club_logo,
    jc.activo AS activo_en_club,
    jc.productor_id,
    pol.id AS poliza_id,
    pol.fecha_inicio,
    pol.fecha_fin,
    pol.tipo_periodo,
    pol.numero_poliza,
    pol.compania,
    pol.monto,
    CASE
        WHEN pol.id IS NULL THEN 'sin_seguro'
        WHEN pol.fecha_fin >= CURRENT_DATE THEN 'vigente'
        WHEN pol.fecha_fin < CURRENT_DATE THEN 'vencido'
    END AS estado_seguro,
    CASE
        WHEN pol.fecha_fin >= CURRENT_DATE THEN (pol.fecha_fin - CURRENT_DATE)
        ELSE NULL
    END AS dias_restantes
FROM jugadores j
LEFT JOIN jugador_club jc ON jc.jugador_id = j.id AND jc.activo = true
LEFT JOIN clubes c ON c.id = jc.club_id
LEFT JOIN LATERAL (
    SELECT *
    FROM polizas
    WHERE polizas.jugador_id = j.id
    ORDER BY fecha_fin DESC
    LIMIT 1
) pol ON true;

-- ============================================================
-- PASO 6: Actualizar funcion verificar_cupon
-- ============================================================

CREATE OR REPLACE FUNCTION verificar_cupon(p_codigo VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_cupon cupones%ROWTYPE;
    v_jugador jugadores%ROWTYPE;
BEGIN
    SELECT * INTO v_cupon FROM cupones WHERE codigo = p_codigo;

    IF v_cupon.id IS NULL THEN
        RETURN jsonb_build_object('valido', false, 'error', 'Cupon no encontrado');
    END IF;

    IF v_cupon.usado THEN
        RETURN jsonb_build_object('valido', false, 'error', 'Cupon ya utilizado', 'usado_at', v_cupon.usado_at);
    END IF;

    IF v_cupon.fecha_vencimiento IS NOT NULL AND v_cupon.fecha_vencimiento < CURRENT_DATE THEN
        RETURN jsonb_build_object('valido', false, 'error', 'Cupon vencido');
    END IF;

    SELECT * INTO v_jugador FROM jugadores WHERE id = v_cupon.jugador_id;

    RETURN jsonb_build_object(
        'valido', true,
        'cupon_id', v_cupon.id,
        'titulo', v_cupon.titulo,
        'descripcion', v_cupon.descripcion,
        'tipo_descuento', v_cupon.tipo_descuento,
        'valor_descuento', v_cupon.valor_descuento,
        'jugador_nombre', v_jugador.nombre || ' ' || COALESCE(v_jugador.apellido, ''),
        'fecha_vencimiento', v_cupon.fecha_vencimiento
    );
END;
$$;

-- ============================================================
-- PASO 7: Indices
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_jugadores_dni ON jugadores(dni);
CREATE INDEX IF NOT EXISTS idx_jugadores_activo ON jugadores(activo);
CREATE INDEX IF NOT EXISTS idx_jugador_club_jugador_id ON jugador_club(jugador_id);
CREATE INDEX IF NOT EXISTS idx_jugador_club_club_id ON jugador_club(club_id);
CREATE INDEX IF NOT EXISTS idx_polizas_jugador_id ON polizas(jugador_id);
CREATE INDEX IF NOT EXISTS idx_documentos_jugador_jugador_id ON documentos_jugador(jugador_id);
CREATE INDEX IF NOT EXISTS idx_jugador_equipo_torneo_jugador_id ON jugador_equipo_torneo(jugador_id);
CREATE INDEX IF NOT EXISTS idx_cupones_jugador_id ON cupones(jugador_id);

-- ============================================================
-- PASO 8: Trigger updated_at para jugadores
-- ============================================================

CREATE TRIGGER set_jugadores_updated_at
    BEFORE UPDATE ON jugadores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PASO 9: Deprecar rol 'jugador' en enum
-- ============================================================

COMMENT ON TYPE rol_enum IS 'Roles para staff: admin, productor, club, cantina. El valor jugador esta DEPRECADO - los jugadores se autentican via la tabla jugadores.';

-- ============================================================
-- VERIFICACION POST-MIGRACION
-- ============================================================

DO $$
DECLARE
    v_jugadores INTEGER;
    v_con_dni INTEGER;
    v_con_password INTEGER;
    v_perfiles_jugador INTEGER;
    v_jugador_club INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_jugadores FROM jugadores;
    SELECT COUNT(*) INTO v_con_dni FROM jugadores WHERE dni IS NOT NULL;
    SELECT COUNT(*) INTO v_con_password FROM jugadores WHERE password_hash IS NOT NULL;
    SELECT COUNT(*) INTO v_perfiles_jugador FROM perfiles WHERE rol = 'jugador';
    SELECT COUNT(*) INTO v_jugador_club FROM jugador_club;

    RAISE NOTICE '========= VERIFICACION =========';
    RAISE NOTICE 'Total jugadores: %', v_jugadores;
    RAISE NOTICE 'Con DNI: %', v_con_dni;
    RAISE NOTICE 'Con password: %', v_con_password;
    RAISE NOTICE 'Perfiles jugador (debe ser 0): %', v_perfiles_jugador;
    RAISE NOTICE 'Relaciones jugador_club: %', v_jugador_club;

    IF v_perfiles_jugador > 0 THEN
        RAISE EXCEPTION 'ERROR: Aun existen perfiles con rol jugador';
    END IF;

    RAISE NOTICE '========= MIGRACION EXITOSA =========';
END $$;

-- Verificar vista
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM jugadores_con_seguro;
    RAISE NOTICE 'Vista jugadores_con_seguro: % registros', v_count;
END $$;

COMMIT;
