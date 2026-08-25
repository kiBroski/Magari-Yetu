'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// Design decision: a person can fill in every field of their listing —
// category, spec, photos, price, description — without ever hitting a login
// wall. Only the final "Publish" action checks auth, and if they're not
// logged in it drops a lightweight inline register/login step right there
// rather than bouncing them off to a separate page and losing their draft.
// This matches how Jiji and PigiaMe both behave, and it exists because the
// alternative — "create an account before you can even start" — is exactly
// the kind of friction that makes people abandon a listing three fields in.

const STEPS = ['Category', 'Details', 'Photos', 'Location & price', 'Review & publish'] as const

const CATEGORIES = [
  { value: 'car', label: 'Car' },
  { value: 'motorcycle', label: 'Motorcycle / boda' },
  { value: 'tuk-tuk', label: 'Tuk-tuk' },
  { value: 'pickup-van', label: 'Pickup / van' },
  { value: 'truck', label: 'Truck / lorry' },
  { value: 'bus', label: 'Bus / minibus' },
  { value: 'trailer', label: 'Trailer' },
  { value: 'heavy-machinery', label: 'Heavy machinery' },
  { value: 'spare-parts', label: 'Spare parts & accessories' },
]

const CONDITIONS = [
  { value: 'brand-new', label: 'Brand new' },
  { value: 'locally-assembled', label: 'Locally assembled' },
  { value: 'foreign-used', label: 'Foreign used (import)' },
  { value: 'locally-used', label: 'Locally used' },
]

const COUNTIES = ['Nairobi', 'Mombasa', 'Kiambu', 'Nakuru', 'Uasin Gishu', 'Kisumu', 'Machakos', 'Kajiado', 'Kilifi', 'Meru', 'Nyeri', 'Other']

interface FormState {
  category: string
  condition: string
  title: string
  make: string
  model: string
  yearOfManufacture: string
  transmission: string
  fuelType: string
  engineCc: string
  mileageKm: string
  bodyType: string
  color: string
  equipmentType: string
  operatingHours: string
  capacityOrTonnage: string
  partType: string
  compatibleModels: string
  partCondition: string
  dutyStatus: string
  description: string
  county: string
  town: string
  price: string
  negotiable: boolean
}

const EMPTY_FORM: FormState = {
  category: '', condition: '', title: '', make: '', model: '', yearOfManufacture: '',
  transmission: '', fuelType: '', engineCc: '', mileageKm: '', bodyType: '', color: '',
  equipmentType: '', operatingHours: '', capacityOrTonnage: '',
  partType: '', compatibleModels: '', partCondition: '', dutyStatus: '',
  description: '', county: '', town: '', price: '', negotiable: true,
}

export function SellWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [files, setFiles] = useState<File[]>([])
  const [user, setUser] = useState<{ id: string; role: string } | null | undefined>(undefined) // undefined = still checking
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register')
  const [authFields, setAuthFields] = useState({ name: '', phone: '', email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/users/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null))
  }, [])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const isHeavyMachinery = form.category === 'heavy-machinery'
  const isSpareParts = form.category === 'spare-parts'
  const isImport = form.condition === 'foreign-used'

  async function ensureAuthenticated(): Promise<boolean> {
    if (user) return true
    setSubmitting(true)
    setError(null)
    try {
      if (authMode === 'register') {
        const regRes = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(authFields),
        })
        if (!regRes.ok) {
          const body = await regRes.json().catch(() => null)
          throw new Error(body?.errors?.[0]?.message ?? 'Could not create your account.')
        }
      }
      const loginRes = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: authFields.email, password: authFields.password }),
      })
      if (!loginRes.ok) throw new Error('Could not log in with those details.')
      const { user: loggedInUser } = await loginRes.json()
      setUser(loggedInUser)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.')
      return false
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePublish() {
    const authed = await ensureAuthenticated()
    if (!authed) return

    setSubmitting(true)
    setError(null)
    try {
      // 1. Upload each photo to Media individually, collecting the doc ids.
      const imageRefs: { image: string }[] = []
      for (const file of files) {
        const body = new FormData()
        body.append('file', file)
        body.append('alt', form.title || `${form.make} ${form.model}`)
        const res = await fetch('/api/media', { method: 'POST', credentials: 'include', body })
        if (!res.ok) throw new Error('One of your photos failed to upload — try again.')
        const doc = await res.json()
        imageRefs.push({ image: doc.doc.id })
      }
      if (imageRefs.length === 0) throw new Error('Add at least one photo before publishing.')

      // 2. Create the listing itself, status starts at pending-review —
      // moderators sanity-check new listings before they go live.
      const payload: Record<string, unknown> = {
        title: form.title || `${form.yearOfManufacture} ${form.make} ${form.model}`,
        category: form.category,
        condition: form.condition,
        make: form.make,
        model: form.model,
        yearOfManufacture: Number(form.yearOfManufacture),
        price: Number(form.price),
        negotiable: form.negotiable,
        description: form.description,
        county: form.county,
        town: form.town,
        images: imageRefs,
        status: 'pending-review',
      }
      if (isImport && form.dutyStatus) {
        payload.dutyStatus = form.dutyStatus
      }
      if (isHeavyMachinery) {
        Object.assign(payload, {
          heavyMachineSpecs: {
            equipmentType: form.equipmentType,
            operatingHours: form.operatingHours ? Number(form.operatingHours) : undefined,
            capacityOrTonnage: form.capacityOrTonnage,
          },
        })
      } else if (isSpareParts) {
        Object.assign(payload, {
          sparePartDetails: {
            partType: form.partType,
            compatibleModels: form.compatibleModels,
            partCondition: form.partCondition,
          },
        })
      } else {
        Object.assign(payload, {
          transmission: form.transmission,
          fuelType: form.fuelType,
          engineCc: form.engineCc ? Number(form.engineCc) : undefined,
          mileageKm: form.mileageKm ? Number(form.mileageKm) : undefined,
          bodyType: form.bodyType,
          color: form.color,
        })
      }

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => null)
        throw new Error(errBody?.errors?.[0]?.message ?? 'Could not publish your listing.')
      }
      router.push('/dashboard/listings?posted=1')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong publishing your listing.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <ol className="mb-8 flex flex-wrap gap-2 text-xs">
        {STEPS.map((label, i) => (
          <li key={label} className={`rounded-full px-3 py-1 font-medium ${i === step ? 'bg-stamp text-white' : i < step ? 'bg-matatu/10 text-matatu' : 'bg-ink-50 text-ink-400'}`}>
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {error && <p className="mb-4 rounded bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>}

      <div className="rounded-lg border border-ink-100 bg-white p-6">
        {step === 0 && (
          <fieldset className="space-y-4">
            <legend className="font-display text-lg font-semibold text-ink">What are you listing?</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CATEGORIES.map((c) => (
                <button key={c.value} type="button" onClick={() => update('category', c.value)}
                  className={`rounded border px-3 py-3 text-sm ${form.category === c.value ? 'border-stamp bg-stamp/10 text-stamp-dark' : 'border-ink-100 text-ink-400'}`}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CONDITIONS.map((c) => (
                <button key={c.value} type="button" onClick={() => update('condition', c.value)}
                  className={`rounded border px-3 py-3 text-sm ${form.condition === c.value ? 'border-stamp bg-stamp/10 text-stamp-dark' : 'border-ink-100 text-ink-400'}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {step === 1 && (
          <fieldset className="space-y-4">
            <legend className="font-display text-lg font-semibold text-ink">Details</legend>
            <Field label="Listing title (optional — we can generate one)"><input value={form.title} onChange={(e) => update('title', e.target.value)} className={inputCls} placeholder="2019 Toyota Harrier, Foreign Used" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Make"><input required value={form.make} onChange={(e) => update('make', e.target.value)} className={inputCls} /></Field>
              <Field label="Model"><input required value={form.model} onChange={(e) => update('model', e.target.value)} className={inputCls} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Year of manufacture"><input type="number" required value={form.yearOfManufacture} onChange={(e) => update('yearOfManufacture', e.target.value)} className={`${inputCls} font-mono`} /></Field>
              {!isHeavyMachinery && !isSpareParts && <Field label="Color"><input value={form.color} onChange={(e) => update('color', e.target.value)} className={inputCls} /></Field>}
            </div>

            {isImport && (
              <Field label="Duty status">
                <select value={form.dutyStatus} onChange={(e) => update('dutyStatus', e.target.value)} className={inputCls}>
                  <option value="">Select</option>
                  <option value="duty-paid">Duty paid — ready for transfer</option>
                  <option value="bonded-pre-clearance">Bonded — duty not yet cleared</option>
                </select>
              </Field>
            )}

            {isHeavyMachinery ? (
              <>
                <Field label="Equipment type">
                  <select value={form.equipmentType} onChange={(e) => update('equipmentType', e.target.value)} className={inputCls}>
                    <option value="">Select</option>
                    {['excavator', 'bulldozer', 'wheel loader', 'grader', 'crane', 'forklift', 'tractor', 'generator', 'compactor', 'other'].map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Operating hours"><input type="number" value={form.operatingHours} onChange={(e) => update('operatingHours', e.target.value)} className={`${inputCls} font-mono`} /></Field>
                  <Field label="Capacity / tonnage"><input value={form.capacityOrTonnage} onChange={(e) => update('capacityOrTonnage', e.target.value)} className={inputCls} placeholder="e.g. 20-tonne" /></Field>
                </div>
              </>
            ) : isSpareParts ? (
              <>
                <Field label="Part type"><input value={form.partType} onChange={(e) => update('partType', e.target.value)} className={inputCls} placeholder="e.g. Alternator, Headlight assembly" /></Field>
                <Field label="Compatible models"><input value={form.compatibleModels} onChange={(e) => update('compatibleModels', e.target.value)} className={inputCls} placeholder="e.g. Toyota Harrier 2015-2020" /></Field>
                <Field label="Part condition">
                  <select value={form.partCondition} onChange={(e) => update('partCondition', e.target.value)} className={inputCls}>
                    <option value="">Select</option><option value="new">New</option><option value="refurbished">Refurbished</option><option value="used">Used</option>
                  </select>
                </Field>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Transmission">
                    <select value={form.transmission} onChange={(e) => update('transmission', e.target.value)} className={inputCls}>
                      <option value="">Select</option><option value="manual">Manual</option><option value="automatic">Automatic</option>
                    </select>
                  </Field>
                  <Field label="Fuel type">
                    <select value={form.fuelType} onChange={(e) => update('fuelType', e.target.value)} className={inputCls}>
                      <option value="">Select</option><option value="petrol">Petrol</option><option value="diesel">Diesel</option><option value="hybrid">Hybrid</option><option value="electric">Electric</option>
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Engine (cc)"><input type="number" value={form.engineCc} onChange={(e) => update('engineCc', e.target.value)} className={`${inputCls} font-mono`} /></Field>
                  <Field label="Mileage (km)"><input type="number" value={form.mileageKm} onChange={(e) => update('mileageKm', e.target.value)} className={`${inputCls} font-mono`} /></Field>
                </div>
                <Field label="Body type">
                  <select value={form.bodyType} onChange={(e) => update('bodyType', e.target.value)} className={inputCls}>
                    <option value="">Select</option>
                    {['sedan', 'suv', 'hatchback', 'wagon', 'pickup', 'van', 'coupe', 'convertible'].map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </Field>
              </>
            )}
            <Field label="Description"><textarea required rows={5} value={form.description} onChange={(e) => update('description', e.target.value)} className={inputCls} /></Field>
          </fieldset>
        )}

        {step === 2 && (
          <fieldset className="space-y-4">
            <legend className="font-display text-lg font-semibold text-ink">Photos</legend>
            <p className="text-sm text-ink-400">Add at least one photo. Listings with 5+ clear photos get noticeably more inquiries.</p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              className="block w-full rounded border border-dashed border-ink-100 p-4 text-sm"
            />
            {files.length > 0 && <p className="text-sm text-matatu">{files.length} photo{files.length === 1 ? '' : 's'} selected</p>}
          </fieldset>
        )}

        {step === 3 && (
          <fieldset className="space-y-4">
            <legend className="font-display text-lg font-semibold text-ink">Location &amp; price</legend>
            <div className="grid grid-cols-2 gap-4">
              <Field label="County">
                <select required value={form.county} onChange={(e) => update('county', e.target.value)} className={inputCls}>
                  <option value="">Select</option>
                  {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Town / area"><input value={form.town} onChange={(e) => update('town', e.target.value)} className={inputCls} /></Field>
            </div>
            <Field label="Price (KES)"><input type="number" required value={form.price} onChange={(e) => update('price', e.target.value)} className={`${inputCls} font-mono`} /></Field>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={form.negotiable} onChange={(e) => update('negotiable', e.target.checked)} />
              Price is negotiable
            </label>
          </fieldset>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Review</h2>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <Row label="Category" value={form.category} />
                <Row label="Condition" value={form.condition} />
                <Row label="Vehicle" value={`${form.yearOfManufacture} ${form.make} ${form.model}`} />
                <Row label="Price" value={form.price ? `KES ${Number(form.price).toLocaleString()}` : ''} />
                <Row label="Location" value={[form.town, form.county].filter(Boolean).join(', ')} />
                <Row label="Photos" value={`${files.length} attached`} />
              </dl>
            </div>

            {user === undefined ? (
              <p className="text-sm text-ink-400">Checking your session…</p>
            ) : user ? (
              <p className="rounded bg-matatu/10 px-3 py-2 text-sm text-matatu">You&apos;re logged in — ready to publish.</p>
            ) : (
              <div className="rounded border border-ink-100 p-4">
                <p className="mb-3 text-sm text-ink">One more thing — create a free account (or log in) so you can manage this listing, see leads, and get paid for it.</p>
                <div className="mb-3 flex gap-2 text-xs">
                  <button type="button" onClick={() => setAuthMode('register')} className={`rounded px-3 py-1 ${authMode === 'register' ? 'bg-ink text-white' : 'border border-ink-100 text-ink-400'}`}>New account</button>
                  <button type="button" onClick={() => setAuthMode('login')} className={`rounded px-3 py-1 ${authMode === 'login' ? 'bg-ink text-white' : 'border border-ink-100 text-ink-400'}`}>I already have one</button>
                </div>
                <div className="space-y-3">
                  {authMode === 'register' && (
                    <>
                      <input placeholder="Full name" value={authFields.name} onChange={(e) => setAuthFields((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
                      <input placeholder="Phone (2547XXXXXXXX)" value={authFields.phone} onChange={(e) => setAuthFields((f) => ({ ...f, phone: e.target.value }))} className={`${inputCls} font-mono`} />
                    </>
                  )}
                  <input type="email" placeholder="Email" value={authFields.email} onChange={(e) => setAuthFields((f) => ({ ...f, email: e.target.value }))} className={inputCls} />
                  <input type="password" placeholder="Password" value={authFields.password} onChange={(e) => setAuthFields((f) => ({ ...f, password: e.target.value }))} className={inputCls} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <button type="button" disabled={step === 0} onClick={() => setStep((s) => s - 1)} className="rounded border border-ink-100 px-5 py-2.5 text-sm text-ink-400 disabled:opacity-0">
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={() => setStep((s) => s + 1)} className="rounded bg-ink px-6 py-2.5 font-display text-sm uppercase tracking-wide text-white">
            Next
          </button>
        ) : (
          <button type="button" disabled={submitting} onClick={handlePublish} className="rounded bg-stamp px-6 py-2.5 font-display text-sm uppercase tracking-wide text-white disabled:opacity-50">
            {submitting ? 'Publishing…' : 'Publish listing'}
          </button>
        )}
      </div>
    </div>
  )
}

const inputCls = 'mt-1 w-full rounded border border-ink-100 px-3 py-2 text-sm'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  )
}
