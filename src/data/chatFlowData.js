/**
 * Chat flow data — defines all steps, questions, and framework-specific questions.
 */

export const STEPS = {
  WELCOME: 'welcome',
  COMPANY_INFO: 'company_info',
  FRAMEWORK: 'framework',
  SECURITY_QUESTIONS: 'security_questions',
  SUMMARY: 'summary',
}

export const FRAMEWORKS = [
  {
    id: 'iso27001',
    label: 'ISO 27001',
    description: 'Information Security Management',
    iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
  },
  {
    id: 'nist',
    label: 'NIST CSF',
    description: 'Cybersecurity Framework',
    iconPath: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
  },
  {
    id: 'gdpr',
    label: 'GDPR',
    description: 'Data Protection Regulation',
    iconPath: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3'
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Tailored Assessment',
    iconPath: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z'
  },
]

export const COMPANY_SIZES = [
  { id: '1-50',     label: '1–50 employees'       },
  { id: '51-200',   label: '51–200 employees'     },
  { id: '201-1000', label: '201–1,000 employees'  },
  { id: '1000+',    label: '1,000+ employees'     },
]

export const INDUSTRIES = [
  { id: 'finance',    label: 'Finance & Banking'   },
  { id: 'healthcare', label: 'Healthcare'          },
  { id: 'tech',       label: 'Technology'          },
  { id: 'government', label: 'Government'          },
  { id: 'retail',     label: 'Retail & E-commerce' },
  { id: 'education',  label: 'Education'           },
  { id: 'other',      label: 'Other'               },
]

export const SECURITY_QUESTIONS = {
  iso27001: [
    { id: 'isms_policy',      question: 'Does your organization have a documented Information Security Management System (ISMS) policy?' },
    { id: 'risk_assessment',  question: 'Do you perform formal risk assessments at least annually?' },
    { id: 'access_control',   question: 'Are access controls and user privilege management procedures in place?' },
    { id: 'incident_response',question: 'Do you have a documented incident response and recovery plan?' },
    { id: 'supplier_security',question: 'Are security requirements included in supplier and third-party agreements?' },
  ],
  nist: [
    { id: 'asset_inventory',  question: 'Do you maintain a complete inventory of all hardware and software assets?' },
    { id: 'threat_detection', question: 'Are continuous monitoring and threat detection systems deployed across your infrastructure?' },
    { id: 'response_plan',    question: 'Is there a tested incident response plan that aligns with NIST guidelines?' },
    { id: 'recovery_objectives', question: 'Have you defined Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO)?' },
    { id: 'supply_chain',     question: 'Do you assess cybersecurity risks within your supply chain?' },
  ],
  gdpr: [
    { id: 'data_mapping',     question: 'Have you completed a data mapping exercise to identify all personal data processed?' },
    { id: 'lawful_basis',     question: 'Is there a documented lawful basis for each category of personal data processing?' },
    { id: 'dpia',             question: 'Do you conduct Data Protection Impact Assessments (DPIAs) for high-risk processing activities?' },
    { id: 'breach_notification', question: 'Is there a process to detect, report, and investigate personal data breaches within 72 hours?' },
    { id: 'data_subject_rights', question: 'Are procedures in place to handle data subject rights requests (access, erasure, portability)?' },
  ],
  custom: [
    { id: 'security_policy',  question: 'Does your organization have a formal, documented security policy reviewed by leadership?' },
    { id: 'employee_training',question: 'Do employees receive regular cybersecurity awareness training?' },
    { id: 'vulnerability_mgmt', question: 'Is there a vulnerability management program with regular scanning and patching?' },
    { id: 'data_encryption',  question: 'Is sensitive data encrypted both at rest and in transit?' },
    { id: 'backup_recovery',  question: 'Are data backups performed regularly and tested for successful restoration?' },
  ],
}

export const YES_NO_OPTIONS = [
  { id: 'yes',     label: 'Yes',       color: 'green'  },
  { id: 'partial', label: 'Partially', color: 'yellow' },
  { id: 'no',      label: 'No',        color: 'red'    },
]
