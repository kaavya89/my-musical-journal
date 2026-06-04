import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  const { email, song_name, artist_name } = body

  if (!email || !song_name) {
    return NextResponse.json({ error: 'Email and song name are required.' }, { status: 400 })
  }

  // Check for existing submission
  const { data: existing } = await supabase
    .from('friend_submissions')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (existing) {
    return NextResponse.json({ error: 'already_submitted' }, { status: 409 })
  }

  const { error } = await supabase
    .from('friend_submissions')
    .insert({
      email: email.toLowerCase().trim(),
      song_name: song_name.trim(),
      artist_name: artist_name?.trim() ?? null,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
