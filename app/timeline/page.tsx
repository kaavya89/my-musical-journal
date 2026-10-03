'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

const C = {
  bg:      '#FBF6EF',
  surface: '#F0E8DC',
  border:  '#E0D4C0',
  text:    '#2C2A24',
  muted:   '#8C7E6E',
  faint:   '#BBA99A',
  accent:  '#1db954',
}

const gridBg = {
  backgroundColor: C.bg,
  backgroundImage: `
    linear-gradient(rgba(180,158,138,0.10) 1px, transparent 1px),
    linear-gradient(90deg, rgba(180,158,138,0.10) 1px, transparent 1px)
  `,
  backgroundSize: '28px 28px',
} as React.CSSProperties

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

/* ── Grid tile ── */
function TrackCard({
  track,
  delay,
  onSelect,
}: {
  track: Track
  delay: number
  onSelect: (t: Track) => void
}) {
  return (
    <div
      className="reveal-child"
      style={{ animationDelay: `${delay}ms`, cursor: 'pointer' }}
      onClick={() => onSelect(track)}
    >
      <div
        style={{
          aspectRatio: '1',
          borderRadius: '10px',
          overflow: 'hidden',
          border: `0.5px solid ${C.border}`,
          marginBottom: '8px',
          position: 'relative',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = 'scale(1.04)'
          el.style.boxShadow = '0 8px 24px rgba(44,42,36,0.12)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = 'scale(1)'
          el.style.boxShadow = 'none'
        }}
      >
        {track.thumbnail_url ? (
          <Image src={track.thumbnail_url} alt={track.title} fill className="object-cover" sizes="200px" />
        ) : (
          <div style={{ width: '100%', height: '100%', background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
            🎵
          </div>
        )}
      </div>
      <div style={{ fontSize: '12px', fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>
        {track.title}
      </div>
      <div style={{ fontSize: '11px', color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {track.artist}
      </div>
    </div>
  )
}

/* ── Detail drawer ── */
function TrackDrawer({
  track,
  isOwner,
  onClose,
  onDelete,
}: {
  track: Track
  isOwner: boolean
  onClose: () => void
  onDelete: (id: string) => void
}) {
  const [showDelete, setShowDelete] = useState(false)

  function handleDelete() {
    onDelete(track.id)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          background: 'rgba(44,42,36,0.28)',
          backdropFilter: 'blur(3px)',
        }}
      />

      {/* Drawer panel */}
      <div
        className="drawer-enter"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          width: '400px',
          maxWidth: '100vw',
          ...gridBg,
          borderLeft: `0.5px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
        }}
      >
        {/* Close button */}
        <div style={{ position: 'sticky', top: 0, zIndex: 1, display: 'flex', justifyContent: 'flex-end', padding: '14px 16px 0' }}>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: `0.5px solid ${C.border}`,
              background: C.bg,
              color: C.muted,
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Album art — full width */}
        {track.thumbnail_url && (
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1', flexShrink: 0 }}>
            <Image src={track.thumbnail_url} alt={track.title} fill className="object-cover" sizes="400px" />
          </div>
        )}

        {/* Details */}
        <div style={{ padding: '24px 24px 40px' }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: C.text, marginBottom: '4px', lineHeight: 1.3 }}>
            {track.title}
          </div>
          <div style={{ fontSize: '14px', color: C.muted, marginBottom: '2px' }}>{track.artist}</div>
          {track.album && (
            <div style={{ fontSize: '12px', color: C.faint, marginBottom: '4px' }}>{track.album}</div>
          )}
          <div style={{ fontSize: '11px', color: C.faint, marginBottom: '24px' }}>
            Added {new Date(track.added_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>

          {/* Notes — full, no truncation, scrolls naturally with drawer */}
          {track.notes && (
            <div
              style={{
                borderLeft: `2px solid ${C.border}`,
                paddingLeft: '16px',
                marginBottom: '28px',
              }}
            >
              <p
                style={{
                  fontSize: '14px',
                  lineHeight: 1.8,
                  color: C.text,
                  fontStyle: 'italic',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  whiteSpace: 'pre-wrap',
                  margin: 0,
                }}
              >
                {track.notes}
              </p>
            </div>
          )}

          {/* Links */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: isOwner ? '20px' : 0 }}>
            {track.spotify_url && (
              <a
                href={track.spotify_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '9px 20px',
                  borderRadius: '24px',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: C.accent,
                  color: '#fff',
                  textDecoration: 'none',
                }}
              >
                Open in Spotify ↗
              </a>
            )}
            {track.youtube_search_url && (
              <a
                href={track.youtube_search_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '9px 20px',
                  borderRadius: '24px',
                  fontSize: '13px',
                  background: C.surface,
                  color: C.muted,
                  border: `0.5px solid ${C.border}`,
                  textDecoration: 'none',
                }}
              >
                Search YouTube ↗
              </a>
            )}
          </div>

          {/* Remove — owner only */}
          {isOwner && !showDelete && (
            <button
              onClick={() => setShowDelete(true)}
              style={{
                fontSize: '12px',
                color: C.faint,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 0',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
              }}
            >
              Remove from journal
            </button>
          )}
          {isOwner && showDelete && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <span style={{ fontSize: '12px', color: C.muted }}>Remove this track?</span>
              <button
                onClick={handleDelete}
                style={{ fontSize: '12px', padding: '5px 14px', borderRadius: '20px', background: '#c0392b', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                Yes, remove
              </button>
              <button
                onClick={() => setShowDelete(false)}
                style={{ fontSize: '12px', padding: '5px 14px', borderRadius: '20px', background: C.surface, color: C.muted, border: `0.5px solid ${C.border}`, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/* ── Page ── */
export default function TimelinePage() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [selected, setSelected] = useState<Track | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setIsOwner(!!user))
    fetch('/api/tracks')
      .then(r => r.json())
      .then(data => { setTracks(data.tracks ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (loading) return
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-revealed') }),
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    )
    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [loading])

  // Close drawer with Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
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
    <div style={{ ...gridBg, minHeight: '100vh', color: C.text }}>
      {/* Nav */}
      <nav style={{
        borderBottom: `0.5px solid ${C.border}`,
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        ...gridBg,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: C.text }}>🎵 My Musical Journal</span>
          <a href="/journal" style={{ fontSize: '12px', color: C.muted, textDecoration: 'none' }}>Add Track</a>
          <a href="/timeline" style={{ fontSize: '12px', color: C.accent, fontWeight: 500, textDecoration: 'none' }}>Timeline</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '11px', color: C.faint }}>{tracks.length} tracks</span>
          {isOwner && (
            <button onClick={handleSignOut} style={{ fontSize: '11px', color: C.faint, background: 'none', border: 'none', cursor: 'pointer' }}>
              Sign out
            </button>
          )}
        </div>
      </nav>

      {/* Hero quote */}
      <section style={{ maxWidth: '600px', margin: '0 auto', padding: '80px 24px 48px', textAlign: 'center' }}>
        <div style={{ fontSize: '80px', color: C.border, lineHeight: 0.8, fontFamily: 'Georgia, serif', marginBottom: '8px', userSelect: 'none' }}>
          &#8220;
        </div>
        <p style={{ fontSize: '18px', fontStyle: 'italic', color: C.muted, lineHeight: 1.75, fontFamily: 'Georgia, "Times New Roman", serif' }}>
          This timeline shows my listening history with specific picks of the songs that mattered to me and ones I keep coming back to. The timeline is also a journal with tidbits on the songs themselves and why I liked them.
        </p>
        <div style={{ fontSize: '80px', color: C.border, lineHeight: 0.8, fontFamily: 'Georgia, serif', marginTop: '8px', userSelect: 'none' }}>
          &#8221;
        </div>
      </section>

      {/* Divider */}
      <div style={{ width: '48px', height: '1.5px', background: C.faint, margin: '0 auto 72px', borderRadius: '2px' }} />

      {/* Timeline */}
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '0 24px 100px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', fontSize: '13px', color: C.faint }}>
            Loading your journal…
          </div>
        )}

        {!loading && tracks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎵</div>
            <h2 style={{ fontSize: '17px', fontWeight: 500, color: C.text, marginBottom: '8px' }}>Your journal is empty</h2>
            <p style={{ fontSize: '13px', color: C.muted, marginBottom: '24px' }}>Start adding tracks you love</p>
            <a href="/journal" style={{ padding: '10px 22px', borderRadius: '24px', fontSize: '13px', fontWeight: 600, background: C.accent, color: '#fff', textDecoration: 'none' }}>
              Add your first track
            </a>
          </div>
        )}

        {months.map(month => (
          <section key={month} data-reveal style={{ marginBottom: '64px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.faint, flexShrink: 0 }}>
                {month}
              </h2>
              <div style={{ flex: 1, height: '0.5px', background: C.border }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: '16px' }}>
              {grouped[month].map((track, i) => (
                <TrackCard key={track.id} track={track} delay={i * 60} onSelect={setSelected} />
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Drawer */}
      {selected && (
        <TrackDrawer
          track={selected}
          isOwner={isOwner}
          onClose={() => setSelected(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
