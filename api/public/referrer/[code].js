import { sql } from '../../_lib/db.js'

// Public endpoint: returns only the referring client's display name and whether
// the code is active. Never exposes email, phone, notes, or any other private field.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }
  const { code } = req.query
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
