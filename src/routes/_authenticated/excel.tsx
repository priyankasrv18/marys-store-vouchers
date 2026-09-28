import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { downloadStockLedgerExcel } from "@/lib/excel";
import { itemsQuery, issuesQuery, receiptsQuery, rupees } from "@/lib/stores";

export const Route = createFileRoute("/_authenticated/excel")({
  head: () => ({
    meta: [
      { title: "Excel Export | St. Mary's Stores" },
      { name: "description", content: "Review and export the complete stores record to Excel." },
    ],
  }),
  component: ExcelPage,
});

const fmtDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function ExcelPage() {
  const items = useQuery(itemsQuery);
  const receipts = useQuery(receiptsQuery);
  const issues = useQuery(issuesQuery);
  const itemMap = new Map((items.data ?? []).map((item) => [item.id, item]));
  const itemName = (id: string) => itemMap.get(id)?.name ?? "Unknown item";
  const loading = items.isLoading || receipts.isLoading || issues.isLoading;
  const stockValue = (items.data ?? []).reduce((total, item) => total + item.available_stock * item.unit_price, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Reports</p>
          <h1 className="mt-1 text-2xl font-bold">Excel Export</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review the current stock, receive records, and issue records before downloading the workbook.
          </p>
        </div>
        <button
          type="button"
          onClick={() => downloadStockLedgerExcel({ items: items.data ?? [], receipts: receipts.data ?? [], issues: issues.data ?? [] })}
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          Export Excel
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="panel p-4"><p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Items</p><p className="num mt-1 text-2xl font-semibold">{items.data?.length ?? 0}</p><p className="mt-1 text-xs text-muted-foreground">Catalogue entries</p></div>
        <div className="panel p-4"><p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Receive records</p><p className="num mt-1 text-2xl font-semibold">{receipts.data?.length ?? 0}</p><p className="mt-1 text-xs text-muted-foreground">Material added</p></div>
        <div className="panel p-4"><p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Stock value</p><p className="num mt-1 text-2xl font-semibold">{rupees(stockValue)}</p><p className="mt-1 text-xs text-muted-foreground">Current available stock</p></div>
      </div>

      <section className="panel overflow-x-auto">
        <div className="border-b border-line px-4 py-3"><h2 className="font-semibold">Receive material</h2><p className="text-xs text-muted-foreground">The same receive data included in the downloaded workbook.</p></div>
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-secondary text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground"><tr><th className="px-3 py-2">Record no.</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">Item</th><th className="px-3 py-2">Vendor</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Amount</th></tr></thead>
          <tbody>{(receipts.data ?? []).map((record) => <tr key={record.id} className="border-t border-line"><td className="num px-3 py-2 font-semibold">{record.record_no}</td><td className="px-3 py-2 text-muted-foreground">{fmtDate(record.purchase_date)}</td><td className="px-3 py-2">{itemName(record.item_id)}</td><td className="px-3 py-2">{record.vendor_name}</td><td className="num px-3 py-2 text-right">{record.quantity}</td><td className="num px-3 py-2 text-right font-semibold">{rupees(record.total_amount)}</td></tr>)}{!loading && (receipts.data ?? []).length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No receive records yet.</td></tr>}</tbody>
        </table>
      </section>

      <section className="panel overflow-x-auto">
        <div className="border-b border-line px-4 py-3"><h2 className="font-semibold">Issue material</h2><p className="text-xs text-muted-foreground">The same issue data included in the downloaded workbook.</p></div>
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-secondary text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground"><tr><th className="px-3 py-2">Record no.</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">Item</th><th className="px-3 py-2">Issued to</th><th className="px-3 py-2">Department</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Balance</th></tr></thead>
          <tbody>{(issues.data ?? []).map((record) => <tr key={record.id} className="border-t border-line"><td className="num px-3 py-2 font-semibold">{record.record_no}</td><td className="px-3 py-2 text-muted-foreground">{fmtDate(record.issue_date)}</td><td className="px-3 py-2">{itemName(record.item_id)}</td><td className="px-3 py-2">{record.issued_to}</td><td className="px-3 py-2 text-muted-foreground">{record.department || "—"}</td><td className="num px-3 py-2 text-right">{record.qty_issued}</td><td className="num px-3 py-2 text-right font-semibold">{record.balance_stock}</td></tr>)}{!loading && (issues.data ?? []).length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">No issue records yet.</td></tr>}</tbody>
        </table>
      </section>
    </div>
  );
}
