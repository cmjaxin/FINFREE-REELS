import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NEO Reels — Admin',
  description: 'Video content platform for NEO Home Loans',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="font-barlow bg-neo-page-bg text-neo-body">
        {children}
      </body>
    </html>
  )
}
