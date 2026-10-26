import mongoose from 'mongoose';

const { Schema } = mongoose;

const SuspectSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    description: { type: String, required: true },
    alibi: { type: String, required: true },
  },
  { _id: false }
);

const ClueSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    detail: { type: String, required: true },
    relevance: { type: String, required: true },
  },
  { _id: false }
);

const HintSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const ClueReasoningSchema = new Schema(
  {
    clueId: { type: String, required: true },
    reason: { type: String, required: true },
  },
  { _id: false }
);

const SolutionSchema = new Schema(
  {
    culpritSuspectId: { type: String, required: true },
    motive: { type: String, required: true },
    method: { type: String, required: true },
    explanation: { type: String, required: true },
    clueReasoning: { type: [ClueReasoningSchema], default: [] },
  },
  { _id: false }
);

const ProgressSchema = new Schema(
  {
    discoveredClueIds: { type: [String], default: [] },
    usedHintIds: { type: [String], default: [] },
  },
  { _id: false }
);

const AccusationSchema = new Schema(
  {
    suspectId: { type: String, default: null },
    isCorrect: { type: Boolean, default: null },
    submittedAt: { type: Date, default: null },
  },
  { _id: false }
);

const ScoreSchema = new Schema(
  {
    basePoints: { type: Number, default: 0 },
    cluePoints: { type: Number, default: 0 },
    hintPenalty: { type: Number, default: 0 },
    finalScore: { type: Number, default: 0 },
  },
  { _id: false }
);

const CaseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    story: { type: String, required: true },
    premise: { type: String, required: true, trim: true },
    difficulty: {
      type: String,
      required: true,
      enum: ['easy', 'medium', 'hard'],
    },
    suspects: {
      type: [SuspectSchema],
      required: true,
    },
    clues: {
      type: [ClueSchema],
      required: true,
    },
    hints: {
      type: [HintSchema],
      required: true,
    },
    solution: {
      type: SolutionSchema,
      required: true,
    },
    progress: {
      type: ProgressSchema,
      default: () => ({ discoveredClueIds: [], usedHintIds: [] }),
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'completed'],
      default: 'active',
    },
    accusation: {
      type: AccusationSchema,
      default: () => ({ suspectId: null, isCorrect: null, submittedAt: null }),
    },
    score: {
      type: ScoreSchema,
      default: () => ({ basePoints: 0, cluePoints: 0, hintPenalty: 0, finalScore: 0 }),
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
CaseSchema.index({ status: 1 });
CaseSchema.index({ createdAt: -1 });

export const Case = mongoose.models.Case || mongoose.model('Case', CaseSchema);

export default Case;
