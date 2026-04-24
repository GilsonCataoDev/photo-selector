import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = params

  // Buscar foto para obter o storage_path
  const { data: photo, error: fetchError } = await supabaseAdmin
    .from('photos')
    .select('storage_path, session_id')
    .eq('id', id)
    .single()

  if (fetchError || !photo) {
    return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 })
  }

  // Remover do storage
  await supabaseAdmin.storage.from('photos').remove([photo.storage_path])

  // Remover do banco
  const { error } = await supabaseAdmin.from('photos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
