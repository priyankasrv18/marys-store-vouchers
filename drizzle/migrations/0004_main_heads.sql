-- Persist the dynamic Main Head list separately from item rows so empty heads are supported.
create table if not exists public.main_heads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

grant select, insert, update, delete on public.main_heads to anon, authenticated;
grant all on public.main_heads to service_role;
alter table public.main_heads enable row level security;

drop policy if exists "main heads are public" on public.main_heads;
create policy "main heads are public" on public.main_heads
  for all to anon, authenticated using (true) with check (true);

insert into public.main_heads (name)
select distinct trim(main_head)
from public.items
where trim(main_head) <> ''
on conflict (name) do nothing;
