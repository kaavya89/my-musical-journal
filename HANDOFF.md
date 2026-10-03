# Handoff: My Musical Journal

Personal music journal. Owner (Kaavya) logs songs with notes; the timeline is public; friends submit a "song of the year" by email.

## Stack
- Next.js 16 (App Router, TypeScript), Tailwind v4, Supabase (Postgres + Auth + RLS), Vercel hosting
- Spotify Web API (client-credentials, search only); YouTube is just a search-URL fallback
- Secrets live in `.env.local` (gitignored): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`. Same vars are set in Vercel.
- PWA manifest + icons in `public/` (Add to Home Screen on iPhone)

## Routes
| Route | Access | Purpose |
|---|---|---|
| `/journal` | login required (middleware) | Search Spotify by text or link, add notes, save |
| `/timeline` | public | Tracks grouped by month, click for full entry. Remove button only when logged in (`isOwner`) |
| `/friends` | public | Email + song search; one submission per email |
| `/login` | public | Supabase email/password |
| `/api/search-music` | public | Spotify search / URL resolve |
| `/api/tracks` | GET public; POST/DELETE need auth | Track CRUD |
| `/api/friends` | public POST | Friend submissions |

## Done this session
- Timeline redesigned from a supplied design (zip: "Timeline · desktop (click any cover)"). Implemented in `app/timeline/page.tsx` + `app/globals.css`:
  - Cream notebook-grid background, Bricolage Grotesque + Newsreader (loaded via `<link>` in `app/layout.tsx`)
  - Two-column month sections (sticky month rail + card grid), vinyl-disc hover on cards
  - Fixed right-side month map that tracks scroll
  - Full-screen entry overlay: blurred art panel with spinning disc, Earlier/Later nav, notes split into a big italic lead sentence + remainder, Spotify/YouTube buttons, Esc closes
- `tsc --noEmit` passes. **Not yet visually verified**: the sandbox can't run the dev server and the user's local `npm run dev` / localhost did not open (cause unknown; earlier Node/icu4c breakage was fixed with `brew upgrade node`).
- Changes are **uncommitted**: `app/timeline/page.tsx`, `app/globals.css`, `app/layout.tsx`.

## Next steps
1. Get the dev server running locally (ask for the exact error) or push a branch (`new-timeline`) and review the Vercel preview URL.
2. Visually QA `/timeline`: card hover, overlay, month map, mobile layout (<=820px / <=900px breakpoints are in `globals.css`).
3. In Supabase, make sure the public read policy exists, or the public timeline is empty: `create policy "Public can read tracks" on public.tracks for select using (true);`
4. Run `supabase-migration-01.sql` if not already applied (adds spotify_url, thumbnail_url, youtube_search_url to `friend_submissions`).
5. Build the Dec 31 job (not started): collect friend submissions, resolve to Spotify/YouTube, build playlists, email everyone.

## Known gotchas
- Don't add platform-specific packages (e.g. `lightningcss-darwin-arm64`) to `package.json`; it breaks Vercel (EBADPLATFORM).
- Spotify images need the `remotePatterns` in `next.config.ts` (i.scdn.co, mosaic.scdn.co, *.spotifycdn.com, i.ytimg.com).
- Git commits from the Claude sandbox hit `index.lock` permission errors; the user commits/pushes from Terminal.
- The timeline design includes per-track accent colors (from album art) that the DB doesn't store; cards currently use a single muted color.
- `globals.css` still holds the dark theme vars used by `/journal`, `/login`, `/friends`; the timeline styles itself with the cream palette and `.tl-*` / `.dt-*` classes.
