import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Cliente público (browser / edge)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente com permissão total (somente server-side / API routes)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Gera URLs assinadas (privadas) para um conjunto de fotos.
 * Expira em `expiresIn` segundos (padrão: 24h).
 * Retorna um mapa { storage_path → signedUrl }
 */
export async function getSignedUrls(
  photos: Array<{ storage_path: string }>,
  expiresIn = 60 * 60 * 24
): Promise<Record<string, string>> {
  if (photos.length === 0) return {}

  const paths = photos.map(p => p.storage_path)

  const { data, error } = await supabaseAdmin.storage
    .from('photos')
    .createSignedUrls(paths, expiresIn)

  if (error || !data) return {}

  const map: Record<string, string> = {}
  data.forEach(item => {
    if (item.signedUrl && item.path) map[item.path] = item.signedUrl
  })
  return map
}
