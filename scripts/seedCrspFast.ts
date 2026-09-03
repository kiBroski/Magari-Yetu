import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Pool } from 'pg'
import xlsx from 'xlsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const workbookPath = path.resolve(__dirname, '..', 'crsp.xlsx')

if (!fs.existsSync(workbookPath)) {
  throw new Error(`CRSP workbook not found: ${workbookPath}`)
}

console.log(`Reading: ${workbookPath}`)

const workbook = xlsx.readFile(workbookPath)

type RecordRow = {
  make: string
  model: string
  modelNumber: string
  variant: string
  transmission: string
  driveConfiguration: string
  engineCc: number | null
  fuelType: string | null
  bodyType: string
  gvwKg: number | null
  seatingCapacity: number | null
  category: string
  crspValueKes: number
  sourceNote: string
}

const records: RecordRow[] = []

function numberFromCell(value: unknown): number | null {
  const parsed = Number(String(value ?? '').replace(/,/g, '').replace(/[^0-9.]/g, '').trim())
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function fuelTypeFromCell(value: unknown): string | null {
  const fuel = String(value ?? '').trim().toLowerCase()
  if (fuel.includes('hybrid')) return 'hybrid'
  if (fuel.includes('electric') || fuel.includes('ev')) return 'electric'
  if (fuel.includes('diesel')) return 'diesel'
  if (fuel.includes('petrol') || fuel.includes('gasoline')) return 'petrol'
  return null
}

function sourceValue(row: Record<string, unknown>, ...names: string[]): unknown {
  const normalizedNames = names.map((name) => name.toLowerCase().replace(/[^a-z0-9]/g, ''))
  for (const [key, value] of Object.entries(row)) {
    if (normalizedNames.includes(key.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
      return value
    }
  }
  return undefined
}

for (const sheetName of workbook.SheetNames) {
  const sheet = workbook.Sheets[sheetName]

  const matrix = xlsx.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
  })

  const headerIndex = matrix.findIndex((row) => {
    const headers = row.map((cell) =>
      String(cell).trim().toLowerCase(),
    )

    return headers.includes('make') && headers.includes('model')
  })

  if (headerIndex < 0) {
    console.log(`Skipping sheet: ${sheetName}`)
    continue
  }

  const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    range: headerIndex,
    defval: '',
  })

  console.log(`${sheetName}: ${rows.length} rows`)

  for (const row of rows) {
    const make = String(sourceValue(row, 'make') ?? '').trim()
    const model = String(sourceValue(row, 'model') ?? '').trim()
    const modelNumber = String(sourceValue(row, 'model number') ?? '').trim()
    const variant = String(sourceValue(row, 'variant', 'description') ?? '').trim()
    const rawCrsp = sourceValue(row, 'crsp', 'crsp kes')

    const crspValueKes =
      typeof rawCrsp === 'number'
        ? rawCrsp
        : Number(
            String(rawCrsp ?? '')
              .replace(/,/g, '')
              .replace(/KES/gi, '')
              .trim(),
          )

    if (
      !make ||
      !model ||
      !Number.isFinite(crspValueKes) ||
      crspValueKes <= 0
    ) {
      continue
    }

    const sheetLower = sheetName.toLowerCase()

    let category = 'car'

    if (
      sheetLower.includes('motorcycle') ||
      sheetLower.includes('motor cycle')
    ) {
      category = 'motorcycle'
    } else if (sheetLower.includes('tractor')) {
      category = 'tractor'
    } else if (sheetLower.includes('tuk')) {
      category = 'tuk-tuk'
    } else if (sheetLower.includes('truck')) {
      category = 'truck'
    } else if (
      sheetLower.includes('machine') ||
      sheetLower.includes('equipment')
    ) {
      category = 'heavy-machinery'
    }

    records.push({
      make,
      model,
      modelNumber,
      variant,
      transmission: String(sourceValue(row, 'transmission') ?? '').trim(),
      driveConfiguration: String(sourceValue(row, 'drive configuration') ?? '').trim(),
      engineCc: numberFromCell(sourceValue(row, 'engine capacity', 'engine capacity cc')),
      fuelType: fuelTypeFromCell(sourceValue(row, 'fuel')),
      bodyType: String(sourceValue(row, 'body type') ?? '').trim(),
      gvwKg: numberFromCell(sourceValue(row, 'gvw', 'gross vehicle weight')),
      seatingCapacity: numberFromCell(sourceValue(row, 'seating', 'seating capacity')),
      category,
      crspValueKes,
      sourceNote:
        `Official KRA CRSP July 2025 - Imported from ` +
        `${path.basename(workbookPath)} - Sheet: ${sheetName}`,
    })
  }
}

console.log(`Parsed ${records.length} valid CRSP records.`)

if (records.length === 0) {
  throw new Error('No valid CRSP records found in workbook.')
}

const databaseUri = process.env.DATABASE_URI

if (!databaseUri) {
  throw new Error('DATABASE_URI is not set in the environment.')
}

const pool = new Pool({
  connectionString: databaseUri,
  max: 2,
})

const client = await pool.connect()

try {
  console.log('Connected to PostgreSQL.')
  console.log('Starting bulk import...')

  await client.query('BEGIN')

  // The Payload locked-documents relationship table references
  // crsp_schedule, so a normal TRUNCATE fails.
  //
  // CASCADE clears the dependent Payload relationship rows as well.
  // This is safe here because this script intentionally replaces the
  // complete CRSP dataset from the authoritative workbook.
  await client.query(
    'TRUNCATE TABLE crsp_schedule RESTART IDENTITY CASCADE',
  )

  const chunkSize = 500

  for (let start = 0; start < records.length; start += chunkSize) {
    const chunk = records.slice(start, start + chunkSize)

    const values: unknown[] = []
    const placeholders: string[] = []

    chunk.forEach((record, index) => {
      const offset = index * 14

      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14})`,
      )

      values.push(
        record.make,
        record.model,
        record.modelNumber || null,
        record.variant || null,
        record.transmission || null,
        record.driveConfiguration || null,
        record.engineCc,
        record.fuelType,
        record.bodyType || null,
        record.gvwKg,
        record.seatingCapacity,
        record.category,
        record.crspValueKes,
        record.sourceNote,
      )
    })

    await client.query(
      `
      INSERT INTO crsp_schedule
      (
        make,
        model,
        model_number,
        variant,
        transmission,
        drive_configuration,
        engine_cc,
        fuel_type,
        body_type,
        gvw_kg,
        seating_capacity,
        category,
        crsp_value_kes,
        source_note
      )
      VALUES
      ${placeholders.join(',')}
      `,
      values,
    )

    const imported = Math.min(
      start + chunkSize,
      records.length,
    )

    console.log(
      `Imported ${imported} / ${records.length}`,
    )
  }

  await client.query(
    `     UPDATE crsp_schedule
    SET
      verified = TRUE,
      created_at = COALESCE(created_at, NOW()),
      updated_at = NOW()
    `,
  )

  await client.query('COMMIT')

  const countResult = await client.query(
    'SELECT COUNT(*)::int AS count FROM crsp_schedule',
  )

  console.log(
    `SUCCESS: ${countResult.rows[0].count} CRSP records are now in the database.`,
  )
} catch (error) {
  await client.query('ROLLBACK')
  console.error(
    'Import failed. Database transaction rolled back.',
  )
  throw error
} finally {
  client.release()
  await pool.end()
}
