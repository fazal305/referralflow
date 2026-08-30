import { sql } from '../_lib/db.js'
import { requireAuth } from '../_lib/auth.js'

async function handler(req, res) {
  if (req.method === 'GET') {
    const tasks = await sql`
      select t.*, r.lead_name as referral_lead_name, c.name as client_name
      from tasks t
      left join referrals r on r.id = t.referral_id
      left join clients c on c.id = t.client_id
      where t.is_done = false
      order by t.due_at nulls last, t.created_at desc
    `
    res.status(200).json(tasks)
    return
  }

  if (req.method === 'POST') {
    const { title, due_at, referral_id, client_id } = req.body || {}
    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Title is required.' })
      return
    }
    const [task] = await sql`
      insert into tasks (title, due_at, referral_id, client_id)
      values (${title.trim()}, ${due_at || null}, ${referral_id || null}, ${client_id || null})
      returning *
    `
    res.status(201).json(task)
    return
  }

  res.status(405).json({ error: 'Method not allowed.' })
}

export default requireAuth(handler)
