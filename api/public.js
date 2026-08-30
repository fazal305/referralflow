import { sql } from './_lib/db.js'

// Public endpoints: never require auth, never expose private client fields.

async function getReferrer(req, res, code) {
  const [row] = await sql`
    select c.name as client_name, rc.is_active as code_is_active
    from referral_codes rc
    join clients c on c.id = rc.client_id
    where rc.code = ${code}
    limit 1
  `
  if (!row) {
    res.status(404).json({ error: 'Referral link not found.' })
    return
  }
  res.status(200).json(row)
}

async function submitReferral(req, res) {
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

export default async function handler(req, res) {
  const segments = String(req.query.match || '').split('/').filter(Boolean)
  const [first, second] = segments

  if (first === 'referrer' && second) {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed.' })
      return
    }
    return getReferrer(req, res, second)
  }

  if (first === 'submit-referral') {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed.' })
      return
    }
    return submitReferral(req, res)
  }

  res.status(404).json({ error: 'Not found.' })
}
