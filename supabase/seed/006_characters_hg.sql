-- Seed : 6 personnages Histoire-Géo avec passifs
-- Story 8.1

INSERT INTO characters (name, archetype, subject, hp, atk, def, vit, force, passive_name, passive_description, passive_modifier) VALUES

-- Cartographe (Explorateur) : révèle 2 hex de plus lors du déplacement
('Cartographe', 'explorer', 'history-geo', 90, 8, 5, 3, 1,
 'Cartographie Avancée',
 'Révèle 2 hex supplémentaires autour de sa position.',
 '[]'
),

-- Légionnaire (Tank) : ignore le premier dégât reçu par combat
('Légionnaire', 'tank', 'history-geo', 140, 6, 9, 0, 2,
 'Bouclier du Centurion',
 'Le premier dégât reçu en combat est annulé.',
 '[]'
),

-- Conquérant (Frappeur) : dégâts ×1.5 en PvP
('Conquérant', 'striker', 'history-geo', 80, 14, 3, 1, 1,
 'Stratégie de Conquête',
 'Inflige 50% de dégâts supplémentaires en PvP.',
 '[{"trigger": "CALC_PVP_DAMAGE", "priority": 15, "condition": null, "effect": {"type": "MULTIPLY", "field": "damage", "value": 1.5}}]'
),

-- Diplomate (Marchand) : accès aux gates sans combat ni or
('Diplomate', 'merchant', 'history-geo', 100, 7, 5, 1, 3,
 'Laissez-Passer Diplomatique',
 'Peut passer les gates gratuitement.',
 '[]'
),

-- Archéologue (Savant) : coffres donnent 50% d''or en plus
('Archéologue', 'scholar', 'history-geo', 100, 9, 6, 1, 1,
 'Fouilles Expertes',
 'Les coffres rapportent 50% d''or supplémentaire.',
 '[]'
),

-- Éclaireur (Éclaireur) : coût plaine réduit à 0
('Messager', 'scout', 'history-geo', 85, 8, 4, 4, 1,
 'Routes Impériales',
 'Se déplace gratuitement sur les plaines.',
 '[{"trigger": "TERRAIN_COST", "priority": 20, "condition": {"field": "terrain", "operator": "==", "value": "plain"}, "effect": {"type": "SET", "field": "cost", "value": 0}}]'
);
