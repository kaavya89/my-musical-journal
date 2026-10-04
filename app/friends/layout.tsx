import type { Metadata } from 'next'

const title = 'Music choices for the year'
const description = 'Share your favourite song, album, retro song with me'

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    images: [{ url: '/icon-512.png', width: 512, height: 512 }],
  },
}

export default function FriendsLayout({ children }: { children: React.ReactNode }) {
  return children
}
