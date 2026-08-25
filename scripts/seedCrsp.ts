import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'
import config from '../payload.config'
import xlsx from 'xlsx'
import type { Category } from '../src/lib/dutyCalculator'

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

async function seedCrsp() {
  const payload = await getPayload({ config })
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
  const workbookCandidates = [
    path.resolve(scriptDirectory, '..', 'crsp.xlsx'),
    path.resolve(scriptDirectory, 'crsp.xlsx'),
  ]
  let created = 0

  const records: Array<readonly [string, string, string, Category, number, string?]> = []
  let workbookPath: string | undefined
  for (const candidate of workbookCandidates) {
    if (!fs.existsSync(candidate) || fs.statSync(candidate).size < 1024) continue
    try {
      const workbook = xlsx.readFile(candidate)
      workbookPath = candidate
      for (const sheetName of workbook.SheetNames) {
        const matrix = xlsx.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, defval: '' })
        const headerIndex = matrix.findIndex((row) => {
          const headers = row.map((cell) => String(cell).trim().toLowerCase())
          return headers.includes('make') && headers.includes('model')
        })
        if (headerIndex < 0) continue

        const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
          range: headerIndex,
          defval: '',
        })
        for (const row of rows) {
          const make = String(row.MAKE ?? row.Make ?? '').trim()
          const model = String(row.MODEL ?? row.Model ?? '').trim()
          const variant = String(row.VARIANT ?? row['Model number'] ?? row.Description ?? '').trim()
          const crspValueKes = Number(row.CRSP ?? row['CRSP (KES)'] ?? row['CRSP (KES.)'])
          if (!make || !model || !Number.isFinite(crspValueKes) || crspValueKes <= 0) continue

          const sheet = sheetName.toLowerCase()
          const category: Category = sheet.includes('motorcycle') || sheet.includes('motor cycle')
            ? 'motorcycle'
            : sheet.includes('tractor')
              ? 'tractor'
              : sheet.includes('tuk')
                ? 'tuk-tuk'
                : sheet.includes('truck')
                  ? 'truck'
                  : sheet.includes('machine') || sheet.includes('equipment')
                    ? 'heavy-machinery'
                    : 'car'
          records.push([make, model, variant, category, crspValueKes, `Official KRA CRSP July 2025 - Imported from ${path.basename(workbookPath)} - Sheet: ${sheetName}`])
        }
      }
      if (records.length > 0) console.log(`Using CRSP workbook: ${workbookPath}`)
      if (records.length > 0) break
    } catch (error) {
      console.warn(`Could not read CRSP workbook ${candidate}: ${error instanceof Error ? error.message : error}`)
    }
  }

  if (records.length === 0) {
    console.warn('No readable CRSP workbook found; using the development starter catalog.')
    records.push(...STARTER_CATALOG)
  }

  const existing = await payload.find({ collection: 'crsp-schedule', limit: 10000, depth: 0 })
  const existingKeys = new Set(existing.docs.map((doc) => `${doc.make}|${doc.model}|${doc.variant ?? ''}`))

  for (const [make, model, variant, category, crspValueKes, sourceNote] of records) {
    const key = `${make}|${model}|${variant}`
    if (existingKeys.has(key)) continue

    await payload.create({
      collection: 'crsp-schedule',
      data: {
        make,
        model,
        variant,
        category,
        crspValueKes,
        verified: Boolean(workbookPath),
        sourceNote: sourceNote ?? 'Starter estimate for development only. Replace with the official KRA CRSP schedule before launch.',
      },
    })
    existingKeys.add(key)
    created += 1
    if (created % 100 === 0) console.log(`Imported ${created} CRSP records...`)
  }

  console.log(`CRSP import complete: ${created} records added.`)
}

seedCrsp().catch((error) => {
  console.error(error)
  process.exitCode = 1
})