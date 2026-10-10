import { z } from 'zod';

import { TRACK_IDS } from '@/features/characters/types';

/**
 * Runtime validation for anything crossing a boundary we do not own:
 * local storage, and (in future) network responses from a server-backed
 * engine. Components never parse these shapes themselves.
 */

const trackIdSchema = z.enum(TRACK_IDS);

export const messageSchema = z.object({
  id: z.string().min(1),
  role: z.enum(['captain', 'player', 'system']),
  text: z.string(),
  createdAt: z.number().int().nonnegative(),
  illustrative: z.boolean().optional(),
});

export const messagesSchema = z.array(messageSchema);

export const conversationPhaseSchema = z.enum(['intro', 'question', 'closing', 'completed']);

export const engineProgressSchema = z.object({
  asked: z.number().int().nonnegative(),
  expected: z.number().int().positive().optional(),
  label: z.string().optional(),
});

export const expeditionResultSchema = z.object({
  trackId: trackIdSchema,
  secondaryTrackId: trackIdSchema.nullish(),
  explanation: z.string().nullish(),
  origin: z.enum(['engine', 'demo']),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

export const engineResponseSchema = z.object({
  messages: messagesSchema,
  phase: conversationPhaseSchema,
  progress: engineProgressSchema.nullish(),
  awaitsReply: z.boolean(),
});

export type ParsedExpeditionResult = z.infer<typeof expeditionResultSchema>;
