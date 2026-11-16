import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET() {
  const categories = await db.category.findMany({ include: { _count: { select: { courses: true } } } })
  return NextResponse.json({ categories })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const c = await cookies()
  const userId = c.get('lms_session')?.value

  if (!body.name) {
    return NextResponse.json({ error: 'Nama kategori diperlukan' }, { status: 400 })
  }

  const cat = await db.category.create({
    data: { name: body.name, description: body.description || null },
    include: { _count: { select: { courses: true } } },
  })

  await db.auditLog.create({
    data: {
      userId,
      action: 'CREATE_CATEGORY',
      entity: 'category',
      entityId: cat.id,
      after: JSON.stringify({ name: cat.name }),
    },
  })

  return NextResponse.json({ category: cat })
}
