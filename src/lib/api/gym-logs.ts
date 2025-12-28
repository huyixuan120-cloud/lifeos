/**
 * Gym Logs API Functions
 *
 * CRUD operations for gym training logs with weight tracking
 */

import { supabase } from '@/lib/supabase';

export interface GymLog {
  id: string;
  user_id: string;
  data: string; // ISO date string
  note_testo: string;
  peso_panca: number | null;
  peso_squat: number | null;
  peso_stacco: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all gym logs for the current user
 */
export async function getGymLogs(): Promise<GymLog[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('gym_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('data', { ascending: false });

  if (error) {
    console.error('Error fetching gym logs:', error);
    return [];
  }

  return data || [];
}

/**
 * Get gym log for a specific date
 */
export async function getGymLogByDate(date: string): Promise<GymLog | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('gym_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('data', date)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - not an error, just no log for this date
      return null;
    }
    console.error('Error fetching gym log by date:', error);
    return null;
  }

  return data;
}

/**
 * Create or update gym log (upsert)
 */
export async function upsertGymLog(
  date: string,
  note_testo: string,
  peso_panca: number | null,
  peso_squat: number | null,
  peso_stacco: number | null
): Promise<GymLog | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('No user logged in');
    return null;
  }

  const { data, error } = await supabase
    .from('gym_logs')
    .upsert(
      {
        user_id: user.id,
        data: date,
        note_testo,
        peso_panca,
        peso_squat,
        peso_stacco,
      },
      {
        onConflict: 'user_id,data',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error upserting gym log:', error);
    return null;
  }

  return data;
}

/**
 * Delete a gym log
 */
export async function deleteGymLog(logId: string): Promise<boolean> {
  const { error } = await supabase
    .from('gym_logs')
    .delete()
    .eq('id', logId);

  if (error) {
    console.error('Error deleting gym log:', error);
    return false;
  }

  return true;
}

/**
 * Get trend data for charts (last N weeks)
 */
export async function getWeightTrends(weeks: number = 8): Promise<{
  dates: string[];
  panca: (number | null)[];
  squat: (number | null)[];
  stacco: (number | null)[];
}> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { dates: [], panca: [], squat: [], stacco: [] };
  }

  const weeksAgo = new Date();
  weeksAgo.setDate(weeksAgo.getDate() - (weeks * 7));

  const { data, error } = await supabase
    .from('gym_logs')
    .select('data, peso_panca, peso_squat, peso_stacco')
    .eq('user_id', user.id)
    .gte('data', weeksAgo.toISOString().split('T')[0])
    .order('data', { ascending: true });

  if (error) {
    console.error('Error fetching weight trends:', error);
    return { dates: [], panca: [], squat: [], stacco: [] };
  }

  if (!data || data.length === 0) {
    return { dates: [], panca: [], squat: [], stacco: [] };
  }

  return {
    dates: data.map((log) => log.data),
    panca: data.map((log) => log.peso_panca),
    squat: data.map((log) => log.peso_squat),
    stacco: data.map((log) => log.peso_stacco),
  };
}
