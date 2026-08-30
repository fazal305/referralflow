import { sql } from '../_lib/db.js'
import { requireAuth } from '../_lib/auth.js'

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }
  const { referral_id, reward_type, reward_value, trigger, status } = req.body || {}
  if (!referral_id || !reward_value) {
    res.status(400).json({ error: 'referral_id and reward_value are required.' })
    return
  }
  const [reward] = await sql`
    insert into referral_rewards (referral_id, reward_type, reward_value, trigger, status)
    values (${referral_id}, ${reward_type || 'custom'}, ${reward_value}, ${trigger || 'manual'}, ${status || 'earned'})
    returning *
  `
  await sql`
    insert into referral_events (referral_id, event_type, description)
    values (${referral_id}, 'reward_created', ${'Reward logged: ' + reward_value})
  `
  res.status(201).json(reward)
}

export default requireAuth(handler)
