"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChannelData } from './ChannelForm'
import dynamic from 'next/dynamic'

const usePromise = <T,>(factory: () => Promise<T>, deps: any[]) => {
  const [value, setValue] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let mounted = true
    setLoading(true)
    factory().then(v => { if (mounted) setValue(v) }).catch(e => { if (mounted) setError(e as Error) }).finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return { value, error, loading }
}

const ClientOnly = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return <>{children}</>
}

export default function Chat({ data }: { data: ChannelData }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'agent', content: string }[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const { value: use, loading: modelLoading, error: modelError } = usePromise(async () => {
    const useMod = await import('@tensorflow-models/universal-sentence-encoder')
    await import('@tensorflow/tfjs')
    return await useMod.load()
  }, [])

  const documents = useMemo(() => {
    return data.videos.map(v => ({
      id: v.id,
      title: v.title,
      url: v.url,
      text: `${v.title}\n${v.description}`,
    }))
  }, [data.videos])

  const ask = async (question: string) => {
    setMessages(m => [...m, { role: 'user', content: question }])
    if (!use) {
      setMessages(m => [...m, { role: 'agent', content: 'Model is still loading. Try again in a moment.' }])
      return
    }
    const [qEmbedding, ...docEmbeddings] = await use.embed([question, ...documents.map(d => d.text)]).array()
    const scores = (docEmbeddings as number[][]).map((emb, i) => cosineSimilarity(emb, qEmbedding as number[]))
    const ranked = documents.map((d, i) => ({ d, score: scores[i] })).sort((a, b) => b.score - a.score).slice(0, 3)
    const response = renderAnswer(question, ranked.map(r => r.d))
    setMessages(m => [...m, { role: 'agent', content: response }])
  }

  return (
    <div className="card p-4 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Chat</h3>
        <span className="text-xs text-slate-400">{data.videos.length} videos indexed</span>
      </div>
      <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
        {messages.length === 0 && (
          <p className="text-slate-300 text-sm">Ask about topics you cover, recent uploads, or get video suggestions.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
            <div className={`inline-block px-3 py-2 rounded-xl ${m.role === 'user' ? 'bg-brand-600' : 'bg-white/5 border border-white/10'}`}>
              <RichText text={m.content} />
            </div>
          </div>
        ))}
        {modelLoading && <p className="text-xs text-slate-400">Loading semantic search model?</p>}
        {modelError && <p className="text-xs text-red-300">Model failed to load.</p>}
      </div>
      <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); const q = inputRef.current?.value?.trim(); if (q) { ask(q); if (inputRef.current) inputRef.current.value=''; } }}>
        <input ref={inputRef} placeholder="e.g., What are my most popular topics?" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500" />
        <button className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500">Ask</button>
      </form>
    </div>
  )
}

function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

function renderAnswer(question: string, docs: { id: string; title: string; url: string; text: string }[]) {
  const bullets = docs.map(d => `- ${d.title} (${d.url})`).join('\n')
  const intro = `Here are the most relevant videos I found for: "${question}"`;
  return `${intro}\n\n${bullets}\n\nTip: Ask about a specific topic or timeframe for more precise results.`
}

function RichText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/\S+)/g)
  return (
    <ClientOnly>
      <span>
        {parts.map((p, i) => p.startsWith('http') ? <a key={i} href={p} target="_blank" className="underline text-sky-300">{p}</a> : <span key={i}>{p}</span>)}
      </span>
    </ClientOnly>
  )
}
