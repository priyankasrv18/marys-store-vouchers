import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  itemsQuery,
  receiptsQuery,
  issuesQuery,
  rupees,
  type Item,
} from "@/lib/stores";

export const Route = createFileRoute("/_authenticated/vouchers")({
  head: () => ({
    meta: [
      { title: "Vouchers | St. Mary's Stores" },
      {
        name: "description",
        content:
          "History of receive and issue vouchers with vendor, item, quantity and amount details.",
      },
      { property: "og:title", content: "Vouchers | St. Mary's Stores" },
      {
        property: "og:description",
        content: "Search and print receive and issue vouchers of the stores department.",
      },
    ],
  }),
  component: VouchersPage,
});

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function VouchersPage() {
  const items = useQuery(itemsQuery);
  const receipts = useQuery(receiptsQuery);
  const issues = useQuery(issuesQuery);
  const [tab, setTab] = useState<"receive" | "issue">("receive");
  const [search, setSearch] = useState("");

  const itemMap = new Map<string, Item>((items.data ?? []).map((i) => [i.id, i]));
  const itemName = (id: string) => itemMap.get(id)?.name ?? "Unknown item";
  const q = search.trim().toLowerCase();

  const receiveRows = (receipts.data ?? []).filter((r) =>
    (r.voucher_no + r.vendor_name + itemName(r.item_id) + (r.bill_no ?? ""))
      .toLowerCase()
      .includes(q),
  );
  const issueRows = (issues.data ?? []).filter((i) =>
    (i.voucher_no + i.issued_to + itemName(i.item_id) + (i.department ?? ""))
      .toLowerCase()
      .includes(q),
  );

  const loading = receipts.isLoading || issues.isLoading || items.isLoading;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Vouchers</h1>
          <p className="text-sm text-muted-foreground">
            Complete record of material received and issued
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            className="field w-56"
            placeholder="Search voucher, item, party"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={60}
          />
          <button
            onClick={() => window.print()}
            className="rounded-md border border-line bg-card px-3 py-2 text-sm font-semibold"
          >
            Print
          </button>
        </div>
      </header>

      <div className="flex gap-1 rounded-md bg-secondary p-1 text-sm font-semibold">
        {(["receive", "issue"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              tab === t
                ? "flex-1 rounded-[5px] bg-card px-3 py-1.5 text-foreground shadow-sm"
                : "flex-1 rounded-[5px] px-3 py-1.5 text-muted-foreground"
            }
          >
            {t === "receive"
              ? `Receive (${receiveRows.length})`
              : `Issue (${issueRows.length})`}
          </button>
        ))}
      </div>

      <div className="panel overflow-x-auto">
        {loading ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">Loading vouchers…</p>
        ) : tab === "receive" ? (
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-secondary text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Voucher no</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Item</th>
                <th className="px-3 py-2 font-medium">Vendor</th>
                <th className="px-3 py-2 font-medium">Bill no</th>
                <th className="px-3 py-2 text-right font-medium">Qty</th>
                <th className="px-3 py-2 text-right font-medium">Rate</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">Approved by</th>
              </tr>
            </thead>
            <tbody>
              {receiveRows.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="num px-3 py-2 font-semibold">{r.voucher_no}</td>
                  <td className="px-3 py-2 text-muted-foreground">{fmtDate(r.purchase_date)}</td>
                  <td className="px-3 py-2">{itemName(r.item_id)}</td>
                  <td className="px-3 py-2">{r.vendor_name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.bill_no || "—"}</td>
                  <td className="num px-3 py-2 text-right">{r.quantity}</td>
                  <td className="num px-3 py-2 text-right">{rupees(r.unit_price)}</td>
                  <td className="num px-3 py-2 text-right font-semibold">
                    {rupees(r.total_amount)}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{r.approved_by || "—"}</td>
                </tr>
              ))}
              {receiveRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">
                    No receive vouchers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-secondary text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Voucher no</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Item</th>
                <th className="px-3 py-2 font-medium">Issued to</th>
                <th className="px-3 py-2 font-medium">Department</th>
                <th className="px-3 py-2 font-medium">Using area</th>
                <th className="px-3 py-2 text-right font-medium">Qty</th>
                <th className="px-3 py-2 text-right font-medium">Balance</th>
                <th className="px-3 py-2 font-medium">Authorised by</th>
              </tr>
            </thead>
            <tbody>
              {issueRows.map((i) => (
                <tr key={i.id} className="border-t border-line">
                  <td className="num px-3 py-2 font-semibold">{i.voucher_no}</td>
                  <td className="px-3 py-2 text-muted-foreground">{fmtDate(i.issue_date)}</td>
                  <td className="px-3 py-2">{itemName(i.item_id)}</td>
                  <td className="px-3 py-2">{i.issued_to}</td>
                  <td className="px-3 py-2 text-muted-foreground">{i.department || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{i.using_area || "—"}</td>
                  <td className="num px-3 py-2 text-right">{i.qty_issued}</td>
                  <td className="num px-3 py-2 text-right">{i.balance_stock}</td>
                  <td className="px-3 py-2 text-muted-foreground">{i.authorised_by || "—"}</td>
                </tr>
              ))}
              {issueRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">
                    No issue vouchers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
