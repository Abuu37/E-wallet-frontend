/**
 * Client-side CSV export of the rows already loaded on screen. Values are exported exactly as shown
 * (so masked phone numbers stay masked). Cells that start with = @ (or a + / - that is not a number or phone prefix) are prefixed with a quote so
 * a spreadsheet never runs them as a formula.
 */
function cell(value: string | number | null | undefined): string {
  let text = value === null || value === undefined ? '' : String(value)
  // Block formulas, but let "+255 ..." phone prefixes and negative numbers through.
  if (/^[=@\t\r]/.test(text) || /^[+-](?!\s?\d)/.test(text)) text = `'${text}`
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  return [headers, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  // The BOM makes Excel read UTF-8 correctly.
  const blob = new Blob(['﻿', toCsv(headers, rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
