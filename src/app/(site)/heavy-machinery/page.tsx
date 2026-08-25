import { ListingsView } from '@/components/listings/ListingsView'

export default function HeavyMachineryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ListingsView forcedCategory="heavy-machinery" title="Heavy machinery" searchParams={searchParams} />
}
