import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createCaseSchema, objectIdSchema, accuseSchema } from '../src/validators/case.schemas.js';
import { validateAiCase, DIFFICULTY_CONFIG } from '../src/validators/ai-case.schema.js';
import { ApiError } from '../src/utils/api-error.js';
import { Case } from '../src/models/Case.js';
import { isDbConnected } from '../src/config/db.js';

describe('Milestone 2: Request Validators (Zod)', () => {
  test('createCaseSchema validates correct premise and difficulty', () => {
    const valid = {
      premise: 'A priceless ancient diamond was stolen from a locked vault overnight.',
      difficulty: 'medium',
    };
    const result = createCaseSchema.parse(valid);
    assert.equal(result.difficulty, 'medium');
    assert.equal(result.premise, valid.premise);
  });

  test('createCaseSchema rejects premise with fewer than 20 characters', () => {
    assert.throws(
      () => createCaseSchema.parse({ premise: 'Too short', difficulty: 'easy' }),
      (err) => err.issues[0].message.includes('at least 20 characters')
    );
  });

  test('createCaseSchema rejects premise with more than 500 characters', () => {
    const longPremise = 'A'.repeat(501);
    assert.throws(
      () => createCaseSchema.parse({ premise: longPremise, difficulty: 'hard' }),
      (err) => err.issues[0].message.includes('cannot exceed 500 characters')
    );
  });

  test('createCaseSchema rejects invalid difficulty', () => {
    assert.throws(
      () =>
        createCaseSchema.parse({
          premise: 'A priceless ancient diamond was stolen from a locked vault overnight.',
          difficulty: 'insane',
        }),
      (err) => err.issues[0].message.includes('easy')
    );
  });

  test('objectIdSchema accepts valid 24-character hex ObjectId', () => {
    const validId = '507f1f77bcf86cd799439011';
    assert.equal(objectIdSchema.parse(validId), validId);
  });

  test('objectIdSchema rejects malformed ObjectId', () => {
    assert.throws(() => objectIdSchema.parse('invalid-id-123'));
  });

  test('accuseSchema validates non-empty suspectId', () => {
    const valid = { suspectId: 'suspect_1' };
    assert.equal(accuseSchema.parse(valid).suspectId, 'suspect_1');

    assert.throws(() => accuseSchema.parse({ suspectId: '' }));
  });
});

describe('Milestone 2: AI Output Validator Constraints', () => {
  const createMockCase = (diff) => {
    const config = DIFFICULTY_CONFIG[diff];
    const suspects = Array.from({ length: config.suspects }, (_, i) => ({
      id: `suspect_${i + 1}`,
      name: `Suspect ${i + 1}`,
      role: `Role ${i + 1}`,
      description: `Description ${i + 1}`,
      alibi: `Alibi ${i + 1}`,
    }));

    const clues = Array.from({ length: config.clues }, (_, i) => ({
      id: `clue_${i + 1}`,
      title: `Clue ${i + 1}`,
      description: `Clue Description ${i + 1}`,
      detail: `Clue Detail ${i + 1}`,
      relevance: `Clue Relevance ${i + 1}`,
    }));

    const hints = Array.from({ length: config.hints }, (_, i) => ({
      id: `hint_${i + 1}`,
      text: `Hint text ${i + 1}`,
    }));

    return {
      title: 'The Vault Mystery',
      story: 'A complete introductory story that sets the scene thoroughly and establishes context for investigation.',
      suspects,
      clues,
      hints,
      solution: {
        culpritSuspectId: 'suspect_1',
        motive: 'Greed and debt',
        method: 'Used stolen keys',
        explanation: 'The fingerprints matched the archive lock and contradicted the alibi.',
        clueReasoning: [{ clueId: 'clue_1', reason: 'Directly points to suspect_1' }],
      },
    };
  };

  test('validateAiCase passes for valid easy, medium, and hard configurations', () => {
    for (const diff of ['easy', 'medium', 'hard']) {
      const mock = createMockCase(diff);
      const validated = validateAiCase(mock, diff);
      assert.equal(validated.suspects.length, DIFFICULTY_CONFIG[diff].suspects);
      assert.equal(validated.clues.length, DIFFICULTY_CONFIG[diff].clues);
      assert.equal(validated.hints.length, DIFFICULTY_CONFIG[diff].hints);
    }
  });

  test('validateAiCase rejects incorrect suspect count', () => {
    const mock = createMockCase('easy');
    mock.suspects.pop(); // now 2 instead of 3
    assert.throws(
      () => validateAiCase(mock, 'easy'),
      (err) => err.message.includes('Expected exactly 3 suspects')
    );
  });

  test('validateAiCase rejects duplicate IDs', () => {
    const mock = createMockCase('easy');
    mock.suspects[1].id = mock.suspects[0].id;
    assert.throws(
      () => validateAiCase(mock, 'easy'),
      (err) => err.message.includes('Duplicate suspect IDs')
    );
  });

  test('validateAiCase rejects culprit suspect not in suspects array', () => {
    const mock = createMockCase('easy');
    mock.solution.culpritSuspectId = 'unknown_culprit';
    assert.throws(
      () => validateAiCase(mock, 'easy'),
      (err) => err.message.includes('does not match any generated suspect')
    );
  });
});

describe('Milestone 2: ApiError and Error Catalog', () => {
  test('ApiError formats properties properly', () => {
    const err = ApiError.notFound('CASE_NOT_FOUND', 'Case does not exist.');
    assert.equal(err.statusCode, 404);
    assert.equal(err.code, 'CASE_NOT_FOUND');
    assert.equal(err.message, 'Case does not exist.');
  });

  test('ApiError badRequest sets status 400', () => {
    const err = ApiError.badRequest('VALIDATION_ERROR', 'Invalid data.');
    assert.equal(err.statusCode, 400);
    assert.equal(err.code, 'VALIDATION_ERROR');
  });

  test('ApiError tooManyRequests sets status 429', () => {
    const err = ApiError.tooManyRequests('RATE_LIMITED');
    assert.equal(err.statusCode, 429);
    assert.equal(err.code, 'RATE_LIMITED');
  });
});

describe('Milestone 2: Mongoose Case Model Schema Validation', () => {
  test('Case document requires title, premise, story, difficulty', async () => {
    const invalidDoc = new Case({});
    await assert.rejects(async () => {
      await invalidDoc.validate();
    });
  });

  test('Case document rejects invalid difficulty enum', async () => {
    const doc = new Case({
      title: 'Test',
      story: 'Story',
      premise: 'Premise',
      difficulty: 'extreme',
    });
    await assert.rejects(async () => {
      await doc.validate();
    });
  });

  test('Case document defaults status to active and progress arrays to empty', () => {
    const doc = new Case({
      title: 'Valid Title',
      story: 'Story',
      premise: 'Premise text here',
      difficulty: 'easy',
      suspects: [],
      clues: [],
      hints: [],
      solution: {
        culpritSuspectId: 's1',
        motive: 'm',
        method: 'met',
        explanation: 'exp',
        clueReasoning: [],
      },
    });
    assert.equal(doc.status, 'active');
    assert.deepEqual(doc.progress.discoveredClueIds, []);
    assert.deepEqual(doc.progress.usedHintIds, []);
    assert.equal(doc.score.finalScore, 0);
  });
});

describe('Milestone 2: Database Connection State', () => {
  test('isDbConnected returns boolean without crashing', () => {
    const connected = isDbConnected();
    assert.equal(typeof connected, 'boolean');
  });
});
