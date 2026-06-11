import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type { summaries } from '../db/schema.js';

export type Summary = InferSelectModel<typeof summaries>;
export type NewSummary = InferInsertModel<typeof summaries>;
