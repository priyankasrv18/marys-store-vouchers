import type { Issue, Item, Receipt } from "./stores";

type CellValue = string | number;
type Cell = { value: CellValue; style?: number };

const xmlEscape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const cellXml = (ref: string, cell: Cell) => {
  const style = cell.style ?? 3;
  if (typeof cell.value === "number" && Number.isFinite(cell.value)) {
    return "<c r=\"" + ref + "\" s=\"" + style + "\" t=\"n\"><v>" + String(cell.value) + "</v></c>";
  }
  return "<c r=\"" + ref + "\" t=\"inlineStr\" s=\"" + style + "\"><is><t xml:space=\"preserve\">" + xmlEscape(String(cell.value)) + "</t></is></c>";
};

const rowXml = (rowNumber: number, cells: Record<string, Cell>) => {
  const content = Object.keys(cells).sort().map((column) => cellXml(column + rowNumber, cells[column])).join("");
  return "<row r=\"" + rowNumber + "\">" + content + "</row>";
};

const dateText = (value: string | null | undefined) => (value ? String(value).slice(0, 10) : "");
const itemLabel = (item: Item) => [item.sub_head, item.name].filter(Boolean).join(" / ");

const stylesXml = [
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
  '<numFmts count="1"><numFmt numFmtId="164" formatCode="₹#,##0.00"/></numFmts>',
  '<fonts count="2"><font><sz val="10"/><color rgb="FF1F2937"/><name val="Aptos"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Aptos"/></font></fonts>',
  '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F4E78"/><bgColor indexed="64"/></patternFill></fill></fills>',
  '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD9E2EC"/></left><right style="thin"><color rgb="FFD9E2EC"/></right><top style="thin"><color rgb="FFD9E2EC"/></top><bottom style="thin"><color rgb="FFD9E2EC"/></bottom><diagonal/></border></borders>',
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>',
  '<cellXfs count="7"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="4" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf></cellXfs>',
  '</styleSheet>',
].join("\\n");

const workbookXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Stock Ledger" sheetId="1" r:id="rId1"/></sheets></workbook>';
const workbookRelsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
const rootRelsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
const contentTypesXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>';

const buildSheetXml = (items: Item[], receipts: Receipt[], issues: Issue[]) => {
  const rows: string[] = [];
  rows.push(rowXml(3, { D: { value: "Main Head", style: 1 }, E: { value: "Receive material", style: 1 }, S: { value: "Issue material", style: 1 } }));
  rows.push(rowXml(4, { C: { value: "No.", style: 2 }, D: { value: "Main Head", style: 2 }, E: { value: "Sub Heads / Item", style: 2 }, F: { value: "Shop / Vendor Name", style: 2 }, G: { value: "Address", style: 2 }, H: { value: "Phone No", style: 2 }, I: { value: "Bill / Invoice No", style: 2 }, J: { value: "Purchase date", style: 2 }, K: { value: "Mfg. Date", style: 2 }, L: { value: "Expiry Date", style: 2 }, M: { value: "Unit Price", style: 2 }, N: { value: "Quantity / Count / KGs", style: 2 }, O: { value: "Total Amount", style: 2 }, P: { value: "Available Stock", style: 2 }, Q: { value: "Approved By", style: 2 }, S: { value: "Date", style: 2 }, T: { value: "Issued to", style: 2 }, U: { value: "Dept / Block", style: 2 }, V: { value: "Using Area", style: 2 }, W: { value: "Qty Issued", style: 2 }, X: { value: "Bal Stock", style: 2 }, Y: { value: "Issued By", style: 2 }, Z: { value: "Authorised By", style: 2 } }));
  let rowNumber = 5;
  let sequence = 1;
  const addItemRow = (item: Item, receipt?: Receipt, issue?: Issue) => {
    const cells: Record<string, Cell> = { C: { value: sequence++, style: 4 }, D: { value: item.main_head, style: 3 }, E: { value: itemLabel(item), style: 3 }, P: { value: item.available_stock, style: 4 } };
    if (receipt) {
      cells.F = { value: receipt.vendor_name, style: 3 }; cells.G = { value: receipt.vendor_address ?? "", style: 3 }; cells.H = { value: receipt.vendor_phone ?? "", style: 3 }; cells.I = { value: receipt.bill_no ?? "", style: 3 }; cells.J = { value: dateText(receipt.purchase_date), style: 6 }; cells.K = { value: dateText(receipt.mfg_date), style: 6 }; cells.L = { value: dateText(receipt.expiry_date), style: 6 }; cells.M = { value: receipt.unit_price, style: 5 }; cells.N = { value: receipt.quantity, style: 4 }; cells.O = { value: receipt.total_amount, style: 5 }; cells.Q = { value: receipt.approved_by ?? "", style: 3 };
    }
    if (issue) {
      cells.S = { value: dateText(issue.issue_date), style: 6 }; cells.T = { value: issue.issued_to, style: 3 }; cells.U = { value: issue.department ?? "", style: 3 }; cells.V = { value: issue.using_area ?? "", style: 3 }; cells.W = { value: issue.qty_issued, style: 4 }; cells.X = { value: issue.balance_stock, style: 4 }; cells.Y = { value: issue.issued_by ?? "", style: 3 }; cells.Z = { value: issue.authorised_by ?? "", style: 3 };
    }
    rows.push(rowXml(rowNumber++, cells));
  };
  items.forEach((item) => {
    const itemReceipts = receipts.filter((receipt) => receipt.item_id === item.id);
    const itemIssues = issues.filter((issue) => issue.item_id === item.id);
    if (itemReceipts.length === 0 && itemIssues.length === 0) addItemRow(item);
    itemReceipts.forEach((receipt) => addItemRow(item, receipt));
    itemIssues.forEach((issue) => addItemRow(item, undefined, issue));
  });
  const widthValues = [3, 3, 7, 20, 24, 24, 24, 14, 18, 14, 14, 14, 14, 16, 16, 16, 18, 3, 14, 22, 18, 20, 14, 14, 18, 18];
  const widths = widthValues.map((width, index) => '<col min="' + (index + 1) + '" max="' + (index + 1) + '" width="' + width + '" customWidth="1"/>').join("");
  const lastRow = Math.max(4, rowNumber - 1);
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:Z' + lastRow + '"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="4" topLeftCell="A5" state="frozen"/></sheetView></sheetViews><cols>' + widths + '</cols><sheetData>' + rows.join("") + '</sheetData><mergeCells count="2"><mergeCell ref="E3:Q3"/><mergeCell ref="S3:Z3"/></mergeCells><pageMargins left="0.25" right="0.25" top="0.5" bottom="0.5" header="0.2" footer="0.2"/><pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0" paperSize="9"/></worksheet>';
};

const crcTable = (() => { const table = new Uint32Array(256); for (let n = 0; n < 256; n += 1) { let c = n; for (let k = 0; k < 8; k += 1) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c >>> 0; } return table; })();
const crc32 = (bytes: Uint8Array) => { let crc = 0xffffffff; for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8); return (crc ^ 0xffffffff) >>> 0; };
const concat = (parts: Uint8Array[]) => { const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0)); let offset = 0; parts.forEach((part) => { result.set(part, offset); offset += part.length; }); return result; };

const zipStored = (files: Array<[string, string]>) => {
  const encoder = new TextEncoder(); const localParts: Uint8Array[] = []; const centralParts: Uint8Array[] = []; let offset = 0;
  files.forEach(([name, content]) => {
    const nameBytes = encoder.encode(name); const data = encoder.encode(content); const crc = crc32(data);
    const local = new Uint8Array(30 + nameBytes.length + data.length); const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true); localView.setUint16(4, 20, true); localView.setUint16(26, nameBytes.length, true); localView.setUint32(14, crc, true); localView.setUint32(18, data.length, true); localView.setUint32(22, data.length, true); local.set(nameBytes, 30); local.set(data, 30 + nameBytes.length); localParts.push(local);
    const central = new Uint8Array(46 + nameBytes.length); const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true); centralView.setUint16(4, 20, true); centralView.setUint16(6, 20, true); centralView.setUint16(26, nameBytes.length, true); centralView.setUint32(16, crc, true); centralView.setUint32(20, data.length, true); centralView.setUint32(24, data.length, true); centralView.setUint32(42, offset, true); central.set(nameBytes, 46); centralParts.push(central); offset += local.length;
  });
  const centralDirectory = concat(centralParts); const end = new Uint8Array(22); const endView = new DataView(end.buffer); endView.setUint32(0, 0x06054b50, true); endView.setUint16(8, files.length, true); endView.setUint16(10, files.length, true); endView.setUint32(12, centralDirectory.length, true); endView.setUint32(16, offset, true); return concat([...localParts, centralDirectory, end]);
};

export function downloadStockLedgerExcel({ items, receipts, issues }: { items: Item[]; receipts: Receipt[]; issues: Issue[] }) {
  const files: Array<[string, string]> = [["[Content_Types].xml", contentTypesXml], ["_rels/.rels", rootRelsXml], ["xl/workbook.xml", workbookXml], ["xl/_rels/workbook.xml.rels", workbookRelsXml], ["xl/styles.xml", stylesXml], ["xl/worksheets/sheet1.xml", buildSheetXml(items, receipts, issues)]];
  const blob = new Blob([zipStored(files)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "st-marys-stock-ledger.xlsx"; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
