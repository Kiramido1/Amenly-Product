import { useState } from 'react'

const Accordion = ({ items, className = '' }) => {
  const [openIndex, setOpenIndex] = useState(null)

  const toggleItem = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="border border-amenly-dark/30 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleItem(index)}
            className="w-full px-4 py-3 text-left flex items-center justify-between bg-black/50 hover:bg-amenly-dark/20 transition-colors"
          >
            <span className="text-white font-medium">{item.title}</span>
            <svg
              className={`w-5 h-5 text-amenly-light transition-transform ${
                openIndex === index ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openIndex === index && (
            <div className="px-4 py-3 bg-black/30">
              <div className="text-silver text-sm">
                {item.content}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default Accordion