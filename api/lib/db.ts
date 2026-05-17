import { Pool } from 'pg'

let pool: Pool | null = null
let schemaReady: Promise<void> | null = null

function getPool(): Pool {
  if (pool) return pool

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL missing')
  }

  pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  })

  return pool
}

async function ensureSchema() {
  if (schemaReady) return schemaReady
  schemaReady = (async () => {
    const p = getPool()
    await p.query(`
      create table if not exists users (
        id bigserial primary key,
        username text not null,
        username_lower text not null unique,
        salt text not null,
        password_hash text not null,
        created_at timestamptz not null default now()
      );
    `)
  })()
  return schemaReady
}

export async function dbQuery<T = any>(text: string, params?: any[]) {
  await ensureSchema()
  const p = getPool()
  return p.query<T>(text, params)
}

