-- Tables pour l'inventaire et l'équipement
-- Story 4.3 + 4.4

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

CREATE INDEX idx_player_inventory_player ON player_inventory(player_id);
CREATE INDEX idx_player_inventory_equipped ON player_inventory(player_id, is_equipped);
