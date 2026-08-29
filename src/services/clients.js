import { supabase } from './supabaseClient'

export async function listClients({ search } = {}) {
  let query = supabase
    .from('clients')
    .select(
      '*, referral_codes(code, is_active), projects(id, name, status, completed_at)',
    )
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getClient(id) {
  const { data, error } = await supabase
    .from('clients')
    .select(
      '*, referral_codes(id, code, is_active), projects(*), referrals:referrals!referrer_client_id(id, lead_name, stage, potential_value, actual_value, created_at)',
    )
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createClient(payload) {
  const { data: userData } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('clients')
    .insert({ ...payload, owner_id: userData.user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateClient(id, payload) {
  const { data, error } = await supabase
    .from('clients')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteClient(id) {
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error
}

function randomCode(name) {
  const slugPart = name
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 5) || 'REF'
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `FAZ-${slugPart}-${random}`
}

export async function ensureReferralCode(clientId, clientName) {
  const { data: existing, error: existingError } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle()
  if (existingError) throw existingError
  if (existing) return existing

  const { data: userData } = await supabase.auth.getUser()

  // Retry on the unique constraint in the unlikely event of a collision.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = randomCode(clientName)
    const { data, error } = await supabase
      .from('referral_codes')
      .insert({ client_id: clientId, code, owner_id: userData.user.id })
      .select()
      .single()
    if (!error) return data
    if (error.code !== '23505') throw error
  }
  throw new Error('Could not generate a unique referral code, try again.')
}
