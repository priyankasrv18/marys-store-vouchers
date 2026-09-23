import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/auth";
import { itemsQuery, mainHeadsQuery, MAIN_HEADS, voucherNo } from "@/lib/stores";

export const Route = createFileRoute("/_authenticated/issue")({
  head: () => ({
    meta: [
      { title: "Issue Material | St. Mary's Stores" },
      {
        name: "description",
        content:
          "Issue stock to departments and blocks with balance stock, issued by and authorised by details, and attached indent slips.",
      },
      { property: "og:title", content: "Issue Material | St. Mary's Stores" },
      {
        property: "og:description",
        content: "Issue stock to departments and attach signed slips or photos.",
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

const MAX_SIZE = 20 * 1024 * 1024;

const prettySize = (n: number) =>
  n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

function IssuePage() {
  const qc = useQueryClient();
  const me = useProfile();
  const items = useQuery(itemsQuery);
  const mainHeads = useQuery(mainHeadsQuery);
  const [form, setForm] = useState(empty);
  const [newMainHead, setNewMainHead] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const headItems = useMemo(
    () => (items.data ?? []).filter((i) => i.main_head === form.main_head),
    [items.data, form.main_head],
  );
  const headOptions = useMemo(
    () => Array.from(new Set([...(mainHeads.data ?? []).map((h) => h.name), ...MAIN_HEADS])),
    [mainHeads.data],
  );
  const selected = (items.data ?? []).find((i) => i.id === form.item_id);
  const balance = selected
    ? selected.available_stock - (Number(form.qty_issued) || 0)
    : null;

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list).filter((f) => {
      if (f.size > MAX_SIZE) {
        toast.error(`${f.name} is larger than 20 MB`);
        return false;
      }
      return true;
    });
    setFiles((prev) => [...prev, ...incoming].slice(0, 10));
  };

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

  const addItem = useMutation({
    mutationFn: async () => {
      const name = newItemName.trim();
      if (!name) throw new Error("Enter an item name");
      if (headItems.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
        throw new Error("That item already exists under this Main Head");
      }
      const { data, error } = await supabase
        .from("items")
        .insert({
          main_head: form.main_head,
          sub_head: name,
          name,
          unit: "nos",
          unit_price: 0,
          available_stock: 0,
          reorder_level: 5,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (item) => {
      setNewItemName("");
      set("item_id", item.id);
      qc.invalidateQueries({ queryKey: ["items"] });
      toast.success("Item added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!form.item_id) throw new Error("Select an item to issue");
      if (!form.issued_to.trim()) throw new Error("Issued to is required");
      const qty = Number(form.qty_issued);
      if (!(qty > 0)) throw new Error("Quantity must be greater than zero");
      if (selected && qty > selected.available_stock)
        throw new Error(`Only ${selected.available_stock} ${selected.unit} available`);

      if (!me.data?.user) throw new Error("You must be signed in");
      const attachmentOwner = me.data.user.id;

      const { data: issue, error } = await supabase
        .from("issues")
        .insert({
          voucher_no: voucherNo("IV"),
          item_id: form.item_id,
          issue_date: form.issue_date,
          issued_to: form.issued_to.trim(),
          department: form.department || null,
          using_area: form.using_area || null,
          qty_issued: qty,
          issued_by: form.issued_by || null,
          authorised_by: form.authorised_by || null,
          created_by: me.data.user.id,
        })
        .select("id")
        .single();
      if (error) throw error;

      for (const file of files) {
        const safe = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${attachmentOwner}/${issue.id}/${Date.now()}-${safe}`;
        const { error: upErr } = await supabase.storage
          .from("issue-attachments")
          .upload(path, file, { contentType: file.type || undefined });
        if (upErr) throw new Error(`Upload failed for ${file.name}: ${upErr.message}`);
        const { error: rowErr } = await supabase.from("issue_attachments").insert({
          issue_id: issue.id,
          file_path: path,
          file_name: file.name,
          mime_type: file.type || null,
          file_size: file.size,
          uploaded_by: null,
        });
        if (rowErr) throw rowErr;
      }
    },
    onSuccess: () => {
      toast.success("Issue voucher saved and stock reduced");
      setForm({ ...empty });
      setFiles([]);
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["issues"] });
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
          Issue Material is available to Admin1 accounts only.
        </p>
      </div>
    );
  }

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
              <option value="">— Select item —</option>
              {headItems.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.available_stock} {i.unit})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Add item">
            <div className="flex gap-2">
              <input
                className="field min-w-0 flex-1"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItem.mutate();
                  }
                }}
                placeholder="New item name"
                maxLength={100}
              />
              <button
                type="button"
                onClick={() => addItem.mutate()}
                disabled={addItem.isPending}
                className="rounded-md border border-line bg-card px-3 text-sm font-semibold disabled:opacity-60"
              >
                Add
              </button>
            </div>
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

        <div className="mt-6">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Attachments — indent slip, signed note or photo
          </p>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={
              "mt-2 cursor-pointer rounded-md border-2 border-dashed px-4 py-8 text-center transition-colors " +
              (dragging ? "border-primary bg-primary/8" : "border-line bg-secondary/50")
            }
          >
            <p className="text-sm font-semibold">Drag files here or click to browse</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Images and PDFs, up to 20 MB each, maximum 10 files
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {files.length > 0 && (
            <ul className="mt-3 divide-y divide-line rounded-md border border-line">
              {files.map((f, idx) => (
                <li
                  key={`${f.name}-${idx}`}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                >
                  <span className="truncate">{f.name}</span>
                  <span className="flex items-center gap-3">
                    <span className="num text-xs text-muted-foreground">
                      {prettySize(f.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFiles((p) => p.filter((_, i) => i !== idx))}
                      className="text-xs font-semibold text-warn"
                    >
                      Remove
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
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
