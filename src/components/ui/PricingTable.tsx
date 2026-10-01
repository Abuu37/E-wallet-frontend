export interface PricingRow {
  service: string
  fee: string
  note?: string
}

export default function PricingTable({
  title,
  rows,
}: {
  title: string
  rows: PricingRow[]
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="border-b border-line bg-surface px-6 py-4">
        <h3 className="font-bold text-ink">{title}</h3>
      </div>
      <table className="w-full text-left text-sm">
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={row.service}>
              <td className="px-6 py-4">
                <p className="font-medium text-ink">{row.service}</p>
                {row.note && (
                  <p className="mt-0.5 text-xs text-muted">{row.note}</p>
                )}
              </td>
              <td className="px-6 py-4 text-right font-semibold text-brand">
                {row.fee}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
