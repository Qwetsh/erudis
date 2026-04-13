-- Seed : 6 personnages Maths avec passifs
-- Story 8.1

INSERT INTO characters (name, archetype, subject, hp, atk, def, vit, force, passive_name, passive_description, passive_modifier) VALUES

-- Mathématicien (Explorateur) : +2 VIT sur routes
('Arpenteur', 'explorer', 'maths', 90, 8, 5, 3, 1,
 'Calcul de Trajectoire',
 'Gagne +2 VIT quand il se déplace sur des routes.',
 '[{"trigger": "TERRAIN_COST", "priority": 20, "condition": {"field": "terrain", "operator": "==", "value": "road"}, "effect": {"type": "ADD", "field": "vitBonus", "value": 2}}]'
),

-- Statisticien (Tank) : réduit les dégâts reçus de 15%
('Statisticien', 'tank', 'maths', 140, 6, 9, 0, 2,
 'Loi des Grands Nombres',
 'Réduit les dégâts reçus de 15%.',
 '[{"trigger": "CALC_PVE_RECEIVED_DAMAGE", "priority": 50, "condition": null, "effect": {"type": "MULTIPLY", "field": "damage", "value": 0.85}}]'
),

-- Algébriste (Frappeur) : dégâts ×1.5 sur questions "Équations"
('Algébriste', 'striker', 'maths', 80, 14, 3, 1, 1,
 'Variable Fatale',
 'Inflige 50% de dégâts supplémentaires sur les questions "Équations".',
 '[{"trigger": "CALC_PVE_DAMAGE", "priority": 15, "condition": {"field": "questionTheme", "operator": "==", "value": "equations"}, "effect": {"type": "MULTIPLY", "field": "damage", "value": 1.5}}]'
),

-- Comptable (Marchand) : achète 20% moins cher
('Comptable', 'merchant', 'maths', 100, 7, 5, 1, 3,
 'Négociation Optimale',
 'Tous les achats coûtent 20% moins cher.',
 '[]'
),

-- Géomètre (Savant) : vision +1 hex
('Géomètre', 'scholar', 'maths', 100, 9, 6, 1, 1,
 'Vision Euclidienne',
 'Augmente le rayon de vision de 1 hex.',
 '[]'
),

-- Probabiliste (Éclaireur) : relance le dé une fois par tour
('Probabiliste', 'scout', 'maths', 85, 8, 4, 4, 1,
 'Second Jet',
 'Peut relancer son dé de déplacement une fois par tour.',
 '[]'
);
