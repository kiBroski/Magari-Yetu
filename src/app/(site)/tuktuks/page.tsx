import { ListingsView } from '@/components/listings/ListingsView'

export default function TuktuksPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ListingsView forcedCategory="tuk-tuk" title="Tuktuks" searchParams={searchParams} />
}
