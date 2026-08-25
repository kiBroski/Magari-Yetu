import type { Metadata } from 'next'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import config from '@payload-config'
import { importMap } from '../importMap'

// This file, its sibling layout.tsx, and importMap.js are the standard
// Payload 3 admin-mount boilerplate — normally you never hand-write these,
// `npx create-payload-app` scaffolds them and `payload generate:importmap`
// regenerates importMap.js whenever you add custom admin components. Run
// that command after `npm install` rather than editing importMap.js by hand.

type Args = { params: Promise<{ segments: string[] }>; searchParams: Promise<{ [key: string]: string | string[] }> }

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

export default function Page({ params, searchParams }: Args) {
  return RootPage({ config, params, searchParams, importMap })
}
