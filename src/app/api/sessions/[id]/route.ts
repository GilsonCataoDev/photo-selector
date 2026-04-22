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
    .order('created_at', { ascending: true })

  const photoList = photos || []

  // URLs assinadas para o admin (expiram em 2h)
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
  const selectedPhotos = photosWithUrls.filter((p: { id: string }) => selectedIds.has(p.id))

  return NextResponse.json({ session, photos: photosWithUrls, selectedPhotos })
}
