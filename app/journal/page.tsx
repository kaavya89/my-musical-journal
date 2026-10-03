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

  return (
    <div className="pg">
      <div className="pg-wrap">
        <SiteHeader active="journal" />

        <main className="pg-narrow">
          <div className="pg-kicker">New entry</div>
          <h1 className="tl-display pg-h1">What are you listening to?</h1>
          <p className="pg-lede">Search by name or paste a Spotify link.</p>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setSelected(null) }}
              placeholder="Search for a track or album…"
              className="pg-field"
            />
            {searching && (
              <span className="pg-s" style={{ position: 'absolute', right: 18, top: 17 }}>Searching…</span>
            )}
          </div>

          {/* Results */}
          {results.length > 0 && !selected && (
            <div className="pg-list" style={{ marginBottom: 24 }}>
              {results.map((r, i) => (
                <button key={r.id + i} className="pg-row" onClick={() => { setSelected(r); setResults([]) }}>
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
            <div className="pg-pick" style={{ marginBottom: 28 }}>
              {selected.thumbnail ? (
                <Image src={selected.thumbnail} alt={selected.title} width={88} height={88} className="pg-thumb" />
              ) : (
                <div className="pg-thumb-empty" style={{ width: 88, height: 88, fontSize: 28 }}>🎵</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="tl-display" style={{ fontSize: 24, lineHeight: 1.1 }}>{selected.title}</div>
                <div className="pg-s" style={{ marginTop: 6 }}>{selected.artist}</div>
                {selected.album && selected.type === 'track' && (
                  <div className="pg-s">{selected.album}</div>
                )}
                <div className="pg-links">
                  {selected.spotify_url && (
                    <a className="pg-spot" href={selected.spotify_url} target="_blank" rel="noreferrer">Open in Spotify ↗</a>
                  )}
                  <a href={selected.youtube_search_url} target="_blank" rel="noreferrer">YouTube ↗</a>
                </div>
              </div>
              <button className="pg-ghost" onClick={() => { setSelected(null); setQuery('') }}>Change</button>
            </div>
          )}

          {/* Notes */}
          {selected && (
            <div style={{ marginBottom: 28 }}>
              <label className="pg-label">How does this make you feel?</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Write anything — a memory, a feeling, what you love about it…"
                rows={5}
                className="pg-field pg-notes"
              />
            </div>
          )}

          {/* Actions */}
          {selected && (
            <button className="pg-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save to journal'}
            </button>
          )}

          {saved && <div className="pg-ok" style={{ marginTop: 18 }}>✓ Added to your journal</div>}
          {error && <div className="pg-err" style={{ marginTop: 18 }}>{error}</div>}
        </main>
      </div>
    </div>
  )
}
