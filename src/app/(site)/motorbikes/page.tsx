import { ListingsView } from '@/components/listings/ListingsView'

export default function MotorbikesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ListingsView forcedCategory="motorcycle" title="Motorbikes" searchParams={searchParams} />
}
