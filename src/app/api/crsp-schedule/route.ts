import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { getCurrentUser } from '@/lib/auth'
import type { Where } from 'payload'

const EXPECTED_HEADERS = [
  'make',
  'model',
  'modelNumber',
  'transmission',
  'driveConfiguration',
  'engineCapacityText',
  'engineCc',
  'bodyType',
  'gvwKg',
  'seatingCapacity',
  'fuelType',
  'sourceGroup',
  'crspValueKes',
  'verified',
  'sourceNote',
]

const SOURCE_GROUPS = [
  'motor-vehicle',
  'motorcycle',
  'tractor-grader',
] as const

type SourceGroup = (typeof SOURCE_GROUPS)[number]

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
    const sourceGroup = searchParams.get('sourceGroup')?.trim()
    const verified = searchParams.get('verified')

    const conditions: Where[] = []

    /*
     * Structured make filter.
     */
    if (make) {
      conditions.push({
        make: {
          like: make,
        },
      })
    }

    /*
     * Structured model filter.
     */
    if (model) {
      conditions.push({
        model: {
          like: model,
        },
      })
    }

    /*
     * Source-sheet family filter.
     *
     * Allowed values:
     * - motor-vehicle
     * - motorcycle
     * - tractor-grader
     */
    if (sourceGroup) {
      conditions.push({
        sourceGroup: {
          equals: sourceGroup,
        },
      })
    }

    /*
     * Verified filter.
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
     * Each word must appear in make, model or model number.
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
              modelNumber: {
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

      /*
       * CRSP is a reference catalogue, not a newest-first feed.
       * Keep results consistently A-Z.
       */
      sort: 'make,model,modelNumber',
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
        /*
         * Payload select fields only accept the declared values.
         * Validate the CSV value before creating the record.
         */
        const sourceGroup = SOURCE_GROUPS.includes(
          row.sourceGroup as SourceGroup,
        )
          ? (row.sourceGroup as SourceGroup)
          : null

        if (!sourceGroup) {
          throw new Error(
            `Invalid sourceGroup "${row.sourceGroup}". Expected motor-vehicle, motorcycle, or tractor-grader.`,
          )
        }

        await payload.create({
          collection: 'crsp-schedule',
          data: {
            make: row.make,
            model: row.model,
            modelNumber: row.modelNumber || undefined,
            transmission: row.transmission || undefined,
            driveConfiguration:
              row.driveConfiguration || undefined,
            engineCapacityText:
              row.engineCapacityText || undefined,
            engineCc: row.engineCc
              ? Number(row.engineCc)
              : undefined,
            bodyType: row.bodyType || undefined,
            gvwKg: row.gvwKg
              ? Number(row.gvwKg)
              : undefined,
            seatingCapacity: row.seatingCapacity
              ? Number(row.seatingCapacity)
              : undefined,
            fuelType: row.fuelType || undefined,
            sourceGroup,
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