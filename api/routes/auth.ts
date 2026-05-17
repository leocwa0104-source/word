/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'
import crypto from 'node:crypto'

const router = Router()

type UserRecord = {
  username: string
  salt: string
  passwordHash: string
  createdAt: string
}

type SessionRecord = {
  username: string
  expiresAt: number
}

const users = new Map<string, UserRecord>()
const sessions = new Map<string, SessionRecord>()

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

function createToken(): string {
  const buf = crypto.randomBytes(32)
  return buf.toString('base64url')
}

function getToken(req: Request): string | undefined {
  const h = req.header('authorization') ?? ''
  if (h.toLowerCase().startsWith('bearer ')) {
    return h.slice(7).trim() || undefined
  }
  const b = req.body as any
  const t = typeof b?.token === 'string' ? b.token : undefined
  return t || undefined
}

function cleanupSessions(now: number) {
  for (const [token, s] of sessions.entries()) {
    if (s.expiresAt <= now) sessions.delete(token)
  }
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
  if (users.has(key)) {
    res.status(409).json({ success: false, error: 'user_exists' })
    return
  }

  const salt = crypto.randomBytes(16)
  const passwordHash = hashPassword(password, salt)
  const user: UserRecord = {
    username,
    salt: salt.toString('base64'),
    passwordHash: passwordHash.toString('base64'),
    createdAt: new Date().toISOString(),
  }
  users.set(key, user)

  const token = createToken()
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 14
  sessions.set(token, { username, expiresAt })

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

  const user = users.get(username.toLowerCase())
  if (!user) {
    res.status(401).json({ success: false, error: 'invalid_credentials' })
    return
  }

  const salt = Buffer.from(user.salt, 'base64')
  const expected = Buffer.from(user.passwordHash, 'base64')
  const actual = hashPassword(password, salt)
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    res.status(401).json({ success: false, error: 'invalid_credentials' })
    return
  }

  cleanupSessions(Date.now())
  const token = createToken()
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 14
  sessions.set(token, { username: user.username, expiresAt })
  res.status(200).json({ success: true, token, user: { username: user.username } })
})

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  const token = getToken(req)
  if (token) sessions.delete(token)
  res.status(200).json({ success: true })
})

router.get('/me', async (req: Request, res: Response): Promise<void> => {
  cleanupSessions(Date.now())
  const token = getToken(req)
  if (!token) {
    res.status(401).json({ success: false, error: 'missing_token' })
    return
  }
  const s = sessions.get(token)
  if (!s) {
    res.status(401).json({ success: false, error: 'invalid_token' })
    return
  }
  res.status(200).json({ success: true, user: { username: s.username } })
})

export default router
