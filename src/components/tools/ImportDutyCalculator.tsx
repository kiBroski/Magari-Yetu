'use client'

import React, { useState, useEffect } from 'react'
import {
  calculateImportDuty,
  DutyBreakdown,
  Category,
  FuelType,
} from '@/lib/dutyCalculator'

interface CrspItem {
  id: string | number
  make: string
  model: string
  modelNumber?: string | null
  transmission?: string | null
  driveConfiguration?: string | null
  engineCapacityText?: string | null
  engineCc?: number | null
  bodyType?: string | null
  gvwKg?: number | null
  seatingCapacity?: number | null
  fuelType?: string | null
  sourceGroup:
    | 'motor-vehicle'
    | 'motorcycle'
    | 'tractor-grader'
  crspValueKes: number
  verified?: boolean
}

export interface SelectedCrspVehicle {
  id: string | number
  make: string
  model: string
  modelNumber?: string | null
  transmission?: string | null
  driveConfiguration?: string | null
  engineCapacityText?: string | null
  engineCc?: number | null
  bodyType?: string | null
  gvwKg?: number | null
  seatingCapacity?: number | null
  fuelType?: string | null
  sourceGroup:
    | 'motor-vehicle'
    | 'motorcycle'
    | 'tractor-grader'
  crspValueKes: number
  verified?: boolean
  sourceNote?: string | null
}

interface ImportDutyCalculatorProps {
  selectedCrsp?: SelectedCrspVehicle | null
  hideCrspLookup?: boolean
}

const DUTY_CATEGORIES: Category[] = [
  'car',
  'motorcycle',
  'tractor',
  'heavy-machinery',
  'pickup-van',
  'truck',
  'bus',
  'trailer',
  'tuk-tuk',
  'spare-parts',
]

const FUEL_TYPES: FuelType[] = [
  'petrol',
  'diesel',
  'hybrid',
  'electric',
]

function sourceGroupToCategory(
  sourceGroup: SelectedCrspVehicle['sourceGroup'],
  bodyType?: string | null,
): Category {
  switch (sourceGroup) {
    case 'motorcycle':
      return 'motorcycle'

    case 'tractor-grader':
      return 'heavy-machinery'

    case 'motor-vehicle': {
      const body = (bodyType ?? '').toLowerCase()

      if (
        body.includes('truck') ||
        body.includes('lorry')
      ) {
        return 'truck'
      }

      if (body.includes('bus')) {
        return 'bus'
      }

      if (
        body.includes('pickup') ||
        body.includes('pick-up') ||
        body.includes('van') ||
        body.includes('minibus') ||
        body.includes('mini bus') ||
        body.includes('mini-bus')
      ) {
        return 'pickup-van'
      }

      return 'car'
    }

    default:
      return 'car'
  }
}

function normalizeFuelType(
  fuelType?: string | null,
): FuelType | null {
  if (!fuelType) return null

  const fuel = fuelType.trim().toLowerCase()

  if (
    fuel === 'petrol' ||
    fuel === 'gasoline' ||
    fuel === 'gas'
  ) {
    return 'petrol'
  }

  if (
    fuel === 'diesel' ||
    fuel === 'deisel'
  ) {
    return 'diesel'
  }

  if (
    fuel === 'hybrid' ||
    fuel.includes('hybrid')
  ) {
    return 'hybrid'
  }

  if (
    fuel === 'electric' ||
    fuel === 'ev' ||
    fuel === 'e'
  ) {
    return 'electric'
  }

  return null
}

export const ImportDutyCalculator: React.FC<
  ImportDutyCalculatorProps
> = ({
  selectedCrsp,
  hideCrspLookup = false,
}) => {
  const currentYear = new Date().getFullYear()

  // Input states
  const [selectedCrspId, setSelectedCrspId] =
    useState<string>('')
  const [crspList, setCrspList] =
    useState<CrspItem[]>([])
  const [crspSearch, setCrspSearch] =
    useState('')
  const [crspLoading, setCrspLoading] =
    useState(false)
  const [customCrsp, setCustomCrsp] =
    useState<number>(2500000)
  const [yearOfManufacture, setYearOfManufacture] =
    useState<number>(currentYear - 7)
  const [engineCc, setEngineCc] =
    useState<number>(1800)
  const [fuelType, setFuelType] =
    useState<FuelType>('petrol')
  const [category, setCategory] =
    useState<Category>('car')

  // A CRSP selection is the authoritative reference
  // for this calculation.
  useEffect(() => {
    if (!selectedCrsp) return

    setSelectedCrspId(String(selectedCrsp.id))
    setCustomCrsp(selectedCrsp.crspValueKes)

    setCategory(
      sourceGroupToCategory(
        selectedCrsp.sourceGroup,
        selectedCrsp.bodyType,
      ),
    )

    if (
      selectedCrsp.engineCc &&
      selectedCrsp.engineCc > 0
    ) {
      setEngineCc(selectedCrsp.engineCc)
    }

    const normalizedFuel = normalizeFuelType(
      selectedCrsp.fuelType,
    )

    if (normalizedFuel) {
      setFuelType(normalizedFuel)
    }
  }, [selectedCrsp])

  // Search the CRSP database server-side.
  useEffect(() => {
    const controller = new AbortController()

    const timer = window.setTimeout(async () => {
      try {
        setCrspLoading(true)

        const query = crspSearch.trim()
          ? `&q=${encodeURIComponent(
              crspSearch.trim(),
            )}`
          : ''

        const res = await fetch(
          `/api/crsp-schedule?limit=30${query}`,
          {
            signal: controller.signal,
          },
        )

        if (!res.ok) {
          throw new Error(
            `CRSP request failed: ${res.status}`,
          )
        }

        const data = await res.json()

        if (Array.isArray(data.docs)) {
          setCrspList(data.docs)
        } else {
          setCrspList([])
        }
      } catch (err) {
        if (
          (err as Error).name !== 'AbortError'
        ) {
          console.error(
            'Failed to load CRSP schedule options',
            err,
          )
        }
      } finally {
        setCrspLoading(false)
      }
    }, 250)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [crspSearch])

  // Update calculator inputs when a vehicle is selected
  // from the calculator's own CRSP lookup.
  const handleVehicleSelect = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const id = e.target.value

    setSelectedCrspId(id)

    const matched = crspList.find(
      (item) => String(item.id) === id,
    )

    if (!matched) return

    setCustomCrsp(matched.crspValueKes)

    setCategory(
      sourceGroupToCategory(
        matched.sourceGroup,
        matched.bodyType,
      ),
    )

    if (
      matched.engineCc &&
      matched.engineCc > 0
    ) {
      setEngineCc(matched.engineCc)
    }

    const normalizedFuel = normalizeFuelType(
      matched.fuelType,
    )

    if (normalizedFuel) {
      setFuelType(normalizedFuel)
    }
  }

  // Calculate live breakdown on every render/state change.
  const breakdown: DutyBreakdown =
    calculateImportDuty({
      crspKes: customCrsp,
      yearOfManufacture,
      engineCc,
      fuelType,
      category,
    })

  return (
    <div
      className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-sm"
      style={{ colorScheme: 'light' }}
    >
      <h2 className="mb-4 text-xl font-bold text-gray-900">
        KRA Vehicle Import Duty Calculator
      </h2>

      {/* Searchable database lookup */}
      {!hideCrspLookup && (
        <div className="mb-5">
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Search Vehicle (CRSP Database):
          </label>

          <input
            type="search"
            value={crspSearch}
            onChange={(e) =>
              setCrspSearch(e.target.value)
            }
            placeholder="Search make or model, e.g. Toyota Vitz"
            className="mb-2 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
          />

          <select
            value={selectedCrspId}
            onChange={handleVehicleSelect}
            className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
          >
            <option value="">
              {crspLoading
                ? 'Searching CRSP records...'
                : '-- Manual Entry / Custom Lookup --'}
            </option>

            {crspList.map((item) => (
              <option
                key={item.id}
                value={String(item.id)}
              >
                {item.make} {item.model}
                {item.modelNumber
                  ? ` (${item.modelNumber})`
                  : ''}
                {' — KES '}
                {item.crspValueKes.toLocaleString()}
                {item.verified
                  ? ''
                  : ' (estimate)'}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Selected CRSP reference */}
      {selectedCrsp && (
        <div className="mb-5 rounded-lg border border-stamp/30 bg-stamp/5 px-4 py-3 text-sm text-ink">
          Using the CRSP reference for{' '}
          <strong>
            {selectedCrsp.make}{' '}
            {selectedCrsp.model}
            {selectedCrsp.modelNumber
              ? ` ${selectedCrsp.modelNumber}`
              : ''}
          </strong>
          :{' '}
          <strong>
            KES{' '}
            {selectedCrsp.crspValueKes.toLocaleString()}
          </strong>
          .
        </div>
      )}

      {/* Manual Input Controls */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            CRSP Value (KES):
          </label>

          <input
            type="number"
            value={customCrsp}
            onChange={(e) =>
              setCustomCrsp(
                Number(e.target.value),
              )
            }
            className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 focus:border-amber-500 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Year of Manufacture:
          </label>

          <select
            value={yearOfManufacture}
            onChange={(e) =>
              setYearOfManufacture(
                Number(e.target.value),
              )
            }
            className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm focus:border-amber-500 focus:ring-amber-500"
          >
            {Array.from(
              { length: 8 },
              (_, i) => currentYear - i,
            ).map((yr) => (
              <option
                key={yr}
                value={yr}
              >
                {yr} ({currentYear - yr}{' '}
                yrs old)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Category:
          </label>

          <select
            value={category}
            onChange={(e) =>
              setCategory(
                e.target.value as Category,
              )
            }
            className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm focus:border-amber-500 focus:ring-amber-500"
          >
            <option value="car">
              Car / SUV / Station Wagon
            </option>
            <option value="pickup-van">
              Pickup / Van / Mini-bus
            </option>
            <option value="truck">
              Truck / Lorry
            </option>
            <option value="bus">
              Bus / Large Passenger Vehicle
            </option>
            <option value="motorcycle">
              Motorbike / Motorcycle
            </option>
            <option value="tuk-tuk">
              Tuktuk (Three-Wheeler)
            </option>
            <option value="trailer">
              Trailer / Semi-Trailer
            </option>
            <option value="heavy-machinery">
              Heavy Machinery / Grader / Excavator
            </option>
            <option value="spare-parts">
              Vehicle Parts & Accessories
            </option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Engine Capacity (CC):
          </label>

          <input
            type="number"
            value={engineCc}
            disabled={
              category === 'heavy-machinery' ||
              category === 'trailer' ||
              category === 'spare-parts'
            }
            onChange={(e) =>
              setEngineCc(
                Number(e.target.value),
              )
            }
            className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 disabled:bg-gray-100 disabled:text-gray-400 focus:border-amber-500 focus:ring-amber-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Fuel Type:
          </label>

          <select
            value={fuelType}
            onChange={(e) =>
              setFuelType(
                e.target.value as FuelType,
              )
            }
            className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm focus:border-amber-500 focus:ring-amber-500"
          >
            <option value="petrol">
              Petrol
            </option>
            <option value="diesel">
              Diesel
            </option>
            <option value="hybrid">
              Hybrid
            </option>
            <option value="electric">
              Electric
            </option>
          </select>
        </div>
      </div>

      <hr className="my-6 border-gray-200" />

      {/* Live Calculation Output */}
      <h3 className="mb-3 text-base font-bold text-gray-900">
        Estimated Taxes & Landed Cost Breakdown
      </h3>

      <div className="space-y-2 text-sm text-gray-700">
        <div className="flex justify-between py-1">
          <span>
            Age Depreciation (
            {(breakdown.depreciationRate * 100).toFixed(
              0,
            )}
            %):
          </span>

          <span className="font-semibold text-red-600">
            - KES{' '}
            {(
              breakdown.crspKes -
              breakdown.customsValueKes
            ).toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between py-1">
          <span>
            Customs Value (Depreciated):
          </span>

          <span className="font-semibold text-gray-900">
            KES{' '}
            {breakdown.customsValueKes.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between py-1">
          <span>
            Import Duty (
            {(breakdown.importDutyRate * 100).toFixed(
              0,
            )}
            %):
          </span>

          <span>
            KES{' '}
            {breakdown.importDutyKes.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between py-1">
          <span>
            Excise Duty (
            {(breakdown.exciseRate * 100).toFixed(
              0,
            )}
            %):
          </span>

          <span>
            KES{' '}
            {breakdown.exciseDutyKes.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between py-1">
          <span>
            VAT (
            {(breakdown.vatRate * 100).toFixed(0)}
            %):
          </span>

          <span>
            KES{' '}
            {breakdown.vatKes.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between py-1">
          <span>
            IDF (2.5%) & RDL (2.0%):
          </span>

          <span>
            KES{' '}
            {(
              breakdown.idfKes +
              breakdown.rdlKes
            ).toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between border-t border-gray-900 pt-3 text-base font-bold text-gray-900">
          <span>Total KRA Taxes:</span>

          <span>
            KES{' '}
            {breakdown.totalTaxesKes.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between py-1 text-xs text-gray-500">
          <span>
            Port, Clearing & Registration (Est.):
          </span>

          <span>
            KES{' '}
            {(
              breakdown.estimatedNtsaRegistrationKes +
              breakdown.estimatedPortAndClearingKes
            ).toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between border-t border-gray-300 pt-2 text-lg font-bold text-amber-600">
          <span>
            Total Landed Cost Above Purchase:
          </span>

          <span>
            KES{' '}
            {breakdown.estimatedLandedCostAboveCrspKes.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ImportDutyCalculator