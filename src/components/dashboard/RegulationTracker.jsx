import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { regulations } from '../../data/mockRegulations'
import CountryIcon from './CountryIcon'

const STATUS_STYLES = {
  Compliant: { color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' },
  Partial: { color: '#94A3B8', bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.3)' },
  'Non-Compliant': { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' },
}

const REQ_COLORS = {
  compliant: '#10b981',
  partial: '#94A3B8',
  'non-compliant': '#ef4444',
}

const RegulationTracker = () => {
  const [expandedId, setExpandedId] = useState(null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-xl border border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden h-full flex flex-col"
      style={{ boxShadow: '0 4px 24px -4px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)' }}
    >
      {/* Header */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-white/10 bg-gradient-to-r from-black/40 to-transparent">
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center backdrop-blur-sm"
            whileHover={{ scale: 1.1, rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </motion.div>
          <div>
            <h3 className="text-[13px] font-bold text-white">Country Regulations</h3>
            <p className="text-[9px] text-white/40">Regional compliance status</p>
          </div>
        </div>
      </div>

      {/* Regulation cards */}
      <div className="flex-1 p-3 sm:p-4 space-y-3 overflow-y-auto scrollbar-chat">
        {regulations.map((reg, i) => {
          const style = STATUS_STYLES[reg.status]
          const isExpanded = expandedId === reg.id
          
          return (
            <motion.div
              key={reg.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
              className="rounded-xl bg-black/40 border border-white/10 hover:border-white/20 backdrop-blur-xl transition-all duration-400 overflow-hidden"
              whileHover={{ y: -2 }}
            >
              {/* Country header - clickable */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : reg.id)}
                className="w-full p-3.5 text-left"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <CountryIcon country={reg.id} className="flex-shrink-0" />
                    <div>
                      <h4 className="text-[12px] font-bold text-white">{reg.label}</h4>
                      <p className="text-[9px] text-white/40 leading-tight">{reg.law}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.span 
                      className="text-[9px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm" 
                      style={{ backgroundColor: style.bg, color: style.color, border: `1px solid ${style.border}` }}
                      animate={{
                        boxShadow: [`0 0 10px ${style.color}20`, `0 0 15px ${style.color}40`, `0 0 10px ${style.color}20`],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    >
                      {reg.status}
                    </motion.span>
                    <motion.svg
                      className="w-4 h-4 text-white/50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </motion.svg>
                  </div>
                </div>

                {/* Overall score */}
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[9px] text-white/40 uppercase tracking-wider font-bold">Overall Progress</span>
                    <span className="text-[11px] font-bold" style={{ color: style.color }}>{reg.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                    <motion.div 
                      className="h-full rounded-full" 
                      style={{ 
                        background: `linear-gradient(90deg, ${style.color}cc, ${style.color})`,
                        boxShadow: `0 0 10px ${style.color}40`,
                      }} 
                      initial={{ width: 0 }} 
                      animate={{ width: `${reg.progress}%` }} 
                      transition={{ duration: 1, delay: 0.5 + i * 0.12 }} 
                    />
                  </div>
                </div>
              </button>

              {/* Expandable details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-white/10"
                  >
                    <div className="p-3.5 space-y-2">
                      {/* Individual requirements */}
                      {reg.requirements.map((req, j) => {
                        const c = REQ_COLORS[req.status]
                        return (
                          <motion.div
                            key={req.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: j * 0.05 }}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] text-white/50">{req.name}</span>
                              <span className="text-[10px] font-bold" style={{ color: c }}>{req.score}%</span>
                            </div>
                            <div className="h-[4px] rounded-full bg-white/[0.05] overflow-hidden">
                              <motion.div 
                                className="h-full rounded-full" 
                                style={{ 
                                  backgroundColor: c,
                                  boxShadow: `0 0 8px ${c}60`,
                                }} 
                                initial={{ width: 0 }} 
                                animate={{ width: `${req.score}%` }} 
                                transition={{ duration: 0.7, delay: 0.1 + j * 0.04 }} 
                              />
                            </div>
                          </motion.div>
                        )
                      })}

                      {/* Audit dates */}
                      <div className="flex gap-4 mt-3 pt-3 border-t border-white/10">
                        <div>
                          <span className="text-[8px] text-white/30 uppercase tracking-wider font-bold">Last Audit</span>
                          <p className="text-[11px] text-white/60 font-semibold">{reg.lastAudit}</p>
                        </div>
                        <div>
                          <span className="text-[8px] text-white/30 uppercase tracking-wider font-bold">Next Audit</span>
                          <p className="text-[11px] text-white/60 font-semibold">{reg.nextAudit}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

export default memo(RegulationTracker)
