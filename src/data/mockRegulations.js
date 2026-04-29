/**
 * Mock country-based regulations data.
 * Each regulation represents a country's cybersecurity/data protection law.
 */

export const regulations = [
  {
    id: 'egypt',
    label: 'Egypt',
    law: 'Personal Data Protection Law (PDPL)',
    description: 'Law No. 151 of 2020 — Data Protection & Cybersecurity',
    progress: 68,
    status: 'Partial',
    lastAudit: '2026-03-10',
    nextAudit: '2026-09-10',
    requirements: [
      { name: 'Data Processing Consent', status: 'compliant', score: 88 },
      { name: 'Cross-Border Transfer', status: 'partial', score: 62 },
      { name: 'Data Breach Notification', status: 'partial', score: 55 },
      { name: 'DPO Appointment', status: 'compliant', score: 90 },
      { name: 'Data Subject Rights', status: 'non-compliant', score: 40 },
    ],
  },
  {
    id: 'saudi',
    label: 'Saudi Arabia',
    law: 'NCA Cybersecurity Controls (ECC)',
    description: 'National Cybersecurity Authority Essential Controls',
    progress: 76,
    status: 'Partial',
    lastAudit: '2026-02-20',
    nextAudit: '2026-08-20',
    requirements: [
      { name: 'Governance', status: 'compliant', score: 92 },
      { name: 'Defense', status: 'compliant', score: 85 },
      { name: 'Resilience', status: 'partial', score: 70 },
      { name: 'Third-Party Security', status: 'partial', score: 58 },
      { name: 'Cloud Security', status: 'compliant', score: 80 },
    ],
  },
  {
    id: 'eu',
    label: 'European Union',
    law: 'GDPR',
    description: 'General Data Protection Regulation (EU 2016/679)',
    progress: 91,
    status: 'Compliant',
    lastAudit: '2026-04-01',
    nextAudit: '2026-10-01',
    requirements: [
      { name: 'Lawful Processing', status: 'compliant', score: 95 },
      { name: 'Data Subject Rights', status: 'compliant', score: 92 },
      { name: 'Data Protection', status: 'compliant', score: 90 },
      { name: 'Breach Notification', status: 'compliant', score: 88 },
      { name: 'DPO & Governance', status: 'partial', score: 78 },
    ],
  },
  {
    id: 'uae',
    label: 'UAE',
    law: 'Federal Decree-Law No. 45/2021',
    description: 'UAE Personal Data Protection Law (PDPL)',
    progress: 82,
    status: 'Partial',
    lastAudit: '2026-03-15',
    nextAudit: '2026-09-15',
    requirements: [
      { name: 'Data Collection', status: 'compliant', score: 94 },
      { name: 'Data Processing', status: 'compliant', score: 88 },
      { name: 'Cross-Border Transfer', status: 'partial', score: 72 },
      { name: 'Data Retention', status: 'partial', score: 68 },
      { name: 'Enforcement', status: 'compliant', score: 85 },
    ],
  },
]
