import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { staffMembersQuery, type StaffMember } from "@/lib/users";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({ meta: [{ title: "User Management | St. Mary's Stores" }] }),
  component: UsersPage,
});

type UserForm = { full_name: string; department: string; designation: string; email: string; phone: string; college: string };
const emptyForm: UserForm = { full_name: "", department: "", designation: "", email: "", phone: "", college: "" };

function UsersPage() {
  const qc = useQueryClient();
  const users = useQuery(staffMembersQuery);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const set = (key: keyof UserForm, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const add = useMutation({
    mutationFn: async () => {
      if (!form.full_name.trim()) throw new Error("Full name is required");
      const { data, error } = await supabase.from("staff_members").insert({
        full_name: form.full_name.trim(),
        department: form.department.trim() || null,
        designation: form.designation.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        college: form.college.trim() || null,
      }).select("*").single();
      if (error) throw error;
      return data as StaffMember;
    },
    onSuccess: () => { setForm(emptyForm); qc.invalidateQueries({ queryKey: ["staff-members"] }); toast.success("User added"); },
    onError: (error: Error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("staff_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff-members"] }); toast.success("User removed"); },
    onError: (error: Error) => toast.error(error.message),
  });
  const submit = (event: FormEvent) => { event.preventDefault(); add.mutate(); };

  return (
    <div className="space-y-6">
      <header><p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Directory</p><h1 className="mt-1 text-2xl font-bold">User Management</h1><p className="mt-1 text-sm text-muted-foreground">Maintain the people who use the stores department.</p></header>
      <form onSubmit={submit} className="panel grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block"><span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Full name *</span><input className="field mt-1" value={form.full_name} onChange={(event) => set("full_name", event.target.value)} placeholder="Full name" /></label>
        <label className="block"><span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Department</span><input className="field mt-1" value={form.department} onChange={(event) => set("department", event.target.value)} placeholder="Stores" /></label>
        <label className="block"><span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Designation</span><input className="field mt-1" value={form.designation} onChange={(event) => set("designation", event.target.value)} placeholder="Stores assistant" /></label>
        <label className="block"><span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Email</span><input type="email" className="field mt-1" value={form.email} onChange={(event) => set("email", event.target.value)} placeholder="name@example.com" /></label>
        <label className="block"><span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Phone</span><input className="field mt-1" value={form.phone} onChange={(event) => set("phone", event.target.value)} placeholder="Phone number" /></label>
        <label className="block"><span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">College</span><input className="field mt-1" value={form.college} onChange={(event) => set("college", event.target.value)} placeholder="Institution" /></label>
        <div className="flex items-end sm:col-span-2 lg:col-span-3"><button type="submit" disabled={add.isPending} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">{add.isPending ? "Adding…" : "Add user"}</button></div>
      </form>
      <section className="panel overflow-x-auto"><table className="w-full min-w-[780px] text-sm"><thead className="bg-secondary text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground"><tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Department</th><th className="px-3 py-2">Designation</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Phone</th><th className="px-3 py-2"></th></tr></thead><tbody>{users.isLoading ? <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Loading users…</td></tr> : (users.data ?? []).map((user) => <tr key={user.id} className="border-t border-line"><td className="px-3 py-2 font-semibold">{user.full_name}</td><td className="px-3 py-2">{user.department || "—"}</td><td className="px-3 py-2">{user.designation || "—"}</td><td className="px-3 py-2">{user.email || "—"}</td><td className="px-3 py-2">{user.phone || "—"}</td><td className="px-3 py-2 text-right"><button type="button" onClick={() => remove.mutate(user.id)} disabled={remove.isPending} className="text-xs font-semibold text-destructive">Remove</button></td></tr>)}{!users.isLoading && (users.data ?? []).length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No users added yet.</td></tr>}</tbody></table></section>
    </div>
  );
}
