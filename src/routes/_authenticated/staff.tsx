import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { COLLEGES, useProfile, type AppRole } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/staff")({
  head: () => ({
    meta: [
      { title: "Staff & Roles | St. Mary's Stores" },
      {
        name: "description",
        content:
          "Administrators manage stores staff accounts and assign admin or staff roles.",
      },
      { property: "og:title", content: "Staff & Roles | St. Mary's Stores" },
      {
        property: "og:description",
        content: "Manage stores staff accounts and their roles.",
      },
    ],
  }),
  component: StaffPage,
});

function StaffPage() {
  const me = useProfile();
  const qc = useQueryClient();

  const staff = useQuery({
    queryKey: ["staff-list"],
    queryFn: async () => {
      const [{ data: profiles, error }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (error) throw error;
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: (roles ?? [])
          .filter((r) => r.user_id === p.id)
          .map((r) => r.role as AppRole),
      }));
    },
  });

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const other: AppRole = role === "admin" ? "staff" : "admin";
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (error && !error.message.includes("duplicate")) throw error;
      const { error: delErr } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", other);
      if (delErr) throw delErr;
    },
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["staff-list"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (me.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (!me.data?.isAdmin) {
    return (
      <div className="panel p-6">
        <h1 className="text-lg font-semibold">Administrators only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ask a stores administrator if you need access to staff and role settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Staff &amp; Roles</h1>
        <p className="text-sm text-muted-foreground">
          Admins can add and delete vouchers and items; staff can record receives and
          issues.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { title: "Admin1 · SMGG", text: "Full stores access for the Guntur portal." },
          { title: "Admin1 · STMW", text: "Full stores access for the Budampadu portal." },
          { title: "User", text: "Own dashboard, stock search, item creation, receives and reports." },
        ].map((card) => (
          <div key={card.title} className="panel p-4">
            <p className="text-sm font-semibold">{card.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{card.text}</p>
          </div>
        ))}
      </div>

      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-secondary text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Department</th>
              <th className="px-3 py-2 font-medium">College</th>
              <th className="px-3 py-2 font-medium">Access</th>
              <th className="px-3 py-2 font-medium">Change</th>
            </tr>
          </thead>
          <tbody>
            {(staff.data ?? []).map((p) => {
              const isAdmin = p.roles.includes("admin");
              return (
                <tr key={p.id} className="border-t border-line">
                  <td className="px-3 py-2">{p.full_name || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{p.email || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{p.department || "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        isAdmin
                          ? "rounded-md bg-ok-soft px-2 py-0.5 text-[11px] font-semibold text-ok"
                          : "rounded-md bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground"
                      }
                    >
                      {isAdmin ? "Admin1" : "User"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      disabled={setRole.isPending || p.id === me.data.user.id}
                      onClick={() =>
                        setRole.mutate({
                          userId: p.id,
                          role: isAdmin ? "staff" : "admin",
                        })
                      }
                      className="rounded-md border border-line bg-card px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                    >
                      {p.id === me.data.user.id
                        ? "You"
                        : isAdmin
                          ? "Make staff"
                          : "Make admin"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {(staff.data ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  No staff accounts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
