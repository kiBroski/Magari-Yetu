// Shared reading layout for /terms and /privacy — narrower measure than the
// rest of the site (long-form legal text is harder to read at full page
// width), numbered sections via <ol>, and a visible "last updated" date
// since that date matters for anyone relying on this as the current version.

export function LegalDocument({
  title,
  lastUpdated,
  intro,
  children,
}: {
  title: string
  lastUpdated: string
  intro?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-ink">{title}</h1>
      <p className="mt-1 font-mono text-xs uppercase tracking-wide text-ink-400">Last updated: {lastUpdated}</p>
      {intro && <div className="mt-6 rounded-lg border border-ink-100 bg-white p-5 text-sm text-ink-400">{intro}</div>}
      <div className="legal-prose mt-8 space-y-10 text-ink-400">{children}</div>
    </div>
  )
}

export function LegalSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold text-ink">{number}. {title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_strong]:text-ink [&_a]:text-stamp-dark [&_a]:hover:underline">
        {children}
      </div>
    </section>
  )
}
