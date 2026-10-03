'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SiteHeader({ active }: { active: 'timeline' | 'journal' | 'friends' }) {
  const [isOwner, setIsOwner] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setIsOwner(!!user))
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const cls = (k: string) => `tl-nav${active === k ? ' tl-nav-on' : ''}`
  return (
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
        <nav aria-label="Primary" style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <a className={cls('timeline')} href="/timeline">Timeline</a>
          {isOwner && <a className={cls('journal')} href="/journal">Add track</a>}
          <a className={cls('friends')} href="/friends">Friends</a>
        </nav>
      </div>
      {isOwner && (
        <button className="tl-nav" onClick={handleSignOut}>Sign out</button>
      )}
    </header>
  )
}
