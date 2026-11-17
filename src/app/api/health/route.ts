import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || ''
  const hasDbUrl = !!dbUrl
  const dbHost = dbUrl.replace(/.*@/, '').replace(/\/.*$/, '') || 'not set'
  const dbProvider = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://') ? 'postgresql' : dbUrl.startsWith('file:') ? 'sqlite' : 'unknown'
  const hasAtInPassword = dbUrl.includes('@') && dbUrl.split('@').length > 3 // @ in password = too many @
  const hasEncodedAt = dbUrl.includes('%40')

  const diag: any = {
    status: 'checking',
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL_set: hasDbUrl,
      DATABASE_URL_provider: dbProvider,
      DATABASE_URL_host: dbHost,
      has_unencoded_at_in_password: hasAtInPassword,
      has_encoded_at: hasEncodedAt,
      NODE_ENV: process.env.NODE_ENV || 'not set',
    },
  }

  // Test Prisma connection
  try {
    const userCount = await db.user.count()
    diag.prisma = { status: 'connected', userCount }
    diag.status = 'ok'
  } catch (err: any) {
    diag.prisma = { status: 'failed', error: err.message?.slice(0, 300) }
    diag.status = 'error'

    // Fallback: try Supabase REST API if env vars are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
    if (supabaseUrl && supabaseKey) {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/User?select=id&limit=1`, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        })
        if (res.ok) {
          const data = await res.json()
          diag.supabase_rest = { status: 'connected', hasUsers: data.length > 0 }
          diag.status = 'partial'
          diag.hint = 'Prisma failed but Supabase REST API works. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars and switch to REST API.'
        } else {
          diag.supabase_rest = { status: 'failed', error: `${res.status}` }
        }
      } catch (e: any) {
        diag.supabase_rest = { status: 'failed', error: e.message?.slice(0, 200) }
      }
    } else {
      diag.supabase_rest = { status: 'not_configured', hint: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as fallback' }
    }
  }

  return NextResponse.json(diag, { status: diag.status === 'ok' ? 200 : 500 })
}
