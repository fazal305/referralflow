import { sql, query } from '../_lib/db.js'
import { requireAuth } from '../_lib/auth.js'

const ALLOWED_FIELDS = [
  'stage',
  'potential_value',
  'actual_value',
  'next_action',
  'notes',
]

async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'GET') {
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
    return
  }

  if (req.method === 'PATCH') {
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
    return
  }

  res.status(405).json({ error: 'Method not allowed.' })
}

export default requireAuth(handler)
