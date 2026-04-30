import { memo } from 'react'
import { motion } from 'framer-motion'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts'
import { compliancePieData, departmentCompliance, riskTrend } from '../../data/mockCompliance'

const GRID_COLOR = 'rgba(255,255,255,0.05)'
const TEXT_COLOR = 'rgba(255,255,255,0.4)'

const ChartCard = ({ title, subtitle, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    className="rounded-xl border border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden"
    style={{ boxShadow: '0 4px 24px -4px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)' }}
    whileHover={{ y: -4, borderColor: 'rgba(255,255,255,0.15)' }}
  >
    <div className="px-4 sm:px-5 py-3.5 border-b border-white/10 bg-gradient-to-r from-black/40 to-transparent">
      <h3 className="text-[13px] font-bold text-white">{title}</h3>
      {subtitle && <p className="text-[9px] text-white/40 mt-0.5">{subtitle}</p>}
    </div>
    <div className="p-4 sm:p-5">{children}</div>
  </motion.div>
)

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ backgroundColor: '#000000', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', padding: '10px 14px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)' }}>
      {label && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || '#2C74B3', fontSize: '12px', fontWeight: 700, marginBottom: '2px' }}>
          {entry.name}: {entry.value}{typeof entry.value === 'number' && entry.name !== 'Risk' ? '%' : ''}
        </p>
      ))}
    </div>
  )
}

const CompliancePie = () => (
  <div className="flex items-center gap-6">
    <div className="w-[130px] h-[130px] sm:w-[150px] sm:h-[150px] flex-shrink-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={130} minHeight={130}>
        <PieChart>
          <Pie data={compliancePieData} cx="50%" cy="50%" innerRadius="62%" outerRadius="88%" paddingAngle={4} dataKey="value" stroke="none">
            {compliancePieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
    <div className="space-y-3 flex-1">
      {compliancePieData.map((item) => (
        <div key={item.name} className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-[3px] flex-shrink-0" style={{ backgroundColor: item.color }} />
          <span className="text-[11px] text-white/35 flex-1">{item.name}</span>
          <span className="text-[11px] font-bold text-white/60">{item.value}</span>
        </div>
      ))}
    </div>
  </div>
)

const DepartmentBars = () => (
  <div className="h-[200px] sm:h-[220px]">
    <ResponsiveContainer width="100%" height="100%" minHeight={200}>
      <BarChart data={departmentCompliance} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fill: TEXT_COLOR, fontSize: 9 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="department" tick={{ fill: TEXT_COLOR, fontSize: 9 }} axisLine={false} tickLine={false} width={75} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(44,116,179,0.1)' }} />
        <Bar dataKey="score" name="Compliance" radius={[0, 4, 4, 0]} maxBarSize={18}>
          {departmentCompliance.map((entry, i) => <Cell key={i} fill={entry.score >= 80 ? '#2C74B3' : entry.score >= 60 ? '#205295' : '#ef4444'} fillOpacity={0.8} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
)

const RiskTrendChart = () => (
  <div className="h-[200px] sm:h-[220px]">
    <ResponsiveContainer width="100%" height="100%" minHeight={200}>
      <AreaChart data={riskTrend} margin={{ left: -10, right: 10, top: 5, bottom: 0 }}>
        <defs>
          <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2C74B3" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#205295" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
        <XAxis dataKey="month" tick={{ fill: TEXT_COLOR, fontSize: 9 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: TEXT_COLOR, fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 100]} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="risk" name="Risk" stroke="#ef4444" fill="url(#riskGrad)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#ef4444', stroke: '#000000', strokeWidth: 2 }} />
        <Area type="monotone" dataKey="compliance" name="Compliance" stroke="#2C74B3" fill="url(#compGrad)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#2C74B3', stroke: '#000000', strokeWidth: 2 }} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
)

const ComplianceCharts = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
    <ChartCard title="Compliance Breakdown" subtitle="Asset status distribution" delay={0.3}><CompliancePie /></ChartCard>
    <ChartCard title="Department Compliance" subtitle="Score by department" delay={0.4}><DepartmentBars /></ChartCard>
    <ChartCard title="Risk & Compliance Trend" subtitle="12-month overview" delay={0.5}><RiskTrendChart /></ChartCard>
  </div>
)

export default memo(ComplianceCharts)
