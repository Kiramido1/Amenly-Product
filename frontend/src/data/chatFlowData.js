/**
 * Chat flow data — defines all steps, questions, and framework-specific questions.
 * Structured compliance assessment experience.
 */

export const STEPS = {
  WELCOME: 'welcome',
  COMPANY_PROFILE: 'company_profile',
  FRAMEWORK: 'framework',
  SECURITY_QUESTIONS: 'security_questions',
  SUMMARY: 'summary',
}

export const STEP_META = [
  { key: STEPS.WELCOME, label: 'Welcome', desc: 'Get started', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { key: STEPS.COMPANY_PROFILE, label: 'Company Profile', desc: 'Organization details', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { key: STEPS.FRAMEWORK, label: 'Framework', desc: 'Select standard', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { key: STEPS.SECURITY_QUESTIONS, label: 'Assessment', desc: 'Compliance checks', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: STEPS.SUMMARY, label: 'Results', desc: 'Your compliance score', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
]

export const FRAMEWORKS = [
  {
    id: 'iso27001',
    label: 'ISO 27001',
    description: 'International standard for information security management systems (ISMS)',
    longDesc: 'Systematic approach to managing sensitive company information through risk management processes.',
    iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    color: 'blue',
    badge: 'Most Popular',
  },
  {
    id: 'nist',
    label: 'NIST CSF',
    description: 'US National Institute of Standards and Technology Cybersecurity Framework',
    longDesc: 'Voluntary framework for reducing cybersecurity risks based on existing standards and guidelines.',
    iconPath: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    color: 'emerald',
    badge: 'Recommended',
  },
  {
    id: 'gdpr',
    label: 'GDPR',
    description: 'General Data Protection Regulation for EU data privacy',
    longDesc: 'European Union regulation on data protection and privacy for individuals within the EU and EEA.',
    iconPath: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
    color: 'violet',
    badge: 'EU Required',
  },
]

export const INDUSTRIES = [
  { id: 'finance',    label: 'Finance & Banking',    iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'healthcare', label: 'Healthcare',           iconPath: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { id: 'tech',       label: 'Technology',           iconPath: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { id: 'government', label: 'Government',           iconPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { id: 'retail',     label: 'Retail & E-commerce',  iconPath: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z' },
  { id: 'education',  label: 'Education',            iconPath: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222' },
  { id: 'manufacturing', label: 'Manufacturing',     iconPath: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'other',      label: 'Other',                iconPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
]

export const COMPANY_SIZES = [
  { id: '1-50',     label: '1–50',       desc: 'Startup / Small' },
  { id: '51-200',   label: '51–200',     desc: 'Growing'         },
  { id: '201-1000', label: '201–1,000',  desc: 'Mid-size'        },
  { id: '1000+',    label: '1,000+',     desc: 'Enterprise'      },
]

export const REGIONS = [
  { id: 'north_america', label: 'North America',  iconPath: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'europe',        label: 'Europe',         iconPath: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'asia_pacific',  label: 'Asia Pacific',   iconPath: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'middle_east',   label: 'Middle East',    iconPath: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'latin_america', label: 'Latin America',  iconPath: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'africa',        label: 'Africa',         iconPath: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
]

export const SECURITY_QUESTIONS = {
  iso27001: [
    { id: 'isms_policy',       question: 'Does your organization have a documented Information Security Management System (ISMS) policy?', category: 'Policy & Governance', weight: 1 },
    { id: 'risk_assessment',   question: 'Do you perform formal risk assessments at least annually?', category: 'Risk Management', weight: 1 },
    { id: 'access_control',    question: 'Are access controls and user privilege management procedures in place?', category: 'Access Control', weight: 1 },
    { id: 'incident_response', question: 'Do you have a documented incident response and recovery plan?', category: 'Incident Management', weight: 1 },
    { id: 'supplier_security', question: 'Are security requirements included in supplier and third-party agreements?', category: 'Supply Chain', weight: 1 },
  ],
  nist: [
    { id: 'asset_inventory',     question: 'Do you maintain a complete inventory of all hardware and software assets?', category: 'Identify', weight: 1 },
    { id: 'threat_detection',    question: 'Are continuous monitoring and threat detection systems deployed across your infrastructure?', category: 'Detect', weight: 1 },
    { id: 'response_plan',       question: 'Is there a tested incident response plan that aligns with NIST guidelines?', category: 'Respond', weight: 1 },
    { id: 'recovery_objectives', question: 'Have you defined Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO)?', category: 'Recover', weight: 1 },
    { id: 'supply_chain',        question: 'Do you assess cybersecurity risks within your supply chain?', category: 'Protect', weight: 1 },
  ],
  gdpr: [
    { id: 'data_mapping',        question: 'Have you completed a data mapping exercise to identify all personal data processed?', category: 'Data Inventory', weight: 1 },
    { id: 'lawful_basis',        question: 'Is there a documented lawful basis for each category of personal data processing?', category: 'Legal Basis', weight: 1 },
    { id: 'dpia',                question: 'Do you conduct Data Protection Impact Assessments (DPIAs) for high-risk processing?', category: 'Impact Assessment', weight: 1 },
    { id: 'breach_notification', question: 'Is there a process to detect, report, and investigate personal data breaches within 72 hours?', category: 'Breach Response', weight: 1 },
    { id: 'data_subject_rights', question: 'Are procedures in place to handle data subject rights requests (access, erasure, portability)?', category: 'Data Rights', weight: 1 },
  ],
}

export const YES_NO_OPTIONS = [
  { id: 'yes',     label: 'Yes',        color: 'green' },
  { id: 'partial', label: 'Partially',  color: 'yellow' },
  { id: 'no',      label: 'No',         color: 'red' },
]

/**
 * Get recommendations based on answers
 */
export const getRecommendations = (frameworkId, answers) => {
  const recommendations = {
    iso27001: {
      isms_policy: 'Develop and document a comprehensive ISMS policy aligned with ISO 27001 Clause 5.',
      risk_assessment: 'Implement a formal risk assessment methodology with regular review cycles.',
      access_control: 'Establish role-based access controls with regular privilege audits.',
      incident_response: 'Create and regularly test an incident response plan with clear escalation paths.',
      supplier_security: 'Include security clauses in all supplier contracts and conduct periodic assessments.',
    },
    nist: {
      asset_inventory: 'Maintain an automated asset discovery and inventory management system.',
      threat_detection: 'Deploy SIEM solutions with 24/7 monitoring capabilities.',
      response_plan: 'Develop and conduct tabletop exercises for your incident response plan.',
      recovery_objectives: 'Define and document RTO/RPO for all critical business systems.',
      supply_chain: 'Implement a vendor risk management program with regular assessments.',
    },
    gdpr: {
      data_mapping: 'Conduct a comprehensive data mapping exercise across all departments.',
      lawful_basis: 'Document the lawful basis for each processing activity in your ROPA.',
      dpia: 'Establish a DPIA process for all new high-risk data processing activities.',
      breach_notification: 'Implement automated breach detection with a 72-hour notification workflow.',
      data_subject_rights: 'Set up automated workflows for handling data subject access requests.',
    },
  }

  const framework = recommendations[frameworkId] || {}
  const result = []

  Object.entries(answers).forEach(([questionId, answer]) => {
    if (answer !== 'yes' && framework[questionId]) {
      result.push({
        questionId,
        severity: answer === 'no' ? 'high' : 'medium',
        recommendation: framework[questionId],
      })
    }
  })

  return result
}
