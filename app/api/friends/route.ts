import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const CATEGORIES = ['song', 'album', 'retro']

interface Pick {
  category: string
  song_name: string
  artist_name?: string | null
  spotify_url?: string | null
  thumbnail_url?: string | null
  youtube_search_url?: string | null
}

export async function POST(request: NextRequest) {
  let supabase
  try {
    supabase = createAdminClient()
  } catch (err) {
    console.error('Friends API: admin client unavailable', err)
    return NextResponse.json({ error: 'Server is missing its database key.' }, { status: 500 })
  }
  const body = await request.json()
  const { name, email, picks } = body as { name?: string; email?: string; picks?: Pick[] }

  const cleanName = typeof name === 'string' ? name.trim().slice(0, 80) : ''
  if (!cleanName) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  }

  if (!Array.isArray(picks) || picks.length === 0) {
    return NextResponse.json({ error: 'Add at least one pick.' }, { status: 400 })
  }

  const seen = new Set<string>()
  for (const p of picks) {
    if (!p?.song_name || !CATEGORIES.includes(p.category) || seen.has(p.category)) {
      return NextResponse.json({ error: 'Invalid picks.' }, { status: 400 })
    }
    seen.add(p.category)
  }

  // Email is optional; only enforce one submission per email when one is given
  const cleanEmail: string | null =
    typeof email === 'string' && email.trim() ? email.toLowerCase().trim() : null

  if (cleanEmail) {
    const { data: existing } = await supabase
      .from('friend_submissions')
      .select('id')
      .eq('email', cleanEmail)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'already_submitted' }, { status: 409 })
    }
  }

  const { error } = await supabase.from('friend_submissions').insert(
    picks.map(p => ({
      name: cleanName,
      email: cleanEmail,
      category: p.category,
      song_name: p.song_name.trim(),
      artist_name: p.artist_name?.trim() ?? null,
      spotify_url: p.spotify_url ?? null,
      thumbnail_url: p.thumbnail_url ?? null,
      youtube_search_url: p.youtube_search_url ?? null,
    }))
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
