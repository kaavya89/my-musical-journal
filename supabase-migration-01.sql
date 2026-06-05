-- Migration 01: Add track metadata columns to friend_submissions
-- Run in: Supabase Dashboard → SQL Editor → New query

alter table public.friend_submissions
  add column if not exists spotify_url      text,
  add column if not exists thumbnail_url    text,
  add column if not exists youtube_search_url text;
