import type { Issue, Item, Receipt } from "./stores";

const HEADERS: Record<string, string> = {
  C: "No.", D: "Main Head", E: "Sub Heads", F: "Shop/Vendor Name", G: "Address", H: "Phone No",
  I: "Bill / Invoice No", J: "Purchase date", K: "Mfg. Date", L: "Expiry Date", M: "Unit Price",
  N: "Quantity / Count / KGs", O: "Total Amount", P: "Available Stock", Q: "Approved By",
  S: "Date", T: "Issued to", U: "Dept/Block", V: "Using Area", W: "Qty Issued", X: "Bal Stock",
  Y: "Issued By", Z: "Authorised By",
};
const WIDTHS: Record<string, number> = {
  A: 3, B: 3, C: 6, D: 20, E: 24, F: 24, G: 24, H: 14, I: 18, J: 14, K: 14, L: 14, M: 12, N: 16,
  O: 14, P: 14, Q: 18, R: 3, S: 14, T: 22, U: 18, V: 20, W: 12, X: 12, Y: 18, Z: 18,
};

const d = (v: string | null | undefined) => (v ? String(v).slice(0, 10) : "");

export async function downloadStockLedgerExcel({ items, receipts, issues }: { items: Item[]; receipts: Receipt[]; issues: Issue[] }) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sheet1", { views: [{ state: "frozen", ySplit: 4 }] });
  Object.entries(WIDTHS).forEach(([c, w]) => (ws.getColumn(c).width = w));

  const border = { style: "thin" as const, color: { argb: "FF9CA3AF" } };
  const allBorders = { top: border, left: border, bottom: border, right: border };
  const head = (ref: string, value: string, fill = "FF1F4E78") => {
    const cell = ws.getCell(ref);
    cell.value = value;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Arial", size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = allBorders;
  };

  ws.getCell("C1").value = "St. Mary's Group of Institutions Guntur for Women — Stores Stock Ledger";
  ws.getCell("C1").font = { bold: true, size: 13, name: "Arial" };
  head("D3", "Main Head");
  ws.mergeCells("E3:Q3"); head("E3", "Receive material");
  ws.mergeCells("S3:Z3"); head("S3", "Issue material", "FF7A4E0B");
  Object.entries(HEADERS).forEach(([c, v]) => head(`${c}4`, v, c >= "S" ? "FF7A4E0B" : "FF2F6F8F"));
  ws.getRow(4).height = 30;

  let row = 5;
  let seq = 1;
  const heads = Array.from(new Set(items.map((i) => i.main_head)));
  for (const mh of heads) {
    const start = row;
    for (const item of items.filter((i) => i.main_head === mh)) {
      const recs = receipts.filter((r) => r.item_id === item.id);
      const iss = issues.filter((i) => i.item_id === item.id);
      const lines = Math.max(1, recs.length, iss.length);
      for (let k = 0; k < lines; k++) {
        const r = recs[k];
        const i = iss[k];
        const vals: Record<string, string | number> = {
          C: seq++, E: item.name, P: item.available_stock,
        };
        if (r) Object.assign(vals, {
          F: r.vendor_name, G: r.vendor_address ?? "", H: r.vendor_phone ?? "", I: r.bill_no ?? "",
          J: d(r.purchase_date), K: d(r.mfg_date), L: d(r.expiry_date), M: Number(r.unit_price),
          N: Number(r.quantity), O: Number(r.total_amount), Q: r.approved_by ?? "",
        });
        if (i) Object.assign(vals, {
          S: d(i.issue_date), T: i.issued_to, U: i.department ?? "", V: i.using_area ?? "",
          W: Number(i.qty_issued), X: Number(i.balance_stock), Y: i.issued_by ?? "", Z: i.authorised_by ?? "",
        });
        Object.keys(HEADERS).forEach((c) => {
          const cell = ws.getCell(`${c}${row}`);
          if (vals[c] !== undefined) cell.value = vals[c];
          cell.border = allBorders;
          cell.font = { name: "Arial", size: 10 };
          if (c === "M" || c === "O") cell.numFmt = "₹#,##0.00";
        });
        row++;
      }
    }
    if (row - 1 > start) ws.mergeCells(`D${start}:D${row - 1}`);
    const mc = ws.getCell(`D${start}`);
    mc.value = mh;
    mc.font = { bold: true, name: "Arial", size: 10 };
    mc.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  }

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `st-marys-stock-ledger-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
