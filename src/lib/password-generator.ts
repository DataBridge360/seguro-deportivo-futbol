/**
 * Genera la contraseña inicial del jugador
 * Formato: Apellido (primera mayúscula) + últimos 3 dígitos del DNI
 *
 * @param apellido - Apellido del jugador
 * @param dni - DNI del jugador
 * @returns Contraseña generada
 *
 * @example
 * generatePassword("ABARZUA", "28387875") // → "Abarzua875"
 * generatePassword("gonzález", "12345678") // → "González678"
 */
export function generatePassword(apellido: string, dni: string): string {
  if (!apellido || !dni) {
    return ''
  }

  const apellidoFormatted =
    apellido.charAt(0).toUpperCase() + apellido.slice(1).toLowerCase()
  const lastThree = dni.slice(-3)

  return `${apellidoFormatted}${lastThree}`
}
