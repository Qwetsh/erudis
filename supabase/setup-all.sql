-- ============================================================
-- ÉRUDIS - Setup complet de la base de données
-- À exécuter dans le SQL Editor du Dashboard Supabase
-- ============================================================

-- ============ MIGRATION 001 : Tables de base ============

CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) NOT NULL UNIQUE,
  phase VARCHAR(20) NOT NULL DEFAULT 'lobby'
    CHECK (phase IN ('lobby', 'playing', 'gameOver')),
  current_turn INTEGER NOT NULL DEFAULT 0,
  current_player_index INTEGER NOT NULL DEFAULT 0,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  archetype VARCHAR(20) NOT NULL
    CHECK (archetype IN ('explorer', 'tank', 'striker', 'merchant', 'scholar', 'scout')),
  subject VARCHAR(20) NOT NULL DEFAULT 'svt'
    CHECK (subject IN ('svt', 'maths', 'history-geo', 'french')),
  hp INTEGER NOT NULL DEFAULT 100,
  atk INTEGER NOT NULL DEFAULT 8,
  def INTEGER NOT NULL DEFAULT 5,
  vit INTEGER NOT NULL DEFAULT 1,
  force INTEGER NOT NULL DEFAULT 1,
  passive_name VARCHAR(100) NOT NULL DEFAULT '',
  passive_description TEXT NOT NULL DEFAULT '',
  passive_modifier JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  character_id UUID REFERENCES characters(id),
  archetype VARCHAR(20),
  hp INTEGER NOT NULL DEFAULT 100,
  atk INTEGER NOT NULL DEFAULT 8,
  def INTEGER NOT NULL DEFAULT 5,
  vit INTEGER NOT NULL DEFAULT 1,
  force INTEGER NOT NULL DEFAULT 1,
  gold INTEGER NOT NULL DEFAULT 0,
  position_q INTEGER NOT NULL DEFAULT 0,
  position_r INTEGER NOT NULL DEFAULT 0,
  turns_played INTEGER NOT NULL DEFAULT 0,
  is_connected BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_players_game ON players(game_id);
CREATE INDEX IF NOT EXISTS idx_games_code ON games(code);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
  CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============ MIGRATION 002 : Carte hexagonale ============

CREATE TABLE IF NOT EXISTS map_hexes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  q INTEGER NOT NULL,
  r INTEGER NOT NULL,
  terrain VARCHAR(20) NOT NULL DEFAULT 'plain'
    CHECK (terrain IN ('road', 'plain', 'forest', 'swamp', 'mountain', 'impassable')),
  zone VARCHAR(20) NOT NULL DEFAULT 'easy'
    CHECK (zone IN ('easy', 'medium', 'hard', 'final')),
  poi VARCHAR(30),
  discovered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_id, q, r)
);

CREATE INDEX IF NOT EXISTS idx_map_hexes_game ON map_hexes(game_id);
CREATE INDEX IF NOT EXISTS idx_map_hexes_lookup ON map_hexes(game_id, q, r);

-- ============ MIGRATION 003 : Questions ============

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject VARCHAR(20) NOT NULL
    CHECK (subject IN ('svt', 'maths', 'history-geo', 'french')),
  theme VARCHAR(100) NOT NULL,
  difficulty VARCHAR(20) NOT NULL DEFAULT 'easy'
    CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_type VARCHAR(20) NOT NULL DEFAULT 'duo'
    CHECK (question_type IN ('duo', 'quatre', 'cash')),
  text TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '[]',
  correct_index INTEGER NOT NULL DEFAULT 0,
  explanation TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(subject, difficulty);

CREATE TABLE IF NOT EXISTS player_question_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  answered_correctly BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pqh_player ON player_question_history(player_id);

-- ============ MIGRATION 004 : Items et Inventaire ============

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  item_type VARCHAR(20) NOT NULL
    CHECK (item_type IN ('equipment', 'consumable')),
  equip_slot VARCHAR(20)
    CHECK (equip_slot IS NULL OR equip_slot IN ('head', 'body', 'tool', 'accessory')),
  rarity VARCHAR(20) NOT NULL DEFAULT 'common'
    CHECK (rarity IN ('common', 'rare', 'legendary')),
  use_context VARCHAR(20)
    CHECK (use_context IS NULL OR use_context IN ('combat', 'map_own_turn', 'anytime')),
  stats JSONB NOT NULL DEFAULT '{}',
  modifiers JSONB NOT NULL DEFAULT '[]',
  buy_price INTEGER NOT NULL DEFAULT 0,
  sell_price INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS player_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  is_equipped BOOLEAN NOT NULL DEFAULT false,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_player_inventory_player ON player_inventory(player_id);
CREATE INDEX IF NOT EXISTS idx_player_inventory_equipped ON player_inventory(player_id, is_equipped);

-- ============ MIGRATION 005 : Encounters ============

CREATE TABLE IF NOT EXISTS encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  encounter_type VARCHAR(20) NOT NULL
    CHECK (encounter_type IN ('ambush', 'narrative')),
  zone VARCHAR(20) NOT NULL DEFAULT 'easy'
    CHECK (zone IN ('easy', 'medium', 'hard', 'final')),
  description TEXT NOT NULL DEFAULT '',
  ambush_penalty JSONB NOT NULL DEFAULT '{}',
  choices JSONB NOT NULL DEFAULT '[]',
  spawn_chance FLOAT NOT NULL DEFAULT 0.3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE INDEX IF NOT EXISTS idx_hex_encounters_game ON hex_encounters(game_id);
CREATE INDEX IF NOT EXISTS idx_hex_encounters_lookup ON hex_encounters(game_id, q, r);

-- ============ MIGRATION 006 : Mort/Respawn/Exam ============

ALTER TABLE players ADD COLUMN IF NOT EXISTS hp_max INTEGER NOT NULL DEFAULT 100;
ALTER TABLE players ADD COLUMN IF NOT EXISTS skip_next_turn BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE players ADD COLUMN IF NOT EXISTS spawn_q INTEGER NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS spawn_r INTEGER NOT NULL DEFAULT 0;

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

CREATE INDEX IF NOT EXISTS idx_exam_attempts_player ON exam_attempts(player_id);

ALTER TABLE games ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES players(id);

-- ============ MIGRATION 007 : Boutiques, Coffres, Gates, Events ============

CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  q INTEGER NOT NULL,
  r INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_id, q, r)
);

CREATE TABLE IF NOT EXISTS shop_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  stock INTEGER NOT NULL DEFAULT 1,
  price_override INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shop_inventory_shop ON shop_inventory(shop_id);

CREATE TABLE IF NOT EXISTS chests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  q INTEGER NOT NULL,
  r INTEGER NOT NULL,
  opened BOOLEAN NOT NULL DEFAULT false,
  opened_by UUID REFERENCES players(id),
  opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_id, q, r)
);

CREATE TABLE IF NOT EXISTS loot_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  zone VARCHAR(20) NOT NULL DEFAULT 'easy'
    CHECK (zone IN ('easy', 'medium', 'hard', 'final')),
  entries JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  q INTEGER NOT NULL,
  r INTEGER NOT NULL,
  from_zone VARCHAR(20) NOT NULL,
  to_zone VARCHAR(20) NOT NULL,
  gold_cost INTEGER NOT NULL DEFAULT 50,
  combat_monster_hp INTEGER NOT NULL DEFAULT 60,
  combat_monster_atk INTEGER NOT NULL DEFAULT 10,
  resolved_by JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_id, q, r)
);

-- game_events (nommé ainsi pour éviter conflit avec table "events" existante)
CREATE TABLE IF NOT EXISTS game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  event_type VARCHAR(20) NOT NULL DEFAULT 'positive'
    CHECK (event_type IN ('positive', 'negative')),
  zone VARCHAR(20) NOT NULL DEFAULT 'easy'
    CHECK (zone IN ('easy', 'medium', 'hard', 'final')),
  effects JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ MIGRATION 008 : Quêtes ============

CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  quest_type VARCHAR(20) NOT NULL DEFAULT 'classic'
    CHECK (quest_type IN ('classic', 'escape_game')),
  objectives JSONB NOT NULL DEFAULT '[]',
  rewards JSONB NOT NULL DEFAULT '{}',
  zone VARCHAR(20) NOT NULL DEFAULT 'easy'
    CHECK (zone IN ('easy', 'medium', 'hard', 'final')),
  escape_data JSONB,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS player_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES quests(id),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  progress JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'failed')),
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_player_quests_player ON player_quests(player_id);
CREATE INDEX IF NOT EXISTS idx_player_quests_status ON player_quests(player_id, status);

CREATE TABLE IF NOT EXISTS player_clues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES quests(id),
  clue_index INTEGER NOT NULL,
  clue_data JSONB NOT NULL DEFAULT '{}',
  found_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  shared BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_player_clues_player ON player_clues(player_id, quest_id);

-- ============ MIGRATION 009 : Monstres ============

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

-- ============ MIGRATION 010 : Config et Logs ============

CREATE TABLE IF NOT EXISTS game_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_id, key)
);

CREATE INDEX IF NOT EXISTS idx_game_config_game ON game_config(game_id);

CREATE TABLE IF NOT EXISTS game_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  event_type VARCHAR(50) NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_logs_game ON game_logs(game_id);
CREATE INDEX IF NOT EXISTS idx_game_logs_player ON game_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_game_logs_type ON game_logs(game_id, event_type);

CREATE TABLE IF NOT EXISTS config_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ MIGRATION 011 : Mondes et Portails ============

ALTER TABLE games ADD COLUMN IF NOT EXISTS world VARCHAR(20) DEFAULT 'bioma'
  CHECK (world IS NULL OR world IN ('bioma', 'arithmos', 'chronos', 'lexica'));

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

CREATE INDEX IF NOT EXISTS idx_portals_game ON portals(game_id);
CREATE INDEX IF NOT EXISTS idx_portals_lookup ON portals(game_id, from_q, from_r);

-- ============ RLS : Autoriser l'accès public pour le MVP ============

ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_hexes ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE hex_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE chests ENABLE ROW LEVEL SECURITY;
ALTER TABLE loot_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_clues ENABLE ROW LEVEL SECURITY;
ALTER TABLE monsters ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE portals ENABLE ROW LEVEL SECURITY;

-- Policies permissives pour le MVP (anon peut tout faire)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'games','players','characters','questions','items','player_inventory',
    'map_hexes','encounters','hex_encounters','exam_attempts',
    'shops','shop_inventory','chests','loot_tables','gates','game_events',
    'quests','player_quests','player_clues','monsters',
    'game_config','game_logs','config_templates','portals'
  ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s_anon_select" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_anon_select" ON %I FOR SELECT TO anon USING (true)', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s_anon_insert" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_anon_insert" ON %I FOR INSERT TO anon WITH CHECK (true)', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s_anon_update" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_anon_update" ON %I FOR UPDATE TO anon USING (true) WITH CHECK (true)', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s_anon_delete" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_anon_delete" ON %I FOR DELETE TO anon USING (true)', tbl, tbl);
  END LOOP;
END $$;

-- ============ ENABLE REALTIME ============

ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE map_hexes;
