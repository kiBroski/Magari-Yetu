import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { calculateImportDuty } from '@/lib/dutyCalculator'

// Server-side twin of the client-side calculation the ImportDutyCalculator
// component runs directly (see src/lib/dutyCalculator.ts, used by both).
// This route exists for anything that needs the number without a browser —
// a future mobile client, or validating a number a dealer typed into a bulk
// upload row.
const InputSchema = z.object({
  crspKes: z.number().positive(),
  yearOfManufacture: z.number().int().min(1980).max(2100),
  engineCc: z.number().positive(),
  fuelType: z.enum(['petrol', 'diesel', 'hybrid', 'electric']),
})

export async function POST(req: NextRequest) {
  const parsed = InputSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  return NextResponse.json(calculateImportDuty(parsed.data))
}
