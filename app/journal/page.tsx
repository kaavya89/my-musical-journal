'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface SearchResult {
  id: string
  type: 'track' | 'album'
  title: string
  artist: string
  album: string
  thumbnail: string | null
  spotify_url: string | null
  youtube_search_url: string
}

export default function JournalPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [notes, setNotes] = useState('')
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/search-music?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results ?? [])
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!query.trim()) { setResults([]); return }
    searchTimeout.current = setTimeout(() => search(query), 400)
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
  }, [query, search])

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    setError('')

    const res = await fetch('/api/tracks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: selected.title,
        artist: selected.artist,
        album: selected.album,
        thumbnail_url: selected.thumbnail,
        spotify_url: selected.spotify_url,
        youtube_search_url: selected.youtube_search_url,
        notes: notes.trim(),
      }),
    })

    if (res.ok) {
      setSaved(true)
      setSelected(null)
      setQuery('')
      setNotes('')
      setResults([])
      setTimeout(() => setSaved(false), 3000)
    } else {
      setError('Failed to save. Try again.')
    }
    setSaving(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Nav */}
      <nav className="border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-6">
          <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>🎵 My Musical Journal</span>
          <a href="/journal" className="text-sm font-medium" style={{ color: 'var(--accent)' }}>Add Track</a>
          <a href="/timeline" className="text-sm" style={{ color: 'var(--muted)' }}>Timeline</a>
        </div>
        <button onClick={handleSignOut} className="text-xs" style={{ color: 'var(--muted)' }}>
          Sign out
        </button>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
          What are you listening to?
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
          Search by name or paste a Spotify link
        </p>

        {/* Search */}
        <div className="relative mb-6">
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(null) }}
            placeholder="Search for a track or album…"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
            }}
          />
          {searching && (
            <span className="absolute right-4 top-3.5 text-xs" style={{ color: 'var(--muted)' }}>
              Searching…
            </span>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && !selected && (
          <div className="rounded-xl overflow-hidden mb-6" style={{ border: '1px solid var(--border)' }}>
            {results.map((r, i) => (
              <button
                key={r.id + i}
                onClick={() => { setSelected(r); setResults([]) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:opacity-80"
                style={{
                  background: 'var(--card)',
                  borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                {r.thumbnail ? (
                  <Image src={r.thumbnail} alt={r.title} width={40} height={40} className="rounded-md object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-md flex-shrink-0 flex items-center justify-center text-lg" style={{ background: 'var(--border)' }}>
                    🎵
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{r.title}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                    {r.artist}{r.type === 'album' ? ' · Album' : r.album ? ` · ${r.album}` : ''}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Selected track */}
        {selected && (
          <div className="mb-6 rounded-xl p-4 flex items-start gap-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            {selected.thumbnail ? (
              <Image src={selected.thumbnail} alt={selected.title} width={72} height={72} className="rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-18 h-18 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl" style={{ background: 'var(--border)' }}>
                🎵
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{selected.title}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{selected.artist}</div>
              {selected.album && selected.type === 'track' && (
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{selected.album}</div>
              )}
              <div className="flex gap-3 mt-2">
                {selected.spotify_url && (
                  <a href={selected.spotify_url} target="_blank" rel="noreferrer" className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                    Open in Spotify ↗
                  </a>
                )}
                <a href={selected.youtube_search_url} target="_blank" rel="noreferrer" className="text-xs" style={{ color: 'var(--muted)' }}>
                  YouTube ↗
                </a>
              </div>
            </div>
            <button onClick={() => { setSelected(null); setQuery('') }} className="text-xs flex-shrink-0" style={{ color: 'var(--muted)' }}>
              ✕
            </button>
          </div>
        )}

        {/* Notes */}
        {selected && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
              How does this make you feel?
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Write anything — a memory, a feeling, what you love about it…"
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            />
          </div>
        )}

        {/* Actions */}
        {selected && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: saving ? 'var(--border)' : 'var(--accent)',
                color: saving ? 'var(--muted)' : '#000',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving…' : 'Save to journal'}
            </button>
          </div>
        )}

        {saved && (
          <div className="mt-4 text-sm font-medium" style={{ color: 'var(--accent)' }}>
            ✓ Added to your journal
          </div>
        )}

        {error && (
          <div className="mt-4 text-sm text-red-400">{error}</div>
        )}
      </main>
    </div>
  )
}
