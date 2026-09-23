-- Restore authenticated access and store the selected college on each account.
alter table public.profiles add column if not exists college text;
alter table public.items add column if not exists created_by uuid references auth.users(id);

create index if not exists profiles_college_idx on public.profiles(college);
create index if not exists items_created_by_idx on public.items(created_by);
create index if not exists receipts_created_by_idx on public.receipts(created_by);
create index if not exists issues_created_by_idx on public.issues(created_by);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, department, college)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'department', ''),
    nullif(new.raw_user_meta_data ->> 'college', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    college = coalesce(excluded.college, public.profiles.college);

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

-- Anonymous access was useful while the project had no login, but it would bypass the role matrix.
revoke all on public.items from anon;
revoke all on public.receipts from anon;
revoke all on public.issues from anon;
revoke all on public.main_heads from anon;
revoke all on public.issue_attachments from anon;

drop policy if exists "anonymous access to items" on public.items;
drop policy if exists "anonymous access to receipts" on public.receipts;
drop policy if exists "anonymous access to issues" on public.issues;
drop policy if exists "anonymous access to issue attachments" on public.issue_attachments;
drop policy if exists "anonymous read issue attachments" on storage.objects;
drop policy if exists "anonymous upload issue attachments" on storage.objects;
drop policy if exists "anonymous delete issue attachments" on storage.objects;
drop policy if exists "main heads are public" on public.main_heads;

-- Keep the catalogue visible to signed-in users, but let non-admin users edit only items they created.
drop policy if exists "staff read items" on public.items;
drop policy if exists "staff write items" on public.items;
drop policy if exists "staff update items" on public.items;
drop policy if exists "admins delete items" on public.items;
create policy "signed in users read items" on public.items
  for select to authenticated using (true);
create policy "signed in users create items" on public.items
  for insert to authenticated with check (created_by = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "owners and admins update items" on public.items
  for update to authenticated
  using (created_by = auth.uid() or public.has_role(auth.uid(), 'admin'))
  with check (created_by = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "admins delete items" on public.items
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "staff read receipts" on public.receipts;
drop policy if exists "staff create receipts" on public.receipts;
drop policy if exists "admins update receipts" on public.receipts;
drop policy if exists "admins delete receipts" on public.receipts;
create policy "admins and owners read receipts" on public.receipts
  for select to authenticated
  using (created_by = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "signed in users create receipts" on public.receipts
  for insert to authenticated with check (created_by = auth.uid());
create policy "admins update receipts" on public.receipts
  for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admins delete receipts" on public.receipts
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "staff read issues" on public.issues;
drop policy if exists "staff create issues" on public.issues;
drop policy if exists "admins update issues" on public.issues;
drop policy if exists "admins delete issues" on public.issues;
create policy "admins and owners read issues" on public.issues
  for select to authenticated
  using (created_by = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "admins create issues" on public.issues
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin') and created_by = auth.uid());
create policy "admins update issues" on public.issues
  for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admins delete issues" on public.issues
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "main heads are public" on public.main_heads;
create policy "signed in users manage main heads" on public.main_heads
  for all to authenticated using (true) with check (true);

-- Issue attachments follow the same signed-in boundary.
drop policy if exists "staff read attachments" on public.issue_attachments;
drop policy if exists "staff add attachments" on public.issue_attachments;
drop policy if exists "owner or admin delete attachments" on public.issue_attachments;
create policy "signed in users read attachments" on public.issue_attachments
  for select to authenticated using (true);
create policy "signed in users add attachments" on public.issue_attachments
  for insert to authenticated with check (auth.uid() = uploaded_by);
create policy "owner or admin delete attachments" on public.issue_attachments
  for delete to authenticated
  using (auth.uid() = uploaded_by or public.has_role(auth.uid(), 'admin'));

drop policy if exists "authenticated read issue attachments" on storage.objects;
drop policy if exists "authenticated upload issue attachments" on storage.objects;
drop policy if exists "authenticated delete issue attachments" on storage.objects;
create policy "authenticated read issue attachments" on storage.objects
  for select to authenticated using (bucket_id = 'issue-attachments');
create policy "authenticated upload issue attachments" on storage.objects
  for insert to authenticated with check (bucket_id = 'issue-attachments');
create policy "authenticated delete issue attachments" on storage.objects
  for delete to authenticated using (bucket_id = 'issue-attachments');
