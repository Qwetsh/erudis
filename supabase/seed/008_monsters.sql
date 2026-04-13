-- Seed : Monstres thématiques par matière et zone
-- Story 8.1

INSERT INTO monsters (name, hp, atk, zone, subject, loot_gold, loot_table) VALUES

-- SVT
('Cellule Mutante', 30, 5, 'easy', 'svt', 10, '[]'),
('Virus Géant', 50, 8, 'medium', 'svt', 20, '[]'),
('Parasite Alpha', 80, 12, 'hard', 'svt', 40, '[]'),
('Chimère Génétique', 120, 15, 'final', 'svt', 60, '[]'),

-- Maths
('Fraction Instable', 30, 5, 'easy', 'maths', 10, '[]'),
('Polynôme Sauvage', 50, 8, 'medium', 'maths', 20, '[]'),
('Matrice Corrompue', 80, 12, 'hard', 'maths', 40, '[]'),
('Infini Déchaîné', 120, 15, 'final', 'maths', 60, '[]'),

-- Histoire-Géo
('Fantôme du Passé', 30, 5, 'easy', 'history-geo', 10, '[]'),
('Gardien des Ruines', 50, 8, 'medium', 'history-geo', 20, '[]'),
('Centurion Maudit', 80, 12, 'hard', 'history-geo', 40, '[]'),
('Titan Antique', 120, 15, 'final', 'history-geo', 60, '[]'),

-- Français
('Faute d''Orthographe', 30, 5, 'easy', 'french', 10, '[]'),
('Métaphore Sauvage', 50, 8, 'medium', 'french', 20, '[]'),
('Anacoluthe Vivante', 80, 12, 'hard', 'french', 40, '[]'),
('Léviathan Littéraire', 120, 15, 'final', 'french', 60, '[]');
