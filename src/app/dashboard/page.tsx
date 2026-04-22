'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Camera, Plus, LogOut, Loader2, RefreshCw } from 'lucide-react'
import { SessionCard } from '@/components/SessionCard'
import type { Session } from '@/types'

export default function DashboardPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions')
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (!res.ok) throw new Error('Falha ao carregar sessões')
      const data = await res.json()
      setSessions(data)
    } catch {
      setError('Não foi possível carregar as sessões.')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const pending = sessions.filter(s => s.status === 'pending')
  const completed = sessions.filter(s => s.status === 'completed')

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">PhotoSelect</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setLoading(true); fetchSessions() }}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="Atualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link
              href="/dashboard/new-session"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova sessão
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Sessões</h1>
          <p className="mt-1 text-sm text-gray-500">
            {sessions.length} sessão{sessions.length !== 1 ? 'ões' : ''} no total
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="text-center py-24">
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={fetchSessions}
              className="mt-3 text-sm text-gray-600 underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-gray-200 rounded-2xl">
            <Camera className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhuma sessão ainda</p>
            <p className="text-sm text-gray-400 mt-1">Crie a primeira sessão para começar</p>
            <Link
              href="/dashboard/new-session"
              className="inline-flex items-center gap-2 mt-5 px-4 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova sessão
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {pending.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Pendentes — {pending.length}
                </h2>
                <div className="space-y-3">
                  {pending.map(session => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              </section>
            )}

            {completed.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Finalizadas — {completed.length}
                </h2>
                <div className="space-y-3">
                  {completed.map(session => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
