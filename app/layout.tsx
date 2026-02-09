import React from "react"
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import './globals.css'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StickFury - Anime Stickman Fighting',
  description: 'Fast-paced anime-themed stickman fighting game with campaign mode, local versus, and unique characters. Browser-friendly and skill-based.',
}

export const viewport: Viewport = {
  themeColor: '#0c0e1e',
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
