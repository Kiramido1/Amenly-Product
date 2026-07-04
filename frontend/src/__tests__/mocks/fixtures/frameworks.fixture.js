export const frameworksList = [
  {
    id: '1',
    name: 'GDPR',
    version: '2018',
    framework_type: 'regulation',
    category: 'data_protection',
    region: 'European Union',
    is_mandatory: true,
    description: 'General Data Protection Regulation'
  },
  {
    id: '2',
    name: 'ISO 27001',
    version: '2022',
    framework_type: 'standard',
    category: 'security',
    region: 'Global',
    is_mandatory: false,
    description: 'Information Security Management System'
  },
  {
    id: '3',
    name: 'HIPAA',
    version: '2013',
    framework_type: 'regulation',
    category: 'healthcare',
    region: 'United States',
    is_mandatory: true,
    description: 'Health Insurance Portability and Accountability Act'
  },
  {
    id: '4',
    name: 'PCI DSS',
    version: '4.0',
    framework_type: 'standard',
    category: 'financial',
    region: 'Global',
    is_mandatory: true,
    description: 'Payment Card Industry Data Security Standard'
  },
  {
    id: '5',
    name: 'SOX',
    version: '2002',
    framework_type: 'regulation',
    category: 'financial',
    region: 'United States',
    is_mandatory: true,
    description: 'Sarbanes-Oxley Act'
  },
  {
    id: '6',
    name: 'CCPA',
    version: '2020',
    framework_type: 'regulation',
    category: 'data_protection',
    region: 'United States',
    is_mandatory: true,
    description: 'California Consumer Privacy Act'
  },
  {
    id: '7',
    name: 'NIST CSF',
    version: '2.0',
    framework_type: 'standard',
    category: 'security',
    region: 'United States',
    is_mandatory: false,
    description: 'National Institute of Standards and Technology Cybersecurity Framework'
  },
  {
    id: '8',
    name: 'SOC 2',
    version: '2017',
    framework_type: 'standard',
    category: 'security',
    region: 'United States',
    is_mandatory: false,
    description: 'Service Organization Control 2'
  }
]

export const frameworkStats = {
  total: 21,
  mandatory_count: 16,
  optional_count: 5,
  by_type: {
    regulation: 13,
    standard: 8
  },
  by_category: {
    data_protection: 6,
    financial: 3,
    healthcare: 2,
    security: 5
  },
  by_region: {
    'United States': 7,
    'Global': 3,
    'European Union': 2
  }
}

export const singleFramework = {
  id: '1',
  name: 'GDPR',
  version: '2018',
  framework_type: 'regulation',
  category: 'data_protection',
  region: 'European Union',
  is_mandatory: true,
  description: 'General Data Protection Regulation - comprehensive data protection law for the European Union'
}
