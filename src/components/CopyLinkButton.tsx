'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface Props {
  link: string
}

export function CopyLinkButton({ link }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback para browsers antigos
      const textarea = document.createElement('textarea')
      textarea.value = link
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border transition-all ${
        copied
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" />
          Copiado!
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          Copiar
        </>
      )}
    </button>
  )
}
