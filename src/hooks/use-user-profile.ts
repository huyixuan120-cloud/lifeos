"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { createClient } from "@/utils/supabase/client";

interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  xp: number;
  level: number;
  focus_minutes: number;
  streak: number;
  tasks_completed: number;
  achievements: any[];
  member_since: string;
  created_at: string;
  updated_at: string;
}

interface UseUserProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  createProfile: (name: string, email: string) => Promise<void>;
}

/**
 * Custom hook for managing user profile with Supabase
 *
 * Provides CRUD operations for user profile:
 * - Fetch user profile on mount
 * - Create user profile if doesn't exist
 * - Update user profile (name, stats, etc.)
 *
 * @returns {UseUserProfileReturn} Profile state and operations
 */
export function useUserProfile(): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get NextAuth session
  const { data: session, status } = useSession();
  const supabase = createClient();

  /**
   * Fetches user profile from Supabase
   */
  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Wait for auth to finish loading
      if (status === "loading") {
        console.log("⏳ Auth loading - waiting...");
        return;
      }

      // Check if user is authenticated
      if (!session?.user) {
        console.log("⚠️ No authenticated user - skipping profile fetch");
        setProfile(null);
        setIsLoading(false);
        return;
      }

      console.log("📥 Fetching profile for user:", session.user.id);

      const { data, error: fetchError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (fetchError) {
        // If profile doesn't exist (PGRST116 = no rows returned), that's ok
        if (fetchError.code === 'PGRST116') {
          console.log("ℹ️ No profile found for user - will create on first update");
          setProfile(null);
          setIsLoading(false);
          return;
        }

        // Silent error handling for empty errors or missing table
        const isEmpty = !fetchError.code && !fetchError.message && Object.keys(fetchError).length === 0;
        const isMissingTable = fetchError.code === '42P01';

        if (isEmpty) {
          console.warn("⚠️ Empty error from Supabase - table may not exist or RLS blocking");
          setProfile(null);
          setIsLoading(false);
          return;
        }

        if (isMissingTable) {
          console.error("❌ Table 'user_profiles' does not exist in Supabase");
          setProfile(null);
          setIsLoading(false);
          return;
        }

        console.error("Error fetching profile:", fetchError);
        setError(fetchError.message || "Failed to fetch profile");
        return;
      }

      if (data) {
        setProfile(data as UserProfile);
        console.log("✅ Profile loaded:", data);
      }
    } catch (err) {
      console.error("Unexpected error fetching profile:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to connect to database";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, session, status]);

  /**
   * Creates a new user profile
   */
  const createProfile = useCallback(
    async (name: string, email: string) => {
      try {
        setError(null);

        if (status === "loading") {
          throw new Error("Authentication still loading. Please wait a moment.");
        }

        if (status === "unauthenticated" || !session?.user?.id) {
          throw new Error("Not authenticated. Please sign in.");
        }

        console.log("📤 Creating profile for user:", session.user.id);

        const { data, error: insertError } = await supabase
          .from("user_profiles")
          .insert({
            id: session.user.id,
            name,
            email,
            xp: 0,
            level: 0,
            focus_minutes: 0,
            streak: 0,
            tasks_completed: 0,
            achievements: [],
            member_since: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.error("❌ Error creating profile:", insertError);
          throw new Error(insertError.message || "Failed to create profile");
        }

        if (data) {
          setProfile(data as UserProfile);
          console.log("✅ Profile created successfully");
        }
      } catch (err) {
        console.error("Unexpected error creating profile:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        throw err;
      }
    },
    [supabase, session, status]
  );

  /**
   * Updates user profile
   */
  const updateProfile = useCallback(
    async (updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>) => {
      try {
        setError(null);

        if (status === "loading") {
          throw new Error("Authentication still loading. Please wait a moment.");
        }

        if (status === "unauthenticated" || !session?.user?.id) {
          throw new Error("Not authenticated. Please sign in.");
        }

        console.log("📤 Updating profile for user:", session.user.id);

        // If no profile exists, create one first
        if (!profile) {
          const name = updates.name || session.user.name || "LifeOS User";
          const email = updates.email || session.user.email || null;
          await createProfile(name, email);
          return;
        }

        const { data, error: updateError } = await supabase
          .from("user_profiles")
          .update(updates)
          .eq("id", session.user.id)
          .select()
          .single();

        if (updateError) {
          console.error("❌ Error updating profile:", updateError);
          throw new Error(updateError.message || "Failed to update profile");
        }

        if (data) {
          setProfile(data as UserProfile);
          console.log("✅ Profile updated successfully");
        }
      } catch (err) {
        console.error("Unexpected error updating profile:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        throw err;
      }
    },
    [supabase, session, status, profile, createProfile]
  );

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    createProfile,
  };
}
