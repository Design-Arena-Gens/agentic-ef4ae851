import { NextRequest } from 'next/server'
import { XMLParser } from 'fast-xml-parser'
import { extractChannelIdOrHandle, buildRssUrlFromChannelId } from '@/lib/youtube'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get('input')?.trim()
  if (!input) return new Response(JSON.stringify({ error: 'Missing input' }), { status: 400 })

  try {
    const resolvedChannelId = await resolveToChannelId(input)
    if (!resolvedChannelId) return new Response(JSON.stringify({ error: 'Channel not found' }), { status: 404 })

    const rssUrl = buildRssUrlFromChannelId(resolvedChannelId)
    const res = await fetch(rssUrl, { next: { revalidate: 60 } })
    if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`)
    const xml = await res.text()

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
    const feed = parser.parse(xml).feed

    const channelTitle: string = feed.title
    const channelUrl = `https://www.youtube.com/channel/${resolvedChannelId}`

    const entries: any[] = Array.isArray(feed.entry) ? feed.entry : (feed.entry ? [feed.entry] : [])
    const videos = entries.map(e => ({
      id: e['yt:videoId'],
      title: e.title,
      url: e.link?.['@_href'] ?? `${channelUrl}/videos`,
      publishedAt: e.published,
      description: e['media:group']?.['media:description'] ?? ''
    }))

    const body = { channelId: resolvedChannelId, channelTitle, channelUrl, videos }
    return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? 'Unknown error' }), { status: 500 })
  }
}

async function resolveToChannelId(input: string): Promise<string | null> {
  const kind = extractChannelIdOrHandle(input)
  if (kind.type === 'id') return kind.value
  if (kind.type === 'handle') {
    const page = await fetch(`https://www.youtube.com/${kind.value}`)
    if (!page.ok) return null
    const html = await page.text()
    const id = matchChannelIdFromHtml(html)
    return id
  }
  if (kind.type === 'url') {
    // Try direct /channel/UC... first
    const direct = input.match(/\/channel\/(UC[0-9A-Za-z_-]{22})/)
    if (direct) return direct[1]
    // Otherwise fetch and parse HTML for channelId
    const page = await fetch(input)
    if (!page.ok) return null
    const html = await page.text()
    const id = matchChannelIdFromHtml(html)
    return id
  }
  // Unknown, try as handle
  if (input.startsWith('@')) return await resolveToChannelId(input)
  return null
}

function matchChannelIdFromHtml(html: string): string | null {
  const m = html.match(/\"channelId\":\"(UC[0-9A-Za-z_-]{22})\"/)
  return m ? m[1] : null
}
