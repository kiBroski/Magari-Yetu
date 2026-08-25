// KRA taxes an imported used vehicle on its *Current Retail Selling Price*
// (CRSP) — an official reference value for that make/model/trim — reduced
// by an age-based depreciation, NOT on whatever you actually paid for it.
//
// This calculator accounts for vehicle classification under EACCMA & Kenya Excise Duty Act rules:
// - Standard Motor Vehicles (Cars, Pickups, Vans, Trucks, Buses): 35% Import Duty, variable Excise Duty.
// - Motorcycles / Tuk-Tuks: 25% Import Duty, 15% Excise Duty.
// - Agricultural Tractors: 0% Import Duty, 0% Excise Duty (EACCMA duty-free status).
// - Heavy Machinery & Graders: 0% Import Duty, 0% Excise Duty.

export type Category =
  | 'car'
  | 'motorcycle'
  | 'tractor'
  | 'heavy-machinery'
  | 'pickup-van'
  | 'truck'
  | 'bus'
  | 'trailer'
  | 'tuk-tuk'
  | 'spare-parts'

export type FuelType = 'petrol' | 'diesel' | 'hybrid' | 'electric'

export interface DutyInput {
  crspKes: number
  yearOfManufacture: number
  engineCc?: number
  fuelType?: FuelType
  category?: Category
}

export interface DutyBreakdown {
  crspKes: number
  ageYears: number
  depreciationRate: number
  customsValueKes: number
  importDutyRate: number
  importDutyKes: number
  exciseRate: number
  exciseDutyKes: number
  vatRate: number
  vatKes: number
  idfKes: number
  rdlKes: number
  totalTaxesKes: number
  estimatedNtsaRegistrationKes: number
  estimatedPortAndClearingKes: number
  estimatedLandedCostAboveCrspKes: number
}

// KRA depreciation curve for direct imports by age at time of import.
// Kenya caps motor vehicle imports at 8 years old from first registration.
const DEPRECIATION_BY_AGE: { maxAgeYears: number; rate: number }[] = [
  { maxAgeYears: 1, rate: 0.05 },
  { maxAgeYears: 2, rate: 0.10 },
  { maxAgeYears: 3, rate: 0.15 },
  { maxAgeYears: 4, rate: 0.20 },
  { maxAgeYears: 5, rate: 0.30 },
  { maxAgeYears: 6, rate: 0.40 },
  { maxAgeYears: 7, rate: 0.50 },
  { maxAgeYears: 8, rate: 0.65 },
]

export const STANDARD_IMPORT_DUTY_RATE = 0.35
export const MOTORCYCLE_IMPORT_DUTY_RATE = 0.25
export const VAT_RATE = 0.16
export const IDF_RATE = 0.025
export const IDF_MIN_KES = 5000
export const RDL_RATE = 0.02
export const NTSA_REGISTRATION_KES = 13800
export const PORT_AND_CLEARING_ESTIMATE_KES = 160800

function importDutyRateFor(category?: Category): number {
  if (category === 'tractor' || category === 'heavy-machinery') return 0.0
  if (category === 'motorcycle' || category === 'tuk-tuk') return MOTORCYCLE_IMPORT_DUTY_RATE
  return STANDARD_IMPORT_DUTY_RATE
}

function exciseRateFor(engineCc: number = 0, fuelType: FuelType = 'petrol', category?: Category): number {
  if (category === 'tractor' || category === 'heavy-machinery' || category === 'trailer') return 0.0
  if (category === 'motorcycle' || category === 'tuk-tuk') return 0.15

  if (fuelType === 'electric') return 0.10
  if (fuelType === 'hybrid') return engineCc > 1500 ? 0.20 : 0.15

  // Standard petrol / diesel bands for passenger & commercial motor vehicles
  if (engineCc <= 1500) return 0.20
  if (engineCc <= 3000) return 0.25
  return 0.35
}

function depreciationFor(ageYears: number): number {
  const band = DEPRECIATION_BY_AGE.find((b) => ageYears <= b.maxAgeYears)
  return band ? band.rate : DEPRECIATION_BY_AGE[DEPRECIATION_BY_AGE.length - 1].rate
}

export function calculateImportDuty(input: DutyInput): DutyBreakdown {
  const currentYear = new Date().getFullYear()
  const ageYears = Math.max(0, currentYear - input.yearOfManufacture)
  const depreciationRate = depreciationFor(ageYears)

  const customsValueKes = Math.round(input.crspKes * (1 - depreciationRate))
  
  const importDutyRate = importDutyRateFor(input.category)
  const importDutyKes = Math.round(customsValueKes * importDutyRate)

  const exciseRate = exciseRateFor(input.engineCc ?? 0, input.fuelType ?? 'petrol', input.category)
  const exciseDutyKes = Math.round((customsValueKes + importDutyKes) * exciseRate)

  const vatKes = Math.round((customsValueKes + importDutyKes + exciseDutyKes) * VAT_RATE)
  const idfKes = Math.max(Math.round(customsValueKes * IDF_RATE), IDF_MIN_KES)
  const rdlKes = Math.round(customsValueKes * RDL_RATE)

  const totalTaxesKes = importDutyKes + exciseDutyKes + vatKes + idfKes + rdlKes

  return {
    crspKes: input.crspKes,
    ageYears,
    depreciationRate,
    customsValueKes,
    importDutyRate,
    importDutyKes,
    exciseRate,
    exciseDutyKes,
    vatRate: VAT_RATE,
    vatKes,
    idfKes,
    rdlKes,
    totalTaxesKes,
    estimatedNtsaRegistrationKes: NTSA_REGISTRATION_KES,
    estimatedPortAndClearingKes: PORT_AND_CLEARING_ESTIMATE_KES,
    estimatedLandedCostAboveCrspKes: totalTaxesKes + NTSA_REGISTRATION_KES + PORT_AND_CLEARING_ESTIMATE_KES,
  }
}