import { sql } from '../../_lib/db.js'
import { requireAuth } from '../../_lib/auth.js'

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }
  const { id } = req.query
  await sql`update tasks set is_done = true where id = ${id}`
  res.status(200).json({ ok: true })
}

export default requireAuth(handler)
