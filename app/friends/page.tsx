'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import SiteHeader from '../components/SiteHeader'

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
      <div className="pg">
        <div className="pg-wrap">
          <SiteHeader active="friends" />
          <main className="pg-narrow">
            <div className="pg-kicker">Song of the year</div>
            <h1 className="tl-display pg-h1">You&apos;re in.</h1>
            {selected && (
              <div className="pg-pick" style={{ alignItems: 'center', width: 'fit-content', maxWidth: '100%', marginBottom: 24 }}>
                {selected.thumbnail && (
                  <Image src={selected.thumbnail} alt={selected.title} width={64} height={64} className="pg-thumb" />
                )}
                <div style={{ minWidth: 0 }}>
                  <div className="pg-t">{selected.title}</div>
                  <div className="pg-s">{selected.artist}</div>
                </div>
              </div>
            )}
            <p className="pg-lede">
              Your pick has been added. On December 31st, you&apos;ll get an email with a playlist of everyone&apos;s favourite songs from this year.
            </p>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="pg">
      <div className="pg-wrap">
        <SiteHeader active="friends" />

        <main className="pg-narrow">
          <div className="pg-kicker">Song of the year</div>
          <h1 className="tl-display pg-h1">What&apos;s your song of the year?</h1>
          <p className="pg-lede">
            Share your favourite track and on Dec 31st, everyone gets a playlist of all the picks.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Email */}
            <div>
              <label className="pg-label">Your email</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="pg-field"
              />
            </div>

            {/* Search */}
            {!selected && (
              <div>
                <label className="pg-label">Your song</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search for a song or album…"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    required={!selected}
                    className="pg-field"
                  />
                  {searching && (
                    <span className="pg-s" style={{ position: 'absolute', right: 18, top: 17 }}>Searching…</span>
                  )}
                </div>
              </div>
            )}

            {/* Results */}
            {results.length > 0 && !selected && (
              <div className="pg-list">
                {results.map((r, i) => (
                  <button key={r.id + i} type="button" className="pg-row" onClick={() => { setSelected(r); setResults([]) }}>
                    {r.thumbnail ? (
                      <Image src={r.thumbnail} alt={r.title} width={44} height={44} className="pg-thumb" />
                    ) : (
                      <div className="pg-thumb-empty" style={{ width: 44, height: 44, fontSize: 18 }}>🎵</div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div className="pg-t">{r.title}</div>
                      <div className="pg-s">
                        {r.artist}{r.type === 'album' ? ' · Album' : r.album ? ` · ${r.album}` : ''}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected track */}
            {selected && (
              <div>
                <label className="pg-label">Your song</label>
                <div className="pg-pick" style={{ alignItems: 'center' }}>
                  {selected.thumbnail ? (
                    <Image src={selected.thumbnail} alt={selected.title} width={64} height={64} className="pg-thumb" />
                  ) : (
                    <div className="pg-thumb-empty" style={{ width: 64, height: 64, fontSize: 22 }}>🎵</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="pg-t">{selected.title}</div>
                    <div className="pg-s">{selected.artist}</div>
                    <div className="pg-links">
                      {selected.spotify_url && (
                        <a className="pg-spot" href={selected.spotify_url} target="_blank" rel="noreferrer">Spotify ↗</a>
                      )}
                      <a href={selected.youtube_search_url} target="_blank" rel="noreferrer">YouTube ↗</a>
                    </div>
                  </div>
                  <button type="button" className="pg-ghost" onClick={() => { setSelected(null); setQuery('') }}>Change</button>
                </div>
              </div>
            )}

            {status === 'already' && <p className="pg-warn">You&apos;ve already submitted a pick from this email.</p>}
            {status === 'error' && <p className="pg-err">Something went wrong. Try again.</p>}

            <div>
              <button type="submit" className="pg-btn" disabled={status === 'loading' || !selected}>
                {status === 'loading' ? 'Submitting…' : 'Submit my pick'}
              </button>
            </div>
          </form>

          <p className="pg-foot" style={{ marginTop: 28 }}>
            One submission per email · You&apos;ll hear from us on Dec 31st
          </p>
        </main>
      </div>
    </div>
  )
}
