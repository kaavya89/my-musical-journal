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
  const [hovered, setHovered] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  return (
    <div
      className="relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
      style={{ aspectRatio: '1', background: 'var(--card)', border: '1px solid var(--border)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowDelete(false) }}
    >
      {track.thumbnail_url ? (
        <Image
          src={track.thumbnail_url}
          alt={track.title}
          fill
          className="object-cover"
          sizes="200px"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: 'var(--border)' }}>
          🎵
        </div>
      )}

      {/* Overlay */}
      {hovered && (
        <div
          className="absolute inset-0 flex flex-col justify-end p-3 transition-all"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 60%, rgba(0,0,0,0.2) 100%)' }}
        >
          <div className="text-xs font-semibold text-white truncate">{track.title}</div>
          <div className="text-xs text-gray-400 truncate mb-1">{track.artist}</div>

          {track.notes && (
            <div
              className="text-xs text-gray-300 leading-relaxed mb-2 overflow-y-auto"
              style={{ maxHeight: '80px', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              {track.notes}
            </div>
          )}

          <div className="flex items-center gap-2 mt-1">
            {track.spotify_url && (
              <a
                href={track.spotify_url}
                target="_blank"
                rel="noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: 'var(--accent)', color: '#000' }}
              >
                Spotify
              </a>
            )}
            {track.youtube_search_url && (
              <a
                href={track.youtube_search_url}
                target="_blank"
                rel="noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
              >
                YouTube
              </a>
            )}
            <button
              onClick={e => { e.stopPropagation(); setShowDelete(true) }}
              className="ml-auto text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#aaa' }}
            >
              ···
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {showDelete && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2"
          style={{ background: 'rgba(0,0,0,0.9)' }}
        >
          <p className="text-xs text-white text-center px-2">Remove from journal?</p>
          <div className="flex gap-2">
            <button
              onClick={() => onDelete(track.id)}
              className="text-xs px-3 py-1 rounded-full text-white"
              style={{ background: '#ef4444' }}
            >
              Remove
            </button>
            <button
              onClick={() => setShowDelete(false)}
              className="text-xs px-3 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
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
      {/* Nav */}
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
            <a
              href="/journal"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--accent)', color: '#000' }}
            >
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
