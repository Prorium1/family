import { z } from 'zod'
import { SAFETY_LEVELS } from '@/types/domain'

/**
 * Structured AI output schemas — field-for-field from spec §17. Every AI
 * response is validated against these; invalid output triggers regeneration
 * and then the static fallback, never a raw pass-through.
 */

export const AI_SCHEMA_VERSION = 1

const confidenceSchema = z.enum(['low', 'medium', 'high'])
const safetyLevelSchema = z.enum(SAFETY_LEVELS)

export const dailyInsightSchema = z.object({
  title: z.string().min(1).max(120),
  sharedValues: z.array(z.string().min(1)).max(8),
  meaningfulDifferences: z
    .array(
      z.object({
        topic: z.string().min(1),
        neutralExplanation: z.string().min(1),
      }),
    )
    .max(6),
  reflection: z.string().min(1),
  conversationQuestion: z.string().min(1),
  microAction: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    estimatedMinutes: z.number().int().min(1).max(60),
  }),
  confidence: confidenceSchema,
  safetyLevel: safetyLevelSchema,
})

export type DailyInsight = z.infer<typeof dailyInsightSchema>

export const repairInsightSchema = z.object({
  neutralSummary: z.string().min(1),
  emotions: z.array(z.string().min(1)).max(10),
  underlyingNeeds: z.array(z.string().min(1)).max(10),
  sharedGoal: z.string().nullable(),
  misunderstandingPattern: z.string().nullable(),
  conversationSteps: z.array(z.string().min(1)).max(8),
  suggestedPhrases: z.array(z.string().min(1)).max(8),
  microAction: z.string().nullable(),
  safetyLevel: safetyLevelSchema,
  safetyMessage: z.string().nullable(),
  shouldPauseMediation: z.boolean(),
})

export type RepairInsight = z.infer<typeof repairInsightSchema>

export const relationshipManualItemSchema = z.object({
  category: z.string().min(1),
  statement: z.string().min(1),
  sourceType: z.enum(['user_stated', 'shared_agreement', 'ai_inference', 'needs_confirmation']),
  sourceIds: z.array(z.string()),
  confidence: confidenceSchema,
  confirmedByUserA: z.boolean(),
  confirmedByUserB: z.boolean(),
})

export type RelationshipManualItem = z.infer<typeof relationshipManualItemSchema>

export const weeklySummarySchema = z.object({
  headline: z.string().min(1),
  appreciation: z.array(z.string()).max(6),
  gentleNote: z.string().nullable(),
  nextWeekSuggestion: z.string().min(1),
  safetyLevel: safetyLevelSchema,
})

export type WeeklySummary = z.infer<typeof weeklySummarySchema>
