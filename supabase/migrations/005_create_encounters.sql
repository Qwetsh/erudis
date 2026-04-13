-- Tables pour les embuscades et rencontres narratives
-- Story 3.4

CREATE TABLE IF NOT EXISTS encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  encounter_type VARCHAR(20) NOT NULL
    CHECK (encounter_type IN ('ambush', 'narrative')),
  zone VARCHAR(20) NOT NULL DEFAULT 'easy'
    CHECK (zone IN ('easy', 'medium', 'hard', 'final')),
  description TEXT NOT NULL DEFAULT '',
  -- Pour les embuscades : perte PV/or en cas d'échec
  ambush_penalty JSONB NOT NULL DEFAULT '{}',
  -- Pour les narratives : choix et conséquences
  choices JSONB NOT NULL DEFAULT '[]',
  -- Probabilité d'apparition (0-1)
  spawn_chance FLOAT NOT NULL DEFAULT 0.3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table de liaison : quels hex ont des encounters actifs
CREATE TABLE IF NOT EXISTS hex_encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  q INTEGER NOT NULL,
  r INTEGER NOT NULL,
  encounter_id UUID NOT NULL REFERENCES encounters(id),
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES players(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_id, q, r)
);

CREATE INDEX idx_hex_encounters_game ON hex_encounters(game_id);
CREATE INDEX idx_hex_encounters_lookup ON hex_encounters(game_id, q, r);
