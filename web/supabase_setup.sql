-- Run this once in Supabase SQL Editor
create table if not exists public.borrow_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id text not null,
  book_name text,
  author text,
  status text not null default 'Pending',
  request_date timestamptz not null default now(),
  due_date timestamptz
);

alter table public.borrow_requests enable row level security;

-- Users can see only their own requests
create policy if not exists "read_own_requests"
on public.borrow_requests
for select
using (auth.uid() = user_id);

-- Users can insert only for themselves
create policy if not exists "insert_own_requests"
on public.borrow_requests
for insert
with check (auth.uid() = user_id);

-- Users can update only their own requests
create policy if not exists "update_own_requests"
on public.borrow_requests
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
