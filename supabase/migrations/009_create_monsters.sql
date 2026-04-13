-- Table monstres pour l'éditeur prof
-- Story 7.2

CREATE TABLE IF NOT EXISTS monsters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  hp INTEGER NOT NULL DEFAULT 50,
  atk INTEGER NOT NULL DEFAULT 8,
  zone VARCHAR(20) NOT NULL DEFAULT 'easy'
    CHECK (zone IN ('easy', 'medium', 'hard', 'final')),
  subject VARCHAR(20)
    CHECK (subject IS NULL OR subject IN ('svt', 'maths', 'history-geo', 'french')),
  loot_gold INTEGER NOT NULL DEFAULT 10,
  loot_table JSONB NOT NULL DEFAULT '[]',
  modifiers JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
