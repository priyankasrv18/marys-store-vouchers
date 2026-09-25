import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { COLLEGES, useProfile, type AppRole, type CollegeId } from "@/lib/auth";
import { createInstitutionUser, setUserPassword, DEFAULT_PASSWORD } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/staff")({
  head: () => ({
    meta: [
      { title: "User Management | St. Mary's Stores" },
      { name: "description", content: "Institution administrators manage users and passwords." },
      { property: "og:title", content: "User Management | St. Mary's Stores" },
      { property: "og:description", content: "Manage stores users and passwords per institution." },
    ],
  }),
  component: StaffPage,
});

function OwnPassword() {
  const [pw, setPw] = useState("");
  const [pending, setPending] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) return toast.error("Password must be at least 6 characters");
    setPending(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setPending(false);
    if (error) toast.error(error.message);
    else { toast.success("Your password was changed"); setPw(""); }
  };
  return (
    <form onSubmit={submit} className="panel flex flex-wrap items-end gap-3 p-4">
      <label className="block min-w-[220px] flex-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Change my password</span>
        <input type="password" className="field mt-1" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" autoComplete="new-password" />
      </label>
      <button disabled={pending} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
        {pending ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}

function StaffPage() {
  const me = useProfile();
  const qc = useQueryClient();
  const setPwFn = useServerFn(setUserPassword);
  const createFn = useServerFn(createInstitutionUser);
  const college = me.data?.college as CollegeId | null | undefined;
  const [newUser, setNewUser] = useState({ username: "", fullName: "", department: "" });

  const staff = useQuery({
    queryKey: ["staff-list", college],
    enabled: !!me.data?.isAdmin,
    queryFn: async () => {
      const [{ data: profiles, error }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("college", college!).order("created_at"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (error) throw error;
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as AppRole),
      }));
    },
  });

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const other: AppRole = role === "admin" ? "staff" : "admin";
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error && !error.message.includes("duplicate")) throw error;
      const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", other);
      if (delErr) throw delErr;
    },
    onSuccess: () => { toast.success("Role updated"); qc.invalidateQueries({ queryKey: ["staff-list"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const changePw = useMutation({
    mutationFn: (v: { userId: string; password?: string }) => setPwFn({ data: v }),
    onSuccess: () => toast.success("Password updated"),
    onError: (e: Error) => toast.error(e.message),
  });

  const addUser = useMutation({
    mutationFn: () => createFn({ data: newUser }),
    onSuccess: (r) => {
      toast.success(`User created (${r.email}) with password ${DEFAULT_PASSWORD}`);
      setNewUser({ username: "", fullName: "", department: "" });
      qc.invalidateQueries({ queryKey: ["staff-list"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (me.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  if (!me.data?.isAdmin) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-bold">My account</h1>
        <OwnPassword />
      </div>
    );
  }

  const inst = college ? COLLEGES[college] : null;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">User Management{inst ? ` · ${inst.short}` : ""}</h1>
        <p className="text-sm text-muted-foreground">
          {inst ? inst.name : "No institution assigned"} — new users get the default password{" "}
          <span className="font-mono">{DEFAULT_PASSWORD}</span>.
        </p>
      </header>

      <OwnPassword />

      <form
        onSubmit={(e) => { e.preventDefault(); if (newUser.username.trim()) addUser.mutate(); }}
        className="panel grid gap-3 p-4 md:grid-cols-4 md:items-end"
      >
        {([
          ["username", "Username"],
          ["fullName", "Full name"],
          ["department", "Department"],
        ] as const).map(([k, label]) => (
          <label key={k} className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
            <input className="field mt-1" value={newUser[k]} onChange={(e) => setNewUser({ ...newUser, [k]: e.target.value })} />
          </label>
        ))}
        <button disabled={addUser.isPending} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          {addUser.isPending ? "Adding…" : "Add user"}
        </button>
      </form>

      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-secondary text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Login</th>
              <th className="px-3 py-2 font-medium">Department</th>
              <th className="px-3 py-2 font-medium">Access</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(staff.data ?? []).map((p) => {
              const isAdmin = p.roles.includes("admin");
              const self = p.id === me.data.user.id;
              return (
                <tr key={p.id} className="border-t border-line">
                  <td className="px-3 py-2">{p.full_name || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {p.email?.endsWith("@stmarys.local") ? p.email.split(".")[0] : p.email}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{p.department || "—"}</td>
                  <td className="px-3 py-2">{isAdmin ? "Admin" : "User"}</td>
                  <td className="flex flex-wrap gap-2 px-3 py-2">
                    {!self && (
                      <>
                        <button
                          onClick={() => {
                            const pw = window.prompt(`New password for ${p.full_name || p.email} (leave blank for ${DEFAULT_PASSWORD})`);
                            if (pw === null) return;
                            changePw.mutate({ userId: p.id, password: pw.trim() || undefined });
                          }}
                          className="rounded-md border border-line bg-card px-3 py-1.5 text-xs font-semibold"
                        >
                          Change password
                        </button>
                        <button
                          disabled={setRole.isPending}
                          onClick={() => setRole.mutate({ userId: p.id, role: isAdmin ? "staff" : "admin" })}
                          className="rounded-md border border-line bg-card px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                        >
                          {isAdmin ? "Make user" : "Make admin"}
                        </button>
                      </>
                    )}
                    {self && <span className="text-xs text-muted-foreground">You</span>}
                  </td>
                </tr>
              );
            })}
            {(staff.data ?? []).length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">No users yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
