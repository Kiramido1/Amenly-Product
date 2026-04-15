import { motion } from 'framer-motion'

const steps = [
  {
    number: '01',
    title: 'Create organization account',
    description: 'Sign up and set up your organization profile in minutes.',
    color: 'from-[#2C74B3] to-[#205295]',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Complete compliance assessment',
    description: 'Answer guided questions about your security practices.',
    color: 'from-[#205295] to-[#144272]',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Analyze infrastructure and risks',
    description: 'Our AI analyzes your infrastructure and identifies risks.',
    color: 'from-[#144272] to-[#0A2647]',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    number: '04',
    title: 'Receive security insights',
    description: 'Get actionable insights to improve your security posture.',
    color: 'from-[#0A2647] to-[#2C74B3]',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
]

const StepCard = ({ step, index, isLast }) => {
  const isEven = index % 2 === 0

  return (
    <div className="relative">
      {/* Vertical line in center - continuous */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#2C74B3]/50 via-[#2C74B3]/30 to-[#2C74B3]/50 -translate-x-1/2" />

      <motion.div
        initial={{ opacity: 0, x: isEven ? -50 : 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: index * 0.15 }}
        className={`flex items-center gap-8 mb-16 ${isEven ? 'flex-row' : 'flex-row-reverse'}`}
      >
        {/* Content side */}
        <div className={`flex-1 ${isEven ? 'text-right' : 'text-left'}`}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="inline-block max-w-md"
          >
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/20 rounded-2xl p-6 hover:bg-white/[0.15] hover:border-white/30 transition-all duration-300 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-2">
                {step.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Center circle */}
        <div className="relative z-10 flex-shrink-0">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.15 + 0.2, type: "spring" }}
            whileHover={{ scale: 1.15, rotate: 360 }}
            className="relative"
          >
            {/* Outer ring */}
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${step.color} p-1 shadow-2xl`}>
              {/* Inner circle */}
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                <span className={`text-3xl font-black bg-gradient-to-br ${step.color} bg-clip-text text-transparent`}>
                  {step.number}
                </span>
              </div>
            </div>
            
            {/* Pulse ring */}
            <motion.div
              className={`absolute inset-0 rounded-full bg-gradient-to-br ${step.color}`}
              animate={{
                scale: [1, 1.3, 1.3],
                opacity: [0.5, 0, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: index * 0.5
              }}
            />
          </motion.div>
        </div>

        {/* Empty space on other side */}
        <div className="flex-1" />
      </motion.div>
    </div>
  )
}

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="relative min-h-screen py-32 lg:py-40 overflow-hidden bg-gradient-to-b from-black via-[#0A2647]/10 to-black">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A2647]/20 via-transparent to-[#0A2647]/20" />
      
      {/* Simple background gradients */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-[#2C74B3]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-[#205295]/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="text-center mb-16 lg:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4"
          >
            <span className="text-[#2C74B3] text-sm font-semibold tracking-wider uppercase px-4 py-2 rounded-full border border-[#2C74B3]/20 bg-[#2C74B3]/5">
              Process
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 text-white leading-tight"
          >
            How It{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2C74B3] via-[#205295] to-[#144272]">
              Works
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-400 text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed"
          >
            Get started in four simple steps.
          </motion.p>
        </div>

        <div className="max-w-5xl mx-auto relative">
          {steps.map((step, index) => (
            <StepCard
              key={index}
              step={step}
              index={index}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorksSection
