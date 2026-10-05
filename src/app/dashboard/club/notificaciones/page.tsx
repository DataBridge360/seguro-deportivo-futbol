import { redirect } from 'next/navigation'

export default function NotificacionesRedirect() {
  redirect('/dashboard/club/comunicacion?tab=notificaciones')
}
