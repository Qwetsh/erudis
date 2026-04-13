-- Configuration live et logs
-- Story 7.6

CREATE TABLE IF NOT EXISTS game_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_id, key)
);

CREATE INDEX idx_game_config_game ON game_config(game_id);

-- Logs de jeu pour statistiques
CREATE TABLE IF NOT EXISTS game_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  event_type VARCHAR(50) NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_game_logs_game ON game_logs(game_id);
CREATE INDEX idx_game_logs_player ON game_logs(player_id);
CREATE INDEX idx_game_logs_type ON game_logs(game_id, event_type);

-- Templates de configuration
CREATE TABLE IF NOT EXISTS config_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
