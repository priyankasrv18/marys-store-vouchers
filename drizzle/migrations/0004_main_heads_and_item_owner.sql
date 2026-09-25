CREATE TABLE IF NOT EXISTS public.main_heads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.main_heads TO authenticated;
GRANT ALL ON public.main_heads TO service_role;
ALTER TABLE public.main_heads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read main heads" ON public.main_heads FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff add main heads" ON public.main_heads FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "admins delete main heads" ON public.main_heads FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.main_heads (name) SELECT DISTINCT main_head FROM public.items ON CONFLICT DO NOTHING;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS created_by uuid;