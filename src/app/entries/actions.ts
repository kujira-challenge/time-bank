'use server';

import { requireUser } from '@/lib/auth/requireUser';
import { entrySchema, entryUpdateSchema } from '@/lib/validation/schemas';
import type { RecipientItemInput } from '@/lib/validation/schemas';
import { revalidatePath } from 'next/cache';
import type { EvaluationItem, RecipientOption } from '@/types';

export async function createEntry(formData: FormData) {
  try {
    const { supabase, user } = await requireUser();

    const contributorIdStr = formData.get('contributor_id') as string | null;
    const recipientsStr = formData.get('recipients') as string | null;
    const recipients: RecipientItemInput[] = recipientsStr ? JSON.parse(recipientsStr) : [];

    const rawData = {
      week_start: formData.get('week_start') as string,
      hours: parseFloat(formData.get('hours') as string),
      tags: JSON.parse(formData.get('tags') as string),
      note: formData.get('note') as string,
      contributor_id: contributorIdStr && contributorIdStr !== '' ? contributorIdStr : user.id,
      recipients,
    };

    // Validate with Zod
    const validatedData = entrySchema.parse(rawData);

    // Extract recipients before inserting entry (not a column on entries table)
    const { recipients: validatedRecipients, ...entryData } = validatedData;

    // Insert entry
    const { data: entry, error: entryError } = await supabase
      .from('entries')
      .insert(entryData)
      .select('id')
      .single();

    if (entryError) {
      return { success: false, error: entryError.message };
    }

    // Insert entry_recipients
    if (validatedRecipients.length > 0 && entry) {
      const recipientRecords = validatedRecipients.map((r) => ({
        entry_id: entry.id,
        recipient_id: r.recipient_id,
        recipient_type: r.recipient_type,
      }));

      const { error: recipientError } = await supabase
        .from('entry_recipients')
        .insert(recipientRecords);

      if (recipientError) {
        console.error('Failed to insert recipients:', recipientError);
      }
    }

    // Insert detailed evaluations if provided
    const evaluationsStr = formData.get('detailed_evaluations') as string | null;
    if (evaluationsStr && entry) {
      const evaluations = JSON.parse(evaluationsStr) as EvaluationItem[];
      const userRecipients = validatedRecipients.filter((r) => r.recipient_type === 'user');
      if (evaluations.length > 0 && userRecipients.length > 0) {
        const evaluationRecords = userRecipients.flatMap((recipient) =>
          evaluations.map((ev) => ({
            entry_id: entry.id,
            evaluator_id: recipient.recipient_id,
            evaluated_id: user.id,
            axis_key: ev.axis_key,
            score: ev.score,
            comment: ev.comment || '',
          })),
        );

        const { error: evalError } = await supabase
          .from('detailed_evaluations')
          .insert(evaluationRecords);

        if (evalError) {
          console.error('Failed to insert evaluations:', evalError);
        }
      }
    }

    revalidatePath('/entries');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error occurred' };
  }
}

export async function updateEntry(entryId: string, formData: FormData) {
  try {
    const { supabase } = await requireUser();

    // Get existing entry for fallback contributor_id
    const { data: entry } = await supabase
      .from('entries')
      .select('contributor_id')
      .eq('id', entryId)
      .single();

    const contributorIdStr = formData.get('contributor_id') as string | null;
    const recipientsStr = formData.get('recipients') as string | null;
    const recipients: RecipientItemInput[] = recipientsStr ? JSON.parse(recipientsStr) : [];

    const rawData = {
      week_start: formData.get('week_start') as string,
      hours: parseFloat(formData.get('hours') as string),
      tags: JSON.parse(formData.get('tags') as string),
      note: formData.get('note') as string,
      contributor_id: contributorIdStr && contributorIdStr !== '' ? contributorIdStr : entry?.contributor_id,
      recipients,
    };

    // Validate with Zod
    const validatedData = entryUpdateSchema.parse(rawData);

    // Extract recipients before updating entry
    const { recipients: validatedRecipients, ...entryUpdateData } = validatedData;

    const { error } = await supabase
      .from('entries')
      .update(entryUpdateData)
      .eq('id', entryId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Replace entry_recipients: delete old, insert new
    if (validatedRecipients !== undefined) {
      await supabase
        .from('entry_recipients')
        .delete()
        .eq('entry_id', entryId);

      if (validatedRecipients.length > 0) {
        const recipientRecords = validatedRecipients.map((r) => ({
          entry_id: entryId,
          recipient_id: r.recipient_id,
          recipient_type: r.recipient_type,
        }));

        const { error: recipientError } = await supabase
          .from('entry_recipients')
          .insert(recipientRecords);

        if (recipientError) {
          console.error('Failed to update recipients:', recipientError);
        }
      }
    }

    revalidatePath('/entries');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error occurred' };
  }
}

export async function deleteEntry(entryId: string) {
  try {
    const { supabase } = await requireUser();

    // entry_recipients are cascade-deleted via FK
    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('id', entryId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/entries');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error occurred' };
  }
}

export async function getEntryHistory(entryId: string) {
  try {
    const { supabase } = await requireUser();

    const { data, error } = await supabase
      .from('entries_history')
      .select('*, actor:profiles!entries_history_actor_id_fkey(display_name)')
      .eq('entry_id', entryId)
      .order('acted_at', { ascending: false })
      .limit(10);

    if (error) {
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message, data: [] };
    }
    return { success: false, error: 'Unknown error occurred', data: [] };
  }
}

export async function getAllTags() {
  try {
    const { supabase } = await requireUser();

    const { data: entries } = await supabase.from('entries').select('tags');

    if (!entries) return { success: true, tags: [] };

    const tagSet = new Set<string>();
    entries.forEach((entry) => {
      entry.tags.forEach((tag: string) => tagSet.add(tag));
    });

    return { success: true, tags: Array.from(tagSet).sort() };
  } catch {
    return { success: true, tags: [] };
  }
}

/**
 * Get all recipient options (users + guilds) for the recipient selector
 */
export async function getRecipientOptions(): Promise<{ success: boolean; options: RecipientOption[] }> {
  try {
    const { supabase } = await requireUser();

    // Fetch active users
    const { data: users } = await supabase
      .from('profiles')
      .select('id, display_name')
      .eq('active', true)
      .order('display_name');

    // Fetch guilds
    const { data: guilds } = await supabase
      .from('guilds')
      .select('id, name')
      .order('name');

    const options: RecipientOption[] = [
      ...(users || []).map((u) => ({
        id: u.id,
        name: u.display_name,
        type: 'user' as const,
      })),
      ...(guilds || []).map((g: { id: string; name: string }) => ({
        id: g.id,
        name: g.name,
        type: 'guild' as const,
      })),
    ];

    return { success: true, options };
  } catch {
    return { success: true, options: [] };
  }
}

/**
 * Get recipients for a specific entry
 */
export async function getEntryRecipients(entryId: string) {
  try {
    const { supabase } = await requireUser();

    const { data, error } = await supabase
      .from('entry_recipients')
      .select('recipient_id, recipient_type')
      .eq('entry_id', entryId);

    if (error) {
      return { success: false, recipients: [] };
    }

    return { success: true, recipients: data || [] };
  } catch {
    return { success: true, recipients: [] };
  }
}
