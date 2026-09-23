import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { itemsQuery, mainHeadsQuery, MAIN_HEADS, rupees, voucherNo } from "@/lib/stores";
import { useProfile } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/receive")({
  head: () => ({
    meta: [
      { title: "Receive Material | St. Mary's Stores" },
      {
        name: "description",
        content:
          "Record purchase vouchers with vendor, bill, dates, rate and quantity; stock updates automatically.",
      },
      { property: "og:title", content: "Receive Material | St. Mary's Stores" },
      {
        property: "og:description",
        content: "Record purchase vouchers and update stock automatically.",
      },
    ],
  }),
  component: ReceivePage,
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
  newItemName: "",
  newSubHead: "",
  newUnit: "nos",
  vendor_name: "",
  vendor_address: "",
  vendor_phone: "",
  bill_no: "",
  purchase_date: new Date().toISOString().slice(0, 10),
  mfg_date: "",
  expiry_date: "",
  unit_price: "",
  quantity: "",
  approved_by: "",
};

function ReceivePage() {
  const qc = useQueryClient();
  const me = useProfile();
  const items = useQuery(itemsQuery);
  const mainHeads = useQuery(mainHeadsQuery);
  const [form, setForm] = useState(empty);
  const [newMainHead, setNewMainHead] = useState("");
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const headItems = useMemo(
    () => (items.data ?? []).filter((i) => i.main_head === form.main_head),
    [items.data, form.main_head],
  );

  const headOptions = useMemo(
    () => Array.from(new Set([...(mainHeads.data ?? []).map((h) => h.name), ...MAIN_HEADS])),
    [mainHeads.data],
  );

  const addMainHead = useMutation({
    mutationFn: async () => {
      const name = newMainHead.trim();
      if (!name) throw new Error("Enter a Main Head name");
      const { data, error } = await supabase
        .from("main_heads")
        .insert({ name })
        .select("name")
        .single();
      if (error) {
        if (error.code === "23505") throw new Error("That Main Head already exists");
        throw error;
      }
      return data.name;
    },
    onSuccess: (name) => {
      setNewMainHead("");
      set("main_head", name);
      set("item_id", "");
      qc.invalidateQueries({ queryKey: ["main-heads"] });
      toast.success("Main Head added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const total = (Number(form.unit_price) || 0) * (Number(form.quantity) || 0);

  const save = useMutation({
    mutationFn: async () => {
      if (!me.data?.user) throw new Error("You must be signed in");
      let itemId = form.item_id;
      if (!itemId) {
        if (!form.newItemName.trim()) throw new Error("Choose an item or enter a new item name");
        const { data, error } = await supabase
          .from("items")
          .insert({
            main_head: form.main_head,
            sub_head: form.newSubHead.trim() || form.newItemName.trim(),
            name: form.newItemName.trim(),
            unit: form.newUnit.trim() || "nos",
            unit_price: Number(form.unit_price) || 0,
            available_stock: 0,
            created_by: me.data.user.id,
          })
          .select("id")
          .single();
        if (error) throw error;
        itemId = data.id;
      }
      if (!form.vendor_name.trim()) throw new Error("Vendor name is required");
      if (!(Number(form.quantity) > 0)) throw new Error("Quantity must be greater than zero");

      const { error } = await supabase.from("receipts").insert({
        voucher_no: voucherNo("PV"),
        item_id: itemId,
        vendor_name: form.vendor_name.trim(),
        vendor_address: form.vendor_address || null,
        vendor_phone: form.vendor_phone || null,
        bill_no: form.bill_no || null,
        purchase_date: form.purchase_date,
        mfg_date: form.mfg_date || null,
        expiry_date: form.expiry_date || null,
        unit_price: Number(form.unit_price) || 0,
        quantity: Number(form.quantity),
        total_amount: total,
        approved_by: form.approved_by || null,
        created_by: me.data.user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Purchase voucher saved and stock updated");
      setForm({ ...empty });
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["receipts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Receive Material</h1>
        <p className="text-sm text-muted-foreground">
          Purchase voucher — saving adds the quantity to available stock.
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
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                className="field min-w-0 flex-1"
                value={form.main_head}
                onChange={(e) => {
                  set("main_head", e.target.value);
                  set("item_id", "");
                }}
              >
                {headOptions.map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </select>
              <input
                className="field min-w-0 flex-1"
                value={newMainHead}
                onChange={(e) => setNewMainHead(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addMainHead.mutate();
                  }
                }}
                placeholder="New Main Head"
                maxLength={80}
              />
              <button
                type="button"
                onClick={() => addMainHead.mutate()}
                disabled={addMainHead.isPending}
                className="rounded-md border border-line bg-card px-3 text-sm font-semibold disabled:opacity-60"
              >
                Add
              </button>
            </div>
          </Field>
          <Field label="Item">
            <select
              className="field"
              value={form.item_id}
              onChange={(e) => set("item_id", e.target.value)}
            >
              <option value="">— New item —</option>
              {headItems.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.sub_head} · {i.name}
                </option>
              ))}
            </select>
          </Field>

          {!form.item_id && (
            <>
              <Field label="New item name">
                <input
                  className="field"
                  value={form.newItemName}
                  onChange={(e) => set("newItemName", e.target.value)}
                  placeholder="PVC Pipe 1 inch"
                  maxLength={100}
                />
              </Field>
              <Field label="Sub head">
                <input
                  className="field"
                  value={form.newSubHead}
                  onChange={(e) => set("newSubHead", e.target.value)}
                  placeholder="Pipes"
                  maxLength={60}
                />
              </Field>
              <Field label="Unit">
                <input
                  className="field"
                  value={form.newUnit}
                  onChange={(e) => set("newUnit", e.target.value)}
                  placeholder="nos / kg / mtr"
                  maxLength={12}
                />
              </Field>
            </>
          )}

          <Field label="Shop / vendor name">
            <input
              className="field"
              value={form.vendor_name}
              onChange={(e) => set("vendor_name", e.target.value)}
              maxLength={120}
            />
          </Field>
          <Field label="Phone no">
            <input
              className="field num"
              value={form.vendor_phone}
              onChange={(e) => set("vendor_phone", e.target.value)}
              maxLength={20}
            />
          </Field>
          <Field label="Address">
            <input
              className="field"
              value={form.vendor_address}
              onChange={(e) => set("vendor_address", e.target.value)}
              maxLength={200}
            />
          </Field>
          <Field label="Bill / invoice no">
            <input
              className="field num"
              value={form.bill_no}
              onChange={(e) => set("bill_no", e.target.value)}
              maxLength={40}
            />
          </Field>
          <Field label="Purchase date">
            <input
              type="date"
              className="field num"
              value={form.purchase_date}
              onChange={(e) => set("purchase_date", e.target.value)}
            />
          </Field>
          <Field label="Mfg. date">
            <input
              type="date"
              className="field num"
              value={form.mfg_date}
              onChange={(e) => set("mfg_date", e.target.value)}
            />
          </Field>
          <Field label="Expiry date">
            <input
              type="date"
              className="field num"
              value={form.expiry_date}
              onChange={(e) => set("expiry_date", e.target.value)}
            />
          </Field>
          <Field label="Unit price">
            <input
              type="number"
              min="0"
              step="0.01"
              className="field num"
              value={form.unit_price}
              onChange={(e) => set("unit_price", e.target.value)}
            />
          </Field>
          <Field label="Quantity / count / kgs">
            <input
              type="number"
              min="0"
              step="0.01"
              className="field num"
              value={form.quantity}
              onChange={(e) => set("quantity", e.target.value)}
            />
          </Field>
          <Field label="Approved by">
            <input
              className="field"
              value={form.approved_by}
              onChange={(e) => set("approved_by", e.target.value)}
              maxLength={80}
            />
          </Field>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="text-sm text-muted-foreground">
            Total amount <span className="num ml-2 text-lg font-semibold text-foreground">{rupees(total)}</span>
          </p>
          <button
            type="submit"
            disabled={save.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {save.isPending ? "Saving…" : "Save purchase voucher"}
          </button>
        </div>
      </form>
    </div>
  );
}
