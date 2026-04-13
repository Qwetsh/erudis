export { supabase } from './client.ts';
export type { Database, GameRow, PlayerRow, CharacterRow, QuestionRow, PlayerQuestionHistoryRow } from './types.ts';
export { createGame, joinGame, startGame } from './game-service.ts';
