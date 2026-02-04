import { z } from 'zod';

/**
 * Format date as YYYY-MM-DD
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Normalize tags: trim, lowercase, dedupe, max 10
 */
export function normalizeTags(tags: string[]): string[] {
  const normalized = tags
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0);

  // Remove duplicates
  const unique = Array.from(new Set(normalized));

  // Limit to 10 tags
  return unique.slice(0, 10);
}

/**
 * Recipient item schema (for entry_recipients)
 */
export const recipientItemSchema = z.object({
  recipient_id: z.string().uuid(),
  recipient_type: z.enum(['user', 'guild']),
});

export type RecipientItemInput = z.input<typeof recipientItemSchema>;

/**
 * Entry schema with validation
 */
export const entrySchema = z.object({
  week_start: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD required)'),
  hours: z.number()
    .positive('Hours must be greater than 0')
    .max(100, 'Hours must not exceed 100'),
  tags: z.array(z.string())
    .max(10, 'Maximum 10 tags allowed')
    .transform(normalizeTags),
  note: z.string()
    .max(1000, 'Note must not exceed 1000 characters')
    .default(''),
  contributor_id: z.string().uuid(),
  recipients: z.array(recipientItemSchema).default([]),
});

export type EntryInput = z.input<typeof entrySchema>;
export type EntryValidated = z.output<typeof entrySchema>;

/**
 * Entry update schema (for admin editing)
 */
export const entryUpdateSchema = entrySchema.partial().required({ week_start: true, hours: true });

export type EntryUpdateInput = z.input<typeof entryUpdateSchema>;

/**
 * Task feedback schema
 */
export const taskFeedbackSchema = z.object({
  task_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500, 'Comment must not exceed 500 characters').default(''),
  reviewer_id: z.string().uuid(),
});

export type TaskFeedbackInput = z.input<typeof taskFeedbackSchema>;
export type TaskFeedbackValidated = z.output<typeof taskFeedbackSchema>;
