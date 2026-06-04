import { NextRequest, NextResponse } from 'next/server'

let cachedToken: { token: string; expiresAt: number } | null = null

async function getSpotifyToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token
  }

  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  const data = await res.json()
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }
  return cachedToken.token
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')
  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 })
  }

  try {
    // Check if it's a Spotify URL
    const spotifyUrlMatch = query.match(
      /spotify\.com\/(track|album)\/([a-zA-Z0-9]+)/
    )

    let results = []

    if (spotifyUrlMatch) {
      // Direct fetch by ID
      const token = await getSpotifyToken()
      const type = spotifyUrlMatch[1]
      const id = spotifyUrlMatch[2]
      const res = await fetch(`https://api.spotify.com/v1/${type}s/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const item = await res.json()

      if (type === 'track') {
        results = [{
          id: item.id,
          type: 'track',
          title: item.name,
          artist: item.artists?.map((a: { name: string }) => a.name).join(', ') ?? '',
          album: item.album?.name ?? '',
          thumbnail: item.album?.images?.[0]?.url ?? null,
          spotify_url: item.external_urls?.spotify ?? null,
          youtube_search_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(item.name + ' ' + (item.artists?.[0]?.name ?? ''))}`,
        }]
      } else {
        results = [{
          id: item.id,
          type: 'album',
          title: item.name,
          artist: item.artists?.map((a: { name: string }) => a.name).join(', ') ?? '',
          album: item.name,
          thumbnail: item.images?.[0]?.url ?? null,
          spotify_url: item.external_urls?.spotify ?? null,
          youtube_search_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(item.name + ' ' + (item.artists?.[0]?.name ?? ''))}`,
        }]
      }
    } else {
      // Text search
      const token = await getSpotifyToken()
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,album&limit=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await res.json()

      const tracks = (data.tracks?.items ?? []).map((item: {
        id: string; name: string;
        artists: { name: string }[];
        album: { name: string; images: { url: string }[] };
        external_urls: { spotify: string }
      }) => ({
        id: item.id,
        type: 'track',
        title: item.name,
        artist: item.artists?.map((a) => a.name).join(', ') ?? '',
        album: item.album?.name ?? '',
        thumbnail: item.album?.images?.[0]?.url ?? null,
        spotify_url: item.external_urls?.spotify ?? null,
        youtube_search_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(item.name + ' ' + (item.artists?.[0]?.name ?? ''))}`,
      }))

      const albums = (data.albums?.items ?? []).map((item: {
        id: string; name: string;
        artists: { name: string }[];
        images: { url: string }[];
        external_urls: { spotify: string }
      }) => ({
        id: item.id,
        type: 'album',
        title: item.name,
        artist: item.artists?.map((a) => a.name).join(', ') ?? '',
        album: item.name,
        thumbnail: item.images?.[0]?.url ?? null,
        spotify_url: item.external_urls?.spotify ?? null,
        youtube_search_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(item.name + ' ' + (item.artists?.[0]?.name ?? ''))}`,
      }))

      // Interleave: tracks first, then albums
      results = [...tracks, ...albums].slice(0, 6)
    }

    return NextResponse.json({ results })
  } catch (err) {
    console.error('Music search error:', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
