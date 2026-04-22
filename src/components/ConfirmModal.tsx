'use client'

import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface Props {
  open: boolean
  count: number
  limit: number
  extraPrice: number | null
  loading: boolean
  error: string
  onConfirm: () => void
  onCancel: () => void
}

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ConfirmModal({ open, count, limit, extraPrice, loading, error, onConfirm, onCancel }: Props) {
  if (!open) return null

  const extraCount = Math.max(0, count - limit)
  const extraTotal = extraCount * (extraPrice ?? 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={!loading ? onCancel : undefined}
      />

      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-scale-in">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-50 rounded-xl mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6 text-gray-700" />
        </div>

        <h2 className="text-lg font-semibold text-gray-900 text-center">
          Confirmar seleção
        </h2>

        {/* Resumo */}
        <div className="mt-4 bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Fotos do pacote</span>
            <span className="font-medium text-gray-900">{limit}</span>
          </div>
          {extraCount > 0 && extraPrice && (
            <>
              <div className="flex justify-between text-gray-600">
                <span>Fotos extras ({extraCount} × {fmt(extraPrice)})</span>
                <span className="font-medium text-gray-900">{fmt(extraTotal)}</span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between font-semibold text-gray-900">
                <span>Total de extras</span>
                <span>{fmt(extraTotal)}</span>
              </div>
            </>
          )}
          <div className="pt-2 border-t border-gray-200 flex justify-between font-semibold text-gray-900">
            <span>Total de fotos</span>
            <span>{count}</span>
          </div>
        </div>

        <p className="mt-3 text-xs text-gray-400 text-center">
          Após confirmar, não será possível alterar a seleção.
        </p>

        {error && (
          <div className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando…
              </>
            ) : (
              'Confirmar'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
