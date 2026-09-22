create policy "staff read issue attachments" on storage.objects
  for select to authenticated using (bucket_id = 'issue-attachments');
create policy "staff upload issue attachments" on storage.objects
  for insert to authenticated with check (bucket_id = 'issue-attachments' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "owner or admin delete issue attachments" on storage.objects
  for delete to authenticated using (
    bucket_id = 'issue-attachments'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.has_role(auth.uid(), 'admin'))
  );