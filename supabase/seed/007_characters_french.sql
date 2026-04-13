-- Seed : 6 personnages Français avec passifs
-- Story 8.1

INSERT INTO characters (name, archetype, subject, hp, atk, def, vit, force, passive_name, passive_description, passive_modifier) VALUES

-- Poète (Explorateur) : gagne 5 or par hex découvert
('Poète Errant', 'explorer', 'french', 90, 8, 5, 3, 1,
 'Inspiration Vagabonde',
 'Gagne 5 or à chaque nouvel hex découvert.',
 '[]'
),

-- Grammairien (Tank) : +3 DEF permanent
('Grammairien', 'tank', 'french', 140, 6, 9, 0, 2,
 'Règle Absolue',
 'Sa maîtrise grammaticale lui confère +3 DEF.',
 '[{"trigger": "CALC_PVE_RECEIVED_DAMAGE", "priority": 10, "condition": null, "effect": {"type": "ADD", "field": "defBonus", "value": 3}}]'
),

-- Rhéteur (Frappeur) : dégâts doublés sur la première question d''un combat
('Rhéteur', 'striker', 'french', 80, 14, 3, 1, 1,
 'Premier Argument',
 'Les dégâts de la première question d''un combat sont doublés.',
 '[]'
),

-- Conteur (Marchand) : les rencontres narratives donnent toujours des récompenses
('Conteur', 'merchant', 'french', 100, 7, 5, 1, 3,
 'Art du Récit',
 'Les rencontres narratives donnent toujours un bonus d''or.',
 '[]'
),

-- Lexicographe (Savant) : +5s sur le timer PvP
('Lexicographe', 'scholar', 'french', 100, 9, 6, 1, 1,
 'Maîtrise du Temps',
 'Gagne 5 secondes supplémentaires en PvP.',
 '[{"trigger": "QUESTION_TIMER", "priority": 10, "condition": null, "effect": {"type": "ADD", "field": "timer", "value": 5}}]'
),

-- Troubadour (Éclaireur) : +1 au résultat du dé
('Troubadour', 'scout', 'french', 85, 8, 4, 4, 1,
 'Chanson de Route',
 'Ajoute +1 au résultat de chaque lancer de dé.',
 '[{"trigger": "ROLL_DICE", "priority": 10, "condition": null, "effect": {"type": "ADD", "field": "roll", "value": 1}}]'
);
