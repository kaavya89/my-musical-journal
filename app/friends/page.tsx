'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
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

export default function FriendsPage() {
  const [email, setEmail] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [searching, setSearching] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'already' | 'error'>('idle')
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setStatus('loading')

    const res = await fetch('/api/friends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        song_name: selected.title,
        artist_name: selected.artist,
        spotify_url: selected.spotify_url,
        thumbnail_url: selected.thumbnail,
        youtube_search_url: selected.youtube_search_url,
      }),
    })

    const data = await res.json()
    if (res.ok) {
      setStatus('success')
    } else if (data.error === 'already_submitted') {
      setStatus('already')
    } else {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🎶</div>
          <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
            You&apos;re in!
          </h1>
          {selected && (
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl mx-auto w-fit" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              {selected.thumbnail && (
                <Image src={selected.thumbnail} alt={selected.title} width={40} height={40} className="rounded-md object-cover"/>
              )}
              <div className="text-left">
                <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{selected.title}</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>{selected.artist}</div>
              </div>
            </div>
          )}
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            Your pick has been added. On December 31st, you&apos;ll get an email with a playlist of everyone&apos;s favourite songs from this year.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-4xl mb-3">🎵</div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
            What&apos;s your song of the year?
          </h1>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
            Share your favourite track and on Dec 31st, everyone gets a playlist of all the picks.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          />

          {/* Search */}
          {!selected && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search for a song or album…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                required={!selected}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              />
              {searching && (
                <span className="absolute right-4 top-3.5 text-xs" style={{ color: 'var(--muted)' }}>Searching…</span>
              )}
            </div>
          )}

          {/* Results dropdown */}
          {results.length > 0 && !selected && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {results.map((r, i) => (
                <button
                  key={r.id + i}
                  type="button"
                  onClick={() => { setSelected(r); setResults([]) }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:opacity-80"
                  style={{
                    background: 'var(--card)',
                    borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  {r.thumbnail ? (
                    <Image src={r.thumbnail} alt={r.title} width={36} height={36} className="rounded-md object-cover flex-shrink-0"/>
                  ) : (
                    <div className="w-9 h-9 rounded-md flex-shrink-0 flex items-center justify-center text-base" style={{ background: 'var(--border)' }}>🎵</div>
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
            <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              {selected.thumbnail ? (
                <Image src={selected.thumbnail} alt={selected.title} width={48} height={48} className="rounded-lg object-cover flex-shrink-0"/>
              ) : (
                <div className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center text-xl" style={{ background: 'var(--border)' }}>🎵</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{selected.title}</div>
                <div className="text-xs truncate" style={{ color: 'var(--muted)' }}>{selected.artist}</div>
                <div className="flex gap-3 mt-1">
                  {selected.spotify_url && (
                    <a href={selected.spotify_url} target="_blank" rel="noreferrer" className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                      Spotify ↗
                    </a>
                  )}
                  <a href={selected.youtube_search_url} target="_blank" rel="noreferrer" className="text-xs" style={{ color: 'var(--muted)' }}>
                    YouTube ↗
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setSelected(null); setQuery('') }}
                className="text-xs flex-shrink-0 px-2 py-1 rounded-lg"
                style={{ color: 'var(--muted)', background: 'var(--border)' }}
              >
                Change
              </button>
            </div>
          )}

          {status === 'already' && (
            <p className="text-sm text-amber-400 text-center">You&apos;ve already submitted a pick from this email.</p>
          )}
          {status === 'error' && (
            <p className="text-sm text-red-400 text-center">Something went wrong. Try again.</p>
          )}

          <button
            type="submit"
            disabled={status === 'loading' || !selected}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: (status === 'loading' || !selected) ? 'var(--border)' : 'var(--accent)',
              color: (status === 'loading' || !selected) ? 'var(--muted)' : '#000',
              cursor: (status === 'loading' || !selected) ? 'not-allowed' : 'pointer',
            }}
          >
            {status === 'loading' ? 'Submitting…' : 'Submit my pick'}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--muted)' }}>
          One submission per email · You&apos;ll hear from us on Dec 31st
        </p>
      </div>
    </div>
  )
}
