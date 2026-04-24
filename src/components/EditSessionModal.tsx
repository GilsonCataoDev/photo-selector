'use client'

import { useState, FormEvent } from 'react'
import { X, Loader2, PlusCircle } from 'lucide-react'
import type { Session } from '@/types'

interface Props {
  session: Session
  onClose: () => void
  onSaved: (updated: Session) => void
}

const EXPIRY_OPTIONS = [
  { label: 'Nunca expira', value: '' },
  { label: '7 dias', days: 7 },
  { label: '15 dias', days: 15 },
  { label: '30 dias', days: 30 },
  { label: '60 dias', days: 60 },
]

export function EditSessionModal({ session, onClose, onSaved }: Props) {
  const [clientName, setClientName] = useState(session.client_name)
  const [shootDate, setShootDate] = useState(session.shoot_date)
  const [photoLimit, setPhotoLimit] = useState(session.photo_limit)
  const [allowExtras, setAllowExtras] = useState(session.extra_photo_price != null)
  const [extraPrice, setExtraPrice] = useState(session.extra_photo_price?.toString() || '')
  const [message, setMessage] = useState(session.message || '')
  const [expiryDays, setExpiryDays] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const parsedExtraPrice = allowExtras ? parseFloat(extraPrice.replace(',', '.')) : null
    if (allowExtras && (!parsedExtraPrice || parsedExtraPrice <= 0)) {
      setError('Informe um valor válido para a foto extra')
      setLoading(false)
      return
    }

    let expires_at: string | null = null
    if (expiryDays) {
      const d = new Date()
      d.setDate(d.getDate() + parseInt(expiryDays))
      expires_at = d.toISOString()
    }

    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: clientName.trim(),
          shoot_date: shootDate,
          photo_limit: photoLimit,
          extra_photo_price: parsedExtraPrice,
          message: message.trim() || null,
          ...(expiryDays !== '' && { expires_at }),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao salvar')
      }
      const updated = await res.json()
      onSaved(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Editar sessão</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do cliente</label>
            <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Data do ensaio</label>
            <input type="date" value={shootDate} onChange={e => setShootDate(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fotos incluídas no pacote</label>
            <div className="flex items-center gap-4">
              <input type="range" min={1} max={200} value={photoLimit}
                onChange={e => setPhotoLimit(Number(e.target.value))} className="flex-1 accent-black" />
              <input type="number" min={1} max={200} value={photoLimit}
                onChange={e => setPhotoLimit(Math.max(1, Math.min(200, Number(e.target.value))))}
                className="w-20 px-3 py-2 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-black" />
            </div>
          </div>

          {/* Extras */}
          <div className="border border-gray-100 rounded-xl p-4 space-y-4">
            <button type="button" onClick={() => setAllowExtras(!allowExtras)} className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className={`w-4 h-4 ${allowExtras ? 'text-black' : 'text-gray-400'}`} />
                <span className="text-sm font-medium text-gray-700">Fotos extras</span>
              </div>
              <div className={`w-10 h-5 rounded-full transition-colors ${allowExtras ? 'bg-black' : 'bg-gray-200'} relative`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${allowExtras ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </button>
            {allowExtras && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">R$</span>
                <input type="text" inputMode="decimal" value={extraPrice}
                  onChange={e => setExtraPrice(e.target.value.replace(/[^0-9.,]/g, ''))}
                  placeholder="0,00"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
              </div>
            )}
          </div>

          {/* Mensagem */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mensagem para o cliente <span className="text-gray-400 font-normal">(opcional)</span></label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
              placeholder="Ex: Olá! Aqui estão suas fotos. Escolha suas favoritas com carinho 💛"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none placeholder:text-gray-400" />
          </div>

          {/* Expiração */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Redefinir expiração do link</label>
            <select value={expiryDays} onChange={e => setExpiryDays(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white">
              <option value="">Manter atual</option>
              {EXPIRY_OPTIONS.map(opt => (
                <option key={opt.label} value={'days' in opt ? opt.days : ''}>{opt.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando…</> : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
