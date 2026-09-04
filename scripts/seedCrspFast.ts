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
  transmission: string
  driveConfiguration: string
  engineCapacityText: string | null
  engineCc: number | null
  fuelType: string | null
  bodyType: string
  gvwKg: number | null
  seatingCapacity: number | null
  sourceGroup: 'motor-vehicle' | 'motorcycle' | 'tractor-grader'
  crspValueKes: number
  sourceNote: string
}

const records: RecordRow[] = []

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function sourceValue(
  row: Record<string, unknown>,
  ...names: string[]
): unknown {
  const expected = names.map(normalizeHeader)

  for (const [key, value] of Object.entries(row)) {
    if (expected.includes(normalizeHeader(key))) {
      return value
    }
  }

  return undefined
}

function textValue(value: unknown): string {
  return String(value ?? '').trim()
}

function numberValue(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(
    String(value)
      .replace(/,/g, '')
      .replace(/[^\d.-]/g, '')
      .trim(),
  )

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function engineCapacity(value: unknown): {
  engineCapacityText: string | null
  engineCc: number | null
} {
  const raw = textValue(value)

  if (!raw) {
    return {
      engineCapacityText: null,
      engineCc: null,
    }
  }

  /*
   * Preserve the original KRA value.
   *
   * Examples:
   *   3000    -> engineCc = 3000
   *   399     -> engineCc = 399
   *   63 kWh  -> engineCc = null
   */
  const numericCc = /^\d+(?:\.\d+)?$/.test(raw)

  return {
    engineCapacityText: raw,
    engineCc: numericCc ? Number(raw) : null,
  }
}

function fuelValue(
  value: unknown,
): 'petrol' | 'diesel' | 'hybrid' | 'electric' | null {
  const raw = textValue(value)

  if (!raw) {
    return null
  }

  const fuel = raw
    .toLowerCase()
    .replace(/[^a-z]/g, '')

  if (
    fuel.includes('electric') ||
    /^elec+tric$/.test(fuel)
  ) {
    return 'electric'
  }

  if (fuel.includes('hybrid')) {
    return 'hybrid'
  }

  if (fuel.includes('diesel')) {
    return 'diesel'
  }

  if (
    fuel.includes('petrol') ||
    fuel.includes('gasoline') ||
    fuel.includes('gasolene')
  ) {
    return 'petrol'
  }

  console.warn(`Unknown fuel value omitted: "${raw}"`)
  return null
}

function crspValue(value: unknown): number | null {
  return numberValue(value)
}

function sourceNote(sheetName: string): string {
  return (
    `Official KRA CRSP July 2025 - Imported from ` +
    `${path.basename(workbookPath)} - Sheet: ${sheetName}`
  )
}

/*
 * --------------------------------------------------------------------------
 * MAIN MOTOR-VEHICLE SHEET
 * --------------------------------------------------------------------------
 *
 * Sheet:
 *   M.Vehicle CRSP July 2025
 *
 * This sheet contains:
 * Make
 * Model
 * Model number
 * Transmission
 * Drive Configuration
 * Engine Capacity
 * Body Type
 * GVW
 * Seating
 * Fuel
 * CRSP (KES.)
 */
function importMotorVehicles(sheet: xlsx.WorkSheet): void {
  const matrix = xlsx.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
  })

  const headerIndex = matrix.findIndex((row) => {
    const headers = row.map(normalizeHeader)

    return (
      headers.includes('make') &&
      headers.includes('model') &&
      headers.includes('crspkes')
    )
  })

  if (headerIndex < 0) {
    throw new Error(
      'Could not find the header row in M.Vehicle CRSP July 2025.',
    )
  }

  const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    range: headerIndex,
    defval: '',
  })

  console.log(
    `M.Vehicle CRSP July 2025: ${rows.length} source rows`,
  )

  for (const row of rows) {
    const make = textValue(sourceValue(row, 'Make'))
    const model = textValue(sourceValue(row, 'Model'))
    const modelNumber = textValue(
      sourceValue(row, 'Model number'),
    )

    const rawEngineCapacity = sourceValue(
      row,
      'Engine Capacity',
    )

    const engine = engineCapacity(rawEngineCapacity)

    const rawCrsp = crspValue(
      sourceValue(row, 'CRSP KES'),
    )

    if (!make || !model || rawCrsp === null) {
      continue
    }

    records.push({
      make,
      model,
      modelNumber,
      transmission: textValue(
        sourceValue(row, 'Transmission'),
      ),
      driveConfiguration: textValue(
        sourceValue(row, 'Drive Configuration'),
      ),
      engineCapacityText: engine.engineCapacityText,
      engineCc: engine.engineCc,
      fuelType: fuelValue(
        sourceValue(row, 'Fuel'),
      ),
      bodyType: textValue(
        sourceValue(row, 'Body Type'),
      ),
      gvwKg: numberValue(
        sourceValue(row, 'GVW'),
      ),
      seatingCapacity: numberValue(
        sourceValue(row, 'Seating'),
      ),
      sourceGroup: 'motor-vehicle',
      crspValueKes: rawCrsp,
      sourceNote: sourceNote(
        'M.Vehicle CRSP July 2025',
      ),
    })
  }

  console.log(
    `M.Vehicle CRSP July 2025: imported ${records.filter(
      (record) => record.sourceGroup === 'motor-vehicle',
    ).length} valid rows`,
  )
}

/*
 * --------------------------------------------------------------------------
 * MOTORCYCLE SHEET
 * --------------------------------------------------------------------------
 *
 * Sheet:
 *   Motor Cycles July 2025
 *
 * The motorcycle source does not contain the same fields as the main
 * motor-vehicle sheet, so it is handled independently.
 */
function importMotorcycles(sheet: xlsx.WorkSheet): void {
  const matrix = xlsx.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
  })

  const headerIndex = matrix.findIndex((row) => {
    const headers = row.map(normalizeHeader)

    return (
      headers.includes('make') &&
      headers.includes('model') &&
      headers.includes('crspkes')
    )
  })

  if (headerIndex < 0) {
    throw new Error(
      'Could not find the header row in Motor Cycles July 2025.',
    )
  }

  const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(
    sheet,
    {
      range: headerIndex,
      defval: '',
    },
  )

  console.log(
    `Motor Cycles July 2025: ${rows.length} source rows`,
  )

  const before = records.length

  for (const row of rows) {
    const make = textValue(sourceValue(row, 'Make'))
    const model = textValue(sourceValue(row, 'Model'))
    const modelNumber = textValue(
      sourceValue(row, 'Model number'),
    )

    const engine = engineCapacity(
      sourceValue(row, 'Engine Capacity'),
    )

    const rawCrsp = crspValue(
      sourceValue(row, 'CRSP KES'),
    )

    if (!make || !model || rawCrsp === null) {
      continue
    }

    records.push({
      make,
      model,
      modelNumber,
      transmission: textValue(
        sourceValue(row, 'Transmission'),
      ),
      driveConfiguration: '',
      engineCapacityText: engine.engineCapacityText,
      engineCc: engine.engineCc,
      fuelType: fuelValue(
        sourceValue(row, 'Fuel'),
      ),
      bodyType: '',
      gvwKg: null,
      seatingCapacity: numberValue(
        sourceValue(row, 'Seating'),
      ),
      sourceGroup: 'motorcycle',
      crspValueKes: rawCrsp,
      sourceNote: sourceNote(
        'Motor Cycles July 2025',
      ),
    })
  }

  console.log(
    `Motor Cycles July 2025: imported ${records.length - before} valid rows`,
  )
}

/*
 * --------------------------------------------------------------------------
 * TRACTORS & GRADERS SHEET
 * --------------------------------------------------------------------------
 *
 * Sheet:
 *   Tractors & Graders July 2025
 *
 * This sheet does NOT have a normal Make/Model header row.
 *
 * Example structure:
 *
 *   MODEL
 *   HORSEPOWER/CC/KW
 *
 *   MASSEY FERGUSON
 *
 *   KSHS
 *
 *   MF-385-2WD       46       2246158.33
 *   MF-385-4WD       46       3165041.28
 *
 * The manufacturer appears as a section heading and therefore needs to
 * be carried forward to subsequent model rows.
 */
function importTractorsAndGraders(
  sheet: xlsx.WorkSheet,
): void {
  const matrix = xlsx.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
  })

  console.log(
    `Tractors & Graders July 2025: ${matrix.length} source rows`,
  )

  const before = records.length

  let currentMake = ''

  for (const row of matrix) {
    const cells = row.map((cell) =>
      textValue(cell),
    )

    if (cells.every((cell) => !cell)) {
      continue
    }

    const upper = cells.map((cell) =>
      cell.toUpperCase(),
    )

    /*
     * Ignore the sheet headers and KSHS marker.
     */
    if (
      upper.some((cell) =>
        cell.includes('HORSEPOWER/CC/KW'),
      ) ||
      upper.includes('MODEL') ||
      upper.includes('KSHS')
    ) {
      continue
    }

    /*
     * Find numeric cells in the row.
     */
    const numericCells = row
      .map((value, index) => ({
        value: numberValue(value),
        index,
      }))
      .filter(
        (item): item is { value: number; index: number } =>
          item.value !== null,
      )

    /*
     * A manufacturer heading normally contains text but no numeric
     * CRSP value. Treat a standalone text row as the current make.
     */
    if (
      numericCells.length === 0 &&
      cells.filter(Boolean).length === 1
    ) {
      currentMake = cells.find(Boolean) ?? ''
      continue
    }

    if (!currentMake) {
      continue
    }

    /*
     * The tractor sheet normally has:
     *
     *   model | horsepower/cc/kw | crsp
     *
     * The final numeric value is the CRSP.
     */
    if (numericCells.length < 2) {
      continue
    }

    const model =
      cells.find(
        (cell, index) =>
          cell &&
          !numericCells.some(
            (numeric) => numeric.index === index,
          ),
      ) ?? ''

    if (!model) {
      continue
    }

    const horsepowerOrCapacity =
      numericCells[0]?.value ?? null

    const crsp =
      numericCells[numericCells.length - 1]?.value ?? null

    if (
      !Number.isFinite(crsp) ||
      crsp <= 0
    ) {
      continue
    }

    records.push({
      make: currentMake,
      model,
      modelNumber: '',
      transmission: '',
      driveConfiguration: '',
      engineCapacityText:
        horsepowerOrCapacity !== null
          ? String(horsepowerOrCapacity)
          : null,
      engineCc: null,
      fuelType: null,
      bodyType: '',
      gvwKg: null,
      seatingCapacity: null,
      sourceGroup: 'tractor-grader',
      crspValueKes: crsp,
      sourceNote: sourceNote(
        'Tractors & Graders July 2025',
      ),
    })
  }

  console.log(
    `Tractors & Graders July 2025: imported ${
      records.length - before
    } valid rows`,
  )
}

/*
 * --------------------------------------------------------------------------
 * READ THE THREE REAL KRA SOURCE SHEETS
 * --------------------------------------------------------------------------
 */

const motorVehicleSheetName =
  'M.Vehicle CRSP July 2025'

const motorcycleSheetName =
  'Motor Cycles July 2025'

const tractorSheetName =
  'Tractors & Graders July 2025'

const motorVehicleSheet =
  workbook.Sheets[motorVehicleSheetName]

const motorcycleSheet =
  workbook.Sheets[motorcycleSheetName]

const tractorSheet =
  workbook.Sheets[tractorSheetName]

if (!motorVehicleSheet) {
  throw new Error(
    `Missing workbook sheet: ${motorVehicleSheetName}`,
  )
}

if (!motorcycleSheet) {
  throw new Error(
    `Missing workbook sheet: ${motorcycleSheetName}`,
  )
}

if (!tractorSheet) {
  throw new Error(
    `Missing workbook sheet: ${tractorSheetName}`,
  )
}

importMotorVehicles(motorVehicleSheet)
importMotorcycles(motorcycleSheet)
importTractorsAndGraders(tractorSheet)

console.log(
  `Parsed ${records.length} valid CRSP records.`,
)

if (records.length === 0) {
  throw new Error(
    'No valid CRSP records found in workbook.',
  )
}

const counts = records.reduce(
  (result, record) => {
    result[record.sourceGroup] =
      (result[record.sourceGroup] ?? 0) + 1

    return result
  },
  {} as Record<string, number>,
)

console.log('Records by source group:')
console.log(counts)

const databaseUri = process.env.DATABASE_URI

if (!databaseUri) {
  throw new Error(
    'DATABASE_URI is not set in the environment.',
  )
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

  /*
   * This intentionally replaces the complete CRSP dataset.
   *
   * CASCADE is required because Payload may have relationship tables
   * referencing crsp_schedule.
   */
  await client.query(
    'TRUNCATE TABLE crsp_schedule RESTART IDENTITY CASCADE',
  )

  const chunkSize = 500

  /*
   * 15 database columns are inserted per record.
   */
  const columnsPerRecord = 15

  for (
    let start = 0;
    start < records.length;
    start += chunkSize
  ) {
    const chunk = records.slice(
      start,
      start + chunkSize,
    )

    const values: unknown[] = []
    const placeholders: string[] = []

    chunk.forEach((record, index) => {
      const offset =
        index * columnsPerRecord

      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15})`,
      )

      values.push(
        record.make,
        record.model,
        record.modelNumber || null,
        record.transmission || null,
        record.driveConfiguration || null,
        record.engineCapacityText,
        record.engineCc,
        record.fuelType,
        record.bodyType || null,
        record.gvwKg,
        record.seatingCapacity,
        record.sourceGroup,
        record.crspValueKes,
        true,
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
          transmission,
          drive_configuration,
          engine_capacity_text,
          engine_cc,
          fuel_type,
          body_type,
          gvw_kg,
          seating_capacity,
          source_group,
          crsp_value_kes,
          verified,
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
    `
      UPDATE crsp_schedule
      SET
        verified = TRUE,
        created_at = COALESCE(created_at, NOW()),
        updated_at = NOW()
    `,
  )

  await client.query('COMMIT')

  const countResult = await client.query(
    `
      SELECT
        COUNT(*)::int AS count
      FROM crsp_schedule
    `,
  )

  const groupResult = await client.query(
    `
      SELECT
        source_group,
        COUNT(*)::int AS count
      FROM crsp_schedule
      GROUP BY source_group
      ORDER BY source_group
    `,
  )

  console.log(
    `SUCCESS: ${countResult.rows[0].count} CRSP records are now in the database.`,
  )

  console.log(
    'Database records by source group:',
  )

  console.table(groupResult.rows)
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