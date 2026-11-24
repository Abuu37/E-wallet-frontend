import type { KeyboardEvent } from 'react'

/** Props that make a table row open its record from the keyboard (Enter or Space) as well as the mouse. */
export function rowProps(onOpen: () => void, label: string) {
  return {
    tabIndex: 0,
    role: 'button' as const,
    'aria-label': label,
    onClick: onOpen,
    onKeyDown: (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() } },
    className: 'cursor-pointer border-t border-line hover:bg-surface focus-visible:bg-blue-50 focus-visible:outline-none',
  }
}
