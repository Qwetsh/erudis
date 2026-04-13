-- Seed : Embuscades et Rencontres Narratives
-- Story 3.4

INSERT INTO encounters (name, encounter_type, zone, description, ambush_penalty, choices, spawn_chance) VALUES

-- === EMBUSCADES ===
('Embuscade Gobelin', 'ambush', 'easy', 'Un gobelin surgit des buissons !',
 '{"hp_loss": 5, "gold_loss": 10}', '[]', 0.3),

('Embuscade Bandit', 'ambush', 'medium', 'Un bandit vous tend une embuscade !',
 '{"hp_loss": 10, "gold_loss": 20}', '[]', 0.3),

('Embuscade Troll', 'ambush', 'hard', 'Un troll bloque le passage !',
 '{"hp_loss": 15, "gold_loss": 30}', '[]', 0.25),

('Embuscade Dragon', 'ambush', 'final', 'Un dragon crache des flammes !',
 '{"hp_loss": 25, "gold_loss": 50}', '[]', 0.2),

-- === RENCONTRES NARRATIVES ===
('Le Loup Blessé', 'narrative', 'easy',
 'Vous trouvez un loup blessé sur le chemin.',
 '{}',
 '[
   {"label": "Le soigner", "consequence": {"type": "reward", "gold": 20, "description": "Le loup vous guide vers un trésor caché !"}},
   {"label": "L''éviter", "consequence": {"type": "neutral", "description": "Vous passez votre chemin sans encombre."}},
   {"label": "L''attaquer", "consequence": {"type": "combat", "monster_hp": 30, "monster_atk": 5, "description": "Le loup se défend férocement !"}}
 ]', 0.4),

('Le Marchand Mystérieux', 'narrative', 'medium',
 'Un marchand encapuchonné vous propose un marché.',
 '{}',
 '[
   {"label": "Accepter le marché (30 or)", "consequence": {"type": "reward", "gold": -30, "heal": 50, "description": "Il vous donne une potion de soin puissante."}},
   {"label": "Décliner poliment", "consequence": {"type": "neutral", "description": "Le marchand disparaît dans l''ombre."}},
   {"label": "Tenter de le voler", "consequence": {"type": "penalty", "hp_loss": 15, "description": "Le marchand était un mage déguisé ! Il vous foudroie."}}
 ]', 0.35),

('Le Pont Fragile', 'narrative', 'medium',
 'Un pont de corde enjambe un précipice. Il semble fragile.',
 '{}',
 '[
   {"label": "Traverser prudemment", "consequence": {"type": "reward", "gold": 15, "description": "Vous trouvez des pièces abandonnées de l''autre côté."}},
   {"label": "Chercher un autre chemin", "consequence": {"type": "neutral", "description": "Vous faites un détour sans incident."}},
   {"label": "Foncer sans réfléchir", "consequence": {"type": "penalty", "hp_loss": 20, "description": "Le pont cède sous votre poids !"}}
 ]', 0.3),

('Le Sanctuaire Oublié', 'narrative', 'hard',
 'Vous découvrez un autel ancien couvert de runes.',
 '{}',
 '[
   {"label": "Prier à l''autel", "consequence": {"type": "reward", "heal": 30, "description": "Une énergie bienfaisante vous envahit."}},
   {"label": "Prendre l''offrande", "consequence": {"type": "reward", "gold": 50, "description": "Vous empochez les pièces d''or laissées en offrande."}},
   {"label": "Détruire l''autel", "consequence": {"type": "penalty", "hp_loss": 30, "description": "Une malédiction s''abat sur vous !"}}
 ]', 0.25),

('Le Gardien du Passage', 'narrative', 'hard',
 'Un gardien spectral vous barre la route.',
 '{}',
 '[
   {"label": "Répondre à son énigme", "consequence": {"type": "reward", "gold": 40, "heal": 20, "description": "Le gardien vous laisse passer et vous bénit."}},
   {"label": "Payer le tribut (40 or)", "consequence": {"type": "reward", "gold": -40, "description": "Le gardien s''efface silencieusement."}},
   {"label": "Forcer le passage", "consequence": {"type": "combat", "monster_hp": 80, "monster_atk": 12, "description": "Le gardien prend forme et attaque !"}}
 ]', 0.3);
