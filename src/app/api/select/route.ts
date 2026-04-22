import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Rota pública — usada pelo cliente para finalizar seleção
export async function POST(request: NextRequest) {
  try {
    const { token, photo_ids } = await request.json()

    if (!token || !Array.isArray(photo_ids) || photo_ids.length === 0) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Buscar sessão pelo token
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('token', token)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
    }

    if (session.status === 'completed') {
      return NextResponse.json({ error: 'Esta seleção já foi finalizada' }, { status: 409 })
    }

    // Validar quantidade mínima (deve selecionar pelo menos o limite do pacote)
    if (photo_ids.length < session.photo_limit) {
      return NextResponse.json(
        { error: `Selecione pelo menos ${session.photo_limit} fotos` },
        { status: 400 }
      )
    }

    // Se não há extras permitidas, validar quantidade exata
    if (!session.extra_photo_price && photo_ids.length !== session.photo_limit) {
      return NextResponse.json(
        { error: `Selecione exatamente ${session.photo_limit} fotos` },
        { status: 400 }
      )
    }

    // Validar que todas as fotos pertencem à sessão
    const { data: validPhotos } = await supabaseAdmin
      .from('photos')
      .select('id')
      .eq('session_id', session.id)
      .in('id', photo_ids)

    if (!validPhotos || validPhotos.length !== photo_ids.length) {
      return NextResponse.json(
        { error: 'Uma ou mais fotos são inválidas' },
        { status: 400 }
      )
    }

    // Inserir seleções
    const selectionRows = photo_ids.map((photo_id: string) => ({
      session_id: session.id,
      photo_id,
    }))

    const { error: insertError } = await supabaseAdmin
      .from('selections')
      .insert(selectionRows)

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Atualizar status da sessão para completed
    await supabaseAdmin
      .from('sessions')
      .update({ status: 'completed' })
      .eq('id', session.id)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
