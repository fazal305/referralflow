import { sql } from '../_lib/db.js'

// Public endpoint: the only write path available to anonymous visitors.
// Validates the code, enforces a submission rate limit, and inserts only
// lead-facing fields into `referrals` — never reads or exposes client data
// beyond what get-referrer already returns.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  const {
    code,
    leadName,
    leadEmail,
    leadPhone,
    leadNeed,
    referrerName,
    referrerEmail,
    message,
  } = req.body || {}

  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Missing referral code.' })
    return
  }
  if (!leadName || !leadName.trim()) {
    res.status(400).json({ error: 'Lead name is required.' })
    return
  }

  const [referralCode] = await sql`
    select id, client_id, is_active from referral_codes where code = ${code}
  `
  if (!referralCode || !referralCode.is_active) {
    res.status(400).json({ error: 'This referral link is no longer active.' })
    return
  }

  const [{ count }] = await sql`
    select count(*)::int as count from referrals
    where referral_code_id = ${referralCode.id} and created_at > now() - interval '10 minutes'
  `
  if (count >= 5) {
    res.status(429).json({ error: 'Too many submissions from this link recently. Please try again later.' })
    return
  }

  const [referral] = await sql`
    insert into referrals (
      referral_code_id, referrer_client_id, lead_name, lead_email, lead_phone,
      lead_need, referrer_name, referrer_email, message, source
    )
    values (
      ${referralCode.id}, ${referralCode.client_id}, ${leadName.trim()}, ${leadEmail || null},
      ${leadPhone || null}, ${leadNeed || null}, ${referrerName || null}, ${referrerEmail || null},
      ${message || null}, 'referral_link'
    )
    returning id
  `

  await sql`
    insert into referral_events (referral_id, event_type, description)
    values (${referral.id}, 'submitted', 'Referral submitted via public link')
  `

  res.status(201).json({ id: referral.id })
}
