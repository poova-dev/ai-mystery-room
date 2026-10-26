import { z } from 'zod';

export const DIFFICULTY_CONFIG = {
  easy: { suspects: 3, clues: 5, hints: 2, basePoints: 100 },
  medium: { suspects: 4, clues: 7, hints: 3, basePoints: 150 },
  hard: { suspects: 5, clues: 9, hints: 3, basePoints: 200 },
};

const SuspectAiSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  role: z.string().trim().min(1),
  description: z.string().trim().min(1),
  alibi: z.string().trim().min(1),
});

const ClueAiSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  detail: z.string().trim().min(1),
  relevance: z.string().trim().min(1),
});

const HintAiSchema = z.object({
  id: z.string().trim().min(1),
  text: z.string().trim().min(1),
});

const ClueReasoningAiSchema = z.object({
  clueId: z.string().trim().min(1),
  reason: z.string().trim().min(1),
});

const SolutionAiSchema = z.object({
  culpritSuspectId: z.string().trim().min(1),
  motive: z.string().trim().min(1),
  method: z.string().trim().min(1),
  explanation: z.string().trim().min(1),
  clueReasoning: z.array(ClueReasoningAiSchema).min(1),
});

export const BaseAiCaseSchema = z.object({
  title: z.string().trim().min(3).max(120),
  story: z.string().trim().min(50).max(3000),
  suspects: z.array(SuspectAiSchema),
  clues: z.array(ClueAiSchema),
  hints: z.array(HintAiSchema),
  solution: SolutionAiSchema,
});

/**
 * Validate AI-generated mystery against difficulty constraints and logical consistency
 * @param {object} data
 * @param {'easy'|'medium'|'hard'} difficulty
 */
export const validateAiCase = (data, difficulty) => {
  const parsed = BaseAiCaseSchema.parse(data);
  const config = DIFFICULTY_CONFIG[difficulty];

  if (!config) {
    throw new Error(`Unknown difficulty: ${difficulty}`);
  }

  // Exact count checks
  if (parsed.suspects.length !== config.suspects) {
    throw new Error(`Expected exactly ${config.suspects} suspects for ${difficulty}, got ${parsed.suspects.length}`);
  }
  if (parsed.clues.length !== config.clues) {
    throw new Error(`Expected exactly ${config.clues} clues for ${difficulty}, got ${parsed.clues.length}`);
  }
  if (parsed.hints.length !== config.hints) {
    throw new Error(`Expected exactly ${config.hints} hints for ${difficulty}, got ${parsed.hints.length}`);
  }

  // Unique ID checks
  const suspectIds = new Set(parsed.suspects.map((s) => s.id));
  if (suspectIds.size !== parsed.suspects.length) {
    throw new Error('Duplicate suspect IDs detected in AI response.');
  }

  const clueIds = new Set(parsed.clues.map((c) => c.id));
  if (clueIds.size !== parsed.clues.length) {
    throw new Error('Duplicate clue IDs detected in AI response.');
  }

  const hintIds = new Set(parsed.hints.map((h) => h.id));
  if (hintIds.size !== parsed.hints.length) {
    throw new Error('Duplicate hint IDs detected in AI response.');
  }

  // Solution reference consistency
  if (!suspectIds.has(parsed.solution.culpritSuspectId)) {
    throw new Error(`Culprit suspect ID '${parsed.solution.culpritSuspectId}' does not match any generated suspect.`);
  }

  for (const reasoning of parsed.solution.clueReasoning) {
    if (!clueIds.has(reasoning.clueId)) {
      throw new Error(`Clue reasoning references unknown clueId: '${reasoning.clueId}'.`);
    }
  }

  return parsed;
};

export default {
  DIFFICULTY_CONFIG,
  BaseAiCaseSchema,
  validateAiCase,
};
