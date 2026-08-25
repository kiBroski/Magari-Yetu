import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { getCurrentUser } from '@/lib/auth'
import type { Category, FuelType } from '@/lib/dutyCalculator'
import type { Where } from 'payload'

// This is the actual, real path to a launch-accurate duty calculator: once
// someone downloads KRA's real CRSP spreadsheet by hand from
// kra.go.ke/images/publications/New-CRSP---July-2025.xlsx (a browser works
// fine; automated fetching is blocked by the site's own robots.txt, which
// is why this project can't do that step for you), export it to CSV and
// import it here. Every row imported this way should be marked verified in
// the CSV — see the expected header shape below.
//
// Expected header row (order matters):
// make,model,variant,engineCc,fuelType,category,crspValueKes,verified,sourceNote

const EXPECTED_HEADERS = ['make', 'model', 'variant', 'engineCc', 'fuelType', 'category', 'crspValueKes', 'verified', 'sourceNote']

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/)
  const headers = lines[0].split(',').map((h) => h.trim())
  return lines.slice(1).filter(Boolean).map((line) => {
    const cells = line.split(',')
    return Object.fromEntries(headers.map((h, i) => [h, (cells[i] ?? '').trim()]))
  })
}

export async function GET(req: NextRequest) {
  const payload = await getPayload()
  const searchParams = req.nextUrl.searchParams
  const limit = Math.min(Number(searchParams.get('limit') ?? 100), 100)
  const verified = searchParams.get('verified')
  const query = searchParams.get('q')?.trim()
  const conditions: Where[] = []
  if (verified !== null) conditions.push({ verified: { equals: verified === 'true' } })
  if (query) {
    conditions.push({
      or: [
        { make: { contains: query } },
        { model: { contains: query } },
        { variant: { contains: query } },
      ],
    })
  }
  const where = conditions.length > 0 ? { and: conditions } : undefined

  const result = await payload.find({
    collection: 'crsp-schedule',
    where,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 100,
  })

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return NextResponse.json({ error: 'Only staff accounts can import the CRSP schedule' }, { status: 403 })
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
        collection: 'crsp-schedule',
        data: {
          make: row.make,
          model: row.model,
          variant: row.variant || undefined,
          engineCc: row.engineCc ? Number(row.engineCc) : undefined,
          fuelType: row.fuelType ? row.fuelType as FuelType : undefined,
          category: row.category as Category,
          crspValueKes: Number(row.crspValueKes),
          verified: row.verified?.toLowerCase() === 'true',
          sourceNote: row.sourceNote || undefined,
        },
      })
      results.push({ row: i + 2, ok: true })
    } catch (err) {
      results.push({ row: i + 2, ok: false, error: err instanceof Error ? err.message : 'Unknown error' })
    }
  }

  return NextResponse.json({ imported: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results })
}
