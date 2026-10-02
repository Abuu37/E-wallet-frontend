import checkIcon from '../../assets/icons/check-mark.png'

interface CheckIconProps {
  className?: string
}

export default function CheckIcon({ className = '' }: CheckIconProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-[18px] w-[18px] shrink-0 bg-brand ${className}`}
      style={{
        WebkitMaskImage: `url(${checkIcon})`,
        maskImage: `url(${checkIcon})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }}
    />
  )
}
