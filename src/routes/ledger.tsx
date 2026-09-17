import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { itemsQuery, MAIN_HEADS, rupees, type Item } from "@/lib/stores";

export const Route = createFileRoute("/ledger")({
  head: () => ({
    meta: [
      { title: "Stock Ledger | St. Mary's Stores" },
      {
        name: "description",
        content:
          "Stock ledger grouped by main head and sub head with rate, available quantity and stock value.",
      },
      { property: "og:title", content: "Stock Ledger | St. Mary's Stores" },
      {
        property: "og:description",
        content: "Stock grouped by main head and sub head with value.",
      },
    ],
  }),
  component: LedgerPage,
});

function LedgerPage() {
  const items = useQuery(itemsQuery);
  const [search, setSearch] = useState("");

  const all = (items.data ?? []).filter((i) =>
    (i.name + i.sub_head + i.main_head).toLowerCase().includes(search.toLowerCase()),
  );

  const grouped = MAIN_HEADS.map((head) => ({
    head,
    rows: all.filter((i) => i.main_head === head),
  })).filter((g) => g.rows.length > 0);

  const value = (i: Item) => i.available_stock * i.unit_price;

  const exportCsv = () => {
    const header = "Main Head,Sub Head,Item,Unit,Rate,Available,Value\n";
    const body = all
      .map((i) =>
        [i.main_head, i.sub_head, i.name, i.unit, i.unit_price, i.available_stock, value(i)]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(new Blob([header + body], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "stock-ledger.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Stock Ledger</h1>
          <p className="text-sm text-muted-foreground">Grouped by main head and sub head</p>
        </div>
        <div className="flex gap-2">
          <input
            className="field w-56"
            placeholder="Search item or head"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={60}
          />
          <button
            onClick={exportCsv}
            className="rounded-md border border-line bg-card px-3 py-2 text-sm font-semibold"
          >
            Export CSV
          </button>
        </div>
      </header>

      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-secondary text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Sub head</th>
              <th className="px-3 py-2 font-medium">Item</th>
              <th className="px-3 py-2 font-medium">Unit</th>
              <th className="px-3 py-2 text-right font-medium">Rate</th>
              <th className="px-3 py-2 text-right font-medium">Available</th>
              <th className="px-3 py-2 text-right font-medium">Value</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map((g) => (
              <>
                <tr key={g.head} className="bg-primary/8">
                  <td colSpan={7} className="px-3 py-1.5 font-serif font-semibold text-primary">
                    {g.head}
                  </td>
                </tr>
                {g.rows.map((i) => {
                  const low = i.available_stock <= i.reorder_level;
                  return (
                    <tr key={i.id} className="border-t border-line">
                      <td className="px-3 py-2 text-muted-foreground">{i.sub_head}</td>
                      <td className="px-3 py-2">{i.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{i.unit}</td>
                      <td className="num px-3 py-2 text-right">{rupees(i.unit_price)}</td>
                      <td className="num px-3 py-2 text-right">{i.available_stock}</td>
                      <td className="num px-3 py-2 text-right">{rupees(value(i))}</td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            low
                              ? "rounded-md bg-warn-soft px-2 py-0.5 text-[11px] font-semibold text-warn"
                              : "rounded-md bg-ok-soft px-2 py-0.5 text-[11px] font-semibold text-ok"
                          }
                        >
                          {low ? "Low" : "OK"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </>
            ))}
            {grouped.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  No items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
