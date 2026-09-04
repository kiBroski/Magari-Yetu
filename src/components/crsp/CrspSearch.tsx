'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

type CrspRecord = {
  id: number
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
  sourceGroup:
    | 'motor-vehicle'
    | 'motorcycle'
    | 'tractor-grader'
  crspValueKes: number
  verified: boolean
  sourceNote: string | null
  updatedAt: string
  createdAt: string
}

type CrspResponse = {
  docs: CrspRecord[]
  hasNextPage: boolean
  hasPrevPage: boolean
  limit: number
  nextPage: number | null
  page: number
  pagingCounter: number
  prevPage: number | null
  totalDocs: number
  totalPages: number
}

type CrspSearchProps = {
  initialLimit?: number
  showFilters?: boolean
  onSelect?: (record: CrspRecord) => void
}

const DEFAULT_LIMIT = 10

function formatKes(value: number) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value)
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function displayValue(
  value: string | number | null | undefined,
) {
  if (value === null || value === undefined) return null

  const text = String(value).trim()

  return text || null
}

function displayFuel(value: string | null) {
  if (!value) return null

  const normalized = value.toLowerCase()

  if (normalized === 'petrol') return 'Petrol'
  if (normalized === 'diesel') return 'Diesel'
  if (normalized === 'hybrid') return 'Hybrid'
  if (normalized === 'electric') return 'Electric'

  return titleCase(value)
}

function displaySourceGroup(
  value: CrspRecord['sourceGroup'],
) {
  if (value === 'motor-vehicle') {
    return 'Motor Vehicle'
  }

  if (value === 'motorcycle') {
    return 'Motorcycle'
  }

  if (value === 'tractor-grader') {
    return 'Tractor & Grader'
  }

  return '—'
}

export default function CrspSearch({
  initialLimit = DEFAULT_LIMIT,
  showFilters = true,
  onSelect,
}: CrspSearchProps) {
  const [query, setQuery] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [sourceGroup, setSourceGroup] = useState('')
  const [verified, setVerified] = useState('')
  const [page, setPage] = useState(1)

  const [data, setData] = useState<CrspResponse | null>(
    null,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [makeOptions, setMakeOptions] = useState<string[]>(
    [],
  )
  const [modelOptions, setModelOptions] = useState<
    string[]
  >([])

  const limit =
    initialLimit > 0
      ? Math.min(Math.floor(initialLimit), 100)
      : DEFAULT_LIMIT

  const fetchCrsp = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams()

      if (query.trim()) {
        params.set('q', query.trim())
      }

      if (make.trim()) {
        params.set('make', make.trim())
      }

      if (model.trim()) {
        params.set('model', model.trim())
      }

      if (sourceGroup) {
        params.set('sourceGroup', sourceGroup)
      }

      if (verified) {
        params.set('verified', verified)
      }

      params.set('limit', String(limit))
      params.set('page', String(page))

      const response = await fetch(
        `/api/crsp-schedule?${params.toString()}`,
        {
          method: 'GET',
          cache: 'no-store',
        },
      )

      const json = await response.json()

      if (!response.ok) {
        throw new Error(
          json?.message ||
            json?.error ||
            `Request failed with status ${response.status}`,
        )
      }

      setData(json)
    } catch (err) {
      console.error('CRSP search error:', err)

      setData(null)

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load CRSP schedule',
      )
    } finally {
      setLoading(false)
    }
  }, [
    query,
    make,
    model,
    sourceGroup,
    verified,
    page,
    limit,
  ])

  useEffect(() => {
    fetchCrsp()
  }, [fetchCrsp])

  /*
   * Load all available makes.
   *
   * The API is paginated, so we intentionally request a
   * larger page. If the CRSP schedule contains more than
   * 100 records, the make list is progressively loaded
   * from subsequent pages.
   */
  useEffect(() => {
    let cancelled = false

    async function loadMakes() {
      try {
        const firstResponse = await fetch(
          '/api/crsp-schedule?limit=100&page=1',
          {
            cache: 'no-store',
          },
        )

        if (!firstResponse.ok) return

        const firstJson: CrspResponse =
          await firstResponse.json()

        const allDocs = [...(firstJson.docs ?? [])]

        if (firstJson.totalPages > 1) {
          const requests: Promise<Response>[] = []

          for (
            let currentPage = 2;
            currentPage <= firstJson.totalPages;
            currentPage += 1
          ) {
            requests.push(
              fetch(
                `/api/crsp-schedule?limit=100&page=${currentPage}`,
                {
                  cache: 'no-store',
                },
              ),
            )
          }

          const responses = await Promise.all(requests)

          for (const response of responses) {
            if (!response.ok) continue

            const json: CrspResponse =
              await response.json()

            allDocs.push(...(json.docs ?? []))
          }
        }

        if (cancelled) return

        const makes = Array.from(
          new Set(
            allDocs
              .map((item) => item.make?.trim())
              .filter(Boolean),
          ),
        ).sort((a, b) => a.localeCompare(b))

        setMakeOptions(makes)
      } catch (err) {
        console.error(
          'Failed to load CRSP makes:',
          err,
        )
      }
    }

    loadMakes()

    return () => {
      cancelled = true
    }
  }, [])

  /*
   * Load all models belonging to the selected make.
   */
  useEffect(() => {
    if (!make) {
      setModelOptions([])
      return
    }

    let cancelled = false

    async function loadModels() {
      try {
        const firstParams = new URLSearchParams({
          make,
          limit: '100',
          page: '1',
        })

        const firstResponse = await fetch(
          `/api/crsp-schedule?${firstParams.toString()}`,
          {
            cache: 'no-store',
          },
        )

        if (!firstResponse.ok) {
          setModelOptions([])
          return
        }

        const firstJson: CrspResponse =
          await firstResponse.json()

        const allDocs = [...(firstJson.docs ?? [])]

        if (firstJson.totalPages > 1) {
          const requests: Promise<Response>[] = []

          for (
            let currentPage = 2;
            currentPage <= firstJson.totalPages;
            currentPage += 1
          ) {
            const params = new URLSearchParams({
              make,
              limit: '100',
              page: String(currentPage),
            })

            requests.push(
              fetch(
                `/api/crsp-schedule?${params.toString()}`,
                {
                  cache: 'no-store',
                },
              ),
            )
          }

          const responses = await Promise.all(requests)

          for (const response of responses) {
            if (!response.ok) continue

            const json: CrspResponse =
              await response.json()

            allDocs.push(...(json.docs ?? []))
          }
        }

        if (cancelled) return

        const models = Array.from(
          new Set(
            allDocs
              .map((item) => item.model?.trim())
              .filter(Boolean),
          ),
        ).sort((a, b) => a.localeCompare(b))

        setModelOptions(models)
      } catch (err) {
        console.error(
          'Failed to load CRSP models:',
          err,
        )

        if (!cancelled) {
          setModelOptions([])
        }
      }
    }

    loadModels()

    return () => {
      cancelled = true
    }
  }, [make])

  const showingText = useMemo(() => {
    if (!data || data.totalDocs === 0) {
      return 'No vehicles found'
    }

    const start =
      (data.page - 1) * data.limit + 1

    const end = Math.min(
      data.page * data.limit,
      data.totalDocs,
    )

    return `Showing ${start}-${end} of ${data.totalDocs}`
  }, [data])

  function handleSearch(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setPage(1)
  }

  function clearFilters() {
    setQuery('')
    setMake('')
    setModel('')
    setSourceGroup('')
    setVerified('')
    setPage(1)
  }

  function changeMake(value: string) {
    setMake(value)
    setModel('')
    setPage(1)
  }

  function changeModel(value: string) {
    setModel(value)
    setPage(1)
  }

  function changeSourceGroup(value: string) {
    setSourceGroup(value)
    setPage(1)
  }

  function goToPage(nextPage: number) {
    if (nextPage < 1) return

    if (
      data &&
      nextPage > data.totalPages
    ) {
      return
    }

    setPage(nextPage)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <section className="w-full space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <form
          onSubmit={handleSearch}
          className="space-y-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <label
                htmlFor="crsp-search"
                className="mb-1.5 block text-sm font-medium"
              >
                Search CRSP schedule
              </label>

              <input
                id="crsp-search"
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
                placeholder="e.g. Toyota Vitz, Land Cruiser, Yamaha..."
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 dark:border-gray-700 dark:bg-gray-900"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {loading
                  ? 'Searching...'
                  : 'Search'}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div>
                <label
                  htmlFor="crsp-make"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Make
                </label>

                <select
                  id="crsp-make"
                  value={make}
                  onChange={(event) =>
                    changeMake(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                >
                  <option value="">
                    All makes
                  </option>

                  {makeOptions.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {titleCase(item)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="crsp-model"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Model
                </label>

                {modelOptions.length > 0 ? (
                  <select
                    id="crsp-model"
                    value={model}
                    onChange={(event) =>
                      changeModel(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                  >
                    <option value="">
                      All models
                    </option>

                    {modelOptions.map((item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="crsp-model"
                    type="text"
                    value={model}
                    onChange={(event) => {
                      setModel(
                        event.target.value,
                      )
                      setPage(1)
                    }}
                    placeholder={
                      make
                        ? 'Enter model'
                        : 'Select make first'
                    }
                    disabled={!make}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900"
                  />
                )}
              </div>

              <div>
                <label
                  htmlFor="crsp-source-group"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Source
                </label>

                <select
                  id="crsp-source-group"
                  value={sourceGroup}
                  onChange={(event) =>
                    changeSourceGroup(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                >
                  <option value="">
                    All vehicle types
                  </option>

                  <option value="motor-vehicle">
                    Motor Vehicles
                  </option>

                  <option value="motorcycle">
                    Motorcycles
                  </option>

                  <option value="tractor-grader">
                    Tractors &amp; Graders
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="crsp-verified"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Verification
                </label>

                <select
                  id="crsp-verified"
                  value={verified}
                  onChange={(event) => {
                    setVerified(
                      event.target.value,
                    )
                    setPage(1)
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                >
                  <option value="">
                    All records
                  </option>

                  <option value="true">
                    Verified only
                  </option>

                  <option value="false">
                    Unverified only
                  </option>
                </select>
              </div>
            </div>
          )}

          {(query ||
            make ||
            model ||
            sourceGroup ||
            verified) && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium underline underline-offset-4"
            >
              Clear filters
            </button>
          )}
        </form>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
        >
          <p className="font-semibold">
            Could not load CRSP schedule
          </p>

          <p className="mt-1">
            {error}
          </p>

          <button
            type="button"
            onClick={fetchCrsp}
            className="mt-3 rounded-lg border border-current px-3 py-1.5 text-xs font-semibold"
          >
            Try again
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {showingText}
        </p>

        {loading && (
          <span className="text-sm text-gray-500">
            Loading...
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
        {data?.docs?.length ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {data.docs.map((record) => {
              const modelNumber =
                displayValue(
                  record.modelNumber,
                )

              const transmission =
                displayValue(
                  record.transmission,
                )

              const driveConfiguration =
                displayValue(
                  record.driveConfiguration,
                )

              const engineCapacityText =
                displayValue(
                  record.engineCapacityText,
                )

              const bodyType =
                displayValue(record.bodyType)

              const engineCc =
                record.engineCc !== null &&
                Number.isFinite(
                  record.engineCc,
                )
                  ? record.engineCc
                  : null

              const gvwKg =
                record.gvwKg !== null &&
                Number.isFinite(record.gvwKg)
                  ? record.gvwKg
                  : null

              const seatingCapacity =
                record.seatingCapacity !== null &&
                Number.isFinite(
                  record.seatingCapacity,
                )
                  ? record.seatingCapacity
                  : null

              const fuelType =
                displayFuel(record.fuelType)

              return (
                <button
                  key={record.id}
                  type="button"
                  onClick={() =>
                    onSelect?.(record)
                  }
                  className={`block w-full text-left transition ${
                    onSelect
                      ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900'
                      : 'cursor-default'
                  }`}
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold">
                              {record.make}{' '}
                              {record.model}
                            </h3>

                            {record.verified && (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                                Verified
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 sm:text-right">
                          <p className="text-lg font-bold">
                            {formatKes(
                              record.crspValueKes,
                            )}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            CRSP value
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-900/60 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Model number
                          </p>

                          <p className="mt-1 font-medium text-gray-800 dark:text-gray-200">
                            {modelNumber ?? '—'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Source
                          </p>

                          <p className="mt-1 font-medium text-gray-800 dark:text-gray-200">
                            {displaySourceGroup(
                              record.sourceGroup,
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Engine
                          </p>

                          <p className="mt-1 font-medium text-gray-800 dark:text-gray-200">
                            {engineCapacityText ??
                              (engineCc !== null
                                ? `${engineCc.toLocaleString()} cc`
                                : '—')}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Fuel
                          </p>

                          <p className="mt-1 font-medium text-gray-800 dark:text-gray-200">
                            {fuelType ?? '—'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Transmission
                          </p>

                          <p className="mt-1 font-medium text-gray-800 dark:text-gray-200">
                            {transmission ?? '—'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Drive
                          </p>

                          <p className="mt-1 font-medium text-gray-800 dark:text-gray-200">
                            {driveConfiguration ??
                              '—'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Body type
                          </p>

                          <p className="mt-1 font-medium text-gray-800 dark:text-gray-200">
                            {bodyType ?? '—'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Seating
                          </p>

                          <p className="mt-1 font-medium text-gray-800 dark:text-gray-200">
                            {seatingCapacity !== null
                              ? seatingCapacity
                              : '—'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            GVW
                          </p>

                          <p className="mt-1 font-medium text-gray-800 dark:text-gray-200">
                            {gvwKg !== null
                              ? `${gvwKg.toLocaleString()} kg`
                              : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="p-10 text-center">
            {loading ? (
              <p className="text-sm text-gray-500">
                Loading CRSP records...
              </p>
            ) : (
              <>
                <p className="font-semibold">
                  No CRSP records found
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Try a different search or clear the
                  filters.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <button
            type="button"
            disabled={
              !data.hasPrevPage || loading
            }
            onClick={() =>
              goToPage(data.page - 1)
            }
            className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            ← Previous
          </button>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {data.page}
            </span>{' '}
            of {data.totalPages}
          </div>

          <button
            type="button"
            disabled={
              !data.hasNextPage || loading
            }
            onClick={() =>
              goToPage(data.page + 1)
            }
            className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            Next →
          </button>
        </div>
      )}
    </section>
  )
}