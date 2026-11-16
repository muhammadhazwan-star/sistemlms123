import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const modules = await db.module.findMany({
    where: { courseId: id },
    orderBy: { order: 'asc' },
    include: { lessons: { orderBy: { order: 'asc' } } },
  })
  return NextResponse.json({ modules })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const count = await db.module.count({ where: { courseId: id } })
  const mod = await db.module.create({
    data: {
      courseId: id,
      title: body.title || 'Modul Baru',
      order: body.order ?? count + 1,
    },
    include: { lessons: true },
  })
  return NextResponse.json({ module: mod })
}
