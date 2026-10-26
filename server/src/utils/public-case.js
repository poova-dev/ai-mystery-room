import { DIFFICULTY_CONFIG } from '../validators/ai-case.schema.js';

/**
 * Serializes a Case Mongoose document or plain object into a secure, public-facing representation.
 * Explicitly whitelists allowed fields according to SPEC.md Section 10.3 and 11.2.
 * Strictly guarantees that private solution fields and undiscovered clue details are never leaked.
 *
 * @param {object} caseDoc - Case document from Mongoose or plain object
 * @returns {object} Public case view
 */
export const toPublicCase = (caseDoc) => {
  if (!caseDoc) {
    return null;
  }

  // Handle Mongoose document or plain JS object
  const raw = typeof caseDoc.toObject === 'function' ? caseDoc.toObject() : caseDoc;
  const caseId = String(raw._id || raw.id);
  const difficulty = raw.difficulty || 'medium';
  const config = DIFFICULTY_CONFIG[difficulty] || { hints: 3, clues: 7 };

  const discoveredClueIds = Array.isArray(raw.progress?.discoveredClueIds)
    ? raw.progress.discoveredClueIds
    : [];
  const discoveredSet = new Set(discoveredClueIds);

  const usedHintIds = Array.isArray(raw.progress?.usedHintIds)
    ? raw.progress.usedHintIds
    : [];

  // Public suspects: safe fields only
  const suspects = (raw.suspects || []).map((s) => ({
    id: s.id,
    name: s.name,
    role: s.role,
    description: s.description,
    alibi: s.alibi,
  }));

  // Public clues: hide `detail` and `relevance` until discovered
  const clues = (raw.clues || []).map((c) => {
    const isDiscovered = discoveredSet.has(c.id);
    const publicClue = {
      id: c.id,
      title: c.title,
      description: c.description,
      isDiscovered,
    };

    // Only reveal detail once the clue is discovered
    if (isDiscovered && c.detail) {
      publicClue.detail = c.detail;
    }

    return publicClue;
  });

  return {
    id: caseId,
    title: raw.title,
    story: raw.story,
    difficulty,
    suspects,
    clues,
    progress: {
      discoveredClueIds,
      cluesDiscovered: discoveredClueIds.length,
      totalClues: (raw.clues || []).length,
      hintsUsed: usedHintIds.length,
      hintLimit: config.hints,
    },
    status: raw.status || 'active',
  };
};

export default {
  toPublicCase,
};
