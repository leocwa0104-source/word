import { Pool } from 'pg'

let pool: Pool | null = null
let schemaReady: Promise<void> | null = null

function getPool(): Pool {
  if (pool) return pool

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL missing')
  }

  const needsSsl =
    process.env.NODE_ENV === 'production' ||
    /(^|[?&])sslmode=require(&|$)/i.test(connectionString) ||
    /neon\.tech/i.test(connectionString)

  pool = new Pool({
    connectionString,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
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

      create table if not exists word_definitions (
        id bigserial primary key,
        word text not null,
        word_lower text not null,
        pos text not null,
        meaning_zh text not null,
        user_id bigint not null references users(id) on delete cascade,
        created_at timestamptz not null default now()
      );
      create index if not exists idx_word_definitions_word_lower on word_definitions(word_lower);
      create index if not exists idx_word_definitions_user_id on word_definitions(user_id);

      create table if not exists word_memories (
        id bigserial primary key,
        word text not null,
        word_lower text not null,
        content text not null,
        user_id bigint not null references users(id) on delete cascade,
        created_at timestamptz not null default now()
      );
      create index if not exists idx_word_memories_word_lower on word_memories(word_lower);
      create index if not exists idx_word_memories_user_id on word_memories(user_id);

      create table if not exists word_applications (
        id bigserial primary key,
        word text not null,
        word_lower text not null,
        zh text not null,
        en text not null,
        user_id bigint not null references users(id) on delete cascade,
        created_at timestamptz not null default now()
      );
      create index if not exists idx_word_applications_word_lower on word_applications(word_lower);
      create index if not exists idx_word_applications_user_id on word_applications(user_id);
    `)
  })()
  return schemaReady
}

export async function dbQuery<T = any>(text: string, params?: any[]) {
  await ensureSchema()
  const p = getPool()
  return p.query<T>(text, params)
}
