import { motion } from 'framer-motion'
import { memo, useMemo } from 'react'

const steps = [
  {
    number: '01',
    title: 'Create organization account',
    description: 'Sign up and set up your organization profile in minutes.',
    color: 'from-[#2C74B3] to-[#205295]',
  },
  {
    number: '02',
    title: 'Complete compliance assessment',
    description: 'Answer guided questions about your security practices.',
    color: 'from-[#205295] to-[#144272]',
  },
  {
    number: '03',
    title: 'Analyze infrastructure and risks',
    description: 'Our AI analyzes your infrastructure and identifies risks.',
    color: 'from-[#144272] to-[#0A2647]',
  },
  {
    number: '04',
    title: 'Receive security insights',
    description: 'Get actionable insights to improve your security posture.',
    color: 'from-[#0A2647] to-[#2C74B3]',
  },
]

const StepCard = memo(({ step, index, isLast }) => {
  const isEven = index % 2 === 0
  
  // Memoize delays to prevent recalculation
  const delays = useMemo(() => ({
    circle: 0.5 + (index * 0.25),
    content: 0.65 + (index * 0.25)
  }), [index])

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, x: isEven ? -20 : 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-50px", amount: 0.3 }}
        transition={{ duration: 0.3, delay: delays.content, ease: "easeOut" }}
        className={`flex items-center gap-6 sm:gap-8 ${isLast ? 'mb-0' : 'mb-12 sm:mb-14'} ${isEven ? 'flex-row' : 'flex-row-reverse'}`}
      >
        {/* Content side */}
        <div className={`flex-1 ${isEven ? 'text-right' : 'text-left'}`}>
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="inline-block max-w-md"
          >
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/20 rounded-2xl p-5 sm:p-6 hover:bg-white/[0.15] hover:border-white/30 transition-all duration-200 shadow-xl">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                {step.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Circle with hover animation */}
        <div className="relative z-10 flex-shrink-0">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-50px", amount: 0.3 }}
            transition={{ 
              duration: 0.25, 
              delay: delays.circle,
              ease: "easeOut"
            }}
            whileHover={{ 
              scale: 1.08,
              transition: { duration: 0.15, ease: "easeOut" }
            }}
            className="relative cursor-pointer"
          >
            {/* Outer ring */}
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br ${step.color} p-[2px]`}>
              {/* Inner circle */}
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                <span className={`text-2xl sm:text-3xl font-black bg-gradient-to-br ${step.color} bg-clip-text text-transparent`}>
                  {step.number}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Empty space on other side */}
        <div className="flex-1" />
      </motion.div>
    </div>
  )
})

StepCard.displayName = 'StepCard'

const HowItWorksSection = memo(() => {
  return (
    <section id="how-it-works" className="relative py-20 sm:py-24 lg:py-28 overflow-hidden bg-gradient-to-b from-black via-[#0A2647]/10 to-black">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A2647]/20 via-transparent to-[#0A2647]/20" />
      
      {/* Simple background gradients */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-[#2C74B3]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-[#205295]/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="inline-block mb-4"
          >
            <span className="text-[#2C74B3] text-sm font-semibold tracking-wider uppercase px-4 py-2 rounded-full border border-[#2C74B3]/20 bg-[#2C74B3]/5">
              Process
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 text-white leading-tight"
          >
            How It{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2C74B3] via-[#205295] to-[#144272]">
              Works
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
            className="text-gray-400 text-base sm:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed"
          >
            Get started in four simple steps.
          </motion.p>
        </div>

        <div className="max-w-5xl mx-auto relative">
          {/* Continuous vertical line connecting all steps */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 w-[2px] origin-top"
            style={{ 
              top: '2rem',
              bottom: '2rem',
              background: 'linear-gradient(180deg, rgba(44,116,179,0.6) 0%, rgba(44,116,179,0.4) 50%, rgba(44,116,179,0.3) 100%)'
            }}
            initial={{ scaleY: 0, opacity: 0 }}
            whileInView={{ scaleY: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-50px", amount: 0.1 }}
            transition={{ 
              duration: 1.2, 
              delay: 0.3,
              ease: "easeOut"
            }}
          />

          {steps.map((step, index) => (
            <StepCard
              key={step.number}
              step={step}
              index={index}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  )
})

HowItWorksSection.displayName = 'HowItWorksSection'

export default HowItWorksSection
