import { sql } from '../../_lib/db.js'
import { requireAuth } from '../../_lib/auth.js'

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }
  const { id } = req.query
  const { event_type, description } = req.body || {}
  if (!description || !description.trim()) {
    res.status(400).json({ error: 'Description is required.' })
    return
  }
  const [event] = await sql`
    insert into referral_events (referral_id, event_type, description)
    values (${id}, ${event_type || 'note_added'}, ${description.trim()})
    returning *
  `
  res.status(201).json(event)
}

export default requireAuth(handler)
