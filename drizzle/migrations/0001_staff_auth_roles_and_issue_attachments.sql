-- Roles
create type public.app_role as enum ('admin', 'staff');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  department text,
  email text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "profiles readable by authenticated" on public.profiles
  for select to authenticated using (true);
create policy "users update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "users insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

create policy "roles readable by authenticated" on public.user_roles
  for select to authenticated using (true);
create policy "admins manage roles" on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
grant insert, update, delete on public.user_roles to authenticated;

-- New signups get a profile; first ever user becomes admin, everyone else staff
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, department)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'department', '')
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (
    new.id,
    case when exists (select 1 from public.user_roles) then 'staff'::public.app_role
         else 'admin'::public.app_role end
  )
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lock the stores tables to signed-in staff
drop policy "items are public" on public.items;
drop policy "receipts are public" on public.receipts;
drop policy "issues are public" on public.issues;

revoke all on public.items from anon;
revoke all on public.receipts from anon;
revoke all on public.issues from anon;
grant select, insert, update, delete on public.items to authenticated;
grant select, insert, update, delete on public.receipts to authenticated;
grant select, insert, update, delete on public.issues to authenticated;

alter table public.receipts add column if not exists created_by uuid;
alter table public.issues add column if not exists created_by uuid;

create policy "staff read items" on public.items for select to authenticated using (true);
create policy "staff write items" on public.items for insert to authenticated with check (true);
create policy "staff update items" on public.items for update to authenticated using (true) with check (true);
create policy "admins delete items" on public.items for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "staff read receipts" on public.receipts for select to authenticated using (true);
create policy "staff create receipts" on public.receipts for insert to authenticated with check (auth.uid() is not null);
create policy "admins update receipts" on public.receipts for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admins delete receipts" on public.receipts for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "staff read issues" on public.issues for select to authenticated using (true);
create policy "staff create issues" on public.issues for insert to authenticated with check (auth.uid() is not null);
create policy "admins update issues" on public.issues for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admins delete issues" on public.issues for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Attachments on issue vouchers
create table public.issue_attachments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  mime_type text,
  file_size bigint,
  uploaded_by uuid,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.issue_attachments to authenticated;
grant all on public.issue_attachments to service_role;
alter table public.issue_attachments enable row level security;

create policy "staff read attachments" on public.issue_attachments
  for select to authenticated using (true);
create policy "staff add attachments" on public.issue_attachments
  for insert to authenticated with check (auth.uid() = uploaded_by);
create policy "owner or admin delete attachments" on public.issue_attachments
  for delete to authenticated
  using (auth.uid() = uploaded_by or public.has_role(auth.uid(), 'admin'));

create index if not exists issue_attachments_issue_id_idx on public.issue_attachments(issue_id);