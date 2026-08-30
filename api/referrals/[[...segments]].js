import { sql, query } from '../_lib/db.js'
import { requireAuth } from '../_lib/auth.js'

const ALLOWED_FIELDS = ['stage', 'potential_value', 'actual_value', 'next_action', 'notes']

async function listReferrals(req, res) {
  const { stage, search } = req.query
  const rows = await sql`
    select r.*,
      rc.code as referral_code, rc.client_id as referral_code_client_id,
      rcc.name as referral_code_client_name,
      refc.id as referrer_client_id_check, refc.name as referrer_client_name
    from referrals r
    left join referral_codes rc on rc.id = r.referral_code_id
    left join clients rcc on rcc.id = rc.client_id
    left join clients refc on refc.id = r.referrer_client_id
    where (${stage || null}::text is null or r.stage = ${stage || null})
      and (
        ${search || null}::text is null
        or r.lead_name ilike ${'%' + (search || '') + '%'}
        or r.referrer_name ilike ${'%' + (search || '') + '%'}
      )
    order by r.last_activity_at desc
  `
  const referrals = rows.map((r) => ({
    ...r,
    referral_codes: r.referral_code
      ? { code: r.referral_code, client_id: r.referral_code_client_id, clients: { name: r.referral_code_client_name } }
      : null,
    referrer_client: r.referrer_client_id_check
      ? { id: r.referrer_client_id_check, name: r.referrer_client_name }
      : null,
  }))
  res.status(200).json(referrals)
}

async function createReferral(req, res) {
  const { referrer_client_id, lead_name, lead_email, lead_phone, lead_need, potential_value, notes } =
    req.body || {}
  if (!lead_name || !lead_name.trim()) {
    res.status(400).json({ error: 'Lead name is required.' })
    return
  }
  const [referral] = await sql`
    insert into referrals (referrer_client_id, lead_name, lead_email, lead_phone, lead_need, potential_value, notes, source)
    values (${referrer_client_id || null}, ${lead_name.trim()}, ${lead_email || null}, ${lead_phone || null}, ${lead_need || null}, ${potential_value || null}, ${notes || null}, 'manual')
    returning *
  `
  await sql`
    insert into referral_events (referral_id, event_type, description)
    values (${referral.id}, 'submitted', 'Referral created manually')
  `
  res.status(201).json(referral)
}

async function getReferral(req, res, id) {
  const [referral] = await sql`
    select r.*,
      rc.code as referral_code, rc.client_id as referral_code_client_id, rcc.id as rcc_id, rcc.name as referral_code_client_name,
      refc.id as referrer_client_id_check, refc.name as referrer_client_name
    from referrals r
    left join referral_codes rc on rc.id = r.referral_code_id
    left join clients rcc on rcc.id = rc.client_id
    left join clients refc on refc.id = r.referrer_client_id
    where r.id = ${id}
  `
  if (!referral) {
    res.status(404).json({ error: 'Referral not found.' })
    return
  }
  const events = await sql`select * from referral_events where referral_id = ${id} order by created_at desc`
  const rewards = await sql`select * from referral_rewards where referral_id = ${id} order by created_at desc`

  res.status(200).json({
    ...referral,
    referral_codes: referral.referral_code
      ? {
          code: referral.referral_code,
          client_id: referral.referral_code_client_id,
          clients: { id: referral.rcc_id, name: referral.referral_code_client_name },
        }
      : null,
    referrer_client: referral.referrer_client_id_check
      ? { id: referral.referrer_client_id_check, name: referral.referrer_client_name }
      : null,
    referral_events: events,
    referral_rewards: rewards,
  })
}

async function updateReferral(req, res, id) {
  const body = req.body || {}
  const updates = Object.entries(body).filter(([key]) => ALLOWED_FIELDS.includes(key))
  if (updates.length === 0) {
    res.status(400).json({ error: 'No valid fields to update.' })
    return
  }
  const setClauses = updates.map(([key], i) => `${key} = $${i + 2}`).join(', ')
  const values = updates.map(([, value]) => value)
  const rows = await query(
    `update referrals set ${setClauses}, last_activity_at = now(), updated_at = now() where id = $1 returning *`,
    [id, ...values],
  )
  if (!rows[0]) {
    res.status(404).json({ error: 'Referral not found.' })
    return
  }

  if (body.stage) {
    await sql`
      insert into referral_events (referral_id, event_type, description)
      values (${id}, 'stage_changed', ${'Stage moved to "' + body.stage + '"'})
    `
  }

  res.status(200).json(rows[0])
}

async function addEvent(req, res, id) {
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

async function handler(req, res) {
  const segments = [].concat(req.query.segments || [])
  const [id, action] = segments

  if (!id) {
    if (req.method === 'GET') return listReferrals(req, res)
    if (req.method === 'POST') return createReferral(req, res)
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  if (id && action === 'events') {
    if (req.method === 'POST') return addEvent(req, res, id)
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  if (id && !action) {
    if (req.method === 'GET') return getReferral(req, res, id)
    if (req.method === 'PATCH') return updateReferral(req, res, id)
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  res.status(404).json({ error: 'Not found.' })
}

export default requireAuth(handler)
