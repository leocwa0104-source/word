import { Router, type Request, type Response } from 'express'
import { dbQuery } from '../lib/db.js'
import { verifyJwt } from '../lib/jwt.js'

const router = Router()

function normalizeWordParam(raw: string): { word: string; key: string } | null {
  if (!raw) return null
  let decoded = raw
  try {
    decoded = decodeURIComponent(raw)
  } catch {}
  const word = decoded.trim()
  if (!word) return null
  if (word.length > 64) return null
  if (!/^[A-Za-z]/.test(word)) return null
  if (!/^[A-Za-z](?:[A-Za-z' -]*[A-Za-z])?$/.test(word)) return null
  const key = word.toLowerCase()
  return { word, key }
}

function getToken(req: Request): string | undefined {
  const h = req.header('authorization') ?? ''
  if (h.toLowerCase().startsWith('bearer ')) {
    return h.slice(7).trim() || undefined
  }
  return undefined
}

async function requireUser(req: Request): Promise<{ id: number; username: string } | null> {
  const token = getToken(req)
  if (!token) return null
  const payload = verifyJwt(token)
  if (!payload) return null
  const key = payload.sub.toLowerCase()
  const r = await dbQuery<{ id: number; username: string }>('select id, username from users where username_lower = $1 limit 1', [
    key,
  ])
  return r.rows[0] ?? null
}

router.get('/:word', async (req: Request, res: Response): Promise<void> => {
  const normalized = normalizeWordParam(String(req.params.word ?? ''))
  if (!normalized) {
    res.status(400).json({ success: false, error: 'invalid_word' })
    return
  }
  const { word, key } = normalized

  const defs = await dbQuery<{
    id: number
    pos: string
    meaning_zh: string
    username: string
    created_at: string
  }>(
    `
    select d.id, d.pos, d.meaning_zh, u.username, d.created_at
    from word_definitions d
    join users u on u.id = d.user_id
    where d.word_lower = $1
    order by d.created_at desc
    limit 200
  `,
    [key],
  )

  const mems = await dbQuery<{
    id: number
    content: string
    username: string
    created_at: string
  }>(
    `
    select m.id, m.content, u.username, m.created_at
    from word_memories m
    join users u on u.id = m.user_id
    where m.word_lower = $1
    order by m.created_at desc
    limit 200
  `,
    [key],
  )

  const apps = await dbQuery<{
    id: number
    zh: string
    en: string
    username: string
    created_at: string
  }>(
    `
    select a.id, a.zh, a.en, u.username, a.created_at
    from word_applications a
    join users u on u.id = a.user_id
    where a.word_lower = $1
    order by a.created_at desc
    limit 200
  `,
    [key],
  )

  res.status(200).json({
    success: true,
    word,
    definitions: defs.rows.map((d) => ({
      id: d.id,
      pos: d.pos,
      meaningZh: d.meaning_zh,
      by: d.username,
      createdAt: d.created_at,
    })),
    memories: mems.rows.map((m) => ({
      id: m.id,
      content: m.content,
      by: m.username,
      createdAt: m.created_at,
    })),
    applications: apps.rows.map((a) => ({
      id: a.id,
      zh: a.zh,
      en: a.en,
      by: a.username,
      createdAt: a.created_at,
    })),
  })
})

router.post('/:word/definitions', async (req: Request, res: Response): Promise<void> => {
  const normalized = normalizeWordParam(String(req.params.word ?? ''))
  if (!normalized) {
    res.status(400).json({ success: false, error: 'invalid_word' })
    return
  }
  const u = await requireUser(req)
  if (!u) {
    res.status(401).json({ success: false, error: 'unauthorized' })
    return
  }

  const body = req.body as any
  const pos = typeof body?.pos === 'string' ? body.pos.trim() : ''
  const meaningZh = typeof body?.meaningZh === 'string' ? body.meaningZh.trim() : ''
  if (!pos || pos.length > 24 || !/^[A-Za-z][A-Za-z. -]*$/.test(pos)) {
    res.status(400).json({ success: false, error: 'invalid_pos' })
    return
  }
  if (!meaningZh || meaningZh.length > 240) {
    res.status(400).json({ success: false, error: 'invalid_meaning' })
    return
  }

  const inserted = await dbQuery<{ id: number; created_at: string }>(
    'insert into word_definitions (word, word_lower, pos, meaning_zh, user_id) values ($1, $2, $3, $4, $5) returning id, created_at',
    [normalized.word, normalized.key, pos, meaningZh, u.id],
  )
  const r = inserted.rows[0]
  res.status(201).json({
    success: true,
    definition: { id: r.id, pos, meaningZh, by: u.username, createdAt: r.created_at },
  })
})

router.post('/:word/memories', async (req: Request, res: Response): Promise<void> => {
  const normalized = normalizeWordParam(String(req.params.word ?? ''))
  if (!normalized) {
    res.status(400).json({ success: false, error: 'invalid_word' })
    return
  }
  const u = await requireUser(req)
  if (!u) {
    res.status(401).json({ success: false, error: 'unauthorized' })
    return
  }

  const body = req.body as any
  const content = typeof body?.content === 'string' ? body.content.trim() : ''
  if (!content || content.length > 2000) {
    res.status(400).json({ success: false, error: 'invalid_content' })
    return
  }

  const inserted = await dbQuery<{ id: number; created_at: string }>(
    'insert into word_memories (word, word_lower, content, user_id) values ($1, $2, $3, $4) returning id, created_at',
    [normalized.word, normalized.key, content, u.id],
  )
  const r = inserted.rows[0]
  res.status(201).json({
    success: true,
    memory: { id: r.id, content, by: u.username, createdAt: r.created_at },
  })
})

router.post('/:word/applications', async (req: Request, res: Response): Promise<void> => {
  const normalized = normalizeWordParam(String(req.params.word ?? ''))
  if (!normalized) {
    res.status(400).json({ success: false, error: 'invalid_word' })
    return
  }
  const u = await requireUser(req)
  if (!u) {
    res.status(401).json({ success: false, error: 'unauthorized' })
    return
  }

  const body = req.body as any
  const zh = typeof body?.zh === 'string' ? body.zh.trim() : ''
  const en = typeof body?.en === 'string' ? body.en.trim() : ''
  if (!zh || zh.length > 400) {
    res.status(400).json({ success: false, error: 'invalid_zh' })
    return
  }
  if (!en || en.length > 400) {
    res.status(400).json({ success: false, error: 'invalid_en' })
    return
  }

  const inserted = await dbQuery<{ id: number; created_at: string }>(
    'insert into word_applications (word, word_lower, zh, en, user_id) values ($1, $2, $3, $4, $5) returning id, created_at',
    [normalized.word, normalized.key, zh, en, u.id],
  )
  const r = inserted.rows[0]
  res.status(201).json({
    success: true,
    application: { id: r.id, zh, en, by: u.username, createdAt: r.created_at },
  })
})

export default router

