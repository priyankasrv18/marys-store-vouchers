import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "staff";

export const COLLEGES = {
  smgg: {
    id: "smgg",
    short: "SMGG",
    name: "St. Mary's Group of Institutions for Women",
    location: "Chebrole, Guntur",
    title: "St. Mary's Group of Institutions Guntur For Women",
  },
  stmw: {
    id: "stmw",
    short: "STMW",
    name: "St. Mary's Women's Engineering College",
    location: "Budampadu",
    title: "St. Mary's Women's Engineering College",
  },
} as const;

export type CollegeId = keyof typeof COLLEGES;

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}

export function useProfile() {
  const { user } = useUser();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: profile, error: profileError }, { data: roles, error: roleError }] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
          supabase.from("user_roles").select("role").eq("user_id", user!.id),
        ]);
      if (profileError) throw profileError;
      if (roleError) throw roleError;
      const roleList = (roles ?? []).map((r) => r.role as AppRole);
      return {
        user: user!,
        profile,
        roles: roleList,
        isAdmin: roleList.includes("admin"),
        college: profile?.college ?? null,
      };
    },
  });
}

export const roleLabel = (isAdmin: boolean) => (isAdmin ? "Admin1" : "User");
