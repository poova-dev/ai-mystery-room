import caseService from '../services/case.service.js';
import { toPublicCase } from '../utils/public-case.js';

/**
 * Controller to handle POST /api/cases
 * Generates and validates a new mystery case, saving it to MongoDB.
 * Returns only the safe public case view.
 */
export const createCaseHandler = async (req, res, next) => {
  try {
    const { premise, difficulty } = req.body;

    const newCase = await caseService.createCase({
      premise,
      difficulty,
    });

    const publicCase = toPublicCase(newCase);

    res.status(201).json({
      case: publicCase,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createCaseHandler,
};
