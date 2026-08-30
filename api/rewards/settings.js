import { sql } from '../_lib/db.js'
import { requireAuth } from '../_lib/auth.js'

async function handler(req, res) {
  if (req.method === 'GET') {
    const [settings] = await sql`select * from reward_settings where id = true`
    res.status(200).json(settings)
    return
  }

  if (req.method === 'PUT') {
    const { reward_type, reward_value, trigger } = req.body || {}
    const [settings] = await sql`
      update reward_settings
      set reward_type = ${reward_type || 'none'}, reward_value = ${reward_value || null}, trigger = ${trigger || 'won'}, updated_at = now()
      where id = true
      returning *
    `
    res.status(200).json(settings)
    return
  }

  res.status(405).json({ error: 'Method not allowed.' })
}

export default requireAuth(handler)
