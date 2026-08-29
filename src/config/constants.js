export const APP_NAME = 'ReferralFlow'
export const BUSINESS_NAME = 'Fazal Abbas'

export const PUBLIC_APP_URL =
  import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin

export const REFERRAL_STAGES = [
  { id: 'new', label: 'New', color: 'var(--stage-new)' },
  { id: 'contacted', label: 'Contacted', color: 'var(--stage-contacted)' },
  { id: 'qualified', label: 'Qualified', color: 'var(--stage-qualified)' },
  { id: 'proposal', label: 'Proposal Sent', color: 'var(--stage-proposal)' },
  {
    id: 'negotiating',
    label: 'Negotiating',
    color: 'var(--stage-negotiating)',
  },
  { id: 'won', label: 'Won', color: 'var(--stage-won)' },
  { id: 'lost', label: 'Lost', color: 'var(--stage-lost)' },
]

export const WIN_MOMENT_TRIGGERS = [
  { id: 'immediate', label: 'Immediately after project completion', hours: 0 },
  { id: '24h', label: '24 hours later', hours: 24 },
  { id: '48h', label: '48 hours later', hours: 48 },
  { id: '7d', label: '7 days later', hours: 168 },
  { id: 'manual', label: 'Manually triggered', hours: null },
]

export const REWARD_TYPES = [
  { id: 'none', label: 'No incentive' },
  { id: 'percentage', label: 'Percentage credit' },
  { id: 'fixed', label: 'Fixed amount credit' },
  { id: 'discount', label: 'Discount on next project' },
  { id: 'gift', label: 'Gift' },
  { id: 'custom', label: 'Custom reward' },
]

export const REWARD_TRIGGERS = [
  { id: 'won', label: "When referral becomes Won" },
  { id: 'qualified', label: 'When referral becomes Qualified' },
  { id: 'manual', label: 'Manually, by me' },
]

export const TEMPLATE_CATEGORIES = [
  'referral_request',
  'referral_received',
  'thank_you',
  'lead_contacted',
  'proposal_sent',
  'deal_won',
  'deal_lost',
  'follow_up',
]

export const TEMPLATE_VARIABLES = [
  'clientName',
  'referralName',
  'projectName',
  'referralCode',
  'projectValue',
  'businessName',
]
