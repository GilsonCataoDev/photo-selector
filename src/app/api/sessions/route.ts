import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('sessions')
    .select(`
      *,
      photos(count),
      selections(count)
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const { client_name, shoot_date, photo_limit, extra_photo_price } = await request.json()

    if (!client_name?.trim()) {
      return NextResponse.json({ error: 'Nome do cliente obrigatório' }, { status: 400 })
    }
    if (!shoot_date) {
      return NextResponse.json({ error: 'Data do ensaio obrigatória' }, { status: 400 })
    }
    if (!photo_limit || photo_limit < 1) {
      return NextResponse.json({ error: 'Limite de fotos inválido' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('sessions')
      .insert({
        client_name: client_name.trim(),
        shoot_date,
        photo_limit,
        extra_photo_price: extra_photo_price ?? null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
