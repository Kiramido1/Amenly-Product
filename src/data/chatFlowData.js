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
  { id: 'iso27001', label: 'ISO 27001', description: 'Information Security Management', icon: '🛡️' },
  { id: 'nist',    label: 'NIST CSF',  description: 'Cybersecurity Framework',        icon: '🔐' },
  { id: 'gdpr',    label: 'GDPR',      description: 'Data Protection Regulation',     icon: '🇪🇺' },
  { id: 'custom',  label: 'Custom',    description: 'Tailored Assessment',            icon: '⚙️' },
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
