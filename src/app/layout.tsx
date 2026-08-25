import type { Metadata } from 'next'
import React from 'react'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
  title: {
    default: 'Magariyetu — Buy & sell vehicles and machinery in Kenya',
    template: '%s | Magariyetu',
  },
  description:
    'New, locally assembled, imported and locally used cars, trucks, and heavy machinery — from individuals and verified dealers across Kenya.',
  openGraph: {
    siteName: 'Magariyetu',
    type: 'website',
    locale: 'en_KE',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}