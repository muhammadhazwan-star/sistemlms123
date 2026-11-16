'use client'
import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, GraduationCap, Award, CalendarClock, ArrowRight, Sparkles, Clock, MapPin, Video } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { t } from '@/lib/i18n'
import { formatDate, formatTime, relativeTime, statusColor } from '@/lib/format'
import { PageHeader, StatCard, GlassCard, EmptyState, LoadingState, ErrorState } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import type { Enrollment, Session, Certificate, Lang } from '@/lib/types'

export function DashboardStaff() {
  const { user, navigate } = useAppStore()
  const lang = (user?.language as Lang) || 'ms'

  const { data: enrData, isLoading: enrLoading, isError: enrError } = useQuery({
    queryKey: ['enrollments', user?.id],
    queryFn: () => api.enrollments.list({ userId: user!.id }),
    enabled: !!user?.id,
  })
  const { data: sesData, isLoading: sesLoading, isError: sesError } = useQuery({
    queryKey: ['sessions', 'upcoming'],
    queryFn: () => api.sessions.list({ period: 'upcoming' }),
  })
  const { data: certData, isLoading: certLoading, isError: certError } = useQuery({
    queryKey: ['certificates', user?.id],
    queryFn: () => api.certificates.list(user!.id),
    enabled: !!user?.id,
  })

  if (enrLoading || sesLoading || certLoading) return <LoadingState label="Memuat papan pemuka..." />
  if (enrError || sesError || certError) return <ErrorState message="Tidak dapat memuatkan data papan pemuka." />

  const enrollments: Enrollment[] = (enrData?.enrollments || []).filter((e) => e.status !== 'COMPLETED')
  const completedEnr: Enrollment[] = (enrData?.enrollments || []).filter((e) => e.status === 'COMPLETED')
  const avgProgress = (enrData?.enrollments || []).length
    ? Math.round((enrData!.enrollments as Enrollment[]).reduce((a, e) => a + (e.progressPct || 0), 0) / (enrData!.enrollments as Enrollment[]).length)
    : 0
  const upcoming: Session[] = (sesData?.sessions || []).slice(0, 5)
  const certificates: Certificate[] = (certData?.certificates || []).slice(0, 3)

  const firstName = user?.name?.split(' ')[0] || 'Staf'

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Selamat datang, ${firstName} 👋`}
        subtitle={lang === 'ms' ? 'Teruskan pembelajaran anda hari ini.' : 'Continue your learning today.'}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={lang === 'ms' ? 'Kursus Aktif' : 'Active Courses'} value={enrollments.length} icon={BookOpen} accent="primary" hint={lang === 'ms' ? 'Sedang berjalan' : 'In progress'} />
        <StatCard label={lang === 'ms' ? 'Kemajuan Purata' : 'Avg Progress'} value={`${avgProgress}%`} icon={GraduationCap} accent="emerald" hint={lang === 'ms' ? 'Semua kursus' : 'All courses'} />
        <StatCard label={lang === 'ms' ? 'Sesi Akan Datang' : 'Upcoming Sessions'} value={upcoming.length} icon={CalendarClock} accent="amber" hint={lang === 'ms' ? '5 terdekat' : 'Next 5'} />
        <StatCard label={lang === 'ms' ? 'Sijil Diperoleh' : 'Certificates'} value={(certData?.certificates || []).length} icon={Award} accent="sky" hint={lang === 'ms' ? 'Telah dikeluarkan' : 'Issued'} />
      </div>

      {/* In-progress courses */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <h2 className="font-semibold text-lg">{lang === 'ms' ? 'Kursus Sedang Berjalan' : 'In-Progress Courses'}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('my-courses')}>
            {t('action.continue', lang)} <ArrowRight className="size-4 ml-1" />
          </Button>
        </div>
        {enrollments.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={lang === 'ms' ? 'Tiada kursus aktif' : 'No active courses'}
            description={lang === 'ms' ? 'Teroka katalog kursus untuk mula belajar.' : 'Browse the catalog to start learning.'}
            action={<Button onClick={() => navigate('catalog')} size="sm">{lang === 'ms' ? 'Lihat Katalog' : 'Browse Catalog'}</Button>}
          />
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin pr-1">
            {enrollments.map((e) => (
              <div key={e.id} className="rounded-xl border border-border/60 bg-card/40 p-4 hover:bg-card/60 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px]">{e.course?.code}</Badge>
                      <Badge className={statusColor(e.status)}>{t(`enr.${e.status}`, lang)}</Badge>
                    </div>
                    <h3 className="font-medium truncate">{e.course?.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={e.progressPct || 0} className="h-2 flex-1" />
                      <span className="text-xs font-semibold text-muted-foreground w-10 text-right">{e.progressPct || 0}%</span>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => navigate('learning-player', { enrollmentId: e.id, courseId: e.courseId })}>
                    {t('action.continue', lang)}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Upcoming sessions */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarClock className="size-5 text-primary" />
              <h2 className="font-semibold text-lg">{lang === 'ms' ? 'Sesi Akan Datang' : 'Upcoming Sessions'}</h2>
            </div>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState icon={CalendarClock} title={lang === 'ms' ? 'Tiada sesi akan datang' : 'No upcoming sessions'} description={lang === 'ms' ? 'Sesi baharu akan dipaparkan di sini.' : 'New sessions will appear here.'} />
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin pr-1">
              {upcoming.map((s) => (
                <div key={s.id} className="rounded-xl border border-border/60 bg-card/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px]">{t(`session.${s.mode}`, lang)}</Badge>
                        {s.course && <Badge variant="secondary" className="text-[10px]">{s.course.code}</Badge>}
                      </div>
                      <h3 className="font-medium truncate">{s.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><CalendarClock className="size-3.5" />{formatDate(s.date, lang)}</span>
                        <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{formatTime(s.startTime)} - {formatTime(s.endTime)}</span>
                        {s.mode === 'BERSEMUKA' && s.location && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{s.location}</span>}
                        {s.mode === 'DALAM_TALIAN' && s.url && <span className="inline-flex items-center gap-1"><Video className="size-3.5" />{lang === 'ms' ? 'Dalam Talian' : 'Online'}</span>}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate('my-attendance', { sessionId: s.id })}>
                      {lang === 'ms' ? 'Daftar' : 'Check In'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Recent certificates */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="size-5 text-primary" />
              <h2 className="font-semibold text-lg">{lang === 'ms' ? 'Sijil Terkini' : 'Recent Certificates'}</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('my-certificates')}>
              {lang === 'ms' ? 'Semua' : 'All'} <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>
          {certificates.length === 0 ? (
            <EmptyState icon={Award} title={lang === 'ms' ? 'Belum ada sijil' : 'No certificates yet'} description={lang === 'ms' ? 'Selesaikan kursus untuk menerima sijil.' : 'Complete courses to earn certificates.'} />
          ) : (
            <div className="space-y-3">
              {certificates.map((c) => (
                <div key={c.id} className="rounded-xl border border-border/60 bg-card/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted-foreground">{c.certNo}</div>
                      <h3 className="font-medium truncate">{c.course?.title}</h3>
                      <div className="text-xs text-muted-foreground mt-1">{lang === 'ms' ? 'Dikeluarkan' : 'Issued'} {formatDate(c.issuedAt, lang)}</div>
                    </div>
                    <Award className="size-8 text-emerald-500 shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {completedEnr.length > 0 && (
        <GlassCard className="p-4">
          <div className="text-xs text-muted-foreground">
            {lang === 'ms' ? `${completedEnr.length} kursus telah selesai.` : `${completedEnr.length} courses completed.`}
            <span className="ml-1">{lang === 'ms' ? 'Dikemaskini' : 'Updated'} {relativeTime(new Date())}</span>
          </div>
        </GlassCard>
      )}

      <Separator />
    </div>
  )
}

export default DashboardStaff
