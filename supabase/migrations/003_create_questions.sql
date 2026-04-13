-- Tables pour le système de questions
-- Story 3.1 : Banque de questions + anti-répétition

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject VARCHAR(20) NOT NULL
    CHECK (subject IN ('svt', 'maths', 'history-geo', 'french')),
  theme VARCHAR(100) NOT NULL,
  difficulty VARCHAR(10) NOT NULL
    CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_type VARCHAR(10) NOT NULL
    CHECK (question_type IN ('duo', 'quatre', 'cash')),
  text TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '[]',
  correct_index INTEGER NOT NULL DEFAULT 0,
  explanation TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Historique des questions posées à chaque joueur (anti-répétition)
CREATE TABLE IF NOT EXISTS player_question_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answered_correctly BOOLEAN NOT NULL DEFAULT false,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_subject ON questions(subject);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_type ON questions(question_type);
CREATE INDEX idx_pqh_player_id ON player_question_history(player_id);
CREATE INDEX idx_pqh_question_id ON player_question_history(question_id);
