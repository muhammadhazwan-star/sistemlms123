import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await db.session.findUnique({
    where: { id },
    include: {
      course: true,
      trainer: true,
      attendances: { include: { user: { include: { department: true } } } },
    }
  })
  if (!session) return NextResponse.json({ error: 'Sesi tidak dijumpai' }, { status: 404 })
  return NextResponse.json({ session })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const session = await db.session.update({
    where: { id },
    data: {
      title: body.title,
      date: body.date ? new Date(body.date) : undefined,
      startTime: body.startTime,
      endTime: body.endTime,
      mode: body.mode,
      location: body.location,
      url: body.url,
      capacity: body.capacity,
      lateAfterMin: body.lateAfterMin,
    }
  })
  return NextResponse.json({ session })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.session.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
