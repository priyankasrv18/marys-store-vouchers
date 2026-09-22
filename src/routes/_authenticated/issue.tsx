import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { itemsQuery, MAIN_HEADS, voucherNo } from "@/lib/stores";

export const Route = createFileRoute("/issue")({
  head: () => ({
    meta: [
      { title: "Issue Material | St. Mary's Stores" },
      {
        name: "description",
        content:
          "Issue stock to departments and blocks with balance stock, issued by and authorised by details.",
      },
      { property: "og:title", content: "Issue Material | St. Mary's Stores" },
      {
        property: "og:description",
        content: "Issue stock to departments and blocks and track balance stock.",
      },
    ],
  }),
  component: IssuePage,
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const empty = {
  main_head: MAIN_HEADS[0] as string,
  item_id: "",
  issue_date: new Date().toISOString().slice(0, 10),
  issued_to: "",
  department: "",
  using_area: "",
  qty_issued: "",
  issued_by: "",
  authorised_by: "",
};

function IssuePage() {
  const qc = useQueryClient();
  const items = useQuery(itemsQuery);
  const [form, setForm] = useState(empty);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const headItems = useMemo(
    () => (items.data ?? []).filter((i) => i.main_head === form.main_head),
    [items.data, form.main_head],
  );
  const selected = (items.data ?? []).find((i) => i.id === form.item_id);
  const balance = selected
    ? selected.available_stock - (Number(form.qty_issued) || 0)
    : null;

  const save = useMutation({
    mutationFn: async () => {
      if (!form.item_id) throw new Error("Select an item to issue");
      if (!form.issued_to.trim()) throw new Error("Issued to is required");
      const qty = Number(form.qty_issued);
      if (!(qty > 0)) throw new Error("Quantity must be greater than zero");
      if (selected && qty > selected.available_stock)
        throw new Error(`Only ${selected.available_stock} ${selected.unit} available`);

      const { error } = await supabase.from("issues").insert({
        voucher_no: voucherNo("IV"),
        item_id: form.item_id,
        issue_date: form.issue_date,
        issued_to: form.issued_to.trim(),
        department: form.department || null,
        using_area: form.using_area || null,
        qty_issued: qty,
        issued_by: form.issued_by || null,
        authorised_by: form.authorised_by || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Issue voucher saved and stock reduced");
      setForm({ ...empty });
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["issues"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Issue Material</h1>
        <p className="text-sm text-muted-foreground">
          Issue voucher — saving deducts the quantity from available stock.
        </p>
      </header>

      <form
        className="panel p-5"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Main head">
            <select
              className="field"
              value={form.main_head}
              onChange={(e) => {
                set("main_head", e.target.value);
                set("item_id", "");
              }}
            >
              {MAIN_HEADS.map((h) => (
                <option key={h}>{h}</option>
              ))}
            </select>
          </Field>
          <Field label="Item">
            <select
              className="field"
              value={form.item_id}
              onChange={(e) => set("item_id", e.target.value)}
            >
              <option value="">— Select item —</option>
              {headItems.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.available_stock} {i.unit})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input
              type="date"
              className="field num"
              value={form.issue_date}
              onChange={(e) => set("issue_date", e.target.value)}
            />
          </Field>
          <Field label="Issued to">
            <input
              className="field"
              value={form.issued_to}
              onChange={(e) => set("issued_to", e.target.value)}
              maxLength={100}
            />
          </Field>
          <Field label="Dept / block">
            <input
              className="field"
              value={form.department}
              onChange={(e) => set("department", e.target.value)}
              maxLength={80}
            />
          </Field>
          <Field label="Using area">
            <input
              className="field"
              value={form.using_area}
              onChange={(e) => set("using_area", e.target.value)}
              maxLength={80}
            />
          </Field>
          <Field label="Qty issued">
            <input
              type="number"
              min="0"
              step="0.01"
              className="field num"
              value={form.qty_issued}
              onChange={(e) => set("qty_issued", e.target.value)}
            />
          </Field>
          <Field label="Balance stock">
            <input
              className="field num bg-muted"
              readOnly
              value={balance === null ? "—" : `${balance} ${selected?.unit ?? ""}`}
            />
          </Field>
          <Field label="Issued by">
            <input
              className="field"
              value={form.issued_by}
              onChange={(e) => set("issued_by", e.target.value)}
              maxLength={80}
            />
          </Field>
          <Field label="Authorised by">
            <input
              className="field"
              value={form.authorised_by}
              onChange={(e) => set("authorised_by", e.target.value)}
              maxLength={80}
            />
          </Field>
        </div>

        <div className="mt-5 flex justify-end border-t border-line pt-4">
          <button
            type="submit"
            disabled={save.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {save.isPending ? "Saving…" : "Save issue voucher"}
          </button>
        </div>
      </form>
    </div>
  );
}
