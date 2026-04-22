'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Images, CheckCircle2, Clock, ArrowRight } from 'lucide-react'
import type { Session } from '@/types'

interface Props {
  session: Session
}

export function SessionCard({ session }: Props) {
  const isCompleted = session.status === 'completed'

  return (
    <Link
      href={`/dashboard/sessions/${session.id}`}
      className="group flex items-center justify-between gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-gray-200 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-4 min-w-0">
        {/* Status icon */}
        <div className={`mt-0.5 w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
          isCompleted ? 'bg-emerald-50' : 'bg-amber-50'
        }`}>
          {isCompleted
            ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            : <Clock className="w-4 h-4 text-amber-500" />}
        </div>

        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{session.client_name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              {format(new Date(session.shoot_date + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Images className="w-3 h-3" />
              {session.photo_limit} foto{session.photo_limit !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
          isCompleted
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-amber-50 text-amber-700'
        }`}>
          {isCompleted ? 'Finalizada' : 'Pendente'}
        </span>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
      </div>
    </Link>
  )
}
