-- Tables fondamentales pour Érudis
-- Story 1.2 + 1.3 : games, players, characters

CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) NOT NULL UNIQUE,
  phase VARCHAR(20) NOT NULL DEFAULT 'lobby'
    CHECK (phase IN ('lobby', 'playing', 'gameOver')),
  current_turn INTEGER NOT NULL DEFAULT 0,
  active_player_index INTEGER NOT NULL DEFAULT 0,
  config JSONB NOT NULL DEFAULT '{}',
  seed INTEGER NOT NULL DEFAULT floor(random() * 2147483647)::int,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  archetype VARCHAR(20) NOT NULL
    CHECK (archetype IN ('explorer', 'tank', 'striker', 'merchant', 'scholar', 'scout')),
  subject VARCHAR(20) NOT NULL
    CHECK (subject IN ('svt', 'maths', 'history-geo', 'french')),
  hp INTEGER NOT NULL DEFAULT 100,
  atk INTEGER NOT NULL DEFAULT 10,
  def INTEGER NOT NULL DEFAULT 5,
  vit INTEGER NOT NULL DEFAULT 0,
  force INTEGER NOT NULL DEFAULT 0,
  passive_name VARCHAR(100) NOT NULL DEFAULT '',
  passive_description TEXT NOT NULL DEFAULT '',
  passive_modifier JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  character_id UUID REFERENCES characters(id),
  hp INTEGER NOT NULL DEFAULT 100,
  max_hp INTEGER NOT NULL DEFAULT 100,
  atk INTEGER NOT NULL DEFAULT 10,
  def INTEGER NOT NULL DEFAULT 5,
  vit INTEGER NOT NULL DEFAULT 0,
  force INTEGER NOT NULL DEFAULT 0,
  gold INTEGER NOT NULL DEFAULT 0,
  position_q INTEGER NOT NULL DEFAULT 0,
  position_r INTEGER NOT NULL DEFAULT 0,
  turn_order INTEGER NOT NULL DEFAULT 0,
  is_connected BOOLEAN NOT NULL DEFAULT true,
  is_dead BOOLEAN NOT NULL DEFAULT false,
  skip_next_turn BOOLEAN NOT NULL DEFAULT false,
  turns_played INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour lookups fréquents
CREATE INDEX idx_games_code ON games(code);
CREATE INDEX idx_players_game_id ON players(game_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
