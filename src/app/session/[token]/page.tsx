'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Camera, CheckCircle2, Loader2, AlertCircle, Check, PlusCircle, ZoomIn, Timer } from 'lucide-react'
import { ConfirmModal } from '@/components/ConfirmModal'
import { PhotoLightbox } from '@/components/PhotoLightbox'
import type { Session, Photo } from '@/types'

const PAGE_SIZE = 50

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function getDraftKey(token: string) {
  return `ps_draft_${token}`
}

export default function ClientSessionPage() {
  const { token } = useParams<{ token: string }>()
  const [session, setSession] = useState<Session | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [limitAlert, setLimitAlert] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/sessions/by-token/${token}`)
        if (res.status === 410) { setError('Este link expirou.'); setLoading(false); return }
        if (!res.ok) throw new Error()
        const data = await res.json()
        setSession(data.session)
        setPhotos(data.photos || [])

        if (data.session.status === 'completed') {
          setDone(true)
          setSelected(new Set<string>(data.selectedPhotoIds || []))
        } else {
          // Restaurar rascunho do localStorage
          try {
            const draft = localStorage.getItem(getDraftKey(token))
            if (draft) {
              const ids: string[] = JSON.parse(draft)
              const validIds = ids.filter((id: string) =>
                (data.photos || []).some((p: Photo) => p.id === id)
              )
              if (validIds.length > 0) setSelected(new Set(validIds))
            }
          } catch { /* ignora erros de localStorage */ }
        }
      } catch {
        setError('Este link é inválido ou expirou.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const togglePhoto = useCallback((photoId: string) => {
    if (done || !session) return
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(photoId)) {
        next.delete(photoId)
      } else {
        const maxAllowed = session.extra_photo_price != null ? photos.length : session.photo_limit
        if (next.size >= maxAllowed) {
          if (!session.extra_photo_price) {
            setLimitAlert(true)
            setTimeout(() => setLimitAlert(false), 3000)
          }
          return prev
        }
        next.add(photoId)
      }
      // Salvar rascunho
      try { localStorage.setItem(getDraftKey(token), JSON.stringify(Array.from(next))) } catch { /* ignora */ }
      return next
    })
  }, [done, session, photos.length, token])

  async function handleFinalize() {
    if (!session) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, photo_ids: Array.from(selected) }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao finalizar')
      }
      try { localStorage.removeItem(getDraftKey(token)) } catch { /* ignora */ }
      setDone(true)
      setShowModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  )

  if (error && !session) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-7 h-7 text-red-400" />
      </div>
      <h1 className="text-lg font-semibold text-gray-900">Link inválido</h1>
      <p className="mt-2 text-sm text-gray-500 max-w-xs">{error}</p>
    </div>
  )

  if (!session) return null

  const limit = session.photo_limit
  const extraPrice = session.extra_photo_price
  const count = selected.size
  const extraCount = Math.max(0, count - limit)
  const extraTotal = extraCount * (extraPrice ?? 0)
  const canFinalize = count >= limit
  const visiblePhotos = photos.slice(0, visibleCount)

  // Tela de sucesso
  if (done) {
    const selectedList = photos.filter(p => selected.has(p.id))
    return (
      <div className="min-h-screen">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-2">
            <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">PhotoSelect</span>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-full mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Seleção finalizada!</h1>
            <p className="mt-2 text-gray-500">
              Olá, <strong>{session.client_name}</strong>! Suas {count} fotos foram enviadas.
            </p>
            {extraCount > 0 && extraPrice && (
              <p className="mt-2 text-sm text-amber-600 font-medium">
                {extraCount} foto{extraCount !== 1 ? 's' : ''} extra{extraCount !== 1 ? 's' : ''} · Total: {fmt(extraTotal)}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-400">Entraremos em contato em breve.</p>
          </div>
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Fotos selecionadas ({count})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {selectedList.map((photo, i) => (
              <button key={photo.id} onClick={() => setLightboxIndex(i)}
                className={`relative aspect-square rounded-xl overflow-hidden bg-gray-100 ${i < limit ? 'ring-2 ring-emerald-400' : 'ring-2 ring-amber-400'}`}>
                <Image src={photo.url} alt={photo.filename} fill className="object-cover" sizes="20vw" />
                {i >= limit && (
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-amber-500 rounded text-white text-xs font-semibold">extra</div>
                )}
              </button>
            ))}
          </div>
          {lightboxIndex !== null && (
            <PhotoLightbox photos={selectedList} index={lightboxIndex}
              onClose={() => setLightboxIndex(null)} onNavigate={setLightboxIndex} />
          )}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-32">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-2">
          <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
            <Camera className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold">PhotoSelect</span>
          {session.expires_at && (
            <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
              <Timer className="w-3 h-3" />
              Expira em {new Date(session.expires_at).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Olá, {session.client_name}!</h1>
          <p className="mt-1 text-gray-500">
            Selecione{' '}
            {extraPrice
              ? <>pelo menos <strong>{limit}</strong> foto{limit !== 1 ? 's' : ''}</>
              : <>exatamente <strong>{limit}</strong> foto{limit !== 1 ? 's' : ''}</>
            }.
          </p>

          {/* Mensagem da fotógrafa */}
          {session.message && (
            <div className="mt-3 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-600 italic">
              {session.message}
            </div>
          )}

          {/* Rascunho restaurado */}
          {count > 0 && (
            <p className="mt-2 text-xs text-gray-400">✓ Seleção anterior restaurada</p>
          )}

          {extraPrice && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
              <PlusCircle className="w-4 h-4" />
              Fotos extras disponíveis por <strong>{fmt(extraPrice)}</strong> cada
            </div>
          )}
        </div>

        {limitAlert && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 bg-gray-900 text-white text-sm rounded-full shadow-lg animate-fade-in">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            Limite de {limit} foto{limit !== 1 ? 's' : ''} atingido
          </div>
        )}

        {photos.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <Camera className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            Nenhuma foto disponível ainda
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
              {visiblePhotos.map((photo, idx) => {
                const isSelected = selected.has(photo.id)
                const selArr = Array.from(selected)
                const isExtra = isSelected && selArr.indexOf(photo.id) >= limit

                return (
                  <div key={photo.id} className="relative aspect-square group">
                    <button
                      onClick={() => togglePhoto(photo.id)}
                      className={`absolute inset-0 rounded-xl overflow-hidden bg-gray-100 photo-select-ring ${
                        isSelected
                          ? isExtra ? 'ring-2 ring-amber-400 ring-offset-2' : 'ring-2 ring-black ring-offset-2'
                          : 'ring-0 hover:ring-1 hover:ring-gray-300 hover:ring-offset-1'
                      }`}
                    >
                      <Image
                        src={photo.url}
                        alt={photo.filename}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARC AAKAAUDASEAAQEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AKwAB/9k="
                      />
                      <div className={`photo-overlay absolute inset-0 ${isSelected ? 'opacity-100 bg-black/25' : 'opacity-0'}`} />
                      {isSelected && (
                        <div className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-md ${isExtra ? 'bg-amber-500' : 'bg-black'}`}>
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      {isExtra && (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-amber-500 rounded text-white text-xs font-semibold">extra</div>
                      )}
                    </button>

                    {/* Zoom button */}
                    <button
                      onClick={e => { e.stopPropagation(); setLightboxIndex(idx) }}
                      className="absolute bottom-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <ZoomIn className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Load more */}
            {visibleCount < photos.length && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                  className="px-6 py-3 border border-gray-200 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Ver mais fotos ({photos.length - visibleCount} restantes)
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900">
              {count} de {limit} foto{limit !== 1 ? 's' : ''}
              {extraCount > 0 && extraPrice && (
                <span className="ml-2 text-amber-600">+{extraCount} extras · {fmt(extraTotal)}</span>
              )}
            </div>
            <div className="mt-1 w-40 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-black rounded-full transition-all duration-300"
                style={{ width: `${Math.min((count / limit) * 100, 100)}%` }} />
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            disabled={!canFinalize}
            className="flex-shrink-0 px-6 py-3 bg-black text-white text-sm font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
          >
            {canFinalize ? 'Finalizar seleção' : `Faltam ${limit - count}`}
          </button>
        </div>
      </div>

      <ConfirmModal
        open={showModal} count={count} limit={limit} extraPrice={extraPrice}
        loading={submitting} error={error}
        onConfirm={handleFinalize}
        onCancel={() => { setShowModal(false); setError('') }}
      />

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={visiblePhotos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  )
}
