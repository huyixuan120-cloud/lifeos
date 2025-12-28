/**
 * Workout API Functions
 *
 * CRUD operations for workout notes and weekly folders
 */

import { supabase } from '@/lib/supabase';

export interface Workout {
  id: string;
  user_id: string;
  week_name: string;
  note_content: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all workouts for the current user
 */
export async function getWorkouts(): Promise<Workout[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // User not logged in - return empty array silently
    return [];
  }

  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching workouts:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a new workout session
 */
export async function createWorkout(
  weekName: string,
  noteContent: string = ''
): Promise<Workout | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // User not logged in - silently return null
    return null;
  }

  const { data, error } = await supabase
    .from('workouts')
    .insert([
      {
        user_id: user.id,
        week_name: weekName,
        note_content: noteContent,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating workout:', error);
    return null;
  }

  return data;
}

/**
 * Update workout (auto-save)
 */
export async function updateWorkout(
  workoutId: string,
  weekName: string,
  noteContent: string
): Promise<boolean> {
  const { error } = await supabase
    .from('workouts')
    .update({
      week_name: weekName,
      note_content: noteContent,
      updated_at: new Date().toISOString(),
    })
    .eq('id', workoutId);

  if (error) {
    console.error('Error updating workout:', error);
    return false;
  }

  return true;
}

/**
 * Delete a workout
 */
export async function deleteWorkout(workoutId: string): Promise<boolean> {
  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', workoutId);

  if (error) {
    console.error('Error deleting workout:', error);
    return false;
  }

  return true;
}

/**
 * Subscribe to workout changes in real-time
 */
export function subscribeToWorkouts(
  userId: string,
  callback: (workout: Workout) => void
) {
  const channel = supabase
    .channel('workouts-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'workouts',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('Workout changed:', payload);
        callback(payload.new as Workout);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
