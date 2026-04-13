-- Tables pour les quêtes
-- Story 6.1, 6.2

-- Templates de quêtes (configurées par le prof)
CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  quest_type VARCHAR(20) NOT NULL DEFAULT 'classic'
    CHECK (quest_type IN ('classic', 'escape_game')),
  -- Objectifs : [{ type: "kill"|"collect"|"reach"|"answer", target: ..., count: N }]
  objectives JSONB NOT NULL DEFAULT '[]',
  -- Récompenses : { gold?: N, item_id?: UUID, xp?: N }
  rewards JSONB NOT NULL DEFAULT '{}',
  -- Zone où cette quête est proposée
  zone VARCHAR(20) NOT NULL DEFAULT 'easy'
    CHECK (zone IN ('easy', 'medium', 'hard', 'final')),
  -- Escape game : indices et puzzle
  escape_data JSONB,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quêtes actives par joueur
CREATE TABLE IF NOT EXISTS player_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES quests(id),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  -- Progression : { "kill": 3, "collect": 1, ... }
  progress JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'failed')),
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_player_quests_player ON player_quests(player_id);
CREATE INDEX idx_player_quests_status ON player_quests(player_id, status);

-- Indices escape game collectés par joueur
CREATE TABLE IF NOT EXISTS player_clues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES quests(id),
  clue_index INTEGER NOT NULL,
  clue_data JSONB NOT NULL DEFAULT '{}',
  found_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  shared BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_player_clues_player ON player_clues(player_id, quest_id);
