export const ragSearchResults = [
  {
    content: 'GDPR requires explicit consent for processing personal data.',
    score: 0.95,
    framework: 'GDPR',
    section: 'Article 7'
  },
  {
    content: 'Data subjects have the right to access their personal data.',
    score: 0.89,
    framework: 'GDPR',
    section: 'Article 15'
  },
  {
    content: 'Organizations must implement appropriate security measures.',
    score: 0.82,
    framework: 'ISO 27001',
    section: 'A.8.1'
  }
]

export const ragQueryResponse = {
  summary: 'ISO 27001 requires organizations to establish an Information Security Management System (ISMS) that includes risk assessment, security controls, and continuous improvement processes.',
  sections: [
    {
      title: 'Risk Assessment',
      content: 'Organizations must conduct thorough risk assessments to identify assets, threats, and vulnerabilities.',
      order: 1
    },
    {
      title: 'Security Controls',
      content: 'Implement controls from Annex A based on risk assessment results.',
      order: 2
    },
    {
      title: 'Continuous Improvement',
      content: 'Regular monitoring and review of the ISMS effectiveness.',
      order: 3
    }
  ],
  confidence_score: 0.91,
  sources: [
    { framework: 'ISO 27001', section: 'Clause 6' },
    { framework: 'ISO 27001', section: 'Annex A' }
  ],
  metadata: {
    word_count: 156,
    processing_time_ms: 1250
  }
}

export const ragLowConfidenceResponse = {
  summary: 'Limited information available on this topic.',
  sections: [
    {
      title: 'Limited Data',
      content: 'The query returned results with low confidence.',
      order: 1
    }
  ],
  confidence_score: 0.35,
  sources: [],
  metadata: {
    word_count: 20,
    processing_time_ms: 500
  }
}
