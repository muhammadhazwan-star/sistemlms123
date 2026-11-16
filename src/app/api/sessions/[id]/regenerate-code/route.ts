import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Regenerate 6-digit code + reset expiry to now + 15 minutes (ATT-02)
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const code6 = String(100000 + Math.floor(Math.random() * 900000))
  const codeExpiry = new Date(Date.now() + 15 * 60 * 1000)
  const session = await db.session.update({
    where: { id },
    data: { code6, codeExpiry },
  })
  return NextResponse.json({ session })
}
