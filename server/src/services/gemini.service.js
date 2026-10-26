import { GoogleGenAI } from '@google/genai';
import { validateAiCase, DIFFICULTY_CONFIG } from '../validators/ai-case.schema.js';
import { ApiError } from '../utils/api-error.js';

/**
 * Builds the system and user prompt for Gemini to generate a structured mystery case.
 * @param {string} premise
 * @param {'easy'|'medium'|'hard'} difficulty
 * @param {string|null} previousError - Error message from previous failed attempt for correction prompt
 */
export const buildPrompt = (premise, difficulty, previousError = null) => {
  const config = DIFFICULTY_CONFIG[difficulty];

  let prompt = `You are a master detective mystery author and logic designer.
Create an engaging, fair, logically sound mystery investigation case based on this premise:
"${premise}"

DIFFICULTY LEVEL: ${difficulty.toUpperCase()}
YOU MUST STRICTLY ADHERE TO THESE EXACT COUNTS:
- Number of Suspects: EXACTLY ${config.suspects}
- Number of Clues: EXACTLY ${config.clues}
- Number of Hints: EXACTLY ${config.hints}

GAMEPLAY AND LOGICAL RULES:
1. Every suspect, clue, and hint must have a unique identifier (e.g. "suspect_1", "clue_1", "hint_1").
2. The "solution.culpritSuspectId" MUST match exactly one of the generated suspect IDs.
3. The mystery MUST be solvable using the provided clues and alibis through deductive reasoning.
4. Clues must provide concrete facts (e.g., physical evidence, timestamps, forensic details, financial records).
5. At least two clues must directly support the identification of the true culprit and contradict their alibi.
6. Clue "description" is public information visible before discovery; "detail" is the crucial forensic observation discovered upon inspection.
7. Hints must be arranged in progressive order of helpfulness without explicitly naming the culprit.
8. Output ONLY a valid JSON object matching the schema below. No markdown fences, no conversational text.

REQUIRED JSON STRUCTURE:
{
  "title": "A captivating case title",
  "story": "A rich introductory narrative (100-300 words) describing the crime scene and situation.",
  "suspects": [
    {
      "id": "suspect_1",
      "name": "Full Name",
      "role": "Their profession or relationship",
      "description": "Public appearance and background",
      "alibi": "Their stated claim for where they were during the incident"
    }
  ],
  "clues": [
    {
      "id": "clue_1",
      "title": "Title of Clue",
      "description": "Public description visible to player before inspection",
      "detail": "Forensic detail revealed after discovering this clue",
      "relevance": "Why this evidence matters in solving the crime"
    }
  ],
  "hints": [
    {
      "id": "hint_1",
      "text": "A subtle strategic nudge toward analyzing a discrepancy"
    }
  ],
  "solution": {
    "culpritSuspectId": "suspect_1",
    "motive": "Clear reason why they did it",
    "method": "How they executed the crime",
    "explanation": "Comprehensive breakdown linking the evidence to prove guilt beyond doubt",
    "clueReasoning": [
      {
        "clueId": "clue_1",
        "reason": "Why this clue refutes their alibi or proves their involvement"
      }
    ]
  }
}`;

  if (previousError) {
    prompt += `\n\nCRITICAL FIX: Your previous generation failed validation with error: "${previousError}".
Fix this error immediately while strictly maintaining exact suspect, clue, and hint counts!`;
  }

  return prompt;
};

/**
 * Strips markdown fences if present and parses JSON safely.
 * @param {string} raw
 * @returns {object}
 */
export const cleanAndParseJson = (raw) => {
  if (!raw || typeof raw !== 'string') {
    throw new Error('Empty response received from AI model.');
  }

  let cleaned = raw.trim();
  // Strip ```json ... ``` or ``` ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Failed to parse AI response as JSON: ${err.message}`);
  }
};

/**
 * Generates and validates a mystery case using Gemini with a single retry on validation error.
 *
 * @param {object} params
 * @param {string} params.premise
 * @param {'easy'|'medium'|'hard'} params.difficulty
 * @param {object} [options]
 * @param {object} [options.aiClient] - Optional injected client for testing/mocking
 * @returns {Promise<object>} Validated AI Case Object
 */
export const generateMysteryCase = async ({ premise, difficulty }, options = {}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  // Check API key unless an injected mock client is provided
  if (!apiKey && !options.aiClient) {
    throw new ApiError(
      503,
      'AI_SERVICE_UNAVAILABLE',
      'Gemini AI API key is not configured on the server.'
    );
  }

  const ai = options.aiClient || new GoogleGenAI({ apiKey });
  const maxAttempts = 2;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const prompt = buildPrompt(premise, difficulty, lastError ? lastError.message : null);

      let responseText = '';

      if (typeof ai.generateMystery === 'function') {
        // Direct mock hook for tests
        responseText = await ai.generateMystery(attempt, lastError ? lastError.message : null);
      } else {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        responseText = response.text ? (typeof response.text === 'function' ? response.text() : response.text) : '';
      }

      const parsedData = cleanAndParseJson(responseText);
      const validatedCase = validateAiCase(parsedData, difficulty);

      // Successfully generated and validated
      return validatedCase;
    } catch (err) {
      lastError = err;
      console.warn(`[GeminiService] Attempt ${attempt}/${maxAttempts} failed: ${err.message}`);

      // If it's a critical client configuration error or already max attempts, stop
      if (attempt === maxAttempts) {
        break;
      }
    }
  }

  // If all attempts failed, throw SPEC-compliant 502 error
  throw new ApiError(
    502,
    'AI_GENERATION_FAILED',
    'Failed to generate a valid mystery case after retry. Please try again with a different premise.'
  );
};

export default {
  buildPrompt,
  cleanAndParseJson,
  generateMysteryCase,
};
