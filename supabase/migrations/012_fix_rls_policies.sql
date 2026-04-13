-- Fix RLS: allow both anon and authenticated roles full access to game tables
-- These tables don't need per-user restrictions (educational game, no auth required)

-- Games
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "games_all_access" ON public.games;
CREATE POLICY "games_all_access" ON public.games
  FOR ALL USING (true) WITH CHECK (true);

-- Players
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "players_all_access" ON public.players;
CREATE POLICY "players_all_access" ON public.players
  FOR ALL USING (true) WITH CHECK (true);

-- Map hexes
ALTER TABLE public.map_hexes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "map_hexes_all_access" ON public.map_hexes;
CREATE POLICY "map_hexes_all_access" ON public.map_hexes
  FOR ALL USING (true) WITH CHECK (true);

-- Characters
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "characters_all_access" ON public.characters;
CREATE POLICY "characters_all_access" ON public.characters
  FOR ALL USING (true) WITH CHECK (true);

-- Monsters
ALTER TABLE public.monsters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "monsters_all_access" ON public.monsters;
CREATE POLICY "monsters_all_access" ON public.monsters
  FOR ALL USING (true) WITH CHECK (true);

-- Questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "questions_all_access" ON public.questions;
CREATE POLICY "questions_all_access" ON public.questions
  FOR ALL USING (true) WITH CHECK (true);

-- Encounters
ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "encounters_all_access" ON public.encounters;
CREATE POLICY "encounters_all_access" ON public.encounters
  FOR ALL USING (true) WITH CHECK (true);

-- Game events
ALTER TABLE public.game_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "game_events_all_access" ON public.game_events;
CREATE POLICY "game_events_all_access" ON public.game_events
  FOR ALL USING (true) WITH CHECK (true);

-- Quests
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quests_all_access" ON public.quests;
CREATE POLICY "quests_all_access" ON public.quests
  FOR ALL USING (true) WITH CHECK (true);

-- Items (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'items' AND table_schema = 'public') THEN
    ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "items_all_access" ON public.items;
    CREATE POLICY "items_all_access" ON public.items FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Player inventory (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'player_inventory' AND table_schema = 'public') THEN
    ALTER TABLE public.player_inventory ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "player_inventory_all_access" ON public.player_inventory;
    CREATE POLICY "player_inventory_all_access" ON public.player_inventory FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Player question history (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'player_question_history' AND table_schema = 'public') THEN
    ALTER TABLE public.player_question_history ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "player_question_history_all_access" ON public.player_question_history;
    CREATE POLICY "player_question_history_all_access" ON public.player_question_history FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
