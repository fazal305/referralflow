import { sql, query } from '../_lib/db.js'
import { requireAuth } from '../_lib/auth.js'

const ALLOWED_FIELDS = ['category', 'name', 'channel', 'body', 'is_default']

async function listTemplates(req, res) {
  const templates = await sql`select * from referral_templates order by category`
  res.status(200).json(templates)
}

async function createTemplate(req, res) {
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
}

async function updateTemplate(req, res, id) {
  const updates = Object.entries(req.body || {}).filter(([key]) => ALLOWED_FIELDS.includes(key))
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
}

async function deleteTemplate(req, res, id) {
  await sql`delete from referral_templates where id = ${id}`
  res.status(204).end()
}

async function handler(req, res) {
  const segments = [].concat(req.query.segments || [])
  const [id] = segments

  if (!id) {
    if (req.method === 'GET') return listTemplates(req, res)
    if (req.method === 'POST') return createTemplate(req, res)
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  if (req.method === 'PATCH') return updateTemplate(req, res, id)
  if (req.method === 'DELETE') return deleteTemplate(req, res, id)
  res.status(405).json({ error: 'Method not allowed.' })
}

export default requireAuth(handler)
