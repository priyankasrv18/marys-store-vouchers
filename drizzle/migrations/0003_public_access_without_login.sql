-- The voucher system is intentionally public: no login page or session is required.
-- Restore anonymous access after the staff-auth migration removed it.

grant select, insert, update, delete on public.items to anon;
grant select, insert, update, delete on public.receipts to anon;
grant select, insert, update, delete on public.issues to anon;

create policy "anonymous access to items" on public.items
  for all to anon using (true) with check (true);
create policy "anonymous access to receipts" on public.receipts
  for all to anon using (true) with check (true);
create policy "anonymous access to issues" on public.issues
  for all to anon using (true) with check (true);

grant select, insert, delete on public.issue_attachments to anon;
create policy "anonymous access to issue attachments" on public.issue_attachments
  for all to anon using (true) with check (true);

create policy "anonymous read issue attachments" on storage.objects
  for select to anon using (bucket_id = 'issue-attachments');
create policy "anonymous upload issue attachments" on storage.objects
  for insert to anon with check (bucket_id = 'issue-attachments');
create policy "anonymous delete issue attachments" on storage.objects
  for delete to anon using (bucket_id = 'issue-attachments');
