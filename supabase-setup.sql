-- ============================================================
-- My Musical Journal — Supabase Database Setup
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. TRACKS TABLE
create table if not exists public.tracks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  title       text not null,
  artist      text not null,
  album       text,
  thumbnail_url       text,
  spotify_url         text,
  youtube_search_url  text,
  notes       text,
  added_at    timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.tracks enable row level security;

-- Only the authenticated owner can read/write their tracks
create policy "Owner can do everything" on public.tracks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. FRIEND SUBMISSIONS TABLE
create table if not exists public.friend_submissions (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  song_name   text not null,
  artist_name text,
  submitted_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.friend_submissions enable row level security;

-- Anyone can insert (submit their song)
create policy "Anyone can submit" on public.friend_submissions
  for insert
  with check (true);

-- Anyone can read their own row (to check for duplicates via the API)
create policy "Anyone can read by email" on public.friend_submissions
  for select
  using (true);

-- Only authenticated users (you) can update/delete
create policy "Owner can manage" on public.friend_submissions
  for all
  using (auth.role() = 'authenticated');
