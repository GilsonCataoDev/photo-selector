'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, PlusCircle } from 'lucide-react'

export default function NewSessionPage() {
  const router = useRouter()
  const [clientName, setClientName] = useState('')
  const [shootDate, setShootDate] = useState('')
  const [photoLimit, setPhotoLimit] = useState(30)
  const [allowExtras, setAllowExtras] = useState(false)
  const [extraPrice, setExtraPrice] = useState('')
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

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: clientName.trim(),
          shoot_date: shootDate,
          photo_limit: photoLimit,
          extra_photo_price: parsedExtraPrice,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao criar sessão')
      }

      const session = await res.json()
      router.push(`/dashboard/sessions/${session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-semibold text-gray-900">Nova Sessão</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nome do cliente <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              required
              placeholder="Ex: Maria Silva"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Data do ensaio <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={shootDate}
              onChange={e => setShootDate(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Fotos incluídas no pacote <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={1}
                max={200}
                value={photoLimit}
                onChange={e => setPhotoLimit(Number(e.target.value))}
                className="flex-1 accent-black"
              />
              <input
                type="number"
                min={1}
                max={200}
                value={photoLimit}
                onChange={e => setPhotoLimit(Math.max(1, Math.min(200, Number(e.target.value))))}
                className="w-20 px-3 py-2 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-400">
              O cliente receberá {photoLimit} foto{photoLimit !== 1 ? 's' : ''} inclusas no pacote
            </p>
          </div>

          {/* Fotos extras */}
          <div className="border border-gray-100 rounded-xl p-4 space-y-4">
            <button
              type="button"
              onClick={() => setAllowExtras(!allowExtras)}
              className="w-full flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <PlusCircle className={`w-4 h-4 ${allowExtras ? 'text-black' : 'text-gray-400'}`} />
                <span className="text-sm font-medium text-gray-700">Permitir fotos extras</span>
              </div>
              <div className={`w-10 h-5 rounded-full transition-colors ${allowExtras ? 'bg-black' : 'bg-gray-200'} relative`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${allowExtras ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </button>

            {allowExtras && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Valor por foto extra (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={extraPrice}
                    onChange={e => setExtraPrice(e.target.value.replace(/[^0-9.,]/g, ''))}
                    placeholder="0,00"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-400">
                  O cliente poderá escolher fotos além do pacote pagando esse valor por foto adicional
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link
              href="/dashboard"
              className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors text-center"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Criando…
                </>
              ) : (
                'Criar sessão'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
