import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { supabaseAdmin, getSignedUrls } from '@/lib/supabase'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = params

  const { data: session, error: sessionError } = await supabaseAdmin
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
  }

  const { data: photos } = await supabaseAdmin
    .from('photos')
    .select('*')
    .eq('session_id', id)
    .order('sort_order', { ascending: true })

  const photoList = photos || []
  const urlMap = await getSignedUrls(photoList, 60 * 60 * 2)
  const photosWithUrls = photoList.map((p: { storage_path: string; url: string }) => ({
    ...p,
    url: urlMap[p.storage_path] || p.url,
  }))

  const { data: selectionRows } = await supabaseAdmin
    .from('selections')
    .select('photo_id')
    .eq('session_id', id)

  const selectedIds = new Set((selectionRows || []).map((s: { photo_id: string }) => s.photo_id))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectedPhotos = photosWithUrls.filter((p: any) => selectedIds.has(p.id))

  return NextResponse.json({ session, photos: photosWithUrls, selectedPhotos })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = params

  try {
    const body = await request.json()
    const allowed = ['client_name', 'shoot_date', 'photo_limit', 'extra_photo_price', 'message', 'expires_at']
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {}
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
