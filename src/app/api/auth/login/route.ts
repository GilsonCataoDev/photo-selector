import { NextRequest, NextResponse } from 'next/server'
import {
  signAdminToken, COOKIE_NAME,
  checkRateLimit, recordFailedAttempt, clearAttempts,
  verifyPassword,
} from '@/lib/auth'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  // Rate limiting
  const { allowed, waitSeconds } = checkRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: `Muitas tentativas. Aguarde ${waitSeconds} segundos.` },
      { status: 429 }
    )
  }

  try {
    const { email, password } = await request.json()
    const validEmail = email === process.env.ADMIN_EMAIL
    const validPassword = await verifyPassword(password)

    if (!validEmail || !validPassword) {
      recordFailedAttempt(ip)
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    clearAttempts(ip)
    const token = await signAdminToken()
    const response = NextResponse.json({ ok: true })
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
