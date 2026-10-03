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

type Category = 'song' | 'album' | 'retro'

const SLOTS: {
  key: Category
  title: string
  help: string
  kind: 'track' | 'album'
  placeholder: string
}[] = [
  {
    key: 'song',
    title: 'Your favourite song of the year',
    help: 'It doesn’t have to be released this year. It can be something you discovered for the first time this year.',
    kind: 'track',
    placeholder: 'Search for a song, or paste a Spotify or YouTube link',
  },
  {
    key: 'album',
    title: 'Your favourite album',
    help: 'Think of the whole album, not just one song. The one you loved from start to finish.',
    kind: 'album',
    placeholder: 'Search for an album, or paste a Spotify or YouTube link',
  },
  {
    key: 'retro',
    title: 'Your favourite retro song you rediscovered',
    help: 'A song you have heard before, but went back to and fell for all over again.',
    kind: 'track',
    placeholder: 'Search for a song, or paste a Spotify or YouTube link',
  },
]

function PickField({
  slot,
  value,
  onChange,
}: {
  slot: (typeof SLOTS)[number]
  value: SearchResult | null
  onChange: (v: SearchResult | null) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/search-music?yt=1&kind=${slot.kind}&q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results ?? [])
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [slot.kind])

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (!query.trim()) { setResults([]); return }
    timer.current = setTimeout(() => search(query), 400)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [query, search])

  return (
    <div>
      <label className="pg-label">{slot.title}</label>
      <p className="pg-foot" style={{ margin: '0 0 12px' }}>{slot.help}</p>

      {!value && (
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder={slot.placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pg-field"
          />
          {searching && (
            <span className="pg-s" style={{ position: 'absolute', right: 18, top: 17 }}>Searching…</span>
          )}
        </div>
      )}

      {!value && results.length > 0 && (
        <div className="pg-list" style={{ marginTop: 12 }}>
          {results.map((r, i) => (
            <button
              key={r.id + i}
              type="button"
              className="pg-row"
              onClick={() => { onChange(r); setResults([]) }}
            >
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

      {value && (
        <div className="pg-pick" style={{ alignItems: 'center' }}>
          {value.thumbnail ? (
            <Image src={value.thumbnail} alt={value.title} width={64} height={64} className="pg-thumb" />
          ) : (
            <div className="pg-thumb-empty" style={{ width: 64, height: 64, fontSize: 22 }}>🎵</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="pg-t">{value.title}</div>
            <div className="pg-s">{value.artist}</div>
            <div className="pg-links">
              {value.spotify_url && (
                <a className="pg-spot" href={value.spotify_url} target="_blank" rel="noreferrer">Spotify ↗</a>
              )}
              <a href={value.youtube_search_url} target="_blank" rel="noreferrer">YouTube ↗</a>
            </div>
          </div>
          <button
            type="button"
            className="pg-ghost"
            onClick={() => { onChange(null); setQuery('') }}
          >
            Change
          </button>
        </div>
      )}
    </div>
  )
}

export default function FriendsPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [picks, setPicks] = useState<Record<Category, SearchResult | null>>({
    song: null,
    album: null,
    retro: null,
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'already' | 'error'>('idle')

  const chosen = SLOTS.filter(s => picks[s.key])
  const canSubmit = chosen.length > 0 && status !== 'loading'

  function goTo(n: 1 | 2) {
    setStep(n)
    window.scrollTo({ top: 0 })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (chosen.length === 0) return
    setStatus('loading')

    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          picks: chosen.map(s => {
            const p = picks[s.key]!
            return {
              category: s.key,
              song_name: p.title,
              artist_name: p.artist,
              spotify_url: p.spotify_url,
              thumbnail_url: p.thumbnail,
              youtube_search_url: p.youtube_search_url,
            }
          }),
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setStatus('success')
      } else if (data.error === 'already_submitted') {
        setStatus('already')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="pg">
        <div className="pg-wrap">
          <SiteHeader active="friends" />
          <main className="pg-narrow">
            <h1 className="tl-display pg-h1">You&apos;re in.</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {chosen.map(s => {
                const p = picks[s.key]!
                return (
                  <div key={s.key} className="pg-pick" style={{ alignItems: 'center', maxWidth: '100%' }}>
                    {p.thumbnail && (
                      <Image src={p.thumbnail} alt={p.title} width={56} height={56} className="pg-thumb" />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div className="pg-kicker" style={{ margin: '0 0 6px' }}>{s.title.replace('Your favourite ', '')}</div>
                      <div className="pg-t">{p.title}</div>
                      <div className="pg-s">{p.artist}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="pg-lede">
              {email.trim()
                ? 'Your picks have been added. On December 31st, you’ll get an email with everyone’s music choices from this year.'
                : 'Your picks have been added. Thanks for sharing them.'}
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
          {step === 1 ? (
            <div key="slide-1" className="dt-up">
              <div className="pg-kicker">Step 1 of 2</div>
              <h1 className="tl-display pg-h1">What are your music choices for the year?</h1>
              <p className="pg-lede">
                I have three questions in the next slide, each for a specific music choice. You can answer 1, 2, or all three.
              </p>

              <div style={{ marginBottom: 36 }}>
                <label className="pg-label">Your email (optional)</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pg-field"
                />
                <p className="pg-foot" style={{ margin: '10px 0 0' }}>
                  If you provide one, all music choices will be emailed to you on December 31st.
                </p>
              </div>

              <button type="button" className="pg-btn" onClick={() => goTo(2)}>
                Continue
              </button>
            </div>
          ) : (
            <form key="slide-2" className="dt-up" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
              <div>
                <div className="pg-kicker">Step 2 of 2</div>
                <h1 className="tl-display pg-h1">Pick your music</h1>
                <p className="pg-lede" style={{ margin: 0 }}>
                  Add at least one. Search by name, or paste a Spotify or YouTube link.
                </p>
              </div>

              {SLOTS.map(slot => (
                <PickField
                  key={slot.key}
                  slot={slot}
                  value={picks[slot.key]}
                  onChange={v => setPicks(prev => ({ ...prev, [slot.key]: v }))}
                />
              ))}

              {status === 'already' && <p className="pg-warn">You&apos;ve already submitted picks from this email.</p>}
              {status === 'error' && <p className="pg-err">Something went wrong. Try again.</p>}

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="pg-btn"
                  onClick={() => goTo(1)}
                  style={{ background: 'transparent', color: '#2c2a24', boxShadow: 'inset 0 0 0 1.5px rgba(44,42,36,.3)' }}
                >
                  Back
                </button>
                <button type="submit" className="pg-btn" disabled={!canSubmit}>
                  {status === 'loading' ? 'Submitting…' : 'Submit my picks'}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  )
}
