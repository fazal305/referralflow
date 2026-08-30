import { sql } from '../_lib/db.js'
import { requireAuth } from '../_lib/auth.js'

async function handler(req, res) {
  if (req.method === 'GET') {
    const templates = await sql`select * from referral_templates order by category`
    res.status(200).json(templates)
    return
  }

  if (req.method === 'POST') {
    const { category, name, channel, body } = req.body || {}
    if (!name || !name.trim() || !body || !body.trim()) {
      res.status(400).json({ error: 'Name and body are required.' })
      return
    }
    const [template] = await sql`
      insert into referral_templates (category, name, channel, body)
      values (${category || 'referral_request'}, ${name.trim()}, ${channel || 'message'}, ${body})
      returning *
    `
    res.status(201).json(template)
    return
  }

  res.status(405).json({ error: 'Method not allowed.' })
}

export default requireAuth(handler)
