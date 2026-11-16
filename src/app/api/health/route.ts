import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const userCount = await db.user.count()
    const courseCount = await db.course.count()
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      users: userCount,
      courses: courseCount,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      database: 'failed',
      error: err.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
