import type { GamePhase, Archetype, Subject } from '../types.ts';

/** Représentation d'une ligne de la table games */
export type GameRow = {
  id: string;
  code: string;
  phase: GamePhase;
  current_turn: number;
  current_player_index: number;
  config: Record<string, unknown>;
  winner_id: string | null;
  world: string;
  created_at: string;
  updated_at: string;
};

/** Représentation d'une ligne de la table players */
export type PlayerRow = {
  id: string;
  game_id: string;
  name: string;
  character_id: string | null;
  archetype: Archetype | null;
  hp: number;
  hp_max: number;
  atk: number;
  def: number;
  vit: number;
  force: number;
  gold: number;
  position_q: number;
  position_r: number;
  turns_played: number;
  is_connected: boolean;
  skip_next_turn: boolean;
  spawn_q: number;
  spawn_r: number;
  created_at: string;
  updated_at: string;
};

/** Représentation d'une ligne de la table characters */
export type CharacterRow = {
  id: string;
  name: string;
  archetype: Archetype;
  subject: Subject;
  hp: number;
  atk: number;
  def: number;
  vit: number;
  force: number;
  passive_name: string;
  passive_description: string;
  passive_modifier: Record<string, unknown>;
  created_at: string;
};

/** Représentation d'une ligne de la table questions */
export type QuestionRow = {
  id: string;
  subject: string;
  theme: string;
  difficulty: string;
  question_type: string;
  text: string;
  answers: string[];
  correct_index: number;
  explanation: string;
  created_at: string;
};

/** Représentation d'une ligne de player_question_history */
export type PlayerQuestionHistoryRow = {
  id: string;
  player_id: string;
  question_id: string;
  answered_correctly: boolean;
  answered_at: string;
};

/** Schéma Database pour le typage Supabase */
export type Database = {
  public: {
    Tables: {
      games: {
        Row: GameRow;
        Insert: Omit<GameRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<GameRow, 'id' | 'created_at'>>;
      };
      players: {
        Row: PlayerRow;
        Insert: Omit<PlayerRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PlayerRow, 'id' | 'created_at'>>;
      };
      characters: {
        Row: CharacterRow;
        Insert: Omit<CharacterRow, 'id' | 'created_at'>;
        Update: Partial<Omit<CharacterRow, 'id' | 'created_at'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
