-- Ajout des colonnes pour mort/respawn et épreuve du brevet
-- Story 3.5

-- hp_max pour calculer le respawn à 100%
ALTER TABLE players ADD COLUMN IF NOT EXISTS hp_max INTEGER NOT NULL DEFAULT 100;

-- skip_next_turn : le joueur perd 1 tour après respawn
ALTER TABLE players ADD COLUMN IF NOT EXISTS skip_next_turn BOOLEAN NOT NULL DEFAULT false;

-- spawn_q/spawn_r : position de spawn pour le respawn
ALTER TABLE players ADD COLUMN IF NOT EXISTS spawn_q INTEGER NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS spawn_r INTEGER NOT NULL DEFAULT 0;

-- Suivi de l'épreuve du brevet
CREATE TABLE IF NOT EXISTS exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  questions_total INTEGER NOT NULL DEFAULT 7,
  questions_correct INTEGER NOT NULL DEFAULT 0,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX idx_exam_attempts_player ON exam_attempts(player_id);

-- Ajout du gagnant sur la table games
ALTER TABLE games ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES players(id);
