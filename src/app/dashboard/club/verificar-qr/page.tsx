import { redirect } from 'next/navigation'

export default function VerificarQRRedirect() {
  redirect('/dashboard/club/jugadores?tab=verificar')
}
