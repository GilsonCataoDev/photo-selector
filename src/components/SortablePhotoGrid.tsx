'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, rectSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trash2, GripVertical } from 'lucide-react'
import type { Photo } from '@/types'

interface SortableItemProps {
  photo: Photo
  onDelete: (id: string) => void
  onZoom: (id: string) => void
}

function SortableItem({ photo, onDelete, onZoom }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: photo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative aspect-square group">
      <button onClick={() => onZoom(photo.id)} className="absolute inset-0 rounded-xl overflow-hidden bg-gray-100">
        <Image
          src={photo.url}
          alt={photo.filename}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors rounded-xl" />
      </button>

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1.5 left-1.5 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-3.5 h-3.5 text-white" />
      </div>

      {/* Delete */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(photo.id) }}
        className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500/80 hover:bg-red-600 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="w-3 h-3 text-white" />
      </button>
    </div>
  )
}

interface Props {
  sessionId: string
  photos: Photo[]
  onChange: (photos: Photo[]) => void
  onZoom: (index: number) => void
}

export function SortablePhotoGrid({ sessionId, photos, onChange, onZoom }: Props) {
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = photos.findIndex(p => p.id === active.id)
    const newIndex = photos.findIndex(p => p.id === over.id)
    const reordered = arrayMove(photos, oldIndex, newIndex)

    onChange(reordered)
    setSaving(true)

    try {
      await fetch('/api/photos/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, photoIds: reordered.map(p => p.id) }),
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(photoId: string) {
    if (!confirm('Remover esta foto?')) return

    const res = await fetch(`/api/photos/${photoId}`, { method: 'DELETE' })
    if (res.ok) {
      onChange(photos.filter(p => p.id !== photoId))
    }
  }

  return (
    <div>
      {saving && (
        <p className="text-xs text-gray-400 mb-2">Salvando ordem…</p>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={photos.map(p => p.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {photos.map((photo, idx) => (
              <SortableItem
                key={photo.id}
                photo={photo}
                onDelete={handleDelete}
                onZoom={() => onZoom(idx)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
