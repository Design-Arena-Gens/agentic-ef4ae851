import ChannelForm, { type ChannelData } from '@/components/ChannelForm'
import Chat from '@/components/Chat'
import Link from 'next/link'
import { Suspense } from 'react'

export default function Page() {
  return (
    <main className="space-y-6">
      <ChannelClient />
      <div className="card p-4 md:p-6">
        <h3 className="font-semibold mb-2">How it works</h3>
        <ol className="list-decimal list-inside text-sm text-slate-300 space-y-1">
          <li>Enter your YouTube channel URL, handle, or ID.</li>
          <li>We index titles and descriptions via the public RSS feed.</li>
          <li>Chat uses semantic search to surface the best matches.</li>
        </ol>
      </div>
      <p className="text-xs text-slate-400">Privacy: Nothing is stored; processed in your browser.</p>
    </main>
  )
}

'use client'
import { useState } from 'react'

function ChannelClient() {
  const [data, setData] = useState<ChannelData | null>(null)
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <ChannelForm onLoaded={setData} />
        {data && (
          <div className="card p-4 md:p-6">
            <h3 className="font-semibold">{data.channelTitle}</h3>
            <p className="text-xs text-slate-400 mb-3">Channel ID: {data.channelId}</p>
            <div className="space-y-2 max-h-64 overflow-auto pr-1">
              {data.videos.map(v => (
                <div key={v.id} className="text-sm">
                  <a href={v.url} target="_blank" className="underline">{v.title}</a>
                  <div className="text-slate-400 text-xs">{new Date(v.publishedAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div>
        {data ? (
          <Suspense fallback={<div className="card p-4">Loading?</div>}>
            <Chat data={data} />
          </Suspense>
        ) : (
          <div className="card p-4 md:p-6 h-full flex items-center justify-center text-slate-300">Load your channel to start chatting.</div>
        )}
      </div>
    </div>
  )
}
