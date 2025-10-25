'use server';

import { requireUser } from '@/lib/auth/requireUser';
import { entrySchema, entryUpdateSchema } from '@/lib/validation/schemas';
import { revalidatePath } from 'next/cache';

export async function createEntry(formData: FormData) {
  try {
    const { supabase, user } = await requireUser();

    const rawData = {
      week_start: formData.get('week_start') as string,
      hours: parseFloat(formData.get('hours') as string),
      tags: JSON.parse(formData.get('tags') as string),
      note: formData.get('note') as string,
      contributor_id: user.id,
    };

    // Validate with Zod
    const validatedData = entrySchema.parse(rawData);

    const { error } = await supabase.from('entries').insert(validatedData);

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

export async function updateEntry(entryId: string, formData: FormData) {
  try {
    const { supabase, user } = await requireUser();

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Admin role required' };
    }

    const rawData = {
      week_start: formData.get('week_start') as string,
      hours: parseFloat(formData.get('hours') as string),
      tags: JSON.parse(formData.get('tags') as string),
      note: formData.get('note') as string,
    };

    // Validate with Zod
    const validatedData = entryUpdateSchema.parse(rawData);

    const { error } = await supabase
      .from('entries')
      .update(validatedData)
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

export async function deleteEntry(entryId: string) {
  try {
    const { supabase, user } = await requireUser();

    // Check if user is admin or owner
    const { data: entry } = await supabase
      .from('entries')
      .select('contributor_id')
      .eq('id', entryId)
      .single();

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';
    const isOwner = entry?.contributor_id === user.id;

    if (!isAdmin && !isOwner) {
      return { success: false, error: 'Unauthorized' };
    }

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
