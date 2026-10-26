import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

export type SortDirection = 'asc' | 'desc' | null

export default function SortIcon({ direction }: { direction: SortDirection }) {
  if (direction === 'asc') return <ChevronUp size={14} className="text-brand" />
  if (direction === 'desc') return <ChevronDown size={14} className="text-brand" />
  return <ChevronsUpDown size={14} className="text-muted" />
}
