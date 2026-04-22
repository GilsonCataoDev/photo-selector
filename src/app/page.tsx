import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth'

export default async function Home() {
  const isAdmin = await getAdminSession()
  if (isAdmin) {
    redirect('/dashboard')
  }
  redirect('/login')
}
