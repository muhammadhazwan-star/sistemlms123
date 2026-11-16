import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')
  const departmentId = searchParams.get('departmentId')
  const search = searchParams.get('search') || ''

  const where: any = {}
  if (role) where.role = role
  if (departmentId) where.departmentId = departmentId
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { staffNo: { contains: search } },
      { email: { contains: search } },
    ]
  }

  const users = await db.user.findMany({
    where,
    include: { department: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const user = await db.user.create({
    data: {
      staffNo: body.staffNo,
      name: body.name,
      email: body.email,
      passwordHash: body.password || 'demo123',
      role: body.role || 'STAFF',
      departmentId: body.departmentId || null,
      position: body.position || null,
      language: body.language || 'ms',
      status: 'ACTIVE',
    }
  })
  return NextResponse.json({ user })
}
