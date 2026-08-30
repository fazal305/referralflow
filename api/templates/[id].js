import { sql, query } from '../_lib/db.js'
import { requireAuth } from '../_lib/auth.js'

const ALLOWED_FIELDS = ['category', 'name', 'channel', 'body', 'is_default']

async function handler(req, res) {
  const { id } = req.query

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
    const rows = await query(
      `update referral_templates set ${setClauses}, updated_at = now() where id = $1 returning *`,
      [id, ...values],
    )
    if (!rows[0]) {
      res.status(404).json({ error: 'Template not found.' })
      return
    }
    res.status(200).json(rows[0])
    return
  }

  if (req.method === 'DELETE') {
    await sql`delete from referral_templates where id = ${id}`
    res.status(204).end()
    return
  }

  res.status(405).json({ error: 'Method not allowed.' })
}

export default requireAuth(handler)
