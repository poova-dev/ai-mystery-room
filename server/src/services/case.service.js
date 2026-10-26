import { Case } from '../models/Case.js';
import { generateMysteryCase } from './gemini.service.js';
import { isDbConnected } from '../config/db.js';
import { ApiError } from '../utils/api-error.js';

/**
 * Creates and persists a new mystery case after AI generation and validation.
 *
 * @param {object} params
 * @param {string} params.premise
 * @param {'easy'|'medium'|'hard'} params.difficulty
 * @param {object} [options] - Optional generation options (e.g., aiClient, skipDbSave for testing)
 * @returns {Promise<object>} Created Case document
 */
export const createCase = async ({ premise, difficulty }, options = {}) => {
  // 1. Generate structured mystery content via Gemini service
  const generated = await generateMysteryCase({ premise, difficulty }, options);

  // 2. Prepare Case document payload
  const casePayload = {
    title: generated.title,
    story: generated.story,
    premise,
    difficulty,
    suspects: generated.suspects,
    clues: generated.clues,
    hints: generated.hints,
    solution: generated.solution,
    progress: {
      discoveredClueIds: [],
      usedHintIds: [],
    },
    status: 'active',
    accusation: {
      suspectId: null,
      isCorrect: null,
      submittedAt: null,
    },
    score: {
      basePoints: 0,
      cluePoints: 0,
      hintPenalty: 0,
      finalScore: 0,
    },
  };

  // 3. Check for mock/skip save option during dry-run testing
  if (options.skipDbSave) {
    const mockCase = new Case(casePayload);
    return mockCase;
  }

  // 4. Verify database connectivity before saving
  if (!isDbConnected()) {
    throw new ApiError(
      503,
      'DATABASE_UNAVAILABLE',
      'Database connection is currently unavailable. Please verify MONGODB_URI configuration.'
    );
  }

  // 5. Persist the validated case
  const savedCase = await Case.create(casePayload);
  return savedCase;
};

export default {
  createCase,
};
