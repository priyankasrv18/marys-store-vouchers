ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS record_no text NOT NULL DEFAULT '';
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS record_no text NOT NULL DEFAULT '';
UPDATE public.receipts SET record_no = voucher_no WHERE record_no = '';
UPDATE public.issues SET record_no = voucher_no WHERE record_no = '';
ALTER TABLE public.receipts ALTER COLUMN voucher_no SET DEFAULT '';
ALTER TABLE public.issues ALTER COLUMN voucher_no SET DEFAULT '';
COMMENT ON COLUMN public.receipts.voucher_no IS 'DEPRECATED: replaced by record_no';
COMMENT ON COLUMN public.issues.voucher_no IS 'DEPRECATED: replaced by record_no';

CREATE TABLE IF NOT EXISTS public.staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  department text,
  designation text,
  email text,
  phone text,
  college text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_members TO anon, authenticated;
GRANT ALL ON public.staff_members TO service_role;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open staff members" ON public.staff_members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.items, public.receipts, public.issues, public.main_heads TO anon;
GRANT SELECT, INSERT ON public.issue_attachments TO anon;
CREATE POLICY "open read items" ON public.items FOR SELECT TO anon USING (true);
CREATE POLICY "open insert items" ON public.items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "open update items" ON public.items FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "open read receipts" ON public.receipts FOR SELECT TO anon USING (true);
CREATE POLICY "open insert receipts" ON public.receipts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "open read issues" ON public.issues FOR SELECT TO anon USING (true);
CREATE POLICY "open insert issues" ON public.issues FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "open read main heads" ON public.main_heads FOR SELECT TO anon USING (true);
CREATE POLICY "open insert main heads" ON public.main_heads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "open read attachments" ON public.issue_attachments FOR SELECT TO anon USING (true);
CREATE POLICY "open insert attachments" ON public.issue_attachments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "open read issue files" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'issue-attachments');
CREATE POLICY "open upload issue files" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'issue-attachments');