-- Adicionar preço de foto extra às sessões
-- Execute no SQL Editor do Supabase

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS extra_photo_price DECIMAL(10,2) DEFAULT NULL;

-- NULL = extras não permitidas
-- Valor > 0 = preço por foto extra em BRL
