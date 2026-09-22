import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Staff Sign In | St. Mary's Stores" },
      {
        name: "description",
        content:
          "Sign in to the St. Mary's Group of Institutions stores voucher system. Staff access only.",
      },
      { property: "og:title", content: "Staff Sign In | St. Mary's Stores" },
      {
        property: "og:description",
        content: "Secure sign in for stores department staff and administrators.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, department },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          toast.success("Account created — check your email to confirm");
        }
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-10">
      <div className="panel w-full max-w-md p-7">
        <p className="font-serif text-xl font-bold leading-tight">St. Mary's</p>
        <p className="text-xs text-muted-foreground">
          Group of Institutions for Women, Guntur
        </p>
        <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-primary">
          Stores Department
        </p>

        <h1 className="mt-5 text-lg font-semibold">
          {mode === "signin" ? "Staff sign in" : "Create staff account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Access is restricted to institution stores staff.
        </p>

        {sent ? (
          <p className="mt-6 rounded-md bg-ok-soft px-3 py-3 text-sm text-ok">
            We sent a confirmation link to {email}. Open it to activate the account, then
            sign in.
          </p>
        ) : (
          <form className="mt-5 space-y-3" onSubmit={submit}>
            {mode === "signup" && (
              <>
                <label className="block">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Full name
                  </span>
                  <input
                    className="field mt-1"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    maxLength={80}
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Department
                  </span>
                  <input
                    className="field mt-1"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    maxLength={80}
                    placeholder="Stores"
                  />
                </label>
              </>
            )}
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Institution email
              </span>
              <input
                type="email"
                className="field mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Password
              </span>
              <input
                type="password"
                className="field mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        )}

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setSent(false);
          }}
          className="mt-4 text-sm text-primary underline underline-offset-4"
        >
          {mode === "signin"
            ? "New staff member? Create an account"
            : "Already registered? Sign in"}
        </button>
      </div>
    </div>
  );
}
