'use client'
import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, PlayCircle, CheckCircle2, Clock, CalendarClock, Award } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { t } from '@/lib/i18n'
import { formatDate, statusColor } from '@/lib/format'
import { PageHeader, GlassCard, EmptyState, LoadingState, ErrorState } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Enrollment, Lang } from '@/lib/types'

export function MyCourses() {
  const { user, navigate } = useAppStore()
  const lang = (user?.language as Lang) || 'ms'

  const { data, isLoading, isError } = useQuery({
    queryKey: ['enrollments', user?.id],
    queryFn: () => api.enrollments.list({ userId: user!.id }),
    enabled: !!user?.id,
  })

  if (isLoading) return <LoadingState label={lang === 'ms' ? 'Memuat kursus...' : 'Loading courses...'} />
  if (isError) return <ErrorState message={lang === 'ms' ? 'Tidak dapat memuatkan kursus.' : 'Failed to load courses.'} />

  const enrollments: Enrollment[] = data?.enrollments || []
  const inProgress = enrollments.filter((e) => e.status === 'IN_PROGRESS')
  const completed = enrollments.filter((e) => e.status === 'COMPLETED')
  const notStarted = enrollments.filter((e) => e.status === 'NOT_STARTED')

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.myCourses', lang)}
        subtitle={lang === 'ms' ? `Anda mempunyai ${enrollments.length} kursus.` : `You have ${enrollments.length} courses.`}
      />

      <Tabs defaultValue="in-progress">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="in-progress">
            {t('enr.IN_PROGRESS', lang)} <span className="ml-1 text-xs text-muted-foreground">({inProgress.length})</span>
          </TabsTrigger>
          <TabsTrigger value="completed">
            {t('enr.COMPLETED', lang)} <span className="ml-1 text-xs text-muted-foreground">({completed.length})</span>
          </TabsTrigger>
          <TabsTrigger value="not-started">
            {t('enr.NOT_STARTED', lang)} <span className="ml-1 text-xs text-muted-foreground">({notStarted.length})</span>
          </TabsTrigger>
        </TabsList>

        {[
          { key: 'in-progress', items: inProgress },
          { key: 'completed', items: completed },
          { key: 'not-started', items: notStarted },
        ].map(({ key, items }) => (
          <TabsContent key={key} value={key} className="mt-4">
            {items.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title={lang === 'ms' ? 'Tiada kursus' : 'No courses'}
                description={lang === 'ms' ? 'Teroka katalog untuk mula belajar.' : 'Browse catalog to start learning.'}
                action={<Button onClick={() => navigate('catalog')} size="sm">{lang === 'ms' ? 'Lihat Katalog' : 'Browse Catalog'}</Button>}
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((e) => <CourseEnrollmentCard key={e.id} enrollment={e} lang={lang} onOpen={() => navigate('learning-player', { enrollmentId: e.id, courseId: e.courseId })} />)}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function CourseEnrollmentCard({ enrollment, lang, onOpen }: { enrollment: Enrollment; lang: Lang; onOpen: () => void }) {
  const course = enrollment.course
  return (
    <GlassCard className="p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="text-[10px] font-mono">{course?.code}</Badge>
        <Badge className={statusColor(enrollment.status)}>{t(`enr.${enrollment.status}`, lang)}</Badge>
      </div>
      <h3 className="font-semibold text-base leading-snug line-clamp-2 mb-1">{course?.title}</h3>
      {course?.level && (
        <div className="text-xs text-muted-foreground mb-3">{t(`level.${course.level}`, lang)} · {course.durationHours} {lang === 'ms' ? 'jam' : 'hours'}</div>
      )}

      <div className="mt-auto space-y-2">
        <div className="flex items-center gap-2">
          <Progress value={enrollment.progressPct || 0} className="h-2 flex-1" />
          <span className="text-xs font-semibold w-10 text-right">{enrollment.progressPct || 0}%</span>
        </div>

        {enrollment.status === 'COMPLETED' ? (
          <>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="size-3.5 text-emerald-500" /> {lang === 'ms' ? 'Selesai' : 'Completed'} {formatDate(enrollment.completedAt, lang)}
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('my-certificates')}>
              <Award className="size-4 mr-1" /> {lang === 'ms' ? 'Lihat Sijil' : 'View Certificate'}
            </Button>
          </>
        ) : (
          <>
            {enrollment.dueDate && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarClock className="size-3.5" /> {lang === 'ms' ? 'Tamat' : 'Due'}: {formatDate(enrollment.dueDate, lang)}
              </div>
            )}
            <Button size="sm" className="w-full" onClick={onOpen}>
              <PlayCircle className="size-4 mr-1" /> {enrollment.status === 'NOT_STARTED' ? (lang === 'ms' ? 'Mula' : 'Start') : t('action.continue', lang)}
            </Button>
          </>
        )}
      </div>
    </GlassCard>
  )
}

export default MyCourses
