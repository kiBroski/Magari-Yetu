import { ListingsView } from '@/components/listings/ListingsView'

export default function CarsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ListingsView forcedCategory="car" title="Cars" searchParams={searchParams} />
}
