// Password validation rules shared by the registro, completar-datos and
// cambiar-contrasena screens for immediate client-side feedback. The backend
// always re-validates; keep this in sync with
// src/modules/auth/dto/password-rules.ts.

// Allowed characters: Unicode letters, combining marks, ASCII digits and the
// ASCII symbols below. Must match the backend regex exactly.
export const PASSWORD_ALLOWED_CHARS_REGEX =
  /^[\p{L}\p{M}0-9!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]+$/u

const WHITESPACE_REGEX = /\s/

/**
 * Returns, in a stable order, every unmet password rule for the given value.
 * An empty array means the password satisfies all rules.
 */
export function getPasswordIssues(password: string): string[] {
  const issues: string[] = []

  if (password.length < 8) {
    issues.push('Debe tener al menos 8 caracteres')
  }
  if (!/\p{L}/u.test(password)) {
    issues.push('Debe contener al menos una letra')
  }
  if (!/\d/.test(password)) {
    issues.push('Debe contener al menos un número')
  }
  if (WHITESPACE_REGEX.test(password)) {
    issues.push('No puede tener espacios')
  } else if (password.length > 0 && !PASSWORD_ALLOWED_CHARS_REGEX.test(password)) {
    issues.push('Solo se permiten letras, números y símbolos como ! @ # $ % . _ -')
  }
  // bcrypt limit; rare enough that the hint does not mention it.
  if (password.length > 72) {
    issues.push('La contraseña es demasiado larga')
  }

  return issues
}
