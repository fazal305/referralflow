import { sql } from './_lib/db.js'
import { requireAuth } from './_lib/auth.js'

async function listTasks(req, res) {
  const tasks = await sql`
    select t.*, r.lead_name as referral_lead_name, c.name as client_name
    from tasks t
    left join referrals r on r.id = t.referral_id
    left join clients c on c.id = t.client_id
    where t.is_done = false
    order by t.due_at nulls last, t.created_at desc
  `
  res.status(200).json(tasks)
}

async function createTask(req, res) {
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
}

async function completeTask(req, res, id) {
  await sql`update tasks set is_done = true where id = ${id}`
  res.status(200).json({ ok: true })
}

async function handler(req, res) {
  const segments = String(req.query.match || '').split('/').filter(Boolean)
  const [id, action] = segments

  if (!id) {
    if (req.method === 'GET') return listTasks(req, res)
    if (req.method === 'POST') return createTask(req, res)
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  if (id && action === 'complete') {
    if (req.method === 'POST') return completeTask(req, res, id)
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  res.status(404).json({ error: 'Not found.' })
}

export default requireAuth(handler)
