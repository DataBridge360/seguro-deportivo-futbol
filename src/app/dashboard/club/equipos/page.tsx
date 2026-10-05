import { redirect } from 'next/navigation'

// The team list now lives as a tab of the combined tournaments page
export default function ClubEquiposPage() {
  redirect('/dashboard/club/torneos?tab=equipos')
}
