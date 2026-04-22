'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Loader2, CheckCircle2, X, Image as ImageIcon, Zap } from 'lucide-react'
import type { Photo } from '@/types'

interface Props {
  sessionId: string
  onUploadComplete: (photos: Photo[]) => void
}

interface FileItem {
  file: File
  originalSize: number
  preview: string
  status: 'pending' | 'compressing' | 'uploading' | 'done' | 'error'
}

/** Comprime e redimensiona para máx 1920px, JPEG 82% de qualidade */
async function compressImage(file: File): Promise<File> {
  // Tipos que o Canvas não consegue processar: manter original
  if (!file.type.startsWith('image/') || file.type === 'image/heic' || file.type === 'image/heif') {
    return file
  }

  return new Promise(resolve => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      const MAX_WIDTH = 1920
      let { width, height } = img

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width)
        width = MAX_WIDTH
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(file); return }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        blob => {
          if (!blob) { resolve(file); return }
          // Só usa comprimida se for menor que o original
          if (blob.size >= file.size) { resolve(file); return }
          const name = file.name.replace(/\.[^.]+$/, '.jpg')
          resolve(new File([blob], name, { type: 'image/jpeg' }))
        },
        'image/jpeg',
        0.82
      )
    }

    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file) }
    img.src = objectUrl
  })
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function UploadZone({ sessionId, onUploadComplete }: Props) {
  const [fileItems, setFileItems] = useState<FileItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [totalSaved, setTotalSaved] = useState(0)

  const onDrop = useCallback((accepted: File[]) => {
    const items: FileItem[] = accepted.map(file => ({
      file,
      originalSize: file.size,
      preview: URL.createObjectURL(file),
      status: 'pending',
    }))
    setFileItems(prev => [...prev, ...items])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'] },
    multiple: true,
    disabled: uploading,
  })

  function removeFile(index: number) {
    setFileItems(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  async function handleUpload() {
    const pending = fileItems.filter(f => f.status === 'pending')
    if (pending.length === 0) return

    setUploading(true)
    let savedBytes = 0

    // Comprimir todos primeiro
    const compressedMap = new Map<FileItem, File>()
    for (const item of pending) {
      setFileItems(prev =>
        prev.map(f => f === item ? { ...f, status: 'compressing' } : f)
      )
      const compressed = await compressImage(item.file)
      savedBytes += Math.max(0, item.file.size - compressed.size)
      compressedMap.set(item, compressed)
    }

    setTotalSaved(prev => prev + savedBytes)

    // Upload em lotes de 5
    const BATCH = 5
    const allUploaded: Photo[] = []

    for (let i = 0; i < pending.length; i += BATCH) {
      const batch = pending.slice(i, i + BATCH)

      setFileItems(prev =>
        prev.map(f => batch.includes(f) ? { ...f, status: 'uploading' } : f)
      )

      const formData = new FormData()
      formData.append('sessionId', sessionId)
      batch.forEach(item => {
        const compressed = compressedMap.get(item) || item.file
        formData.append('files', compressed)
      })

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const data = await res.json()

        if (res.ok && data.photos) {
          allUploaded.push(...data.photos)
          setFileItems(prev =>
            prev.map(f => batch.includes(f) ? { ...f, status: 'done' } : f)
          )
        } else {
          setFileItems(prev =>
            prev.map(f => batch.includes(f) ? { ...f, status: 'error' } : f)
          )
        }
      } catch {
        setFileItems(prev =>
          prev.map(f => batch.includes(f) ? { ...f, status: 'error' } : f)
        )
      }
    }

    setUploading(false)
    if (allUploaded.length > 0) onUploadComplete(allUploaded)

    setTimeout(() => {
      setFileItems(prev => {
        prev.filter(f => f.status === 'done').forEach(f => URL.revokeObjectURL(f.preview))
        return prev.filter(f => f.status !== 'done')
      })
    }, 2500)
  }

  const pendingCount = fileItems.filter(f => f.status === 'pending').length

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-black bg-gray-50 scale-[1.01]'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className={`mx-auto w-8 h-8 mb-3 transition-colors ${isDragActive ? 'text-black' : 'text-gray-400'}`} />
        <p className="text-sm font-medium text-gray-700">
          {isDragActive ? 'Solte as fotos aqui' : 'Arraste as fotos ou clique para selecionar'}
        </p>
        <p className="mt-1 text-xs text-gray-400">JPG, PNG, WEBP, HEIC — compressão automática antes do envio</p>
      </div>

      {/* Economia total */}
      {totalSaved > 1024 * 100 && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium px-1">
          <Zap className="w-3.5 h-3.5" />
          {formatBytes(totalSaved)} economizados com compressão
        </div>
      )}

      {/* Preview list */}
      {fileItems.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {fileItems.map((item, index) => (
              <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.preview} alt="" className="w-full h-full object-cover" />

                {/* Status overlays */}
                {item.status === 'compressing' && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
                    <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />
                    <span className="text-white text-[9px] font-medium">comprimindo</span>
                  </div>
                )}
                {item.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                )}
                {item.status === 'done' && (
                  <div className="absolute inset-0 bg-emerald-500/60 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                )}
                {item.status === 'error' && (
                  <div className="absolute inset-0 bg-red-500/60 flex items-center justify-center">
                    <X className="w-5 h-5 text-white" />
                  </div>
                )}

                {/* Tamanho original */}
                {item.status === 'pending' && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-1 py-0.5 text-center">
                    <span className="text-white text-[9px]">{formatBytes(item.originalSize)}</span>
                  </div>
                )}

                {/* Remover */}
                {item.status === 'pending' && !uploading && (
                  <button
                    onClick={e => { e.stopPropagation(); removeFile(index) }}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {pendingCount > 0 && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full py-3 px-4 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Comprimindo e enviando…
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" />
                  Enviar {pendingCount} foto{pendingCount !== 1 ? 's' : ''} (com compressão automática)
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
