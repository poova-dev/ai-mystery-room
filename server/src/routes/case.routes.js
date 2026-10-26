import { Router } from 'express';
import { createCaseHandler } from '../controllers/case.controller.js';
import { validateBody, createCaseSchema } from '../validators/case.schemas.js';
import { caseGenerationRateLimiter } from '../middleware/rate-limiters.js';

const router = Router();

// POST /api/cases - Generate and create a new mystery case
router.post(
  '/cases',
  caseGenerationRateLimiter,
  validateBody(createCaseSchema),
  createCaseHandler
);

export default router;
