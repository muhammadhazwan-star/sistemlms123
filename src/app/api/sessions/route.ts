import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const trainerId = searchParams.get('trainerId')
  const courseId = searchParams.get('courseId')
  const period = searchParams.get('period') || 'all' // past, today, upcoming, all

  const where: any = {}
  if (trainerId) where.trainerId = trainerId
  if (courseId) where.courseId = courseId
  const now = new Date()
  if (period === 'past') where.date = { lt: now }
  if (period === 'upcoming') where.date = { gt: now }
  if (period === 'today') {
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1)
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
    where.date = { gt: yesterday, lt: tomorrow }
  }

  const sessions = await db.session.findMany({
    where,
    orderBy: { date: 'asc' },
    include: {
      course: true,
      trainer: true,
      _count: { select: { attendances: true } },
    },
  })
  return NextResponse.json({ sessions })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const date = new Date(body.date)
  const code6 = String(100000 + Math.floor(Math.random() * 900000))
  const qrToken = randomUUID()
  const codeExpiry = new Date(date.getTime() + 60 * 60 * 1000)

  const session = await db.session.create({
    data: {
      courseId: body.courseId || null,
      title: body.title,
      date,
      startTime: body.startTime,
      endTime: body.endTime,
      mode: body.mode || 'BERSEMUKA',
      location: body.location || null,
      url: body.url || null,
      capacity: body.capacity || 40,
      qrToken,
      code6,
      codeExpiry,
      lateAfterMin: body.lateAfterMin ?? 15,
      trainerId: body.trainerId || null,
    }
  })
  return NextResponse.json({ session })
}
