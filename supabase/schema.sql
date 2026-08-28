-- Run this script in the Supabase SQL Editor before using /uploads.

create table if not exists public.study_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null,
  file_size bigint not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.study_uploads enable row level security;

drop policy if exists "Users can create their own upload records"
  on public.study_uploads;
create policy "Users can create their own upload records"
  on public.study_uploads for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can view their own upload records"
  on public.study_uploads;
create policy "Users can view their own upload records"
  on public.study_uploads for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own upload records"
  on public.study_uploads;
create policy "Users can delete their own upload records"
  on public.study_uploads for delete to authenticated
  using (auth.uid() = user_id);

-- Admin-only access for approval/rejection. Replace the email below with your admin account email.
drop policy if exists "Admins can read all upload records"
on public.study_uploads;
create policy "Admins can read all upload records"
on public.study_uploads for select to authenticated
using (auth.email() = 'admin@example.com');

drop policy if exists "Admins can update all upload statuses"
on public.study_uploads;
create policy "Admins can update all upload statuses"
on public.study_uploads for update to authenticated
using (auth.email() = 'admin@example.com')
with check (auth.email() = 'admin@example.com');

insert into storage.buckets (id, name, public)
values ('study-videos', 'study-videos', false)
on conflict (id) do nothing;

drop policy if exists "Users can upload their own study files"
  on storage.objects;
create policy "Users can upload their own study files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'study-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can view their own study files"
  on storage.objects;
create policy "Users can view their own study files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'study-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete their own study files"
  on storage.objects;
create policy "Users can delete their own study files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'study-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
