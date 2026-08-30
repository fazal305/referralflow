import { sql } from './_lib/db.js'
import { requireAuth } from './_lib/auth.js'

async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }
  const term = (req.query.q || '').trim()
  if (term.length < 2) {
    res.status(200).json({ clients: [], referrals: [] })
    return
  }
  const like = `%${term}%`
  const clients = await sql`
    select id, name, company from clients
    where name ilike ${like} or company ilike ${like} or notes ilike ${like}
    limit 5
  `
  const referrals = await sql`
    select id, lead_name, referrer_name from referrals
    where lead_name ilike ${like} or referrer_name ilike ${like}
    limit 5
  `
  res.status(200).json({ clients, referrals })
}

export default requireAuth(handler)
