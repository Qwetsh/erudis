-- Table pour stocker les hexagones de la carte
-- Story 2.2 : Génération procédurale

CREATE TABLE IF NOT EXISTS map_hexes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  q INTEGER NOT NULL,
  r INTEGER NOT NULL,
  terrain VARCHAR(20) NOT NULL
    CHECK (terrain IN ('road', 'plain', 'forest', 'swamp', 'mountain', 'impassable')),
  zone VARCHAR(10) NOT NULL DEFAULT 'easy'
    CHECK (zone IN ('easy', 'medium', 'hard', 'final')),
  poi VARCHAR(20)
    CHECK (poi IS NULL OR poi IN ('shop', 'blacksmith', 'sanctuary', 'chest', 'boss', 'gate', 'village', 'spawn', 'finalExam')),
  discovered BOOLEAN NOT NULL DEFAULT false,
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (game_id, q, r)
);

CREATE INDEX idx_map_hexes_game_id ON map_hexes(game_id);
CREATE INDEX idx_map_hexes_game_coords ON map_hexes(game_id, q, r);
