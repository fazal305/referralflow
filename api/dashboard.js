import { sql } from './_lib/db.js'
import { requireAuth } from './_lib/auth.js'

async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }
  const referrals = await sql`
    select id, stage, potential_value, actual_value, lead_name, referrer_name, created_at
    from referrals
  `
  res.status(200).json(referrals)
}

export default requireAuth(handler)
