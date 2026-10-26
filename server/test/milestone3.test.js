import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { toPublicCase } from '../src/utils/public-case.js';
import {
  generateMysteryCase,
  cleanAndParseJson,
  buildPrompt,
} from '../src/services/gemini.service.js';
import { DIFFICULTY_CONFIG } from '../src/validators/ai-case.schema.js';
import { ApiError } from '../src/utils/api-error.js';

// Helper to generate a valid mock case matching difficulty requirements
const createMockAiResponse = (difficulty) => {
  const config = DIFFICULTY_CONFIG[difficulty];
  const suspects = Array.from({ length: config.suspects }, (_, i) => ({
    id: `suspect_${i + 1}`,
    name: `Suspect Name ${i + 1}`,
    role: `Curator ${i + 1}`,
    description: `Public description ${i + 1}`,
    alibi: `Was in the library reading archives ${i + 1}`,
  }));

  const clues = Array.from({ length: config.clues }, (_, i) => ({
    id: `clue_${i + 1}`,
    title: `Clue Title ${i + 1}`,
    description: `Public clue observation ${i + 1}`,
    detail: `Forensic laboratory detail ${i + 1}`,
    relevance: `Directly contradicts suspect_${i + 1}'s alibi`,
  }));

  const hints = Array.from({ length: config.hints }, (_, i) => ({
    id: `hint_${i + 1}`,
    text: `Notice the discrepancy in the records for suspect ${i + 1}`,
  }));

  return {
    title: `The Mystery of the Stolen Gem (${difficulty})`,
    story: `A complete introductory mystery narrative detailing the crime scene. The vault was locked and undisturbed overnight.`,
    suspects,
    clues,
    hints,
    solution: {
      culpritSuspectId: 'suspect_1',
      motive: 'Large gambling debts',
      method: 'Duplicated the master archive keycard',
      explanation: 'Suspect 1 was captured on timestamped sensors entering the archive contrary to their stated alibi.',
      clueReasoning: [
        { clueId: 'clue_1', reason: 'Refutes their claimed presence in the library.' },
        { clueId: 'clue_2', reason: 'Matches the fibers left on the vault door.' },
      ],
    },
  };
};

describe('Milestone 3: Public Case Serializer & Solution Secrecy', () => {
  const mockFullCase = {
    _id: '507f1f77bcf86cd799439011',
    title: 'The Stolen Diamond',
    story: 'The museum was quiet until midnight...',
    premise: 'A rare diamond disappears from a private gallery exhibition.',
    difficulty: 'medium',
    suspects: [
      {
        id: 'suspect_1',
        name: 'Alice',
        role: 'Curator',
        description: 'Tall, composed',
        alibi: 'At dinner',
      },
      {
        id: 'suspect_2',
        name: 'Bob',
        role: 'Guard',
        description: 'Alert',
        alibi: 'On patrol',
      },
    ],
    clues: [
      {
        id: 'clue_1',
        title: 'Muddy Footprint',
        description: 'A footprint near the window',
        detail: 'Size 10 boot matching Alice',
        relevance: 'Proves presence',
      },
      {
        id: 'clue_2',
        title: 'Broken Glass',
        description: 'Shards on the floor',
        detail: 'Cut from the inside',
        relevance: 'Inside job indicator',
      },
    ],
    hints: [
      { id: 'hint_1', text: 'Look at the shoes' },
      { id: 'hint_2', text: 'Examine the broken glass direction' },
    ],
    solution: {
      culpritSuspectId: 'suspect_1',
      motive: 'Debt',
      method: 'Smashed case',
      explanation: 'Alice did it because of debts',
      clueReasoning: [{ clueId: 'clue_1', reason: 'Matches footprint' }],
    },
    progress: {
      discoveredClueIds: ['clue_1'],
      usedHintIds: ['hint_1'],
    },
    status: 'active',
  };

  test('never leaks solution, culpritSuspectId, motive, method, or explanation', () => {
    const publicCase = toPublicCase(mockFullCase);

    assert.equal(publicCase.solution, undefined);
    assert.equal(publicCase.culpritSuspectId, undefined);
    assert.equal(publicCase.motive, undefined);
    assert.equal(publicCase.method, undefined);
    assert.equal(publicCase.explanation, undefined);
    assert.equal(publicCase.clueReasoning, undefined);

    // Deep check that no string in the public case mentions the culprit or motive
    const jsonString = JSON.stringify(publicCase);
    assert.equal(jsonString.includes('culpritSuspectId'), false);
    assert.equal(jsonString.includes('Large gambling debts'), false);
    assert.equal(jsonString.includes('Alice did it because of debts'), false);
  });

  test('does not leak full hints array in active case', () => {
    const publicCase = toPublicCase(mockFullCase);
    assert.equal(publicCase.hints, undefined);
    assert.equal(publicCase.progress.hintsUsed, 1);
    assert.equal(publicCase.progress.hintLimit, 3); // medium difficulty limit
  });

  test('reveals detail only for discovered clues and never leaks relevance', () => {
    const publicCase = toPublicCase(mockFullCase);

    // clue_1 was in discoveredClueIds
    const clue1 = publicCase.clues.find((c) => c.id === 'clue_1');
    assert.equal(clue1.isDiscovered, true);
    assert.equal(clue1.detail, 'Size 10 boot matching Alice');
    assert.equal(clue1.relevance, undefined);

    // clue_2 was NOT discovered
    const clue2 = publicCase.clues.find((c) => c.id === 'clue_2');
    assert.equal(clue2.isDiscovered, false);
    assert.equal(clue2.detail, undefined);
    assert.equal(clue2.relevance, undefined);
  });
});

describe('Milestone 3: cleanAndParseJson utility', () => {
  test('parses raw clean JSON', () => {
    const data = { title: 'Test' };
    const parsed = cleanAndParseJson(JSON.stringify(data));
    assert.deepEqual(parsed, data);
  });

  test('strips markdown ```json and ``` fences properly', () => {
    const raw = '```json\n{"title": "Test Fence"}\n```';
    const parsed = cleanAndParseJson(raw);
    assert.equal(parsed.title, 'Test Fence');
  });

  test('throws descriptive error on malformed JSON', () => {
    assert.throws(
      () => cleanAndParseJson('{ bad json }'),
      (err) => err.message.includes('Failed to parse AI response as JSON')
    );
  });
});

describe('Milestone 3: Gemini Service with Mock Client & Retry Logic', () => {
  test('generates valid mystery case for easy, medium, and hard', async () => {
    for (const diff of ['easy', 'medium', 'hard']) {
      const mockClient = {
        generateMystery: async () => JSON.stringify(createMockAiResponse(diff)),
      };

      const result = await generateMysteryCase(
        { premise: 'A rare book disappeared from the locked university library.', difficulty: diff },
        { aiClient: mockClient }
      );

      assert.equal(result.suspects.length, DIFFICULTY_CONFIG[diff].suspects);
      assert.equal(result.clues.length, DIFFICULTY_CONFIG[diff].clues);
      assert.equal(result.hints.length, DIFFICULTY_CONFIG[diff].hints);
      assert.ok(result.solution.culpritSuspectId);
    }
  });

  test('retries once when attempt 1 produces invalid counts, then succeeds', async () => {
    let callCount = 0;
    const mockClient = {
      generateMystery: async (attempt, previousError) => {
        callCount++;
        if (attempt === 1) {
          // Attempt 1: Malformed (only 1 suspect instead of 3 for easy)
          const badCase = createMockAiResponse('easy');
          badCase.suspects = [badCase.suspects[0]];
          return JSON.stringify(badCase);
        }
        // Attempt 2: Fixed and valid
        assert.ok(previousError);
        assert.ok(previousError.includes('suspects'));
        return JSON.stringify(createMockAiResponse('easy'));
      },
    };

    const result = await generateMysteryCase(
      { premise: 'A valuable painting was cut from its museum frame overnight.', difficulty: 'easy' },
      { aiClient: mockClient }
    );

    assert.equal(callCount, 2);
    assert.equal(result.suspects.length, 3);
  });

  test('throws 502 AI_GENERATION_FAILED when both attempts fail', async () => {
    let callCount = 0;
    const mockClient = {
      generateMystery: async () => {
        callCount++;
        return 'Not even JSON at all';
      },
    };

    await assert.rejects(
      async () => {
        await generateMysteryCase(
          { premise: 'A crown vanished from a guarded royal vault during a storm.', difficulty: 'easy' },
          { aiClient: mockClient }
        );
      },
      (err) => {
        assert.equal(err instanceof ApiError, true);
        assert.equal(err.statusCode, 502);
        assert.equal(err.code, 'AI_GENERATION_FAILED');
        return true;
      }
    );

    assert.equal(callCount, 2); // Confirms exactly 2 attempts
  });
});

describe('Milestone 3: POST /api/cases Request Validation & Integration', () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => {
      server.close(resolve);
    });
  });

  test('rejects request with premise shorter than 20 characters', async () => {
    const res = await fetch(`${baseUrl}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ premise: 'Too short', difficulty: 'easy' }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(body.error.message.includes('20 characters'));
  });

  test('rejects request with premise longer than 500 characters', async () => {
    const res = await fetch(`${baseUrl}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ premise: 'A'.repeat(501), difficulty: 'easy' }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(body.error.message.includes('500 characters'));
  });

  test('rejects request with invalid difficulty', async () => {
    const res = await fetch(`${baseUrl}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        premise: 'A rare manuscript disappears from a locked museum archive during a private exhibition.',
        difficulty: 'extreme',
      }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(body.error.message.includes('easy'));
  });

  test('rejects empty body', async () => {
    const res = await fetch(`${baseUrl}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  });

  test('returns 503 AI_SERVICE_UNAVAILABLE when GEMINI_API_KEY is not configured', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      const res = await fetch(`${baseUrl}/api/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          premise: 'A rare manuscript disappears from a locked museum archive during a private exhibition.',
          difficulty: 'easy',
        }),
      });

      assert.equal(res.status, 503);
      const body = await res.json();
      assert.equal(body.error.code, 'AI_SERVICE_UNAVAILABLE');
    } finally {
      if (originalKey) {
        process.env.GEMINI_API_KEY = originalKey;
      }
    }
  });
});
