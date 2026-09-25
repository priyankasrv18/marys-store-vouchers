import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { COLLEGES, type CollegeId, useUser } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function CollegeSeal({ short }: { short: string }) {
  return (
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-[#c6a647] bg-[#f8f1cf] text-center text-[10px] font-bold leading-tight text-[#7d1d33] shadow-inner">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#c6a647]">
        {short === "STMW" ? "SMW\nCOLLEGE" : "SMGG\nINSTITUTIONS"}
      </span>
    </div>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useUser();
  const [selectedCollege, setSelectedCollege] = useState<CollegeId | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [loading, navigate, user]);

  const college = selectedCollege ? COLLEGES[selectedCollege] : null;

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedCollege) return;
    if (!identifier.trim() || !password) {
      toast.error("Enter your username/email and password");
      return;
    }
    setPending(true);
    const id = identifier.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: id.includes("@") ? id : `${id.replace(/[^a-z0-9._-]/g, "")}.${selectedCollege}@stmarys.local`,
      password,
    });
    if (error || !data.user) {
      setPending(false);
      toast.error(error?.message || "Unable to sign in");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("college")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profileError) {
      await supabase.auth.signOut();
      setPending(false);
      toast.error(profileError.message);
      return;
    }
    if (profile?.college && profile.college !== selectedCollege) {
      await supabase.auth.signOut();
      setPending(false);
      toast.error("This account belongs to the other college portal");
      return;
    }
    if (!profile?.college) {
      await supabase.from("profiles").update({ college: selectedCollege }).eq("id", data.user.id);
    }
    toast.success("Welcome to " + college?.short + " Stores");
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-[#5e0e20] px-4 py-10 text-[#4c1722] sm:py-16">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        {!selectedCollege ? (
          <section className="w-full max-w-3xl text-center text-white">
            <p className="text-xs uppercase tracking-[0.35em] text-[#efcf77]">St. Mary's Stores</p>
            <h1 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">Select your College</h1>
            <p className="mt-3 text-sm text-white/70">Choose the institution to sign in to its voucher system</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {(Object.keys(COLLEGES) as CollegeId[]).map((id) => {
                const item = COLLEGES[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedCollege(id)}
                    className="rounded-lg bg-white px-5 py-5 text-center shadow-xl transition-transform hover:-translate-y-1"
                  >
                    <CollegeSeal short={item.short} />
                    <h2 className="mx-auto mt-4 max-w-[250px] font-serif text-lg font-bold leading-tight text-[#6d1b2d]">
                      {item.name}
                    </h2>
                    <p className="mt-2 text-xs text-slate-500">{item.location}</p>
                    <span className="mt-5 block rounded-md bg-[#8d1d36] px-4 py-2 text-sm font-semibold text-white">
                      Continue →
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="w-full max-w-md rounded-lg bg-white px-5 py-7 shadow-2xl sm:px-8">
            <CollegeSeal short={college!.short} />
            <h1 className="mt-4 text-center font-serif text-xl font-bold leading-tight text-[#6d1b2d]">
              {college!.title}
            </h1>
            <p className="mt-2 text-center text-xs text-slate-500">
              Voucher Entry System · Secured Admin Portal
            </p>
            <button
              type="button"
              onClick={() => setSelectedCollege(null)}
              className="mx-auto mt-2 block text-xs font-semibold text-[#8d1d36] underline underline-offset-2"
            >
              ← Switch College
            </button>

            <form className="mt-7 space-y-4" onSubmit={signIn}>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                  Username / email
                </span>
                <input
                  autoFocus
                  className="field mt-1"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Admin1 / user / email"
                  autoComplete="username"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                  Password
                </span>
                <input
                  type="password"
                  className="field mt-1"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
              </label>
              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-md bg-[#8d1d36] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#74162b] disabled:opacity-60"
              >
                {pending ? "Signing in…" : "Sign In"}
              </button>
            </form>
            <p className="mt-5 text-center text-[11px] text-slate-500">Users are created by an administrator only.</p>
          </section>
        )}
      </div>
    </div>
  );
}
