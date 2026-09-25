import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const DEFAULT_PASSWORD = "stmarys@123";

async function myAdminCollege(supabase: any, userId: string) {
  const [{ data: roles }, { data: profile }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase.from("profiles").select("college").eq("id", userId).maybeSingle(),
  ]);
  if (!(roles ?? []).some((r: any) => r.role === "admin")) throw new Error("Administrators only");
  if (!profile?.college) throw new Error("Your account has no institution assigned");
  return profile.college as string;
}

export const setUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ userId: z.string().uuid(), password: z.string().max(72).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const college = await myAdminCollege(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: target } = await supabaseAdmin
      .from("profiles").select("college").eq("id", data.userId).maybeSingle();
    if (!target || (target.college && target.college !== college))
      throw new Error("You can only manage users of your own institution");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password || DEFAULT_PASSWORD,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createInstitutionUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      username: z.string().trim().min(2).max(60),
      fullName: z.string().trim().max(100).optional(),
      department: z.string().trim().max(100).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const college = await myAdminCollege(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.username.includes("@")
      ? data.username.toLowerCase()
      : `${data.username.toLowerCase().replace(/[^a-z0-9._-]/g, "")}.${college}@stmarys.local`;
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: data.fullName || data.username, department: data.department || "", college },
    });
    if (error) throw new Error(error.message);
    return { email };
  });
