import { ListingsView } from '@/components/listings/ListingsView'

export default function TrucksPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ListingsView forcedCategory="truck" title="Trucks & lorries" searchParams={searchParams} />
}
