/**
 * Asset and compliance presentation constants
 * Used across dashboard components for consistent styling and metadata
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
  [STATUS.SECURE]: {
    label: 'Secure',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.25)',
  },
  [STATUS.WARNING]: {
    label: 'Warning',
    color: '#94A3B8',
    bg: 'rgba(148,163,184,0.12)',
    border: 'rgba(148,163,184,0.25)',
  },
  [STATUS.CRITICAL]: {
    label: 'Critical',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.25)',
  },
}

// Framework metadata for display
export const FRAMEWORK_META = {
  iso27001: {
    label: 'ISO 27001',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    color: '#2C74B3',
  },
  nist: {
    label: 'NIST CSF',
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    color: '#f59e0b',
  },
  gdpr: {
    label: 'GDPR',
    icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
    color: '#8b5cf6',
  },
  soc2: {
    label: 'SOC 2',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    color: '#06b6d4',
  },
}
