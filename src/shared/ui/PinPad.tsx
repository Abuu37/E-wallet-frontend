import { Delete } from 'lucide-react'
import { useCallback, type KeyboardEvent } from 'react'

interface PinPadProps {
  value: string
  onChange: (next: string) => void
  /** Accessible name for the group, e.g. "Enter your PIN". */
  label: string
  length?: number
  disabled?: boolean
  tone?: 'light' | 'dark'
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const

/**
 * 4-dot PIN entry with an on-screen keypad. Digits are never rendered; the dots only show how many
 * were typed. Hardware keyboard works too (digits, Backspace) while the pad has focus.
 */
export function PinPad({ value, onChange, label, length = 4, disabled, tone = 'light' }: PinPadProps) {
  const dark = tone === 'dark'

  const press = useCallback((key: string) => {
    if (disabled) return
    if (key === 'del') onChange(value.slice(0, -1))
    else if (value.length < length) onChange(value + key)
  }, [disabled, length, onChange, value])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (/^[0-9]$/.test(e.key)) { e.preventDefault(); press(e.key) }
    else if (e.key === 'Backspace') { e.preventDefault(); press('del') }
  }

  return (
    <div role="group" aria-label={label} tabIndex={0} onKeyDown={onKeyDown} className="flex flex-col gap-5 outline-none focus-visible:ring-4 focus-visible:ring-blue-200 rounded-2xl">
      <div role="status" aria-label={`${value.length} of ${length} digits entered`} className="flex justify-center gap-[18px] pt-3">
        {Array.from({ length }, (_, i) => (
          <span
            key={i}
            className={`h-[18px] w-[18px] rounded-full border-2 ${
              i < value.length
                ? dark ? 'border-white bg-white' : 'border-ink bg-ink'
                : dark ? 'border-slate-600 bg-transparent' : 'border-slate-400 bg-transparent'
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {KEYS.map((k, i) =>
          k === '' ? (
            <span key={i} aria-hidden="true" />
          ) : (
            <button
              key={k}
              type="button"
              disabled={disabled}
              onClick={() => press(k)}
              aria-label={k === 'del' ? 'Delete' : k}
              className={`flex h-16 items-center justify-center rounded-2xl text-2xl font-bold transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 disabled:opacity-50 ${
                dark ? 'bg-[#111A2E] text-white hover:bg-[#16213B]' : 'bg-slate-100 text-ink hover:bg-slate-200'
              }`}
            >
              {k === 'del' ? <Delete aria-hidden="true" size={24} /> : k}
            </button>
          ),
        )}
      </div>
    </div>
  )
}
