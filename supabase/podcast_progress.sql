-- Podcast progress persistence for authenticated users.
-- Run this in the Supabase SQL Editor when Supabase Auth is connected to ANKIU.

create extension if not exists pgcrypto;

create table if not exists public.podcast_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  podcast_id text not null,
  current_time double precision not null default 0 check (current_time >= 0),
  duration double precision not null default 0 check (duration >= 0),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, podcast_id)
);

alter table public.podcast_progress enable row level security;

create policy "podcast_progress_select_own"
on public.podcast_progress for select
to authenticated
using (auth.uid() = user_id);

create policy "podcast_progress_insert_own"
on public.podcast_progress for insert
to authenticated
with check (auth.uid() = user_id);

create policy "podcast_progress_update_own"
on public.podcast_progress for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "podcast_progress_delete_own"
on public.podcast_progress for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists podcast_progress_user_updated_idx
on public.podcast_progress (user_id, updated_at desc);

create or replace function public.set_podcast_progress_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists podcast_progress_set_updated_at on public.podcast_progress;
create trigger podcast_progress_set_updated_at
before update on public.podcast_progress
for each row execute function public.set_podcast_progress_updated_at();
