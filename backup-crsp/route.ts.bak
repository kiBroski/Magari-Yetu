import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { getCurrentUser } from '@/lib/auth'
import type { Category, FuelType } from '@/lib/dutyCalculator'
import type { Where } from 'payload'

const EXPECTED_HEADERS = [
  'make',
  'model',
  'variant',
  'engineCc',
  'fuelType',
  'category',
  'crspValueKes',
  'verified',
  'sourceNote',
]

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/)

  if (lines.length === 0 || !lines[0]) {
    return []
  }

  const headers = lines[0].split(',').map((h) => h.trim())

  return lines
    .slice(1)
    .filter(Boolean)
    .map((line) => {
      const cells = line.split(',')

      return Object.fromEntries(
        headers.map((h, i) => [h, (cells[i] ?? '').trim()]),
      )
    })
}

export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload()
    const searchParams = req.nextUrl.searchParams

    const requestedLimit = Number(searchParams.get('limit') ?? 100)
    const requestedPage = Number(searchParams.get('page') ?? 1)

    const limit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(Math.floor(requestedLimit), 100)
        : 100

    const page =
      Number.isFinite(requestedPage) && requestedPage > 0
        ? Math.floor(requestedPage)
        : 1

    const query = searchParams.get('q')?.trim()
    const make = searchParams.get('make')?.trim()
    const model = searchParams.get('model')?.trim()
    const category = searchParams.get('category')?.trim()
    const verified = searchParams.get('verified')

    const conditions: Where[] = []

    /*
     * Structured make filter
     */
    if (make) {
      conditions.push({
        make: {
          like: make,
        },
      })
    }

    /*
     * Structured model filter
     */
    if (model) {
      conditions.push({
        model: {
          like: model,
        },
      })
    }

    /*
     * Structured category filter
     */
    if (category) {
      conditions.push({
        category: {
          equals: category,
        },
      })
    }

    /*
     * Verified filter
     */
    if (verified !== null) {
      conditions.push({
        verified: {
          equals: verified.toLowerCase() === 'true',
        },
      })
    }

    /*
     * Multi-word search.
     *
     * Example:
     *
     *   ?q=Toyota Vitz
     *
     * becomes:
     *
     *   Toyota must appear in make/model/variant
     *   AND
     *   Vitz must appear in make/model/variant
     *
     * This allows:
     *
     *   TOYOTA + VITZ HYBRID U
     *
     * to match "Toyota Vitz".
     */
    if (query) {
      const words = query
        .split(/\s+/)
        .map((word) => word.trim())
        .filter(Boolean)

      for (const word of words) {
        conditions.push({
          or: [
            {
              make: {
                like: word,
              },
            },
            {
              model: {
                like: word,
              },
            },
            {
              variant: {
                like: word,
              },
            },
          ],
        })
      }
    }

    const where =
      conditions.length > 0
        ? {
            and: conditions,
          }
        : undefined

    const result = await payload.find({
      collection: 'crsp-schedule',
      where,
      limit,
      page,
      // The schedule is a reference catalogue, not a newest-first feed.
      // Returning it in make/model order keeps every consumer (search,
      // calculator and select lists) consistently A–Z.
      sort: 'make,model,variant',
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('CRSP schedule GET error:', error)

    return NextResponse.json(
      {
        error: 'Failed to query CRSP schedule',
        message:
          error instanceof Error
            ? error.message
            : 'Unknown database error',
      },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      return NextResponse.json(
        {
          error: 'Only staff accounts can import the CRSP schedule',
        },
        { status: 403 },
      )
    }

    const formData = await req.formData().catch(() => null)
    const file = formData?.get('file')

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        {
          error: 'Attach a CSV file under the "file" field',
        },
        { status: 400 },
      )
    }

    const text = await (file as File).text()
    const rows = parseCsv(text)

    if (rows.length === 0) {
      return NextResponse.json(
        {
          error: 'The CSV file is empty or contains no data rows',
        },
        { status: 400 },
      )
    }

    const missing = EXPECTED_HEADERS.filter(
      (header) => !(header in rows[0]),
    )

    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: `Missing columns: ${missing.join(', ')}`,
        },
        { status: 400 },
      )
    }

    const payload = await getPayload()

    const results: {
      row: number
      ok: boolean
      error?: string
    }[] = []

    for (const [i, row] of rows.entries()) {
      try {
        await payload.create({
          collection: 'crsp-schedule',
          data: {
            make: row.make,
            model: row.model,
            variant: row.variant || undefined,
            engineCc: row.engineCc
              ? Number(row.engineCc)
              : undefined,
            fuelType: row.fuelType
              ? (row.fuelType as FuelType)
              : undefined,
            category: row.category as Category,
            crspValueKes: Number(row.crspValueKes),
            verified:
              row.verified?.toLowerCase() === 'true',
            sourceNote: row.sourceNote || undefined,
          },
        })

        results.push({
          row: i + 2,
          ok: true,
        })
      } catch (err) {
        results.push({
          row: i + 2,
          ok: false,
          error:
            err instanceof Error
              ? err.message
              : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      imported: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    })
  } catch (error) {
    console.error('CRSP schedule POST error:', error)

    return NextResponse.json(
      {
        error: 'Failed to import CRSP schedule',
        message:
          error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
