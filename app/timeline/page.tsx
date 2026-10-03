'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

// Cream palette — scoped to this page only
const C = {
  bg:       '#FBF6EF',
  surface:  '#F0E8DC',
  border:   '#E0D4C0',
  text:     '#2C2A24',
  muted:    '#8C7E6E',
  faint:    '#BBA99A',
  accent:   '#1db954',
  navBg:    'rgba(251,246,239,0.95)',
  overlay:  'rgba(44,42,36,0.55)',
}

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

function TrackCard({
  track,
  onDelete,
  isOwner,
  delay,
}: {
  track: Track
  onDelete: (id: string) => void
  isOwner: boolean
  delay: number
}) {
  const [open, setOpen] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  return (
    <>
      {/* Grid card — always shows title/artist below art */}
      <div
        className="reveal-child"
        style={{ animationDelay: `${delay}ms`, cursor: 'pointer' }}
        onClick={() => setOpen(true)}
      >
        <div
          style={{
            aspectRatio: '1',
            borderRadius: '10px',
            overflow: 'hidden',
            border: `0.5px solid ${C.border}`,
            marginBottom: '8px',
            position: 'relative',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
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
            <div
              style={{
                width: '100%',
                height: '100%',
                background: C.surface,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
              }}
            >
              🎵
            </div>
          )}
        </div>
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: C.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginBottom: '2px',
          }}
        >
          {track.title}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: C.muted,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {track.artist}
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: C.overlay,
            backdropFilter: 'blur(6px)',
          }}
          onClick={() => {
            setOpen(false)
            setShowDelete(false)
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '360px',
              borderRadius: '20px',
              overflow: 'hidden',
              background: C.bg,
              border: `0.5px solid ${C.border}`,
              boxShadow: '0 24px 48px rgba(44,42,36,0.18)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Album art */}
            {track.thumbnail_url && (
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1' }}>
                <Image
                  src={track.thumbnail_url}
                  alt={track.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div style={{ padding: '20px 22px 22px' }}>
              {/* Track info */}
              <div
                style={{ fontSize: '16px', fontWeight: 600, color: C.text, marginBottom: '3px' }}
              >
                {track.title}
              </div>
              <div style={{ fontSize: '13px', color: C.muted, marginBottom: '2px' }}>
                {track.artist}
              </div>
              {track.album && (
                <div style={{ fontSize: '12px', color: C.faint, marginBottom: '4px' }}>
                  {track.album}
                </div>
              )}
              <div style={{ fontSize: '11px', color: C.faint, marginBottom: '14px' }}>
                Added{' '}
                {new Date(track.added_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>

              {/* Notes */}
              {track.notes && (
                <p
                  style={{
                    fontSize: '13px',
                    lineHeight: 1.7,
                    color: C.text,
                    whiteSpace: 'pre-wrap',
                    marginBottom: '18px',
                    fontStyle: 'italic',
                    borderLeft: `2px solid ${C.border}`,
                    paddingLeft: '12px',
                  }}
                >
                  {track.notes}
                </p>
              )}

              {/* Links + remove */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {track.spotify_url && (
                  <a
                    href={track.spotify_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '7px 16px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: C.accent,
                      color: '#fff',
                      textDecoration: 'none',
                    }}
                  >
                    Spotify ↗
                  </a>
                )}
                {track.youtube_search_url && (
                  <a
                    href={track.youtube_search_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '7px 16px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      background: C.surface,
                      color: C.muted,
                      border: `0.5px solid ${C.border}`,
                      textDecoration: 'none',
                    }}
                  >
                    YouTube ↗
                  </a>
                )}
                {isOwner && (
                  <button
                    onClick={() => setShowDelete(!showDelete)}
                    style={{
                      marginLeft: 'auto',
                      fontSize: '11px',
                      padding: '7px 14px',
                      borderRadius: '20px',
                      background: C.surface,
                      color: C.faint,
                      border: `0.5px solid ${C.border}`,
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              {isOwner && showDelete && (
                <div
                  style={{
                    marginTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '12px', color: C.muted }}>Are you sure?</span>
                  <button
                    onClick={() => {
                      onDelete(track.id)
                      setOpen(false)
                    }}
                    style={{
                      fontSize: '11px',
                      padding: '5px 14px',
                      borderRadius: '20px',
                      background: '#c0392b',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Yes, remove
                  </button>
                  <button
                    onClick={() => setShowDelete(false)}
                    style={{
                      fontSize: '11px',
                      padding: '5px 14px',
                      borderRadius: '20px',
                      background: C.surface,
                      color: C.muted,
                      border: `0.5px solid ${C.border}`,
                      cursor: 'pointer',
                    }}
                  >
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
  const [isOwner, setIsOwner] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setIsOwner(!!user))
    fetch('/api/tracks')
      .then(r => r.json())
      .then(data => {
        setTracks(data.tracks ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Attach scroll-reveal observer after tracks load
  useEffect(() => {
    if (loading) return
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed')
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    )
    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [loading])

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
    <div style={{
      backgroundColor: C.bg,
      backgroundImage: `
        linear-gradient(rgba(180,158,138,0.10) 1px, transparent 1px),
        linear-gradient(90deg, rgba(180,158,138,0.10) 1px, transparent 1px)
      `,
      backgroundSize: '28px 28px',
      minHeight: '100vh',
      color: C.text,
    }}>
      {/* Nav */}
      <nav
        style={{
          borderBottom: `0.5px solid ${C.border}`,
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: C.bg,
          backgroundImage: `linear-gradient(rgba(180,158,138,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(180,158,138,0.10) 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
          backdropFilter: 'blur(2px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: C.text }}>
            🎵 My Musical Journal
          </span>
          <a href="/journal" style={{ fontSize: '12px', color: C.muted, textDecoration: 'none' }}>
            Add Track
          </a>
          <a
            href="/timeline"
            style={{ fontSize: '12px', color: C.accent, fontWeight: 500, textDecoration: 'none' }}
          >
            Timeline
          </a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '11px', color: C.faint }}>{tracks.length} tracks</span>
          {isOwner && (
            <button
              onClick={handleSignOut}
              style={{
                fontSize: '11px',
                color: C.faint,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          )}
        </div>
      </nav>

      {/* Hero quote */}
      <section
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          padding: '80px 24px 48px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '80px',
            color: C.border,
            lineHeight: 0.8,
            fontFamily: 'Georgia, serif',
            marginBottom: '8px',
            userSelect: 'none',
          }}
        >
          &#8220;
        </div>
        <p
          style={{
            fontSize: '18px',
            fontStyle: 'italic',
            color: C.muted,
            lineHeight: 1.75,
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}
        >
          This timeline shows my listening history with specific picks of the songs that mattered to
          me and ones I keep coming back to. The timeline is also a journal with tidbits on the
          songs themselves and why I liked them.
        </p>
        <div
          style={{
            fontSize: '80px',
            color: C.border,
            lineHeight: 0.8,
            fontFamily: 'Georgia, serif',
            marginTop: '8px',
            userSelect: 'none',
          }}
        >
          &#8221;
        </div>
      </section>

      {/* Divider */}
      <div
        style={{
          width: '48px',
          height: '1.5px',
          background: C.faint,
          margin: '0 auto 72px',
          borderRadius: '2px',
        }}
      />

      {/* Timeline */}
      <main
        style={{ maxWidth: '860px', margin: '0 auto', padding: '0 24px 100px' }}
      >
        {loading && (
          <div
            style={{ textAlign: 'center', padding: '80px 0', fontSize: '13px', color: C.faint }}
          >
            Loading your journal…
          </div>
        )}

        {!loading && tracks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎵</div>
            <h2 style={{ fontSize: '17px', fontWeight: 500, color: C.text, marginBottom: '8px' }}>
              Your journal is empty
            </h2>
            <p style={{ fontSize: '13px', color: C.muted, marginBottom: '24px' }}>
              Start adding tracks you love
            </p>
            <a
              href="/journal"
              style={{
                padding: '10px 22px',
                borderRadius: '24px',
                fontSize: '13px',
                fontWeight: 600,
                background: C.accent,
                color: '#fff',
                textDecoration: 'none',
              }}
            >
              Add your first track
            </a>
          </div>
        )}

        {months.map(month => (
          <section
            key={month}
            data-reveal
            style={{ marginBottom: '64px' }}
          >
            {/* Month header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '20px',
              }}
            >
              <h2
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: C.faint,
                  flexShrink: 0,
                }}
              >
                {month}
              </h2>
              <div
                style={{
                  flex: 1,
                  height: '0.5px',
                  background: C.border,
                }}
              />
            </div>

            {/* Track grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
                gap: '16px',
              }}
            >
              {grouped[month].map((track, i) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  onDelete={handleDelete}
                  isOwner={isOwner}
                  delay={i * 60}
                />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
