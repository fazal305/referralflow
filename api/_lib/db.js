import { neon } from '@neondatabase/serverless'

let client

function getClient() {
  if (!client) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not configured.')
    }
    client = neon(process.env.DATABASE_URL)
  }
  return client
}

// Tagged-template usage: sql`select * from clients where id = ${id}`
export function sql(strings, ...values) {
  return getClient()(strings, ...values)
}

// Parameterized usage for dynamically-built queries: query('update ... where id = $1', [id])
export function query(text, params) {
  return getClient().query(text, params)
}
