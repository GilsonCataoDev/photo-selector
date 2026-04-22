import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { supabaseAdmin, getSignedUrls } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const formData = await request.formData()
    const sessionId = formData.get('sessionId') as string
    const files = formData.getAll('files') as File[]

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId obrigatório' }, { status: 400 })
    }
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Verificar se a sessão existe
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
    }

    const uploadedPhotos = []

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue

      const ext = file.name.split('.').pop() || 'jpg'
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const storagePath = `${sessionId}/${uniqueName}`

      const buffer = await file.arrayBuffer()
      const uint8 = new Uint8Array(buffer)

      const { error: uploadError } = await supabaseAdmin.storage
        .from('photos')
        .upload(storagePath, uint8, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        continue
      }

      const { data: photo, error: dbError } = await supabaseAdmin
        .from('photos')
        .insert({
          session_id: sessionId,
          url: storagePath,       // guardamos o path; URL real vem assinada
          storage_path: storagePath,
          filename: file.name,
        })
        .select()
        .single()

      if (!dbError && photo) {
        uploadedPhotos.push(photo)
      }
    }

    // Gerar URLs assinadas (2h) para exibir imediatamente no painel
    const urlMap = await getSignedUrls(uploadedPhotos, 60 * 60 * 2)
    const photosWithUrls = uploadedPhotos.map(p => ({
      ...p,
      url: urlMap[p.storage_path] || p.url,
    }))

    return NextResponse.json({ photos: photosWithUrls }, { status: 201 })
  } catch (err) {
    console.error('Upload route error:', err)
    return NextResponse.json({ error: 'Erro interno no upload' }, { status: 500 })
  }
}
