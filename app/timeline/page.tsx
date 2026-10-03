'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const SHORT   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

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

interface EnrichedTrack extends Track {
  no: number
  dayLabel: string
}

interface MonthGroup {
  id: string
  name: string
  abbr: string
  year: number
  tracks: EnrichedTrack[]
  countLabel: string
}

function buildMonths(tracks: Track[], total: number): MonthGroup[] {
  const groups: MonthGroup[] = []
  tracks.forEach((track, i) => {
    const d = new Date(track.added_at)
    const mo = d.getMonth()
    const year = d.getFullYear()
    const id = `m-${year}-${String(mo + 1).padStart(2, '0')}`
    let g = groups[groups.length - 1]
    if (!g || g.id !== id) {
      g = { id, name: MONTHS[mo], abbr: SHORT[mo], year, tracks: [], countLabel: '' }
      groups.push(g)
    }
    g.tracks.push({ ...track, no: total - i, dayLabel: `${d.getDate()} ${SHORT[mo]}` })
  })
  groups.forEach(g => { g.countLabel = g.tracks.length === 1 ? '1 entry' : `${g.tracks.length} entries` })
  return groups
}

function splitNotes(n: string): [string, string] {
  n = n.trim()
  if (n.length <= 160) return [n, '']
  const m = n.match(/^[\s\S]{20,220}?[.!?](?=\s)/)
  if (!m) return ['', n]
  return [m[0], n.slice(m[0].length).trim()]
}

function ytUrl(track: Track) {
  return track.youtube_search_url
    ?? `https://www.youtube.com/results?search_query=${encodeURIComponent(`${track.title} ${track.artist.split(',')[0]}`)}`
}

// ── Track card ────────────────────────────────────────────
function TrackCard({ track, onSelect }: { track: EnrichedTrack; onSelect: () => void }) {
  return (
    <button className="tl-card" onClick={onSelect}>
      <div className="tl-art">
        {/* Vinyl disc behind cover */}
        <div className="tl-disc">
          {track.thumbnail_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={track.thumbnail_url} alt="" />
          )}
        </div>
        {/* Cover in front */}
        <div className="tl-cover-wrap">
          {track.thumbnail_url ? (
            <Image
              src={track.thumbnail_url}
              fill
              alt={`Cover art for ${track.title}`}
              sizes="(max-width: 820px) 50vw, 220px"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#F0E8DC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>🎵</div>
          )}
        </div>
      </div>

      {/* Text below art */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', width: '100%', minWidth: 0 }}>
        <div style={{ font: '600 12px/1 var(--fu)', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6f6253' }}>
          No. {track.no} · {track.dayLabel}
        </div>
        <div className="tl-ctitle">{track.title}</div>
        <div style={{ font: '500 14px/1.45 var(--fu)', color: '#6f6253' }}>{track.artist}</div>
        {track.notes && (
          <div className="tl-ex" style={{ fontFamily: 'var(--fn)', fontStyle: 'italic', fontSize: '17px', lineHeight: 1.5, color: '#4a4239', marginTop: '2px' }}>
            {track.notes}
          </div>
        )}
      </div>
    </button>
  )
}

// ── Detail overlay ────────────────────────────────────────
function DetailOverlay({
  track, total, older, newer, isOwner,
  onClose, onOlder, onNewer, onDelete,
}: {
  track: EnrichedTrack
  total: number
  older: EnrichedTrack | null
  newer: EnrichedTrack | null
  isOwner: boolean
  onClose: () => void
  onOlder: () => void
  onNewer: () => void
  onDelete: (id: string) => void
}) {
  const [showDelete, setShowDelete] = useState(false)
  const [lead, rest] = splitNotes(track.notes ?? '')
  const isShort = !!lead && !rest
  const d = new Date(track.added_at)
  const dateLabel = `${d.getDate()} ${SHORT[d.getMonth()]} ${d.getFullYear()}`

  return (
    <div className="tl-overlay" role="dialog" aria-modal aria-label="Journal entry">
      <div className="dt">

        {/* ── Left: art panel ── */}
        <div className="dt-art">
          {track.thumbnail_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="dt-bg" src={track.thumbnail_url} alt="" />
          )}

          {/* Back button */}
          <div style={{ position: 'absolute', left: 24, right: 24, top: 24, display: 'flex', zIndex: 2 }}>
            <button className="dt-glass" onClick={onClose}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Timeline
            </button>
          </div>

          {/* Spinning disc + cover */}
          <div className="dt-stage">
            <div className="dt-slide">
              <div className="dt-disc">
                {track.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="dt-disc-img" src={track.thumbnail_url} alt="" />
                )}
              </div>
            </div>
            <div className="dt-cover-wrap">
              {track.thumbnail_url && (
                <Image src={track.thumbnail_url} fill alt={`Cover for ${track.title}`} sizes="50vw" style={{ objectFit: 'cover' }} />
              )}
            </div>
          </div>

          {/* Earlier / Later nav */}
          {(older || newer) && (
            <div style={{ position: 'absolute', left: 24, right: 24, bottom: 24, display: 'flex', justifyContent: 'space-between', gap: 12, zIndex: 2 }}>
              {older ? (
                <button className="dt-step" onClick={onOlder}>
                  {older.thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={older.thumbnail_url} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
                    <span style={{ font: '600 11px/1 var(--fu)', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6f6253' }}>Earlier</span>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', font: '500 15px/1.25 var(--fu)' }}>{older.title}</span>
                  </span>
                </button>
              ) : <span />}
              {newer && (
                <button className="dt-step dt-step-r" onClick={onNewer}>
                  {newer.thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={newer.thumbnail_url} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0, alignItems: 'flex-end' }}>
                    <span style={{ font: '600 11px/1 var(--fu)', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6f6253' }}>Later</span>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', font: '500 15px/1.25 var(--fu)' }}>{newer.title}</span>
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Right: notes panel ── */}
        <article className="dt-page">
          {/* Header row */}
          <div className="dt-head dt-up">
            <div className="dt-meta" style={{ color: '#6f6253' }}>
              No. {track.no} of {total} · {dateLabel}
            </div>
            <button className="dt-x" aria-label="Close entry" onClick={onClose}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {/* Title block */}
          <div className="dt-up dt-d1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h1 className="dt-title">{track.title}</h1>
            {track.album && <div className="dt-src">{track.album}</div>}
            <div className="dt-artist">{track.artist}</div>
          </div>

          {/* Notes */}
          <div className={`dt-note dt-up dt-d2${isShort ? ' dt-note-short' : ''}`}>
            {lead && (
              <blockquote className={`dt-lead${isShort ? ' dt-lead-big' : ''}`} style={{ margin: 0 }}>
                <span style={{ color: '#8c7e6e' }} aria-hidden="true">&ldquo;</span>
                {lead}
                {isShort && <span style={{ color: '#8c7e6e' }} aria-hidden="true">&rdquo;</span>}
              </blockquote>
            )}
            {rest && <p className="dt-rest">{rest}</p>}
          </div>

          {/* Actions */}
          <div className="dt-actions dt-up dt-d3">
            {track.spotify_url && (
              <a className="dt-btn dt-play" href={track.spotify_url} target="_blank" rel="noopener noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>
                Listen on Spotify
              </a>
            )}
            <a className="dt-btn dt-sec" href={ytUrl(track)} target="_blank" rel="noopener noreferrer">
              Find on YouTube
            </a>
            {isOwner && !showDelete && (
              <button
                onClick={() => setShowDelete(true)}
                style={{ background: 'none', border: 'none', color: '#8c7e6e', font: '600 13px/1 var(--fu)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px' }}
              >
                Remove
              </button>
            )}
            {isOwner && showDelete && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                <span style={{ fontSize: '14px', color: '#6f6253', fontFamily: 'var(--fu)' }}>Remove this track?</span>
                <button onClick={() => { onDelete(track.id); onClose() }} style={{ padding: '8px 16px', borderRadius: 999, background: '#c0392b', color: '#fff', border: 'none', font: '600 13px/1 var(--fu)', cursor: 'pointer' }}>Yes</button>
                <button onClick={() => setShowDelete(false)} style={{ padding: '8px 16px', borderRadius: 999, background: 'rgba(44,42,36,.08)', color: '#2c2a24', border: 'none', font: '600 13px/1 var(--fu)', cursor: 'pointer' }}>Cancel</button>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  )
}

// ── Month map sidebar ─────────────────────────────────────
function MonthMap({ months, activeId }: { months: MonthGroup[]; activeId: string }) {
  return (
    <nav className="tl-map" aria-label="Jump to month">
      {months.map(m => (
        <a key={m.id} className={`tl-mrow${m.id === activeId ? ' tl-mrow-on' : ''}`} href={`#${m.id}`} title={`${m.name} ${m.year}`}>
          <span style={{ width: 26, display: 'block' }}>{m.abbr}</span>
          <span className="tl-mdots">
            {m.tracks.slice(0, 3).map(t => t.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={t.id} src={t.thumbnail_url} alt="" />
            ))}
          </span>
        </a>
      ))}
    </nav>
  )
}

// ── Page ──────────────────────────────────────────────────
export default function TimelinePage() {
  const [tracks, setTracks]       = useState<Track[]>([])
  const [loading, setLoading]     = useState(true)
  const [isOwner, setIsOwner]     = useState(false)
  const [selIdx, setSelIdx]       = useState<number | null>(null)
  const [activeId, setActiveId]   = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setIsOwner(!!user))
    fetch('/api/tracks')
      .then(r => r.json())
      .then(data => { setTracks(data.tracks ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Active month tracking via scroll
  useEffect(() => {
    if (loading || !tracks.length) return
    const months = buildMonths(tracks, tracks.length)
    const ids = months.map(m => m.id)
    if (ids.length) setActiveId(ids[0])
    const onScroll = () => {
      let act = ids[0]
      const line = window.innerHeight * 0.35
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) act = id
      }
      setActiveId(act)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [loading, tracks])

  // Escape key closes overlay
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelIdx(null) }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  async function handleDelete(id: string) {
    await fetch(`/api/tracks?id=${id}`, { method: 'DELETE' })
    setTracks(prev => prev.filter(t => t.id !== id))
    setSelIdx(null)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const total    = tracks.length
  const months   = buildMonths(tracks, total)
  const allFlat  = months.flatMap(m => m.tracks)   // newest-first
  const selected = selIdx !== null ? allFlat[selIdx] : null
  const older    = selIdx !== null && selIdx < allFlat.length - 1 ? allFlat[selIdx + 1] : null
  const newer    = selIdx !== null && selIdx > 0 ? allFlat[selIdx - 1] : null

  const first = tracks[tracks.length - 1]
  const last  = tracks[0]
  const span  = first && last
    ? `${SHORT[new Date(first.added_at).getMonth()]}–${SHORT[new Date(last.added_at).getMonth()]} ${new Date(last.added_at).getFullYear()}`
    : ''

  const pageBg: React.CSSProperties = {
    backgroundColor: '#fbf6ef',
    backgroundImage: `linear-gradient(rgba(180,158,138,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(180,158,138,.1) 1px,transparent 1px)`,
    backgroundSize: '28px 28px',
  }

  return (
    <div style={{ ...pageBg, minHeight: '100vh', color: '#2c2a24' }}>
      <div className="tl-wrap" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px', boxSizing: 'border-box' }}>

        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px 24px', padding: '24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
            <div className="tl-display" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 22 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <circle cx="12" cy="12" r="9.5" />
                <circle cx="12" cy="12" r="3" />
                <circle cx="12" cy="12" r=".6" fill="currentColor" />
              </svg>
              My Musical Journal
            </div>
            <nav aria-label="Primary" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <a className="tl-nav tl-nav-on" href="/timeline" aria-current="page">Timeline</a>
              <a className="tl-nav" href="/journal">Add track</a>
              <a className="tl-nav" href="/friends">Friends</a>
              {isOwner && (
                <button className="tl-nav" onClick={handleSignOut}>Sign out</button>
              )}
            </nav>
          </div>
          <div style={{ font: '500 14px/1 var(--fu)', color: '#6f6253' }}>
            {total} tracks{span ? ` · ${span}` : ''}
          </div>
        </header>

        {/* Hero */}
        <section style={{ padding: '72px 0 64px', display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 860 }}>
          <h1 className="tl-display" style={{ margin: 0, fontSize: 'clamp(42px,6.4vw,92px)', lineHeight: 0.96, textWrap: 'balance' }}>
            The songs that mattered, and the ones I keep coming back to.
          </h1>
          <p style={{ margin: 0, fontFamily: 'var(--fn)', fontStyle: 'italic', fontSize: 'clamp(18px,2vw,22px)', lineHeight: 1.55, color: '#5b5145' }}>
            My listening history, one pick at a time. Each cover opens a page from the journal: a few lines on the song and why it stayed with me.
          </p>
        </section>

        {/* Loading */}
        {loading && (
          <div style={{ padding: '80px 0', fontSize: 14, color: '#8c7e6e', fontFamily: 'var(--fu)' }}>
            Loading your journal…
          </div>
        )}

        {/* Month sections */}
        {months.map(month => (
          <section
            key={month.id}
            id={month.id}
            className="tl-month"
            aria-label={`${month.name} ${month.year}`}
          >
            {/* Sticky month rail */}
            <div className="tl-rail">
              <h2 className="tl-display" style={{ margin: 0, fontSize: 'clamp(34px,4vw,54px)', lineHeight: 0.95 }}>
                {month.name}
              </h2>
              <div style={{ font: '500 14px/1.4 var(--fu)', color: '#6f6253' }}>
                {month.year} · {month.countLabel}
              </div>
            </div>

            {/* Cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '56px 36px' }}>
              {month.tracks.map(track => {
                const flatIdx = allFlat.findIndex(t => t.id === track.id)
                return (
                  <TrackCard key={track.id} track={track} onSelect={() => setSelIdx(flatIdx)} />
                )
              })}
            </div>
          </section>
        ))}

        {/* Footer */}
        {!loading && total > 0 && (
          <footer style={{ padding: '64px 0 96px', borderTop: '1px solid rgba(44,42,36,.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: 'var(--fn)', fontStyle: 'italic', fontSize: 26, color: '#5b5145' }}>More to come.</div>
            <a href="/journal" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 24px', borderRadius: 999, background: '#2c2a24', color: '#fbf6ef', textDecoration: 'none', font: '600 15px/1 var(--fu)' }}>
              Add a track
            </a>
          </footer>
        )}
      </div>

      {/* Sidebar month map */}
      {!loading && months.length > 1 && (
        <MonthMap months={months} activeId={activeId} />
      )}

      {/* Detail overlay */}
      {selected && selIdx !== null && (
        <DetailOverlay
          track={selected}
          total={total}
          older={older}
          newer={newer}
          isOwner={isOwner}
          onClose={() => setSelIdx(null)}
          onOlder={() => setSelIdx(i => i !== null ? i + 1 : null)}
          onNewer={() => setSelIdx(i => i !== null ? i - 1 : null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
