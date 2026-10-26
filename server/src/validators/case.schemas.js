import { z } from 'zod';
import mongoose from 'mongoose';

/**
 * Custom Zod validator for MongoDB ObjectId
 */
export const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid case ID format.',
});

/**
 * Validation schema for POST /api/cases
 */
export const createCaseSchema = z.object({
  premise: z
    .string({ required_error: 'Premise is required.' })
    .trim()
    .min(20, { message: 'Premise must be at least 20 characters.' })
    .max(500, { message: 'Premise cannot exceed 500 characters.' }),
  difficulty: z.enum(['easy', 'medium', 'hard'], {
    errorMap: () => ({ message: "Difficulty must be one of: 'easy', 'medium', 'hard'." }),
  }),
});

/**
 * Validation schema for case ID URL parameter
 */
export const caseIdParamSchema = z.object({
  id: objectIdSchema,
});

/**
 * Validation schema for clue discovery URL parameters
 */
export const discoverClueParamSchema = z.object({
  id: objectIdSchema,
  clueId: z.string().trim().min(1, { message: 'Clue ID cannot be empty.' }),
});

/**
 * Validation schema for POST /api/cases/:id/accuse
 */
export const accuseSchema = z.object({
  suspectId: z
    .string({ required_error: 'Suspect ID is required.' })
    .trim()
    .min(1, { message: 'Suspect ID cannot be empty.' }),
});

/**
 * Middleware factory to validate request body against a Zod schema
 * @param {z.ZodSchema} schema
 */
export const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware factory to validate request params against a Zod schema
 * @param {z.ZodSchema} schema
 */
export const validateParams = (schema) => (req, res, next) => {
  try {
    req.params = schema.parse(req.params);
    next();
  } catch (error) {
    next(error);
  }
};

export default {
  objectIdSchema,
  createCaseSchema,
  caseIdParamSchema,
  discoverClueParamSchema,
  accuseSchema,
  validateBody,
  validateParams,
};
