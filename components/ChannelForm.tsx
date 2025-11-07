"use client"

import { useState } from 'react'

export type ChannelData = {
  channelId: string
  channelTitle: string
  channelUrl: string
  videos: Array<{
    id: string
    title: string
    url: string
    publishedAt: string
    description: string
  }>
}

export default function ChannelForm({ onLoaded }: { onLoaded: (data: ChannelData) => void }) {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/channel?input=${encodeURIComponent(input)}`)
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const data = (await res.json()) as ChannelData
      onLoaded(data)
    } catch (err: any) {
      setError(err.message ?? 'Failed to load channel')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={load} className="card p-4 md:p-6">
      <label className="block text-sm text-slate-300 mb-2">Channel URL, handle (@name), or ID</label>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="https://youtube.com/@yourhandle or UC..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50"
        >{loading ? 'Loading?' : 'Load'}</button>
      </div>
      {error && <p className="text-red-300 text-sm mt-2">{error}</p>}
      <p className="text-xs text-slate-400 mt-2">We read the public RSS feed to index your latest videos.</p>
    </form>
  )
}
