'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowLeft, Calendar, Images, CheckCircle2, Clock,
  Loader2, Download, PlusCircle, Pencil, ExternalLink, Timer,
} from 'lucide-react'
import { UploadZone } from '@/components/UploadZone'
import { CopyLinkButton } from '@/components/CopyLinkButton'
import { SortablePhotoGrid } from '@/components/SortablePhotoGrid'
import { PhotoLightbox } from '@/components/PhotoLightbox'
import { EditSessionModal } from '@/components/EditSessionModal'
import type { Session, Photo } from '@/types'

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selectedPhotos, setSelectedPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [showEdit, setShowEdit] = useState(false)

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${id}`)
      if (res.status === 401) { router.push('/login'); return }
      if (res.status === 404) { router.push('/dashboard'); return }
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSession(data.session)
      setPhotos(data.photos || [])
      setSelectedPhotos(data.selectedPhotos || [])
    } catch {
      setError('Não foi possível carregar a sessão.')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { fetchSession() }, [fetchSession])

  function handleUploadComplete(newPhotos: Photo[]) {
    setPhotos(prev => [...prev, ...newPhotos])
  }

  function downloadSelections() {
    if (!session || selectedPhotos.length === 0) return
    const extraCount = Math.max(0, selectedPhotos.length - session.photo_limit)
    const lines = [
      `Fotos selecionadas — ${session.client_name}`,
      `Ensaio: ${session.shoot_date}`,
      `Fotos do pacote: ${session.photo_limit}`,
      extraCount > 0 ? `Fotos extras: ${extraCount} × ${fmt(session.extra_photo_price || 0)} = ${fmt(extraCount * (session.extra_photo_price || 0))}` : '',
      `Total: ${selectedPhotos.length} fotos`,
      '',
      ...selectedPhotos.map((p, i) => `${i + 1}. ${p.filename}`),
    ].filter(l => l !== undefined)
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `selecao-${session.client_name.replace(/\s+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  )

  if (error || !session) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-500 text-sm">{error || 'Sessão não encontrada'}</p>
        <Link href="/dashboard" className="mt-3 text-sm text-gray-600 underline block">Voltar</Link>
      </div>
    </div>
  )

  const clientLink = `${process.env.NEXT_PUBLIC_APP_URL}/session/${session.token}`
  const isCompleted = session.status === 'completed'
  const extraCount = Math.max(0, selectedPhotos.length - session.photo_limit)

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/dashboard" className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-gray-900 truncate">{session.client_name}</h1>
          </div>
          <button onClick={() => setShowEdit(true)}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors" title="Editar sessão">
            <Pencil className="w-4 h-4" />
          </button>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${isCompleted ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            {isCompleted ? <><CheckCircle2 className="w-3 h-3" />Finalizada</> : <><Clock className="w-3 h-3" />Pendente</>}
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Info card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                {format(new Date(session.shoot_date + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Images className="w-4 h-4 text-gray-400" />
                {session.photo_limit} fotos incluídas no pacote
                {isCompleted && <span className="text-emerald-600 font-medium">· {selectedPhotos.length} selecionadas</span>}
              </div>
              {session.extra_photo_price && (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <PlusCircle className="w-4 h-4 text-amber-400" />
                  Extras: {fmt(session.extra_photo_price)} por foto
                  {isCompleted && extraCount > 0 && (
                    <span className="font-semibold">· {extraCount} extras = {fmt(extraCount * session.extra_photo_price)}</span>
                  )}
                </div>
              )}
              {session.expires_at && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Timer className="w-4 h-4 text-gray-400" />
                  Expira em {format(new Date(session.expires_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              )}
              {session.message && (
                <div className="mt-2 text-sm text-gray-500 italic bg-gray-50 rounded-xl px-3 py-2">
                  "{session.message}"
                </div>
              )}
            </div>
            {isCompleted && selectedPhotos.length > 0 && (
              <button onClick={downloadSelections}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                Baixar lista
              </button>
            )}
          </div>

          {/* Link */}
          {!isCompleted && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Link do cliente</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-600 truncate">
                  {clientLink}
                </code>
                <CopyLinkButton link={clientLink} />
                <a href={clientLink} target="_blank" rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Fotos selecionadas (admin view após finalizar) */}
        {isCompleted && selectedPhotos.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Fotos escolhidas ({selectedPhotos.length})
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {selectedPhotos.map((photo, idx) => (
                <button key={photo.id} onClick={() => setLightboxIndex(idx)}
                  className={`relative aspect-square rounded-xl overflow-hidden bg-gray-100 hover:ring-2 hover:ring-gray-300 transition-all ${idx < session.photo_limit ? 'ring-2 ring-emerald-400' : 'ring-2 ring-amber-400'}`}>
                  <Image src={photo.url} alt={photo.filename} fill className="object-cover" sizes="16vw" />
                  {idx >= session.photo_limit && (
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-amber-500 rounded text-white text-[9px] font-bold">EXTRA</div>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Upload + Galeria */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            {isCompleted ? `Todas as fotos (${photos.length})` : `Fotos enviadas (${photos.length})`}
          </h2>

          {!isCompleted && (
            <div className="mb-4">
              <UploadZone sessionId={id} onUploadComplete={handleUploadComplete} />
            </div>
          )}

          {photos.length > 0 && (
            isCompleted ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                {photos.map((photo, idx) => {
                  const isSel = selectedPhotos.some(s => s.id === photo.id)
                  return (
                    <button key={photo.id} onClick={() => setLightboxIndex(idx)}
                      className={`relative aspect-square rounded-xl overflow-hidden bg-gray-100 transition-all ${isSel ? 'ring-2 ring-emerald-400' : 'opacity-40'}`}>
                      <Image src={photo.url} alt={photo.filename} fill className="object-cover" sizes="16vw" />
                    </button>
                  )
                })}
              </div>
            ) : (
              <SortablePhotoGrid
                sessionId={id}
                photos={photos}
                onChange={setPhotos}
                onZoom={setLightboxIndex}
              />
            )
          )}
        </section>
      </main>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={isCompleted ? selectedPhotos : photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}

      {/* Edit modal */}
      {showEdit && (
        <EditSessionModal
          session={session}
          onClose={() => setShowEdit(false)}
          onSaved={updated => { setSession(updated); setShowEdit(false) }}
        />
      )}
    </div>
  )
}
