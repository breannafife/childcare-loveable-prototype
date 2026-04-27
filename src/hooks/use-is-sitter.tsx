import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useIsSitter() {
  const { user } = useAuth();

  const { data: isSitter = false, isLoading } = useQuery({
    queryKey: ["is-sitter", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "sitter")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  return { isSitter, isLoading };
}
