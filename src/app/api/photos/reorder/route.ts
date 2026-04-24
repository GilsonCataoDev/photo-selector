import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const { sessionId, photoIds } = await request.json()

    if (!sessionId || !Array.isArray(photoIds)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Atualizar sort_order de cada foto
    const updates = photoIds.map((id: string, index: number) =>
      supabaseAdmin.from('photos').update({ sort_order: index }).eq('id', id).eq('session_id', sessionId)
    )

    await Promise.all(updates)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
