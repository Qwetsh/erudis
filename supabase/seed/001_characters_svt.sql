-- Seed : 6 personnages SVT avec passifs sous forme de modifiers JSONB
-- Story 4.2 : Personnages SVT et Passifs

INSERT INTO characters (name, archetype, subject, hp, atk, def, vit, force, passive_name, passive_description, passive_modifier) VALUES

-- Écologue (Explorateur) : coût terrain forêt/marais réduit à 1
('Écologue', 'explorer', 'svt', 90, 8, 5, 3, 1,
 'Affinité Naturelle',
 'Réduit le coût de déplacement en forêt et marais à 1.',
 '[{"trigger": "TERRAIN_COST", "priority": 20, "condition": {"field": "terrain", "operator": "==", "value": "forest"}, "effect": {"type": "SET", "field": "cost", "value": 1}},
   {"trigger": "TERRAIN_COST", "priority": 20, "condition": {"field": "terrain", "operator": "==", "value": "swamp"}, "effect": {"type": "SET", "field": "cost", "value": 1}}]'
),

-- Vétérinaire (Tank) : récupère 20% PV max après combat gagné
('Vétérinaire', 'tank', 'svt', 140, 6, 9, 0, 2,
 'Instinct de Survie',
 'Récupère 20% de ses PV max après avoir gagné un combat.',
 '[{"trigger": "CALC_PVE_DAMAGE", "priority": 90, "condition": null, "effect": {"type": "TRIGGER", "field": "", "value": {"action": "heal_on_win", "percent": 0.2}}}]'
),

-- Laborantin (Frappeur) : multiplicateur cash ×10 au lieu de ×8
('Laborantin', 'striker', 'svt', 80, 14, 3, 1, 1,
 'Réaction Explosive',
 'Le multiplicateur de dégâts "cash" passe à ×10.',
 '[{"trigger": "CALC_PVE_DAMAGE", "priority": 15, "condition": {"field": "questionType", "operator": "==", "value": "cash"}, "effect": {"type": "SET", "field": "multiplier", "value": 10}}]'
),

-- Ingénieur Env. (Marchand) : revend objets au double
('Ingénieur Env.', 'merchant', 'svt', 100, 7, 5, 1, 3,
 'Recyclage Expert',
 'Revend les objets au double de leur prix de revente normal.',
 '[]'
),

-- Médecin (Savant) : supprime 1 mauvaise réponse sur "Corps humain" 1×/combat
('Médecin', 'scholar', 'svt', 100, 9, 6, 1, 1,
 'Diagnostic Précis',
 'Sur les questions "Corps humain", une mauvaise réponse est éliminée (1×/combat).',
 '[]'
),

-- Géologue (Éclaireur) : coût terrain montagne réduit à 1
('Géologue', 'scout', 'svt', 85, 8, 4, 4, 1,
 'Spéléologue',
 'Réduit le coût de déplacement en montagne à 1.',
 '[{"trigger": "TERRAIN_COST", "priority": 20, "condition": {"field": "terrain", "operator": "==", "value": "mountain"}, "effect": {"type": "SET", "field": "cost", "value": 1}}]'
);
