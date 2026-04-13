-- Support multi-mondes et portails
-- Story 8.2

-- Ajout du monde sur la table games
ALTER TABLE games ADD COLUMN IF NOT EXISTS world VARCHAR(20) DEFAULT 'bioma'
  CHECK (world IS NULL OR world IN ('bioma', 'arithmos', 'chronos', 'lexica'));

-- Portails inter-mondes sur la carte
CREATE TABLE IF NOT EXISTS portals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  from_q INTEGER NOT NULL,
  from_r INTEGER NOT NULL,
  to_world VARCHAR(20) NOT NULL
    CHECK (to_world IN ('bioma', 'arithmos', 'chronos', 'lexica')),
  to_q INTEGER NOT NULL,
  to_r INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_portals_game ON portals(game_id);
CREATE INDEX idx_portals_lookup ON portals(game_id, from_q, from_r);
