import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const user = await db.user.update({
    where: { id },
    data: {
      name: body.name,
      email: body.email,
      role: body.role,
      departmentId: body.departmentId,
      position: body.position,
      language: body.language,
      status: body.status,
      avatarColor: body.avatarColor,
    }
  })
  return NextResponse.json({ user })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.user.update({ where: { id }, data: { status: 'INACTIVE' } })
  return NextResponse.json({ ok: true })
}
