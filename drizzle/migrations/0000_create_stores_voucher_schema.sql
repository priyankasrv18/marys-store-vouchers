-- Items master
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  main_head TEXT NOT NULL,
  sub_head TEXT NOT NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'nos',
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  available_stock NUMERIC(12,2) NOT NULL DEFAULT 0,
  reorder_level NUMERIC(12,2) NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO anon, authenticated;
GRANT ALL ON public.items TO service_role;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items are public" ON public.items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Receive vouchers
CREATE TABLE public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_no TEXT NOT NULL,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  vendor_address TEXT,
  vendor_phone TEXT,
  bill_no TEXT,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mfg_date DATE,
  expiry_date DATE,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  approved_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receipts TO anon, authenticated;
GRANT ALL ON public.receipts TO service_role;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "receipts are public" ON public.receipts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Issue vouchers
CREATE TABLE public.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_no TEXT NOT NULL,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  issued_to TEXT NOT NULL,
  department TEXT,
  using_area TEXT,
  qty_issued NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_stock NUMERIC(12,2) NOT NULL DEFAULT 0,
  issued_by TEXT,
  authorised_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.issues TO anon, authenticated;
GRANT ALL ON public.issues TO service_role;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "issues are public" ON public.issues FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Stock movement triggers
CREATE OR REPLACE FUNCTION public.apply_receipt()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.items
     SET available_stock = available_stock + NEW.quantity,
         unit_price = NEW.unit_price
   WHERE id = NEW.item_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_apply_receipt AFTER INSERT ON public.receipts
FOR EACH ROW EXECUTE FUNCTION public.apply_receipt();

CREATE OR REPLACE FUNCTION public.apply_issue()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cur NUMERIC;
BEGIN
  SELECT available_stock INTO cur FROM public.items WHERE id = NEW.item_id;
  IF cur IS NULL THEN RAISE EXCEPTION 'Item not found'; END IF;
  IF NEW.qty_issued > cur THEN RAISE EXCEPTION 'Not enough stock: only % available', cur; END IF;
  UPDATE public.items SET available_stock = cur - NEW.qty_issued WHERE id = NEW.item_id;
  NEW.balance_stock := cur - NEW.qty_issued;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_apply_issue BEFORE INSERT ON public.issues
FOR EACH ROW EXECUTE FUNCTION public.apply_issue();

-- Seed catalogue from the college stock ledger
INSERT INTO public.items (main_head, sub_head, name, unit, unit_price, available_stock, reorder_level) VALUES
('Plumbing','Pipes','PVC Pipe 1 inch','mtr',95,120,30),
('Plumbing','L Bows','PVC L Bow 1 inch','nos',28,60,20),
('Plumbing','Anglers','Angle Valve','nos',210,18,10),
('Electrical','Tubelights','LED Tubelight 20W','nos',310,42,15),
('Electrical','Wire Coils','Wire Coil 1.5 sq mm','coil',1150,6,4),
('Electrical','Switchs','Modular Switch 6A','nos',85,75,25),
('Stationary','A4 Paper','A4 Paper Ream 80 GSM','ream',280,9,15),
('Stationary','Pens','Blue Gel Pen','nos',12,340,100),
('Stationary','Pencials','HB Pencil','nos',6,260,100),
('Carpenting Material','Playwood Sheets','Plywood Sheet 18mm','sheet',1850,14,6),
('Carpenting Material','Doors','Flush Door 32mm','nos',3400,5,3),
('Hostel Canteen','Grains','Rice Sona Masoori','kg',58,420,150),
('Hostel Canteen','Oils','Sunflower Oil','ltr',132,48,30),
('Building Material','Cement','OPC 53 Grade Cement','bag',390,35,20),
('Building Material','Steel','TMT Steel Rod 8mm','nos',420,22,15);