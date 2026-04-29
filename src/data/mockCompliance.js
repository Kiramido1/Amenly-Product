/**
 * Mock compliance analytics data.
 * Frameworks (ISO/NIST/GDPR) are here as compliance scores.
 */

import { assets } from './mockAssets'

const totalAssets = assets.length
const criticalAssets = assets.filter(a => a.status === 'critical').length
const warningAssets = assets.filter(a => a.status === 'warning').length
const secureAssets = assets.filter(a => a.status === 'secure').length
const avgCompliance = Math.round(assets.reduce((sum, a) => sum + a.compliance_score, 0) / totalAssets)
const avgRisk = Math.round(assets.reduce((sum, a) => sum + a.risk_score, 0) / totalAssets)

export const summaryStats = {
  overallCompliance: avgCompliance,
  riskAverage: avgRisk,
  totalAssets,
  criticalAssets,
  warningAssets,
  secureAssets,
}

/** Compliance vs Non-compliance (for Pie Chart) */
export const compliancePieData = [
  { name: 'Compliant', value: secureAssets, color: '#2C74B3' },
  { name: 'Partial', value: warningAssets, color: '#94A3B8' },
  { name: 'Non-Compliant', value: criticalAssets, color: '#ef4444' },
]

/** Compliance score per department (for Bar Chart) */
export const departmentCompliance = [
  { department: 'Engineering', score: 87, assets: assets.filter(a => a.department === 'Engineering').length },
  { department: 'Finance', score: 65, assets: assets.filter(a => a.department === 'Finance').length },
  { department: 'Operations', score: 74, assets: assets.filter(a => a.department === 'Operations').length },
  { department: 'HR', score: 62, assets: assets.filter(a => a.department === 'HR').length },
  { department: 'Executive', score: 80, assets: assets.filter(a => a.department === 'Executive').length },
]

/** Framework compliance scores */
export const frameworkScores = [
  { id: 'iso27001', label: 'ISO 27001', score: 82, status: 'Partial', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { id: 'nist', label: 'NIST CSF', score: 74, status: 'Partial', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  { id: 'gdpr', label: 'GDPR', score: 91, status: 'Compliant', icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3' },
  { id: 'soc2', label: 'SOC 2', score: 78, status: 'Partial', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
]

/** Risk trend over 12 months */
export const riskTrend = [
  { month: 'May', risk: 42, compliance: 71 },
  { month: 'Jun', risk: 45, compliance: 68 },
  { month: 'Jul', risk: 50, compliance: 65 },
  { month: 'Aug', risk: 48, compliance: 67 },
  { month: 'Sep', risk: 44, compliance: 70 },
  { month: 'Oct', risk: 40, compliance: 73 },
  { month: 'Nov', risk: 38, compliance: 75 },
  { month: 'Dec', risk: 35, compliance: 77 },
  { month: 'Jan', risk: 33, compliance: 79 },
  { month: 'Feb', risk: 36, compliance: 76 },
  { month: 'Mar', risk: 32, compliance: 80 },
  { month: 'Apr', risk: avgRisk, compliance: avgCompliance },
]
