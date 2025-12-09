import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/db/dexie";
import { LocalProfile } from "@/db/types";
import { useAuth } from "@/contexts/AuthContext";

export const useProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const profile = await db.profile.get(user.id);
      return profile || null;
    },
    enabled: !!user?.id,
    staleTime: Infinity,
  });

  const updateUsernameMutation = useMutation({
    mutationFn: async (newUsername: string) => {
      if (!user?.id) throw new Error("No user authenticated");

      await db.profile.update(user.id, {
        username: newUsername,
        updated_at: new Date().toISOString(),
      });
      return newUsername;
    },
    onSuccess: (newUsername) => {
      queryClient.setQueryData<LocalProfile | null>(
        ["profile", user?.id],
        (old) => (old ? { ...old, username: newUsername } : null),
      );
    },
  });

  const markInitialDeckGeneratedMutation = useMutation({
    mutationFn: async (userId: string = user?.id || "") => {
      if (!userId) throw new Error("No user ID available");

      await db.profile.update(userId, {
        initial_deck_generated: true,
        updated_at: new Date().toISOString(),
      });
      return userId;
    },
    onSuccess: (_, variablesUserId) => {
      const targetId = variablesUserId || user?.id;
      queryClient.setQueryData<LocalProfile | null>(
        ["profile", targetId],
        (old) => (old ? { ...old, initial_deck_generated: true } : null),
      );
      queryClient.invalidateQueries({ queryKey: ["profile", targetId] });
    },
  });

  return {
    profile: profileQuery.data ?? null,
    loading: profileQuery.isLoading,
    error: profileQuery.error,

    updateUsername: (username: string) =>
      updateUsernameMutation.mutateAsync(username),
    markInitialDeckGenerated: (userId?: string) =>
      markInitialDeckGeneratedMutation.mutateAsync(userId || user?.id || ""),
    refreshProfile: () => profileQuery.refetch(),
  };
};
