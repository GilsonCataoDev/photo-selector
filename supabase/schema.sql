-- ============================================================
-- PhotoSelect — Schema do banco de dados (Supabase / PostgreSQL)
-- Execute este script no SQL Editor do seu projeto Supabase
-- ============================================================

-- Tabela de sessões (ensaios)
CREATE TABLE IF NOT EXISTS sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name  TEXT        NOT NULL,
  shoot_date   DATE        NOT NULL,
  photo_limit  INTEGER     NOT NULL DEFAULT 10,
  status       TEXT        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'completed')),
  token        UUID        UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de fotos
CREATE TABLE IF NOT EXISTS photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  url           TEXT        NOT NULL,
  storage_path  TEXT        NOT NULL,
  filename      TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de seleções do cliente
CREATE TABLE IF NOT EXISTS selections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  photo_id    UUID        NOT NULL REFERENCES photos(id)   ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, photo_id)
);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_photos_session_id    ON photos(session_id);
CREATE INDEX IF NOT EXISTS idx_selections_session_id ON selections(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token        ON sessions(token);

-- ============================================================
-- Storage: crie um bucket público chamado "photos" em:
-- Supabase Dashboard → Storage → New Bucket → nome: photos → Public: ON
-- ============================================================
