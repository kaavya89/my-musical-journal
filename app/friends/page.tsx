'use client'

import { useState } from 'react'

export default function FriendsPage() {
  const [email, setEmail] = useState('')
  const [songName, setSongName] = useState('')
  const [artistName, setArtistName] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'already' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')

    const res = await fetch('/api/friends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, song_name: songName, artist_name: artistName }),
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
        {/* Header */}
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
          <div>
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Song or album name"
              value={songName}
              onChange={e => setSongName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Artist name (optional)"
              value={artistName}
              onChange={e => setArtistName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            />
          </div>

          {status === 'already' && (
            <p className="text-sm text-amber-400 text-center">
              You&apos;ve already submitted a pick from this email.
            </p>
          )}
          {status === 'error' && (
            <p className="text-sm text-red-400 text-center">
              Something went wrong. Try again.
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: status === 'loading' ? 'var(--border)' : 'var(--accent)',
              color: status === 'loading' ? 'var(--muted)' : '#000',
              cursor: status === 'loading' ? 'not-allowed' : 'pointer',
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
