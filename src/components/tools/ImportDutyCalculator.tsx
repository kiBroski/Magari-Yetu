'use client'

import React, { useState, useEffect } from 'react'
import { calculateImportDuty, DutyBreakdown, Category, FuelType } from '@/lib/dutyCalculator'

interface CrspItem {
  id: string
  make: string
  model: string
  variant?: string
  category: Category
  crspValueKes: number
  verified?: boolean
}

export const ImportDutyCalculator: React.FC = () => {
  const currentYear = new Date().getFullYear()

  // Input states
  const [selectedCrspId, setSelectedCrspId] = useState<string>('')
  const [crspList, setCrspList] = useState<CrspItem[]>([])
  const [crspSearch, setCrspSearch] = useState('')
  const [crspLoading, setCrspLoading] = useState(false)
  const [customCrsp, setCustomCrsp] = useState<number>(2500000)
  const [yearOfManufacture, setYearOfManufacture] = useState<number>(currentYear - 7)
  const [engineCc, setEngineCc] = useState<number>(1800)
  const [fuelType, setFuelType] = useState<FuelType>('petrol')
  const [category, setCategory] = useState<Category>('car')

  // Search the CRSP database server-side so the browser never loads thousands
  // of vehicle options into a single select element.
  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        setCrspLoading(true)
        const query = crspSearch.trim() ? `&q=${encodeURIComponent(crspSearch.trim())}` : ''
        const res = await fetch(`/api/crsp-schedule?limit=30${query}`, { signal: controller.signal })
        const data = await res.json()
        if (data.docs) setCrspList(data.docs)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error('Failed to load CRSP schedule options', err)
      } finally {
        setCrspLoading(false)
      }
    }, 250)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [crspSearch])

  // Update input parameters when a pre-seeded CRSP vehicle is selected
  const handleVehicleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    setSelectedCrspId(id)
    const matched = crspList.find((item) => item.id === id)
    if (matched) {
      setCustomCrsp(matched.crspValueKes)
      setCategory(matched.category)
    }
  }

  // Calculate live breakdown on every render state change
  const breakdown: DutyBreakdown = calculateImportDuty({
    crspKes: customCrsp,
    yearOfManufacture,
    engineCc,
    fuelType,
    category,
  })

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-4">KRA Vehicle Import Duty Calculator</h2>

      {/* Searchable database lookup */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Search Vehicle (CRSP Database):
        </label>
        <input
          type="search"
          value={crspSearch}
          onChange={(e) => setCrspSearch(e.target.value)}
          placeholder="Search make, model or variant, e.g. Toyota Vitz"
          className="mb-2 w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
        <select
          value={selectedCrspId}
          onChange={handleVehicleSelect}
          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        >
          <option value="">{crspLoading ? 'Searching CRSP records...' : '-- Manual Entry / Custom Lookup --'}</option>
          {crspList.map((item) => (
            <option key={item.id} value={item.id}>
              {item.make} {item.model} {item.variant ? `(${item.variant})` : ''} — KES {item.crspValueKes.toLocaleString()}{item.verified ? '' : ' (estimate)'}
            </option>
          ))}
        </select>
      </div>

      {/* Manual Input Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">CRSP Value (KES):</label>
          <input
            type="number"
            value={customCrsp}
            onChange={(e) => setCustomCrsp(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Year of Manufacture:</label>
          <select
            value={yearOfManufacture}
            onChange={(e) => setYearOfManufacture(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white focus:ring-amber-500 focus:border-amber-500"
          >
            {Array.from({ length: 8 }, (_, i) => currentYear - i).map((yr) => (
              <option key={yr} value={yr}>
                {yr} ({currentYear - yr} yrs old)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Category:</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="car">Car / SUV / Station Wagon</option>
            <option value="pickup-van">Pickup / Van / Mini-bus</option>
            <option value="truck">Truck / Lorry</option>
            <option value="bus">Bus / Large Passenger Vehicle</option>
            <option value="motorcycle">Motorbike / Motorcycle</option>
            <option value="tuk-tuk">Tuktuk (Three-Wheeler)</option>
            <option value="trailer">Trailer / Semi-Trailer</option>
            <option value="heavy-machinery">Heavy Machinery / Grader / Excavator</option>
            <option value="spare-parts">Vehicle Parts & Accessories</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Engine Capacity (CC):</label>
          <input
            type="number"
            value={engineCc}
            disabled={category === 'heavy-machinery' || category === 'trailer' || category === 'spare-parts'}
            onChange={(e) => setEngineCc(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Fuel Type:</label>
          <select
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value as FuelType)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="hybrid">Hybrid</option>
            <option value="electric">Electric</option>
          </select>
        </div>
      </div>

      <hr className="my-6 border-gray-200" />

      {/* Live Calculation Output */}
      <h3 className="text-base font-bold text-gray-900 mb-3">Estimated Taxes & Landed Cost Breakdown</h3>
      
      <div className="space-y-2 text-sm text-gray-700">
        <div className="flex justify-between py-1">
          <span>Age Depreciation ({(breakdown.depreciationRate * 100).toFixed(0)}%):</span>
          <span className="font-semibold text-red-600">- KES {(breakdown.crspKes - breakdown.customsValueKes).toLocaleString()}</span>
        </div>

        <div className="flex justify-between py-1">
          <span>Customs Value (Depreciated):</span>
          <span className="font-semibold text-gray-900">KES {breakdown.customsValueKes.toLocaleString()}</span>
        </div>

        <div className="flex justify-between py-1">
          <span>Import Duty ({(breakdown.importDutyRate * 100).toFixed(0)}%):</span>
          <span>KES {breakdown.importDutyKes.toLocaleString()}</span>
        </div>

        <div className="flex justify-between py-1">
          <span>Excise Duty ({(breakdown.exciseRate * 100).toFixed(0)}%):</span>
          <span>KES {breakdown.exciseDutyKes.toLocaleString()}</span>
        </div>

        <div className="flex justify-between py-1">
          <span>VAT ({(breakdown.vatRate * 100).toFixed(0)}%):</span>
          <span>KES {breakdown.vatKes.toLocaleString()}</span>
        </div>

        <div className="flex justify-between py-1">
          <span>IDF (2.5%) & RDL (2.0%):</span>
          <span>KES {(breakdown.idfKes + breakdown.rdlKes).toLocaleString()}</span>
        </div>

        <div className="flex justify-between pt-3 border-t border-gray-900 font-bold text-base text-gray-900">
          <span>Total KRA Taxes:</span>
          <span>KES {breakdown.totalTaxesKes.toLocaleString()}</span>
        </div>

        <div className="flex justify-between py-1 text-xs text-gray-500">
          <span>Port, Clearing & Registration (Est.):</span>
          <span>KES {(breakdown.estimatedNtsaRegistrationKes + breakdown.estimatedPortAndClearingKes).toLocaleString()}</span>
        </div>

        <div className="flex justify-between pt-2 border-t border-gray-300 font-bold text-lg text-amber-600">
          <span>Total Landed Cost Above Purchase:</span>
          <span>KES {breakdown.estimatedLandedCostAboveCrspKes.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

export default ImportDutyCalculator