import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const level = searchParams.get('level')
  const categoryId = searchParams.get('categoryId')
  const language = searchParams.get('language')
  const status = searchParams.get('status') || 'PUBLISHED'
  const sort = searchParams.get('sort') || 'newest'

  const where: any = {}
  if (status && status !== 'all') where.status = status
  if (level && level !== 'all') where.level = level
  if (categoryId && categoryId !== 'all') where.categoryId = categoryId
  if (language && language !== 'all') where.language = language
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { code: { contains: search } },
      { description: { contains: search } },
    ]
  }

  let orderBy: any = { createdAt: 'desc' }
  if (sort === 'title') orderBy = { title: 'asc' }
  if (sort === 'duration') orderBy = { durationHours: 'asc' }

  const courses = await db.course.findMany({
    where,
    orderBy,
    include: {
      category: true,
      instructor: true,
      modules: { include: { lessons: true }, orderBy: { order: 'asc' } },
      _count: { select: { enrollments: true } },
    },
  })
  return NextResponse.json({ courses })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const course = await db.course.create({
    data: {
      code: body.code,
      title: body.title,
      description: body.description || '',
      categoryId: body.categoryId || null,
      level: body.level || 'PEMULA',
      language: body.language || 'ms',
      durationHours: body.durationHours || 4,
      instructorId: body.instructorId || null,
      status: body.status || 'DRAFT',
      passMark: body.passMark ?? 70,
      minAttendancePct: body.minAttendancePct ?? 0,
      outcomes: (body.outcomes || []).join('\n'),
      syllabus: (body.syllabus || []).join('\n'),
    }
  })
  return NextResponse.json({ course })
}
