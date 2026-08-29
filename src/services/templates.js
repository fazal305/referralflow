import { supabase } from './supabaseClient'
import { TEMPLATE_VARIABLES } from '../config/constants'

export async function listTemplates() {
  const { data, error } = await supabase
    .from('referral_templates')
    .select('*')
    .order('category')
  if (error) throw error
  return data
}

export async function createTemplate(payload) {
  const { data: userData } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('referral_templates')
    .insert({ ...payload, owner_id: userData.user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTemplate(id, payload) {
  const { data, error } = await supabase
    .from('referral_templates')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTemplate(id) {
  const { error } = await supabase.from('referral_templates').delete().eq('id', id)
  if (error) throw error
}

// Safe variable replacement: only known {{variable}} tokens are substituted.
// Unknown tokens are left as-is rather than throwing, so a typo never breaks a message.
export function renderTemplate(body, values) {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    if (!TEMPLATE_VARIABLES.includes(key)) return match
    const value = values[key]
    return value === undefined || value === null || value === '' ? match : String(value)
  })
}
