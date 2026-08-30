import { neon } from '@neondatabase/serverless'

let cached

export function sql(strings, ...values) {
  if (!cached) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not configured.')
    }
    cached = neon(process.env.DATABASE_URL)
  }
  return cached(strings, ...values)
}
