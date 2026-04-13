-- Seed : Quêtes classiques et escape game
-- Stories 6.1, 6.2

INSERT INTO quests (name, description, quest_type, objectives, rewards, zone, escape_data) VALUES

-- Quêtes classiques
('Chasseur de slimes', 'Éliminez 3 slimes dans la zone facile.',
 'classic',
 '[{"type": "kill", "target": "slime", "count": 3}]',
 '{"gold": 30}',
 'easy', NULL),

('Herboriste', 'Récupérez 5 herbes médicinales.',
 'classic',
 '[{"type": "collect", "target": "herb", "count": 5}]',
 '{"gold": 40}',
 'easy', NULL),

('Explorateur des cavernes', 'Atteignez la grotte cachée et répondez à 5 questions.',
 'classic',
 '[{"type": "reach", "target": "cave", "count": 1}, {"type": "answer", "target": "svt", "count": 5}]',
 '{"gold": 60}',
 'medium', NULL),

('Tueur de trolls', 'Éliminez 5 trolls dans la zone difficile.',
 'classic',
 '[{"type": "kill", "target": "troll", "count": 5}]',
 '{"gold": 80}',
 'hard', NULL),

('Érudit', 'Répondez correctement à 10 questions de n''importe quel thème.',
 'classic',
 '[{"type": "answer", "target": "any", "count": 10}]',
 '{"gold": 50}',
 'easy', NULL),

-- Quête escape game
('Le Mystère du Laboratoire', 'Un ancien laboratoire contient un secret. Trouvez les 4 indices et résolvez l''énigme.',
 'escape_game',
 '[{"type": "collect_clue", "count": 4}]',
 '{"gold": 100}',
 'medium',
 '{"total_clues": 4, "clues": [
    {"index": 0, "hint": "Le premier chiffre est le nombre de pattes d''un insecte."},
    {"index": 1, "hint": "Le deuxième chiffre est le pH de l''eau pure."},
    {"index": 2, "hint": "Le troisième chiffre est le nombre de chromosomes humains divisé par 23."},
    {"index": 3, "hint": "Le dernier chiffre est le nombre de ventricules du cœur."}
  ], "solution": "6724", "rewards": {"gold": 150}}');
