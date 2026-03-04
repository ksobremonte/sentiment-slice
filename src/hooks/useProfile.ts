import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

export interface Profile {
  display_name: string | null;
  avatar_url: string | null;
}

export const useProfile = () => {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) { setProfile(null); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
    } else if (!error && !data) {
      // Profile doesn't exist yet (for users created before the trigger)
      const { data: inserted } = await supabase
        .from("profiles")
        .insert({ user_id: user.id })
        .select("display_name, avatar_url")
        .single();
      if (inserted) setProfile(inserted);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
    if (error) throw error;
    setProfile((prev) => prev ? { ...prev, ...updates } : { display_name: null, avatar_url: null, ...updates });
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    if (!user) throw new Error("Not authenticated");
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/avatar.${ext}`;

    const { error } = await supabase.storage
      .from("profile-avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("profile-avatars")
      .getPublicUrl(path);

    // Add cache-busting param
    return `${urlData.publicUrl}?t=${Date.now()}`;
  };

  return { profile, loading, updateProfile, uploadAvatar, refetch: fetchProfile };
};
