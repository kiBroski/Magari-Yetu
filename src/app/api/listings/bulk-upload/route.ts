import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { getCurrentUser } from '@/lib/auth'
import type { Listing } from '@/payload-types'

// Dealer differentiator: instead of clicking "post a listing" forty times,
// a dealer with an existing stock spreadsheet uploads it once. Deliberately
// hand-rolled CSV parsing (no dependency) — the format is narrow and fixed,
// so a tiny parser is easier to reason about than pulling in a library for
// it. Every row lands as status='pending-review', same as a manually
// created listing; bulk import does not skip moderation.
//
// Expected header row (order matters):
// title,category,condition,make,model,yearOfManufacture,price,county,town,description

const EXPECTED_HEADERS = ['title', 'category', 'condition', 'make', 'model', 'yearOfManufacture', 'price', 'county', 'town', 'description']

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/)
  const headers = lines[0].split(',').map((h) => h.trim())
  return lines.slice(1).filter(Boolean).map((line) => {
    // Naive split — fine for the simple, comma-in-quotes-free stock sheets
    // this targets. For anything richer, swap in a real CSV parser.
    const cells = line.split(',')
    return Object.fromEntries(headers.map((h, i) => [h, (cells[i] ?? '').trim()]))
  })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'dealer' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Only dealer accounts can bulk-upload' }, { status: 403 })
  }

  const formData = await req.formData().catch(() => null)
  const file = formData?.get('file')
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Attach a CSV file under the "file" field' }, { status: 400 })
  }

  const text = await (file as File).text()
  const rows = parseCsv(text)
  const missing = EXPECTED_HEADERS.filter((h) => !(h in (rows[0] ?? {})))
  if (missing.length > 0) {
    return NextResponse.json({ error: `Missing columns: ${missing.join(', ')}` }, { status: 400 })
  }

  const payload = await getPayload()
  const results: { row: number; ok: boolean; error?: string }[] = []

  for (const [i, row] of rows.entries()) {
    try {
      await payload.create({
        collection: 'listings',
        data: {
          title: row.title,
          slug: `${row.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now()}-${i}`,
          category: row.category as Listing['category'],
          condition: row.condition as Listing['condition'],
          make: row.make,
          model: row.model,
          yearOfManufacture: Number(row.yearOfManufacture),
          price: Number(row.price),
          county: row.county as Listing['county'],
          town: row.town,
          description: row.description,
          seller: user.id,
          status: 'pending-review',
          images: [], // bulk rows land without photos; seller adds them from the dashboard before it can go active
        },
      })
      results.push({ row: i + 2, ok: true })
    } catch (err) {
      results.push({ row: i + 2, ok: false, error: err instanceof Error ? err.message : 'Unknown error' })
    }
  }

  return NextResponse.json({ imported: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results })
}
