'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface Track {
  id: string
  title: string
  artist: string
  album: string
  thumbnail_url: string | null
  spotify_url: string | null
  youtube_search_url: string | null
  notes: string | null
  added_at: string
}

function groupByMonth(tracks: Track[]) {
  const groups: Record<string, Track[]> = {}
  for (const track of tracks) {
    const date = new Date(track.added_at)
    const key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    if (!groups[key]) groups[key] = []
    groups[key].push(track)
  }
  return groups
}

function TrackCard({ track, onDelete }: { track: Track; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  return (
    <>
      {/* Thumbnail grid card */}
      <div
        onClick={() => setOpen(true)}
        className="relative rounded-xl overflow-hidden cursor-pointer group"
        style={{ aspectRatio: '1', background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        {track.thumbnail_url ? (
          <Image src={track.thumbnail_url} alt={track.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="200px"/>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: 'var(--border)' }}>🎵</div>
        )}
        {/* Hover overlay — just title, no truncated notes */}
        <div className="absolute inset-0 flex flex-col justify-end p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 50%, transparent 100%)' }}>
          <div className="text-xs font-semibold text-white truncate">{track.title}</div>
          <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>{track.artist}</div>
        </div>
      </div>

      {/* Full modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => { setOpen(false); setShowDelete(false) }}
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Album art — square */}
            {track.thumbnail_url && (
              <div className="relative w-full" style={{ aspectRatio: '1' }}>
                <Image src={track.thumbnail_url} alt={track.title} fill className="object-cover"/>
              </div>
            )}

            <div className="p-5">
              {/* Track info */}
              <div className="text-base font-semibold mb-0.5" style={{ color: 'var(--foreground)' }}>{track.title}</div>
              <div className="text-sm mb-0.5" style={{ color: 'var(--muted)' }}>{track.artist}</div>
              {track.album && (
                <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{track.album}</div>
              )}
              <div className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
                Added {new Date(track.added_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>

              {/* Full notes — no truncation */}
              {track.notes && (
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--foreground)', whiteSpace: 'pre-wrap' }}>
                  {track.notes}
                </p>
              )}

              {/* Links */}
              <div className="flex items-center gap-2">
                {track.spotify_url && (
                  <a href={track.spotify_url} target="_blank" rel="noreferrer"
                    className="px-4 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: 'var(--accent)', color: '#000' }}>
                    Spotify ↗
                  </a>
                )}
                {track.youtube_search_url && (
                  <a href={track.youtube_search_url} target="_blank" rel="noreferrer"
                    className="px-4 py-2 rounded-xl text-xs"
                    style={{ background: 'var(--border)', color: 'var(--foreground)' }}>
                    YouTube ↗
                  </a>
                )}
                <button
                  onClick={() => setShowDelete(!showDelete)}
                  className="ml-auto text-xs px-3 py-2 rounded-xl"
                  style={{ background: 'var(--border)', color: 'var(--muted)' }}>
                  Remove
                </button>
              </div>

              {/* Delete confirm */}
              {showDelete && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>Are you sure?</span>
                  <button
                    onClick={() => { onDelete(track.id); setOpen(false) }}
                    className="text-xs px-3 py-1 rounded-full text-white"
                    style={{ background: '#ef4444' }}>
                    Yes, remove
                  </button>
                  <button
                    onClick={() => setShowDelete(false)}
                    className="text-xs px-3 py-1 rounded-full"
                    style={{ background: 'var(--border)', color: 'var(--foreground)' }}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function TimelinePage() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetch('/api/tracks')
      .then(r => r.json())
      .then(data => { setTracks(data.tracks ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleDelete(id: string) {
    await fetch(`/api/tracks?id=${id}`, { method: 'DELETE' })
    setTracks(prev => prev.filter(t => t.id !== id))
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const grouped = groupByMonth(tracks)
  const months = Object.keys(grouped)

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <nav className="border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
        <div className="flex items-center gap-6">
          <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>🎵 My Musical Journal</span>
          <a href="/journal" className="text-sm" style={{ color: 'var(--muted)' }}>Add Track</a>
          <a href="/timeline" className="text-sm font-medium" style={{ color: 'var(--accent)' }}>Timeline</a>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs" style={{ color: 'var(--muted)' }}>{tracks.length} tracks</span>
          <button onClick={handleSignOut} className="text-xs" style={{ color: 'var(--muted)' }}>Sign out</button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <p className="text-sm italic leading-relaxed mb-10 max-w-xl" style={{ color: "var(--muted)", fontStyle: "italic" }}>
          This timeline shows my listening history with specific picks of the songs that mattered to me and ones I keep coming back to. The timeline is also a journal with tidbits on the songs themselves and why I liked them.
        </p>
        {loading && (
          <div className="text-center py-20 text-sm" style={{ color: 'var(--muted)' }}>
            Loading your journal…
          </div>
        )}

        {!loading && tracks.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🎵</div>
            <h2 className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>Your journal is empty</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Start adding tracks you love</p>
            <a href="/journal" className="px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'var(--accent)', color: '#000' }}>
              Add your first track
            </a>
          </div>
        )}

        {months.map(month => (
          <section key={month} className="mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: 'var(--muted)' }}>
              {month}
            </h2>
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
              {grouped[month].map(track => (
                <TrackCard key={track.id} track={track} onDelete={handleDelete} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
