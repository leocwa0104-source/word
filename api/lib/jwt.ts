import crypto from 'node:crypto'

type JwtPayload = {
  sub: string
  exp: number
}

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function base64UrlEncodeJson(obj: any): string {
  const buf = Buffer.from(JSON.stringify(obj), 'utf-8')
  return base64UrlEncode(buf)
}

function base64UrlDecodeToString(input: string): string {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padLen = (4 - (b64.length % 4)) % 4
  const padded = b64 + '='.repeat(padLen)
  return Buffer.from(padded, 'base64').toString('utf-8')
}

function getSecret(): Buffer {
  const raw = process.env.JWT_SECRET
  if (raw && raw.length >= 16) return Buffer.from(raw, 'utf-8')
  if (process.env.NODE_ENV !== 'production') return Buffer.from('dev-jwt-secret-please-change', 'utf-8')
  throw new Error('JWT_SECRET missing')
}

function signHs256(input: string): string {
  const mac = crypto.createHmac('sha256', getSecret()).update(input).digest()
  return base64UrlEncode(mac)
}

export function signJwt(sub: string, expiresInSeconds: number): string {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload: JwtPayload = { sub, exp: now + expiresInSeconds }
  const encodedHeader = base64UrlEncodeJson(header)
  const encodedPayload = base64UrlEncodeJson(payload)
  const data = `${encodedHeader}.${encodedPayload}`
  const sig = signHs256(data)
  return `${data}.${sig}`
}

export function verifyJwt(token: string): JwtPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [h, p, sig] = parts
  const data = `${h}.${p}`
  const expected = signHs256(data)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null

  try {
    const payload = JSON.parse(base64UrlDecodeToString(p)) as JwtPayload
    if (!payload?.sub || typeof payload.sub !== 'string') return null
    if (!payload?.exp || typeof payload.exp !== 'number') return null
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp <= now) return null
    return payload
  } catch {
    return null
  }
}

