import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { itemsQuery, receiptsQuery, issuesQuery, rupees } from "@/lib/stores";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stores Dashboard | St. Mary's Guntur" },
      {
        name: "description",
        content:
          "Live stock value, low-stock alerts and recent purchase and issue vouchers for the St. Mary's stores department.",
      },
      { property: "og:title", content: "Stores Dashboard | St. Mary's Guntur" },
      {
        property: "og:description",
        content: "Live stock value, low-stock alerts and recent vouchers.",
      },
    ],
  }),
  component: Dashboard,
});

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="panel p-4">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="num mt-1 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function Dashboard() {
  const items = useQuery(itemsQuery);
  const receipts = useQuery(receiptsQuery);
  const issues = useQuery(issuesQuery);

  const list = items.data ?? [];
  const totalValue = list.reduce((s, i) => s + i.available_stock * i.unit_price, 0);
  const low = list.filter((i) => i.available_stock <= i.reorder_level);
  const nameOf = (id: string) => list.find((i) => i.id === id)?.name ?? "Item";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Stores Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Purchase &amp; issue vouchers with live stock position
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/receive"
            className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            New Receive
          </Link>
          <Link
            to="/issue"
            className="rounded-md border border-line bg-card px-3 py-2 text-sm font-semibold"
          >
            New Issue
          </Link>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Total stock value"
          value={rupees(totalValue)}
          note={`${list.length} items in catalogue`}
        />
        <Stat
          label="Low stock items"
          value={String(low.length)}
          note="at or below reorder level"
        />
        <Stat
          label="Receive vouchers"
          value={String(receipts.data?.length ?? 0)}
          note="purchases recorded"
        />
        <Stat
          label="Issue vouchers"
          value={String(issues.data?.length ?? 0)}
          note="materials issued"
        />
      </section>

      <section className="panel p-4">
        <h2 className="text-base font-semibold">Reorder soon</h2>
        {low.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            All items are above their reorder level.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {low.map((i) => (
              <li key={i.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {i.name}
                  <span className="ml-2 text-xs text-muted-foreground">{i.main_head}</span>
                </span>
                <span className="num text-warn">
                  {i.available_stock} {i.unit} left
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <h2 className="text-base font-semibold">Recent receives</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {(receipts.data ?? []).slice(0, 6).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                <span className="num text-xs text-muted-foreground">{r.voucher_no}</span>
                <span className="flex-1 truncate">{nameOf(r.item_id)}</span>
                <span className="num">{rupees(r.total_amount)}</span>
              </li>
            ))}
            {(receipts.data ?? []).length === 0 && (
              <li className="py-2 text-muted-foreground">No purchases recorded yet.</li>
            )}
          </ul>
        </div>
        <div className="panel p-4">
          <h2 className="text-base font-semibold">Recent issues</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {(issues.data ?? []).slice(0, 6).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                <span className="num text-xs text-muted-foreground">{r.voucher_no}</span>
                <span className="flex-1 truncate">
                  {nameOf(r.item_id)} &middot; {r.issued_to}
                </span>
                <span className="num">{r.qty_issued}</span>
              </li>
            ))}
            {(issues.data ?? []).length === 0 && (
              <li className="py-2 text-muted-foreground">No issues recorded yet.</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
