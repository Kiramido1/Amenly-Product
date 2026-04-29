/**
 * Mock infrastructure assets for the cybersecurity dashboard.
 * Each asset represents a network device/service with compliance and risk metadata.
 * Structured for easy replacement with API data.
 */

export const ASSET_TYPES = {
  FIREWALL: 'firewall',
  WORKSTATION: 'workstation',
  SERVER: 'server',
  ROUTER: 'router',
  CLOUD: 'cloud',
}

export const ASSET_TYPE_META = {
  [ASSET_TYPES.FIREWALL]: {
    label: 'Firewall',
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    color: '#f97316',
  },
  [ASSET_TYPES.WORKSTATION]: {
    label: 'Workstation',
    icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    color: '#8b5cf6',
  },
  [ASSET_TYPES.SERVER]: {
    label: 'Server',
    icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01',
    color: '#2C74B3',
  },
  [ASSET_TYPES.ROUTER]: {
    label: 'Router',
    icon: 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0',
    color: '#06b6d4',
  },
  [ASSET_TYPES.CLOUD]: {
    label: 'Cloud Service',
    icon: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z',
    color: '#10b981',
  },
}

export const STATUS = {
  SECURE: 'secure',
  WARNING: 'warning',
  CRITICAL: 'critical',
}

export const STATUS_META = {
  [STATUS.SECURE]: { label: 'Secure', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
  [STATUS.WARNING]: { label: 'Warning', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.25)' },
  [STATUS.CRITICAL]: { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
}

export const DEPARTMENTS = ['Engineering', 'Finance', 'Operations', 'HR', 'Executive']

/**
 * 24 infrastructure assets positioned on a grid map.
 * gridX/gridY are percentage-based positions (0–100).
 */
export const assets = [
  // === Core Infrastructure (center cluster) ===
  { id: 'fw-01', name: 'Core Firewall Alpha', type: ASSET_TYPES.FIREWALL, department: 'Engineering', risk_score: 12, status: STATUS.SECURE, compliance_score: 95, ip: '10.0.1.1', last_scan: '2026-04-27', gridX: 48, gridY: 20, vulnerabilities: ['CVE-2025-0012 (Patched)'] },
  { id: 'fw-02', name: 'DMZ Firewall Beta', type: ASSET_TYPES.FIREWALL, department: 'Engineering', risk_score: 38, status: STATUS.WARNING, compliance_score: 72, ip: '10.0.1.2', last_scan: '2026-04-25', gridX: 28, gridY: 15, vulnerabilities: ['CVE-2026-1834 (Open)', 'CVE-2025-9921 (Mitigated)'] },
  { id: 'fw-03', name: 'Edge Firewall Gamma', type: ASSET_TYPES.FIREWALL, department: 'Operations', risk_score: 85, status: STATUS.CRITICAL, compliance_score: 41, ip: '10.0.1.3', last_scan: '2026-04-20', gridX: 72, gridY: 18, vulnerabilities: ['CVE-2026-3301 (Critical)', 'CVE-2026-2847 (Open)', 'CVE-2025-7722 (Open)'] },

  // === Servers ===
  { id: 'srv-01', name: 'Database Primary', type: ASSET_TYPES.SERVER, department: 'Engineering', risk_score: 22, status: STATUS.SECURE, compliance_score: 88, ip: '10.0.2.10', last_scan: '2026-04-27', gridX: 42, gridY: 42, vulnerabilities: [] },
  { id: 'srv-02', name: 'Application Server', type: ASSET_TYPES.SERVER, department: 'Engineering', risk_score: 15, status: STATUS.SECURE, compliance_score: 92, ip: '10.0.2.11', last_scan: '2026-04-27', gridX: 55, gridY: 38, vulnerabilities: ['CVE-2025-4401 (Patched)'] },
  { id: 'srv-03', name: 'Mail Server', type: ASSET_TYPES.SERVER, department: 'Operations', risk_score: 67, status: STATUS.WARNING, compliance_score: 58, ip: '10.0.2.12', last_scan: '2026-04-22', gridX: 62, gridY: 50, vulnerabilities: ['CVE-2026-1102 (Open)', 'CVE-2025-8834 (Open)'] },
  { id: 'srv-04', name: 'Backup Server', type: ASSET_TYPES.SERVER, department: 'Operations', risk_score: 8, status: STATUS.SECURE, compliance_score: 96, ip: '10.0.2.13', last_scan: '2026-04-27', gridX: 35, gridY: 55, vulnerabilities: [] },
  { id: 'srv-05', name: 'Auth Server (LDAP)', type: ASSET_TYPES.SERVER, department: 'Engineering', risk_score: 78, status: STATUS.CRITICAL, compliance_score: 35, ip: '10.0.2.14', last_scan: '2026-04-18', gridX: 50, gridY: 58, vulnerabilities: ['CVE-2026-4401 (Critical)', 'CVE-2026-3302 (Open)'] },

  // === Workstations ===
  { id: 'ws-01', name: 'Dev Workstation 01', type: ASSET_TYPES.WORKSTATION, department: 'Engineering', risk_score: 18, status: STATUS.SECURE, compliance_score: 90, ip: '10.0.3.101', last_scan: '2026-04-27', gridX: 15, gridY: 40, vulnerabilities: [] },
  { id: 'ws-02', name: 'Dev Workstation 02', type: ASSET_TYPES.WORKSTATION, department: 'Engineering', risk_score: 25, status: STATUS.SECURE, compliance_score: 85, ip: '10.0.3.102', last_scan: '2026-04-26', gridX: 18, gridY: 52, vulnerabilities: ['CVE-2025-7712 (Patched)'] },
  { id: 'ws-03', name: 'Finance Terminal', type: ASSET_TYPES.WORKSTATION, department: 'Finance', risk_score: 42, status: STATUS.WARNING, compliance_score: 68, ip: '10.0.3.201', last_scan: '2026-04-24', gridX: 82, gridY: 42, vulnerabilities: ['CVE-2026-0098 (Open)'] },
  { id: 'ws-04', name: 'HR Terminal', type: ASSET_TYPES.WORKSTATION, department: 'HR', risk_score: 55, status: STATUS.WARNING, compliance_score: 62, ip: '10.0.3.301', last_scan: '2026-04-23', gridX: 85, gridY: 55, vulnerabilities: ['CVE-2026-1199 (Open)', 'CVE-2025-6633 (Mitigated)'] },
  { id: 'ws-05', name: 'Exec Workstation', type: ASSET_TYPES.WORKSTATION, department: 'Executive', risk_score: 30, status: STATUS.WARNING, compliance_score: 76, ip: '10.0.3.401', last_scan: '2026-04-25', gridX: 78, gridY: 70, vulnerabilities: ['CVE-2026-0501 (Open)'] },
  { id: 'ws-06', name: 'Ops Terminal 01', type: ASSET_TYPES.WORKSTATION, department: 'Operations', risk_score: 10, status: STATUS.SECURE, compliance_score: 94, ip: '10.0.3.501', last_scan: '2026-04-27', gridX: 12, gridY: 68, vulnerabilities: [] },

  // === Routers ===
  { id: 'rt-01', name: 'Core Router', type: ASSET_TYPES.ROUTER, department: 'Engineering', risk_score: 20, status: STATUS.SECURE, compliance_score: 89, ip: '10.0.0.1', last_scan: '2026-04-27', gridX: 48, gridY: 8, vulnerabilities: [] },
  { id: 'rt-02', name: 'Branch Router East', type: ASSET_TYPES.ROUTER, department: 'Operations', risk_score: 45, status: STATUS.WARNING, compliance_score: 65, ip: '10.0.0.2', last_scan: '2026-04-23', gridX: 88, gridY: 30, vulnerabilities: ['CVE-2025-9900 (Open)'] },
  { id: 'rt-03', name: 'Branch Router West', type: ASSET_TYPES.ROUTER, department: 'Operations', risk_score: 14, status: STATUS.SECURE, compliance_score: 91, ip: '10.0.0.3', last_scan: '2026-04-26', gridX: 8, gridY: 28, vulnerabilities: [] },
  { id: 'rt-04', name: 'VPN Gateway', type: ASSET_TYPES.ROUTER, department: 'Engineering', risk_score: 72, status: STATUS.CRITICAL, compliance_score: 44, ip: '10.0.0.4', last_scan: '2026-04-19', gridX: 30, gridY: 75, vulnerabilities: ['CVE-2026-5501 (Critical)', 'CVE-2026-4412 (Open)'] },

  // === Cloud Services ===
  { id: 'cld-01', name: 'AWS Production', type: ASSET_TYPES.CLOUD, department: 'Engineering', risk_score: 16, status: STATUS.SECURE, compliance_score: 93, ip: 'aws-us-east-1', last_scan: '2026-04-27', gridX: 25, gridY: 88, vulnerabilities: [] },
  { id: 'cld-02', name: 'Azure AD Tenant', type: ASSET_TYPES.CLOUD, department: 'Executive', risk_score: 28, status: STATUS.SECURE, compliance_score: 84, ip: 'azure-tenant-01', last_scan: '2026-04-26', gridX: 45, gridY: 85, vulnerabilities: ['IAM-2026-001 (Mitigated)'] },
  { id: 'cld-03', name: 'GCP Analytics', type: ASSET_TYPES.CLOUD, department: 'Finance', risk_score: 52, status: STATUS.WARNING, compliance_score: 61, ip: 'gcp-analytics-01', last_scan: '2026-04-22', gridX: 65, gridY: 88, vulnerabilities: ['GCP-2026-003 (Open)', 'IAM-2026-005 (Open)'] },
  { id: 'cld-04', name: 'S3 Backup Vault', type: ASSET_TYPES.CLOUD, department: 'Operations', risk_score: 5, status: STATUS.SECURE, compliance_score: 98, ip: 'aws-s3-vault', last_scan: '2026-04-27', gridX: 82, gridY: 85, vulnerabilities: [] },

  // === Additional Assets (24 total) ===
  { id: 'srv-06', name: 'Finance Database', type: ASSET_TYPES.SERVER, department: 'Finance', risk_score: 48, status: STATUS.WARNING, compliance_score: 64, ip: '10.0.2.20', last_scan: '2026-04-24', gridX: 90, gridY: 62, vulnerabilities: ['CVE-2026-2201 (Open)', 'SQL-2026-014 (Mitigated)'] },
  { id: 'ws-07', name: 'IT Admin Console', type: ASSET_TYPES.WORKSTATION, department: 'Engineering', risk_score: 9, status: STATUS.SECURE, compliance_score: 97, ip: '10.0.3.601', last_scan: '2026-04-27', gridX: 38, gridY: 30, vulnerabilities: [] },
]

/**
 * Network connections between assets (for drawing SVG lines on the map).
 * Each entry is [sourceId, targetId].
 */
export const connections = [
  ['rt-01', 'fw-01'],
  ['rt-01', 'fw-02'],
  ['rt-01', 'fw-03'],
  ['rt-01', 'rt-02'],
  ['rt-01', 'rt-03'],
  ['fw-01', 'srv-01'],
  ['fw-01', 'srv-02'],
  ['fw-01', 'srv-04'],
  ['fw-02', 'ws-01'],
  ['fw-02', 'ws-02'],
  ['fw-03', 'srv-03'],
  ['fw-03', 'ws-03'],
  ['srv-02', 'srv-05'],
  ['srv-01', 'srv-04'],
  ['rt-02', 'ws-03'],
  ['rt-02', 'ws-04'],
  ['rt-03', 'ws-01'],
  ['rt-03', 'ws-06'],
  ['rt-04', 'cld-01'],
  ['rt-04', 'cld-02'],
  ['srv-05', 'cld-02'],
  ['srv-03', 'ws-05'],
  ['cld-01', 'cld-04'],
  ['cld-02', 'cld-03'],
  ['rt-02', 'srv-06'],
  ['ws-03', 'srv-06'],
  ['fw-01', 'ws-07'],
  ['srv-02', 'ws-07'],
]
