// Generate complete SQL (DDL + seed data) from existing SQLite database
// Output: supabase/seed-complete.sql — runnable in Supabase SQL Editor
import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'fs'
import { randomUUID } from 'crypto'

const db = new PrismaClient()

function sqlVal(v: any): string {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  if (v instanceof Date) return `'${v.toISOString()}'`
  // escape single quotes
  const s = String(v).replace(/'/g, "''")
  return `'${s}'`
}

function insertStmt(table: string, columns: string[], values: any[]): string {
  const vals = values.map(sqlVal).join(', ')
  return `INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${vals});`
}

async function main() {
  const lines: string[] = []
  lines.push('-- LMS Al Amin - Complete Database Setup (DDL + Seed Data)')
  lines.push('-- Run this in Supabase SQL Editor to create all tables and seed data')
  lines.push('-- Generated from sandbox dummy database')
  lines.push('')
  lines.push('-- ===========================================')
  lines.push('-- PART 1: Drop existing tables (clean slate)')
  lines.push('-- ===========================================')
  lines.push('')

  const tables = ['AuditLog', 'Notification', 'Certificate', 'AttendanceCorrection', 'Attendance', 'Session', 'QuizAttempt', 'Question', 'Quiz', 'LessonProgress', 'Lesson', 'Module', 'Enrollment', 'Course', 'Category', 'User', 'Department']
  for (const t of tables) {
    lines.push(`DROP TABLE IF EXISTS "${t}" CASCADE;`)
  }
  // Drop enums
  const enums = ['Role', 'UserStatus', 'CourseLevel', 'CourseStatus', 'LessonType', 'QuestionType', 'EnrollmentStatus', 'SessionMode', 'AttendanceStatus', 'AttendanceMethod', 'CorrectionState']
  for (const e of enums) {
    lines.push(`DROP TYPE IF EXISTS "${e}" CASCADE;`)
  }
  lines.push('')

  // Read DDL from migration file
  lines.push('-- ===========================================')
  lines.push('-- PART 2: Create schema (tables + enums)')
  lines.push('-- ===========================================')
  lines.push('')
  const ddl = require('fs').readFileSync('supabase/migrations/20261116000000_init/migration.sql', 'utf8')
  lines.push(ddl)
  lines.push('')

  lines.push('-- ===========================================')
  lines.push('-- PART 3: Seed data')
  lines.push('-- ===========================================')
  lines.push('')

  // Departments
  lines.push('-- Departments')
  const depts = await db.department.findMany()
  for (const d of depts) {
    lines.push(insertStmt('Department', ['id', 'code', 'name', 'headUserId', 'createdAt'], [d.id, d.code, d.name, d.headUserId, d.createdAt]))
  }
  lines.push('')

  // Categories
  lines.push('-- Categories')
  const cats = await db.category.findMany()
  for (const c of cats) {
    lines.push(insertStmt('Category', ['id', 'name', 'description', 'createdAt'], [c.id, c.name, c.description, c.createdAt]))
  }
  lines.push('')

  // Users
  lines.push('-- Users (40)')
  const users = await db.user.findMany()
  for (const u of users) {
    lines.push(insertStmt('User', ['id', 'staffNo', 'name', 'email', 'passwordHash', 'role', 'departmentId', 'position', 'language', 'status', 'avatarColor', 'createdAt', 'updatedAt'], [u.id, u.staffNo, u.name, u.email, u.passwordHash, u.role, u.departmentId, u.position, u.language, u.status, u.avatarColor, u.createdAt, u.updatedAt]))
  }
  lines.push('')

  // Courses
  lines.push('-- Courses (9)')
  const courses = await db.course.findMany()
  for (const c of courses) {
    lines.push(insertStmt('Course', ['id', 'code', 'title', 'description', 'categoryId', 'level', 'language', 'durationHours', 'instructorId', 'status', 'passMark', 'minAttendancePct', 'thumbnail', 'outcomes', 'syllabus', 'createdAt', 'updatedAt'], [c.id, c.code, c.title, c.description, c.categoryId, c.level, c.language, c.durationHours, c.instructorId, c.status, c.passMark, c.minAttendancePct, c.thumbnail, c.outcomes, c.syllabus, c.createdAt, c.updatedAt]))
  }
  lines.push('')

  // Modules
  lines.push('-- Modules')
  const modules = await db.module.findMany()
  for (const m of modules) {
    lines.push(insertStmt('Module', ['id', 'courseId', 'title', 'order', 'createdAt'], [m.id, m.courseId, m.title, m.order, m.createdAt]))
  }
  lines.push('')

  // Lessons
  lines.push('-- Lessons')
  const lessons = await db.lesson.findMany()
  for (const l of lessons) {
    lines.push(insertStmt('Lesson', ['id', 'moduleId', 'title', 'type', 'content', 'durationMin', 'order', 'createdAt'], [l.id, l.moduleId, l.title, l.type, l.content, l.durationMin, l.order, l.createdAt]))
  }
  lines.push('')

  // Quizzes
  lines.push('-- Quizzes')
  const quizzes = await db.quiz.findMany()
  for (const q of quizzes) {
    lines.push(insertStmt('Quiz', ['id', 'courseId', 'title', 'timeLimitMin', 'maxAttempts', 'passMark', 'createdAt'], [q.id, q.courseId, q.title, q.timeLimitMin, q.maxAttempts, q.passMark, q.createdAt]))
  }
  lines.push('')

  // Questions
  lines.push('-- Questions')
  const questions = await db.question.findMany()
  for (const q of questions) {
    lines.push(insertStmt('Question', ['id', 'quizId', 'type', 'text', 'options', 'correctAnswer', 'explanation', 'points', 'order'], [q.id, q.quizId, q.type, q.text, q.options, q.correctAnswer, q.explanation, q.points, q.order]))
  }
  lines.push('')

  // Enrollments
  lines.push('-- Enrollments')
  const enrollments = await db.enrollment.findMany()
  for (const e of enrollments) {
    lines.push(insertStmt('Enrollment', ['id', 'userId', 'courseId', 'assignedBy', 'status', 'progressPct', 'dueDate', 'completedAt', 'createdAt', 'updatedAt'], [e.id, e.userId, e.courseId, e.assignedBy, e.status, e.progressPct, e.dueDate, e.completedAt, e.createdAt, e.updatedAt]))
  }
  lines.push('')

  // Sessions
  lines.push('-- Sessions')
  const sessions = await db.session.findMany()
  for (const s of sessions) {
    lines.push(insertStmt('Session', ['id', 'courseId', 'title', 'date', 'startTime', 'endTime', 'mode', 'location', 'url', 'capacity', 'qrToken', 'code6', 'codeExpiry', 'lateAfterMin', 'trainerId', 'createdAt'], [s.id, s.courseId, s.title, s.date, s.startTime, s.endTime, s.mode, s.location, s.url, s.capacity, s.qrToken, s.code6, s.codeExpiry, s.lateAfterMin, s.trainerId, s.createdAt]))
  }
  lines.push('')

  // Attendance
  lines.push('-- Attendance')
  const attendances = await db.attendance.findMany()
  for (const a of attendances) {
    lines.push(insertStmt('Attendance', ['id', 'sessionId', 'userId', 'status', 'checkInAt', 'checkOutAt', 'method', 'recordedById', 'remarks', 'createdAt', 'updatedAt'], [a.id, a.sessionId, a.userId, a.status, a.checkInAt, a.checkOutAt, a.method, a.recordedById, a.remarks, a.createdAt, a.updatedAt]))
  }
  lines.push('')

  // Certificates
  lines.push('-- Certificates')
  const certs = await db.certificate.findMany()
  for (const c of certs) {
    lines.push(insertStmt('Certificate', ['id', 'userId', 'courseId', 'certNo', 'issuedAt', 'expiresAt', 'verifyCode'], [c.id, c.userId, c.courseId, c.certNo, c.issuedAt, c.expiresAt, c.verifyCode]))
  }
  lines.push('')

  // Notifications
  lines.push('-- Notifications')
  const notifs = await db.notification.findMany()
  for (const n of notifs) {
    lines.push(insertStmt('Notification', ['id', 'userId', 'type', 'message', 'read', 'createdAt'], [n.id, n.userId, n.type, n.message, n.read, n.createdAt]))
  }
  lines.push('')

  // Audit logs
  lines.push('-- Audit Logs')
  const logs = await db.auditLog.findMany()
  for (const l of logs) {
    lines.push(insertStmt('AuditLog', ['id', 'userId', 'action', 'entity', 'entityId', 'before', 'after', 'timestamp'], [l.id, l.userId, l.action, l.entity, l.entityId, l.before, l.after, l.timestamp]))
  }
  lines.push('')

  lines.push('-- ===========================================')
  lines.push('-- DONE! Database is ready.')
  lines.push('-- Demo accounts (password: demo123):')
  lines.push('--   Admin:    user1000@alaamin.my')
  lines.push('--   HR:       user1001@alaamin.my')
  lines.push('--   Trainer:  user1003@alaamin.my')
  lines.push('--   Staff:    user1007@alaamin.my')
  lines.push('-- ===========================================')

  const sql = lines.join('\n')
  writeFileSync('supabase/seed-complete.sql', sql)
  console.log(`SQL generated: supabase/seed-complete.sql (${sql.length} bytes, ${lines.length} lines)`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
