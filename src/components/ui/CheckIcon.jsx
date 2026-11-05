import checkIcon from '../../assets/icons/check-mark.png'

export default function CheckIcon({ className = '' }) {
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
