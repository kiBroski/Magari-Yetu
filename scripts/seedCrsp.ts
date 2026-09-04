import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'
import config from '../payload.config'
import xlsx from 'xlsx'

const STARTER_CATALOG = [
  ['Toyota', 'Vitz', 'F', 'car', 1350000],
  ['Toyota', 'Axio', 'X', 'car', 1850000],
  ['Toyota', 'Fielder', 'X', 'car', 1950000],
  ['Toyota', 'Harrier', 'Premium', 'car', 4200000],
  ['Toyota', 'Land Cruiser Prado', 'TX', 'car', 7200000],
  ['Nissan', 'Note', 'e-Power', 'car', 2100000],
  ['Nissan', 'X-Trail', '20X', 'car', 3100000],
  ['Mazda', 'Demio', '13C', 'car', 1550000],
  ['Honda', 'Fit', 'Hybrid', 'car', 1750000],
  ['Subaru', 'Forester', '2.0i', 'car', 2850000],
  ['Isuzu', 'D-Max', 'Double Cab', 'pickup-van', 4300000],
  ['Toyota', 'Hilux', 'Double Cab', 'pickup-van', 5800000],
  ['Toyota', 'Hiace', 'Diesel', 'bus', 5200000],
  ['Bajaj', 'Boxer', 'BM150', 'motorcycle', 145000],
  ['TVS', 'King', 'Deluxe', 'tuk-tuk', 520000],
] as const

type SourceGroup =
  | 'motor-vehicle'
  | 'motorcycle'
  | 'tractor-grader'

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function sourceValue(row: Record<string, unknown>, ...names: string[]) {
  const expected = names.map(normalizeHeader)

  for (const [key, value] of Object.entries(row)) {
    if (expected.includes(normalizeHeader(key))) {
      return value
    }
  }

  return undefined
}

function textValue(value: unknown) {
  return String(value ?? '').trim()
}

function numberValue(value: unknown): number | null {
  const number = Number(
    String(value ?? '')
      .replace(/,/g, '')
      .replace(/[^\d.]/g, ''),
  )

  return Number.isFinite(number) && number > 0 ? number : null
}

function engineCapacity(value: unknown) {
  const raw = textValue(value)
  const isCc = /^\d+(\.\d+)?$/.test(raw)

  return {
    engineCapacityText: raw || null,
    engineCc: isCc ? Number(raw) : null,
  }
}

function fuelValue(value: unknown) {
  const raw = textValue(value).toLowerCase()

  if (raw.includes('electric')) return 'electric'
  if (raw.includes('hybrid')) return 'hybrid'
  if (raw.includes('diesel')) return 'diesel'
  if (raw.includes('gasoline') || raw.includes('petrol')) return 'petrol'

  return raw || null
}

async function seedCrsp() {
  const payload = await getPayload({ config })

  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))

  const workbookCandidates = [
    path.resolve(scriptDirectory, '..', 'crsp.xlsx'),
    path.resolve(scriptDirectory, 'crsp.xlsx'),
  ]

  let created = 0

  const records: Array<{
    make: string
    model: string
    modelNumber: string | null
    transmission: string | null
    driveConfiguration: string | null
    engineCapacityText: string | null
    engineCc: number | null
    bodyType: string | null
    gvwKg: number | null
    seatingCapacity: number | null
    fuelType: string | null
    sourceGroup: SourceGroup
    crspValueKes: number
    sourceNote: string
  }> = []

  let workbookPath: string | undefined

  for (const candidate of workbookCandidates) {
    if (!fs.existsSync(candidate) || fs.statSync(candidate).size < 1024) {
      continue
    }

    try {
      const workbook = xlsx.readFile(candidate)
      workbookPath = candidate

      for (const sheetName of workbook.SheetNames) {
        if (
          sheetName === 'TEMPLATE 2025' ||
          sheetName.toLowerCase().includes('tractor') ||
          sheetName.toLowerCase().includes('grader')
        ) {
          continue
        }

        const matrix = xlsx.utils.sheet_to_json<unknown[]>(
          workbook.Sheets[sheetName],
          {
            header: 1,
            defval: '',
          },
        )

        const headerIndex = matrix.findIndex((row) => {
          const headers = row.map((cell) =>
            normalizeHeader(String(cell)),
          )

          return headers.includes('make') && headers.includes('model')
        })

        if (headerIndex < 0) continue

        const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(
          workbook.Sheets[sheetName],
          {
            range: headerIndex,
            defval: '',
          },
        )

        const isMotorcycle =
          sheetName.toLowerCase().includes('motorcycle') ||
          sheetName.toLowerCase().includes('motor cycle')

        for (const row of rows) {
          const make = textValue(sourceValue(row, 'Make'))
          const model = textValue(sourceValue(row, 'Model'))

          const modelNumber =
            textValue(
              sourceValue(
                row,
                'Model number',
                'Model number ',
              ),
            ) || null

          const crspValueKes =
            numberValue(
              sourceValue(
                row,
                'CRSP',
                'CRSP KES',
                'CRSP (KES)',
                'CRSP (KES.)',
              ),
            ) ?? 0

          if (!make || !model || crspValueKes <= 0) {
            continue
          }

          const engine = engineCapacity(
            sourceValue(row, 'Engine Capacity'),
          )

          records.push({
            make,
            model,
            modelNumber,
            transmission:
              textValue(sourceValue(row, 'Transmission')) || null,
            driveConfiguration: isMotorcycle
              ? null
              : textValue(
                    sourceValue(
                      row,
                      'Drive Configuration',
                    ),
                  ) || null,
            engineCapacityText: engine.engineCapacityText,
            engineCc: engine.engineCc,
            bodyType: isMotorcycle
              ? null
              : textValue(sourceValue(row, 'Body Type')) || null,
            gvwKg: isMotorcycle
              ? null
              : numberValue(sourceValue(row, 'GVW')),
            seatingCapacity: numberValue(
              sourceValue(row, 'Seating', 'seating'),
            ),
            fuelType: fuelValue(
              sourceValue(row, 'Fuel'),
            ),
            sourceGroup: isMotorcycle
              ? 'motorcycle'
              : 'motor-vehicle',
            crspValueKes,
            sourceNote: `Official KRA CRSP July 2025 - Imported from ${path.basename(
              workbookPath,
            )} - Sheet: ${sheetName}`,
          })
        }
      }

      if (records.length > 0) {
        console.log(`Using CRSP workbook: ${workbookPath}`)
        break
      }
    } catch (error) {
      console.warn(
        `Could not read CRSP workbook ${candidate}: ${
          error instanceof Error ? error.message : error
        }`,
      )
    }
  }

  if (records.length === 0) {
    console.warn(
      'No readable CRSP workbook found; using the development starter catalog.',
    )

    for (const [
      make,
      model,
      modelNumber,
      category,
      crspValueKes,
    ] of STARTER_CATALOG) {
      const sourceGroup: SourceGroup =
        category === 'motorcycle'
          ? 'motorcycle'
          : 'motor-vehicle'

      records.push({
        make,
        model,
        modelNumber,
        transmission: null,
        driveConfiguration: null,
        engineCapacityText: null,
        engineCc: null,
        bodyType: null,
        gvwKg: null,
        seatingCapacity: null,
        fuelType: null,
        sourceGroup,
        crspValueKes,
        sourceNote:
          'Starter estimate for development only. Replace with the official KRA CRSP schedule before launch.',
      })
    }
  }

  const existing = await payload.find({
    collection: 'crsp-schedule',
    limit: 10000,
    depth: 0,
  })

  const existingKeys = new Set(
    existing.docs.map(
      (doc) =>
        `${doc.make}|${doc.model}|${doc.modelNumber ?? ''}`,
    ),
  )

  for (const record of records) {
    const key = `${record.make}|${record.model}|${
      record.modelNumber ?? ''
    }`

    if (existingKeys.has(key)) {
      continue
    }

    await payload.create({
      collection: 'crsp-schedule',
      data: {
        make: record.make,
        model: record.model,
        modelNumber: record.modelNumber,
        transmission: record.transmission,
        driveConfiguration: record.driveConfiguration,
        engineCapacityText: record.engineCapacityText,
        engineCc: record.engineCc,
        bodyType: record.bodyType,
        gvwKg: record.gvwKg,
        seatingCapacity: record.seatingCapacity,
        fuelType: record.fuelType,
        sourceGroup: record.sourceGroup,
        crspValueKes: record.crspValueKes,
        verified: Boolean(workbookPath),
        sourceNote: record.sourceNote,
      },
    })

    existingKeys.add(key)
    created += 1

    if (created % 100 === 0) {
      console.log(`Imported ${created} CRSP records...`)
    }
  }

  console.log(`CRSP import complete: ${created} records added.`)
}

seedCrsp().catch((error) => {
  console.error(error)
  process.exitCode = 1
})