-- Tables pour les boutiques, coffres, gates, événements
-- Stories 5.1, 5.3, 5.4, 5.5

-- Boutiques avec stock fixe par case
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  q INTEGER NOT NULL,
  r INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_id, q, r)
);

-- Stock de chaque boutique
CREATE TABLE IF NOT EXISTS shop_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  stock INTEGER NOT NULL DEFAULT 1,
  price_override INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shop_inventory_shop ON shop_inventory(shop_id);

-- Coffres sur la carte
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

-- Tables de loot configurables
CREATE TABLE IF NOT EXISTS loot_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  zone VARCHAR(20) NOT NULL DEFAULT 'easy'
    CHECK (zone IN ('easy', 'medium', 'hard', 'final')),
  entries JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Gates entre zones
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

-- Événements aléatoires (préfixé game_ pour éviter conflit avec table events existante)
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
