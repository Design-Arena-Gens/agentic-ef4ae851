import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'YouTube Channel Agent',
  description: 'An agent that answers questions about your channel',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="container py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">YouTube Channel Agent</h1>
            <p className="text-sm text-slate-300 mt-1">Chat with your channel. No API key required.</p>
          </header>
          {children}
          <footer className="mt-12 text-center text-sm text-slate-400">
            Built for creators ? Runs on Vercel
          </footer>
        </div>
      </body>
    </html>
  )
}
