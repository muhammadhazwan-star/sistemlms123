'use client'
import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, User as UserIcon, Globe, Layers, CheckCircle2, FileText, Video, FlaskConical, PlayCircle, Award, ListChecks, BookOpen, ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { t } from '@/lib/i18n'
import { statusColor } from '@/lib/format'
import { PageHeader, GlassCard, EmptyState, LoadingState, ErrorState } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import type { Course, LessonType, Lang } from '@/lib/types'

export function CourseDetail() {
  const { user, params, navigate } = useAppStore()
  const lang = (user?.language as Lang) || 'ms'
  const courseId = params?.courseId as string | undefined
  const qc = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => api.courses.get(courseId!),
    enabled: !!courseId,
  })
  const { data: enrData } = useQuery({
    queryKey: ['enrollments', user?.id, courseId],
    queryFn: () => api.enrollments.list({ userId: user!.id, courseId: courseId! }),
    enabled: !!user?.id && !!courseId,
  })

  const enrollMut = useMutation({
    mutationFn: () => api.enrollments.assign(user!.id, courseId!),
    onSuccess: (res) => {
      toast.success(lang === 'ms' ? 'Berhasil mendaftar kursus!' : 'Enrolled successfully!')
      qc.invalidateQueries({ queryKey: ['enrollments', user?.id] })
      navigate('learning-player', { enrollmentId: res.enrollment.id, courseId })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (!courseId) return <ErrorState message={lang === 'ms' ? 'ID kursus tidak ditentukan.' : 'Course ID missing.'} />
  if (isLoading) return <LoadingState label={lang === 'ms' ? 'Memuat kursus...' : 'Loading course...'} />
  if (isError || !data?.course) return <ErrorState message={lang === 'ms' ? 'Kursus tidak dijumpai.' : 'Course not found.'} />

  const course = data.course as Course
  const enrollment = (enrData?.enrollments || [])[0]
  const totalLessons = (course.modules || []).reduce((a, m) => a + (m.lessons?.length || 0), 0)
  const outcomes = (course.outcomes || '').split('\n').map((s) => s.trim()).filter(Boolean)
  const syllabus = (course.syllabus || '').split('\n').map((s) => s.trim()).filter(Boolean)
  const quizzes = course.quizzes || []

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('catalog')} className="mb-2">
        <ArrowLeft className="size-4 mr-1" /> {lang === 'ms' ? 'Kembali ke Katalog' : 'Back to Catalog'}
      </Button>

      {/* Hero */}
      <GlassCard className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="outline" className="font-mono">{course.code}</Badge>
              <Badge className={levelColor(course.level)}>{t(`level.${course.level}`, lang)}</Badge>
              <Badge className={statusColor(course.status)}>{t(`course.${course.status.toLowerCase()}`, lang)}</Badge>
              <Badge variant="secondary">{course.language === 'ms' ? 'Bahasa Malaysia' : 'English'}</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">{course.title}</h1>
            <p className="text-muted-foreground text-sm mb-4">{course.description}</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Clock className="size-4" /> {course.durationHours} {lang === 'ms' ? 'jam' : 'hours'}</span>
              <span className="inline-flex items-center gap-1.5"><BookOpen className="size-4" /> {totalLessons} {lang === 'ms' ? 'pelajaran' : 'lessons'}</span>
              {course.instructor && (
                <span className="inline-flex items-center gap-1.5"><UserIcon className="size-4" /> {course.instructor.name}</span>
              )}
              {course.category && (
                <span className="inline-flex items-center gap-1.5"><Layers className="size-4" /> {course.category.name}</span>
              )}
              <span className="inline-flex items-center gap-1.5"><Globe className="size-4" /> {course.language}</span>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-72 shrink-0">
            <GlassCard className="p-5 space-y-4">
              {enrollment ? (
                <>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">{t('label.progress', lang)}</div>
                    <div className="flex items-center gap-2">
                      <Progress value={enrollment.progressPct || 0} className="h-2" />
                      <span className="text-sm font-semibold w-10 text-right">{enrollment.progressPct || 0}%</span>
                    </div>
                    <Badge className={`${statusColor(enrollment.status)} mt-2`}>{t(`enr.${enrollment.status}`, lang)}</Badge>
                  </div>
                  <Button className="w-full" onClick={() => navigate('learning-player', { enrollmentId: enrollment.id, courseId })}>
                    <PlayCircle className="size-4 mr-1" /> {lang === 'ms' ? 'Sambung Belajar' : 'Continue Learning'}
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground">
                    {lang === 'ms' ? 'Anda belum mendaftar kursus ini.' : 'You are not enrolled in this course.'}
                  </div>
                  <Button className="w-full gradient-primary" disabled={enrollMut.isPending} onClick={() => enrollMut.mutate()}>
                    {enrollMut.isPending ? (lang === 'ms' ? 'Mendaftar...' : 'Enrolling...') : (lang === 'ms' ? 'Daftar Kursus' : 'Enroll Now')}
                  </Button>
                </>
              )}
              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/60">
                <div>{lang === 'ms' ? 'Markah Lulus' : 'Pass Mark'}: <span className="font-medium text-foreground">{course.passMark}%</span></div>
                <div>{lang === 'ms' ? 'Kehadiran Min' : 'Min Attendance'}: <span className="font-medium text-foreground">{course.minAttendancePct}%</span></div>
              </div>
            </GlassCard>
          </div>
        </div>
      </GlassCard>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">{lang === 'ms' ? 'Gambaran' : 'Overview'}</TabsTrigger>
          <TabsTrigger value="syllabus">{lang === 'ms' ? 'Sukatan' : 'Syllabus'}</TabsTrigger>
          <TabsTrigger value="quizzes">{lang === 'ms' ? 'Kuiz' : 'Quizzes'}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <GlassCard className="p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><ListChecks className="size-4 text-primary" /> {lang === 'ms' ? 'Hasil Pembelajaran' : 'Learning Outcomes'}</h3>
              {outcomes.length === 0 ? (
                <p className="text-sm text-muted-foreground">{lang === 'ms' ? 'Tiada hasil pembelajaran.' : 'No outcomes specified.'}</p>
              ) : (
                <ul className="space-y-2">
                  {outcomes.map((o, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="size-4 mt-0.5 text-emerald-500 shrink-0" />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>
            <GlassCard className="p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><BookOpen className="size-4 text-primary" /> {lang === 'ms' ? 'Topik Sukatan' : 'Syllabus Topics'}</h3>
              {syllabus.length === 0 ? (
                <p className="text-sm text-muted-foreground">{lang === 'ms' ? 'Tiada topik.' : 'No topics.'}</p>
              ) : (
                <ul className="space-y-2">
                  {syllabus.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="size-5 rounded-md gradient-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="syllabus" className="mt-4">
          <GlassCard className="p-5">
            {course.modules.length === 0 ? (
              <EmptyState icon={BookOpen} title={lang === 'ms' ? 'Sukatan belum tersedia' : 'Syllabus not yet available'} />
            ) : (
              <div className="space-y-4">
                {course.modules.map((m, i) => (
                  <div key={m.id} className="rounded-xl border border-border/60 bg-card/40 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">
                        <span className="text-muted-foreground text-xs mr-2">{lang === 'ms' ? 'Modul' : 'Module'} {i + 1}</span>
                        {m.title}
                      </h4>
                      <Badge variant="secondary" className="text-[10px]">{m.lessons?.length || 0} {lang === 'ms' ? 'pelajaran' : 'lessons'}</Badge>
                    </div>
                    {m.lessons && m.lessons.length > 0 && (
                      <ul className="space-y-1.5 mt-2">
                        {m.lessons.map((l) => (
                          <li key={l.id} className="flex items-center gap-2 text-sm py-1.5">
                            <LessonTypeIcon type={l.type} />
                            <span className="flex-1">{l.title}</span>
                            <span className="text-xs text-muted-foreground">{l.durationMin}m</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </TabsContent>

        <TabsContent value="quizzes" className="mt-4">
          <GlassCard className="p-5">
            {quizzes.length === 0 ? (
              <EmptyState icon={Award} title={lang === 'ms' ? 'Tiada kuiz untuk kursus ini' : 'No quizzes for this course'} />
            ) : (
              <div className="space-y-3">
                {quizzes.map((q) => (
                  <div key={q.id} className="rounded-xl border border-border/60 bg-card/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="font-medium flex items-center gap-2">
                        <Award className="size-4 text-amber-500" />
                        {q.title}
                      </h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1.5">
                        <span>{q.questions?.length || 0} {lang === 'ms' ? 'soalan' : 'questions'}</span>
                        <span>{lang === 'ms' ? 'Markah Lulus' : 'Pass Mark'}: {q.passMark}%</span>
                        <span>{lang === 'ms' ? 'Masa' : 'Time'}: {q.timeLimitMin}m</span>
                        <span>{lang === 'ms' ? 'Cubaan' : 'Attempts'}: {q.maxAttempts}</span>
                      </div>
                    </div>
                    {enrollment && (
                      <Button size="sm" variant="outline" onClick={() => navigate('quiz-player', { quizId: q.id, courseId })}>
                        {lang === 'ms' ? 'Ambil Kuiz' : 'Take Quiz'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function LessonTypeIcon({ type }: { type: LessonType }) {
  const cls = 'size-4 text-muted-foreground shrink-0'
  if (type === 'VIDEO') return <Video className={cls} />
  if (type === 'PDF') return <FileText className={cls} />
  if (type === 'LAB') return <FlaskConical className={cls} />
  return <FileText className={cls} />
}

function levelColor(level: string): string {
  const m: Record<string, string> = {
    PEMULA: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    PERTENGAHAN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    LANJUTAN: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    SEMUA: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  }
  return m[level] || m.PEMULA
}

export default CourseDetail
