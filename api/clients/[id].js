import { sql } from '../_lib/db.js'
import { requireAuth } from '../_lib/auth.js'

const ALLOWED_FIELDS = [
  'name',
  'company',
  'email',
  'phone',
  'relationship_status',
  'satisfaction',
  'referral_eligible',
  'preferred_contact_method',
  'notes',
  'last_contact_at',
]

async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'GET') {
    const [client] = await sql`select * from clients where id = ${id}`
    if (!client) {
      res.status(404).json({ error: 'Client not found.' })
      return
    }
    const referralCodes = await sql`select id, code, is_active from referral_codes where client_id = ${id}`
    const projects = await sql`select * from projects where client_id = ${id} order by created_at desc`
    const referrals = await sql`
      select id, lead_name, stage, potential_value, actual_value, created_at
      from referrals where referrer_client_id = ${id}
      order by created_at desc
    `
    res.status(200).json({ ...client, referral_codes: referralCodes, projects, referrals })
    return
  }

  if (req.method === 'PATCH') {
    const updates = Object.entries(req.body || {}).filter(([key]) =>
      ALLOWED_FIELDS.includes(key),
    )
    if (updates.length === 0) {
      res.status(400).json({ error: 'No valid fields to update.' })
      return
    }
    const setClauses = updates.map(([key], i) => `${key} = $${i + 2}`).join(', ')
    const values = updates.map(([, value]) => value)
    const rows = await sql(
      `update clients set ${setClauses}, updated_at = now() where id = $1 returning *`,
      [id, ...values],
    )
    if (!rows[0]) {
      res.status(404).json({ error: 'Client not found.' })
      return
    }
    res.status(200).json(rows[0])
    return
  }

  if (req.method === 'DELETE') {
    await sql`delete from clients where id = ${id}`
    res.status(204).end()
    return
  }

  res.status(405).json({ error: 'Method not allowed.' })
}

export default requireAuth(handler)
