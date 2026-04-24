import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getSignedUrls } from '@/lib/supabase'

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params

  const { data: session, error } = await supabaseAdmin
    .from('sessions')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !session) {
    return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
  }

  // Verificar expiração
  if (session.expires_at && new Date(session.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Este link expirou.' }, { status: 410 })
  }

  const { data: photos } = await supabaseAdmin
    .from('photos')
    .select('*')
    .eq('session_id', session.id)
    .order('sort_order', { ascending: true })

  const photoList = photos || []
  const urlMap = await getSignedUrls(photoList, 60 * 60 * 24)
  const photosWithUrls = photoList.map((p: { storage_path: string; url: string }) => ({
    ...p,
    url: urlMap[p.storage_path] || p.url,
  }))

  let selectedPhotoIds: string[] = []
  if (session.status === 'completed') {
    const { data: selections } = await supabaseAdmin
      .from('selections')
      .select('photo_id')
      .eq('session_id', session.id)
    selectedPhotoIds = (selections || []).map((s: { photo_id: string }) => s.photo_id)
  }

  return NextResponse.json({ session, photos: photosWithUrls, selectedPhotoIds })
}
