/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'
import crypto from 'node:crypto'
import { dbQuery } from '../lib/db.js'
import { signJwt, verifyJwt } from '../lib/jwt.js'

const router = Router()

function isValidUsername(username: string): boolean {
  if (username.length < 3 || username.length > 32) return false
  return /^[a-zA-Z0-9_]+$/.test(username)
}

function isValidPassword(password: string): boolean {
  return password.length >= 6 && password.length <= 128
}

function hashPassword(password: string, salt: Buffer): Buffer {
  return crypto.scryptSync(password, salt, 64)
}

function getToken(req: Request): string | undefined {
  const h = req.header('authorization') ?? ''
  if (h.toLowerCase().startsWith('bearer ')) {
    return h.slice(7).trim() || undefined
  }
  return undefined
}

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const body = req.body as any
  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!isValidUsername(username)) {
    res.status(400).json({ success: false, error: 'invalid_username' })
    return
  }
  if (!isValidPassword(password)) {
    res.status(400).json({ success: false, error: 'invalid_password' })
    return
  }

  const key = username.toLowerCase()
  try {
    const existing = await dbQuery('select 1 from users where username_lower = $1 limit 1', [key])
    if (existing.rows.length > 0) {
      res.status(409).json({ success: false, error: 'user_exists' })
      return
    }
    const salt = crypto.randomBytes(16)
    const passwordHash = hashPassword(password, salt)
    await dbQuery(
      'insert into users (username, username_lower, salt, password_hash) values ($1, $2, $3, $4)',
      [username, key, salt.toString('base64'), passwordHash.toString('base64')],
    )
  } catch (e: any) {
    const code = typeof e?.code === 'string' ? e.code : ''
    if (code === '23505') {
      res.status(409).json({ success: false, error: 'user_exists' })
      return
    }
    res.status(500).json({ success: false, error: 'server_error' })
    return
  }
  const token = signJwt(username, 60 * 60 * 24 * 14)
  res.status(201).json({ success: true, token, user: { username } })
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const body = req.body as any
  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!isValidUsername(username) || !isValidPassword(password)) {
    res.status(400).json({ success: false, error: 'invalid_credentials' })
    return
  }

  const key = username.toLowerCase()
  const r = await dbQuery<{ username: string; salt: string; password_hash: string }>(
    'select username, salt, password_hash from users where username_lower = $1 limit 1',
    [key],
  )
  const user = r.rows[0]
  if (!user) {
    res.status(401).json({ success: false, error: 'invalid_credentials' })
    return
  }

  const salt = Buffer.from(user.salt, 'base64')
  const expected = Buffer.from(user.password_hash, 'base64')
  const actual = hashPassword(password, salt)
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    res.status(401).json({ success: false, error: 'invalid_credentials' })
    return
  }

  const token = signJwt(user.username, 60 * 60 * 24 * 14)
  res.status(200).json({ success: true, token, user: { username: user.username } })
})

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({ success: true })
})

router.get('/me', async (req: Request, res: Response): Promise<void> => {
  const token = getToken(req)
  if (!token) {
    res.status(401).json({ success: false, error: 'missing_token' })
    return
  }
  const payload = verifyJwt(token)
  if (!payload) {
    res.status(401).json({ success: false, error: 'invalid_token' })
    return
  }

  const key = payload.sub.toLowerCase()
  const r = await dbQuery<{ username: string }>('select username from users where username_lower = $1 limit 1', [key])
  const u = r.rows[0]
  if (!u) {
    res.status(401).json({ success: false, error: 'invalid_token' })
    return
  }

  res.status(200).json({ success: true, user: { username: u.username } })
})

export default router
