This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Study uploads setup

The uploads page uses a private Supabase Storage bucket named `study-videos` and a
`study_uploads` table. Create both in Supabase before using `/uploads`:

```sql
create table public.study_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null,
  file_size bigint not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.study_uploads enable row level security;

create policy "Users can create their own upload records"
  on public.study_uploads for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view their own upload records"
  on public.study_uploads for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete their own upload records"
  on public.study_uploads for delete to authenticated
  using (auth.uid() = user_id);
```

Create the `study-videos` bucket in **Storage** and add Storage policies that
allow authenticated users to upload, view, and delete objects only under their
own user ID folder. An admin can review records by changing `status` to
`approved` or `rejected` in Supabase.

```sql
create policy "Users can upload their own study files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'study-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view their own study files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'study-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own study files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'study-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
