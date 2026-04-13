-- Seed : Événements aléatoires
-- Story 5.5

INSERT INTO game_events (name, description, event_type, zone, effects) VALUES

-- POSITIFS zone facile
('Trésor caché', 'Vous trouvez quelques pièces sous un rocher.', 'positive', 'easy', '{"gold": 10}'),
('Source de vie', 'Une source d''eau pure vous revigore.', 'positive', 'easy', '{"heal": 15}'),
('Marchand ambulant', 'Un marchand vous offre un pourboire pour l''avoir aidé.', 'positive', 'easy', '{"gold": 15}'),

-- NÉGATIFS zone facile
('Piège à ours', 'Vous marchez sur un piège caché !', 'negative', 'easy', '{"hp_loss": 10}'),
('Pickpocket', 'Un voleur subtilise quelques pièces.', 'negative', 'easy', '{"gold": -10}'),

-- POSITIFS zone moyenne
('Coffre oublié', 'Un ancien coffre contient de l''or !', 'positive', 'medium', '{"gold": 25}'),
('Bénédiction du sage', 'Un ermite vous soigne.', 'positive', 'medium', '{"heal": 25}'),
('Veine de minerai', 'Vous trouvez un filon de minerai précieux.', 'positive', 'medium', '{"gold": 30}'),

-- NÉGATIFS zone moyenne
('Éboulement', 'Des rochers s''effondrent sur vous !', 'negative', 'medium', '{"hp_loss": 15}'),
('Taxe du seigneur', 'Un garde exige une taxe de passage.', 'negative', 'medium', '{"gold": -20}'),

-- POSITIFS zone difficile
('Relique ancienne', 'Vous découvrez une relique de grande valeur.', 'positive', 'hard', '{"gold": 50}'),
('Fontaine magique', 'Une fontaine enchantée restaure vos forces.', 'positive', 'hard', '{"heal": 40}'),
('Trésor du dragon', 'Vous trouvez le trésor abandonné d''un dragon.', 'positive', 'hard', '{"gold": 60}'),

-- NÉGATIFS zone difficile
('Malédiction', 'Une ancienne malédiction vous frappe !', 'negative', 'hard', '{"hp_loss": 25}'),
('Brigands', 'Une bande de brigands vous dépouille.', 'negative', 'hard', '{"hp_loss": 10, "gold": -30}'),

-- POSITIFS zone finale
('Dernière offrande', 'Un esprit bienveillant vous prépare pour l''épreuve.', 'positive', 'final', '{"heal": 50, "gold": 30}'),

-- NÉGATIFS zone finale
('Piège mortel', 'Un piège vicieux protège la zone finale !', 'negative', 'final', '{"hp_loss": 30}');
