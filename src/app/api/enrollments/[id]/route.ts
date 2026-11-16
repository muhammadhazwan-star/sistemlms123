import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const enrollment = await db.enrollment.findUnique({
    where: { id },
    include: {
      course: { include: { modules: { include: { lessons: { orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } } } },
      user: true,
    }
  })
  return NextResponse.json({ enrollment })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const c = await cookies()
  const userId = c.get('lms_session')?.value

  const existing = await db.enrollment.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const enrollment = await db.enrollment.update({
    where: { id },
    data: {
      progressPct: body.progressPct ?? existing.progressPct,
      status: body.status ?? existing.status,
      completedAt: body.completedAt ? new Date(body.completedAt) : existing.completedAt,
    }
  })
  return NextResponse.json({ enrollment })
}
