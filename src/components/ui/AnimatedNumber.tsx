import { useCountUp } from '../../hooks/useCountUp'

export default function AnimatedNumber({ value }: { value: string }) {
  const match = value.match(/^(\D*)([\d,]+\.?\d*)(.*)$/)
  const numberPart = match?.[2] ?? ''
  const hasComma = numberPart.includes(',')
  const decimals = numberPart.includes('.') ? numberPart.split('.')[1].length : 0
  const target = parseFloat(numberPart.replace(/,/g, '')) || 0
  const current = useCountUp(target)

  if (!match) return <>{value}</>

  const [, prefix, , suffix] = match
  const formatted = hasComma
    ? current.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : current.toFixed(decimals)

  return (
    <>
      {prefix}
      {formatted}
      {suffix}
    </>
  )
}
