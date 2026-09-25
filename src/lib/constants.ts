// Número de WhatsApp de asistencia para el registro público de jugadores.
// NO confundir con el WhatsApp de seguro deportivo (542996130664) usado en otras
// pantallas del dashboard: son contactos distintos.
export const ASISTENCIA_WHATSAPP = '542994119493'

export function buildAsistenciaWhatsappUrl(mensaje?: string): string {
  const texto = mensaje ?? 'Hola, necesito ayuda para completar mi registro en el Complejo Deportivo Plaza Huincul.'
  return `https://wa.me/${ASISTENCIA_WHATSAPP}?text=${encodeURIComponent(texto)}`
}
