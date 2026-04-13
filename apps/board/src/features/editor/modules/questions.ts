import { z } from 'zod';
import type { EditorModuleConfig } from '../types';

const questionSchema = z.object({
  subject: z.enum(['svt', 'maths', 'history-geo', 'french']),
  theme: z.string().min(1, 'Thème requis'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  question_type: z.enum(['duo', 'quatre', 'cash']),
  text: z.string().min(1, 'Texte requis'),
  answers: z.unknown().default([]),
  correct_index: z.number().min(0),
  explanation: z.string().default(''),
});

export const questionsModule: EditorModuleConfig = {
  tableName: 'questions',
  title: 'Questions',
  schema: questionSchema,
  searchField: 'text',
  defaultValues: {
    subject: 'svt',
    theme: '',
    difficulty: 'easy',
    question_type: 'duo',
    text: '',
    answers: ['', ''],
    correct_index: 0,
    explanation: '',
  },
  fields: [
    {
      name: 'subject',
      label: 'Matière',
      type: 'select',
      options: [
        { value: 'svt', label: 'SVT' },
        { value: 'maths', label: 'Maths' },
        { value: 'history-geo', label: 'Histoire-Géo' },
        { value: 'french', label: 'Français' },
      ],
    },
    { name: 'theme', label: 'Thème', type: 'text', required: true },
    {
      name: 'difficulty',
      label: 'Difficulté',
      type: 'select',
      options: [
        { value: 'easy', label: 'Facile' },
        { value: 'medium', label: 'Moyen' },
        { value: 'hard', label: 'Difficile' },
      ],
    },
    {
      name: 'question_type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'duo', label: 'Duo (2 choix)' },
        { value: 'quatre', label: 'Quatre (4 choix)' },
        { value: 'cash', label: 'Cash (réponse ouverte)' },
      ],
    },
    { name: 'text', label: 'Question', type: 'textarea', required: true },
    { name: 'answers', label: 'Réponses', type: 'json', placeholder: '["réponse A", "réponse B"]' },
    { name: 'correct_index', label: 'Index correct (0-based)', type: 'number' },
    { name: 'explanation', label: 'Explication', type: 'textarea' },
  ],
};
