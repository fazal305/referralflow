import { supabase } from './supabaseClient'

export async function getReferrerDisplayName(code) {
  const { data, error } = await supabase.rpc('get_referrer_display_name', {
    p_code: code,
  })
  if (error) throw error
  return data?.[0] || null
}

export async function submitPublicReferral(code, form) {
  const { data, error } = await supabase.rpc('submit_public_referral', {
    p_code: code,
    p_lead_name: form.leadName,
    p_lead_email: form.leadEmail || null,
    p_lead_phone: form.leadPhone || null,
    p_lead_need: form.leadNeed || null,
    p_referrer_name: form.referrerName || null,
    p_referrer_email: form.referrerEmail || null,
    p_message: form.message || null,
  })
  if (error) throw error
  return data
}
