import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { count: totalSessions },
    { count: completedThisMonth },
    { count: photosDelivered },
    { data: extraRows },
  ] = await Promise.all([
    supabaseAdmin.from('sessions').select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('updated_at', firstOfMonth),
    supabaseAdmin.from('selections').select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('sessions')
      .select('photo_limit, extra_photo_price, selections(count)')
      .eq('status', 'completed')
      .not('extra_photo_price', 'is', null),
  ])

  // Calcular receita de extras
  let extrasRevenue = 0
  if (extraRows) {
    for (const s of extraRows) {
      const total = (s.selections as { count: number }[])[0]?.count || 0
      const extras = Math.max(0, total - s.photo_limit)
      extrasRevenue += extras * (s.extra_photo_price || 0)
    }
  }

  return NextResponse.json({
    total_sessions: totalSessions || 0,
    completed_this_month: completedThisMonth || 0,
    photos_delivered: photosDelivered || 0,
    extras_revenue: extrasRevenue,
  })
}
