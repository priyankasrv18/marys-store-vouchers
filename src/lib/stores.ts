import { supabase } from "@/integrations/supabase/client";

export type MainHead = {
  id: string;
  name: string;
  created_at: string;
};

export const mainHeadsQuery = {
  queryKey: ["main-heads"],
  queryFn: async (): Promise<MainHead[]> => {
    const { data, error } = await supabase
      .from("main_heads")
      .select("id, name, created_at")
      .order("created_at");
    if (error) throw error;
    return (data ?? []) as MainHead[];
  },
};

export const MAIN_HEADS = [
  "Plumbing",
  "Electrical",
  "Stationary",
  "Carpenting Material",
  "Hostel Canteen",
  "Building Material",
] as const;

export type Item = {
  id: string;
  main_head: string;
  sub_head: string;
  name: string;
  unit: string;
  unit_price: number;
  available_stock: number;
  reorder_level: number;
};

export type Receipt = {
  id: string;
  voucher_no: string;
  item_id: string;
  vendor_name: string;
  vendor_address: string | null;
  vendor_phone: string | null;
  bill_no: string | null;
  purchase_date: string;
  mfg_date: string | null;
  expiry_date: string | null;
  unit_price: number;
  quantity: number;
  total_amount: number;
  approved_by: string | null;
  created_at: string;
};

export type Issue = {
  id: string;
  voucher_no: string;
  item_id: string;
  issue_date: string;
  issued_to: string;
  department: string | null;
  using_area: string | null;
  qty_issued: number;
  balance_stock: number;
  issued_by: string | null;
  authorised_by: string | null;
  created_at: string;
};

export const rupees = (n: number) =>
  "\u20B9 " + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export const itemsQuery = {
  queryKey: ["items"],
  queryFn: async (): Promise<Item[]> => {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .order("main_head")
      .order("sub_head");
    if (error) throw error;
    return (data ?? []) as Item[];
  },
};

export const receiptsQuery = {
  queryKey: ["receipts"],
  queryFn: async (): Promise<Receipt[]> => {
    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Receipt[];
  },
};

export const issuesQuery = {
  queryKey: ["issues"],
  queryFn: async (): Promise<Issue[]> => {
    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Issue[];
  },
};

export const voucherNo = (prefix: string) =>
  `${prefix}-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
