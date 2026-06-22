-- =============================================================
-- VIMS — 0003_storage.sql : storage buckets + access policies
-- Buckets are private; the app serves files via signed URLs.
-- =============================================================

insert into storage.buckets (id, name, public)
values
  ('invoices', 'invoices', false),
  ('receipts', 'receipts', false),
  ('profile-images', 'profile-images', true)
on conflict (id) do nothing;

-- INVOICES bucket: owner/co-owner write, all authenticated read.
create policy "invoices read" on storage.objects
  for select to authenticated using (bucket_id = 'invoices');
create policy "invoices write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'invoices' and public.is_owner_or_coowner());
create policy "invoices update" on storage.objects
  for update to authenticated
  using (bucket_id = 'invoices' and public.is_owner_or_coowner());
create policy "invoices delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'invoices' and public.is_owner_or_coowner());

-- RECEIPTS bucket: owner/co-owner full; team can upload when permitted.
create policy "receipts read" on storage.objects
  for select to authenticated using (bucket_id = 'receipts');
create policy "receipts write" on storage.objects
  for insert to authenticated with check (bucket_id = 'receipts');
create policy "receipts delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'receipts' and public.is_owner_or_coowner());

-- PROFILE IMAGES: a user manages files under a folder named after their uid.
create policy "avatars read" on storage.objects
  for select using (bucket_id = 'profile-images');
create policy "avatars write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars update" on storage.objects
  for update to authenticated
  using (bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text);
