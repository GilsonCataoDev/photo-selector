-- Migration v2 — Execute no SQL Editor do Supabase

-- Mensagem personalizada da fotógrafa para o cliente
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS message TEXT DEFAULT NULL;

-- Expiração do link (NULL = nunca expira)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL;

-- Ordem das fotos na galeria
ALTER TABLE photos ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Índice para ordenação eficiente
CREATE INDEX IF NOT EXISTS idx_photos_sort_order ON photos(session_id, sort_order);
