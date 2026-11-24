import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

export interface FaqItem {
  question: string
  answer: string
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const isOpen = openIndex === index
        return (
          <div
            key={item.question}
            className="overflow-hidden rounded-2xl border border-line bg-white"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              aria-expanded={isOpen}
            >
              <span className="flex items-center gap-3">
                <HelpCircle
                  size={20}
                  className={`shrink-0 transition-colors duration-200 ${
                    isOpen ? 'text-brand' : 'text-brand/60'
                  }`}
                />
                <span
                  className={`font-semibold transition-colors duration-200 ${
                    isOpen ? 'text-brand' : 'text-ink'
                  }`}
                >
                  {item.question}
                </span>
              </span>
              <ChevronDown
                size={20}
                className={`shrink-0 text-muted transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-brand' : ''
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-5 text-sm leading-relaxed text-muted">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
