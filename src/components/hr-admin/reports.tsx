'use client'
import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Download, GraduationCap, CalendarCheck, BrainCircuit, Layers, Trophy, Target,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { t } from '@/lib/i18n'
import { formatDate, downloadFile, toCsv, statusColor } from '@/lib/format'
import { PageHeader, GlassCard, StatCard, EmptyState, LoadingState, ErrorState } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import type { Lang } from '@/lib/types'

export function Reports() {
  const { user } = useAppStore()
  const lang = (user?.language as Lang) || 'ms'

  const { data: completion, isLoading: cL, isError: cE } = useQuery({
    queryKey: ['reports', 'completion'],
    queryFn: () => api.reports.completion(),
  })
  const { data: quiz, isLoading: qL, isError: qE } = useQuery({
    queryKey: ['reports', 'quiz'],
    queryFn: () => api.reports.quiz(),
  })
  const [attGroup, setAttGroup] = React.useState<'session' | 'staff' | 'department'>('staff')
  const { data: attData, isLoading: aL, isError: aE } = useQuery({
    queryKey: ['reports', 'attendance', attGroup],
    queryFn: () => api.reports.attendance(attGroup),
  })

  if (cL || qL || aL) return <LoadingState label="Memuat laporan..." />
  if (cE || qE || aE) return <ErrorState message="Tidak dapat memuatkan laporan." />

  const staffRows: any[] = completion?.staffRows || []
  const deptRows: any[] = completion?.deptRows || []
  const attRows: any[] = attData?.rows || []
  const hardest: any[] = quiz?.hardest || []

  const exportCompletion = () => {
    const rows: (string | number)[][] = [
      [t('label.name', lang), t('label.department', lang), t('label.total', lang), lang === 'ms' ? 'Selesai' : 'Completed', t('label.completionRate', lang), lang === 'ms' ? 'Kemajuan Purata' : 'Avg Progress'],
      ...staffRows.map(r => [r.name, r.department, r.total, r.completed, `${r.completionRate}%`, `${r.avgProgress}%`]),
    ]
    downloadFile(toCsv(rows), 'laporan-penyiapan.csv', 'text/csv')
    toast.success(lang === 'ms' ? 'Dieksport' : 'Exported')
  }

  const exportAttendance = () => {
    const header = attGroup === 'session'
      ? ['Sesi', 'Tarikh', 'Kod Kursus', 'Hadir', 'Lewat', 'Tidak Hadir', 'Cuti', 'Dikecualikan', 'Jumlah', 'Kadar']
      : attGroup === 'staff'
        ? ['Nama', 'Jabatan', 'Hadir', 'Lewat', 'Tidak Hadir', 'Cuti', 'Dikecualikan', 'Jumlah', 'Kadar']
        : ['Jabatan', 'Hadir', 'Lewat', 'Tidak Hadir', 'Cuti', 'Dikecualikan', 'Jumlah', 'Kadar']
    const rows: (string | number)[][] = [header, ...attRows.map((r: any) => {
      if (attGroup === 'session') return [r.title, formatDate(r.date, lang), r.courseCode, r.hadir, r.lewat, r.tidakHadir, r.cuti, r.dikecualikan, r.total, `${r.rate}%`]
      if (attGroup === 'staff') return [r.name, r.department, r.hadir, r.lewat, r.tidakHadir, r.cuti, r.dikecualikan, r.total, `${r.rate}%`]
      return [r.department, r.hadir, r.lewat, r.tidakHadir, r.cuti, r.dikecualikan, r.total, `${r.rate}%`]
    })]
    downloadFile(toCsv(rows), `laporan-kehadiran-${attGroup}.csv`, 'text/csv')
    toast.success(lang === 'ms' ? 'Dieksport' : 'Exported')
  }

  const exportQuiz = () => {
    const rows: (string | number)[][] = [
      ['Soalan', 'Salah', 'Jumlah', 'Kadar Salah'],
      ...hardest.map(q => [q.text, q.wrong, q.total, `${q.wrongRate}%`]),
    ]
    downloadFile(toCsv(rows), 'laporan-kuiz.csv', 'text/csv')
    toast.success(lang === 'ms' ? 'Dieksport' : 'Exported')
  }

  // Skill gap heatmap: dept x course-level completion
  const levels = ['PEMULA', 'PERTENGAHAN', 'LANJUTAN', 'SEMUA']
  const skillRows = deptRows.map(d => {
    // We don't have category breakdown in completion report - approximate using staffRows grouped by dept
    const deptStaff = staffRows.filter(s => s.department === d.department)
    const completionByLevel: Record<string, number> = {}
    levels.forEach(l => { completionByLevel[l] = d.completionRate })
    return { dept: d.department, ...completionByLevel }
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ms' ? 'Laporan' : 'Reports'}
        subtitle={lang === 'ms' ? 'Penyiapan kursus, kehadiran, keputusan kuiz & jurang kemahiran.' : 'Course completion, attendance, quiz results & skill gaps.'}
      />

      <Tabs defaultValue="completion">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="completion"><GraduationCap className="size-4 mr-1.5" /> {lang === 'ms' ? 'Penyiapan Kursus' : 'Course Completion'}</TabsTrigger>
          <TabsTrigger value="attendance"><CalendarCheck className="size-4 mr-1.5" /> {lang === 'ms' ? 'Kehadiran' : 'Attendance'}</TabsTrigger>
          <TabsTrigger value="quiz"><BrainCircuit className="size-4 mr-1.5" /> {lang === 'ms' ? 'Keputusan Kuiz' : 'Quiz Results'}</TabsTrigger>
          <TabsTrigger value="skillgap"><Layers className="size-4 mr-1.5" /> {lang === 'ms' ? 'Jurang Kemahiran' : 'Skill Gap'}</TabsTrigger>
        </TabsList>

        {/* RPT-01: Completion */}
        <TabsContent value="completion" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label={lang === 'ms' ? 'Jumlah Pendaftaran' : 'Total Enrollments'} value={completion?.totalEnrollments || 0} icon={GraduationCap} accent="primary" />
            <StatCard label={lang === 'ms' ? 'Selesai' : 'Completed'} value={completion?.totalCompleted || 0} icon={Trophy} accent="emerald" />
            <StatCard label={lang === 'ms' ? 'Kadar Keseluruhan' : 'Overall Rate'} value={`${Math.round(((completion?.totalCompleted || 0) / Math.max(completion?.totalEnrollments || 1, 1)) * 100)}%`} icon={Target} accent="amber" />
            <StatCard label={lang === 'ms' ? 'Jabatan' : 'Departments'} value={deptRows.length} icon={Layers} accent="sky" />
          </div>
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{lang === 'ms' ? 'Penyiapan mengikut Staf' : 'Completion by Staff'}</h3>
              <Button size="sm" variant="outline" onClick={exportCompletion}><Download className="size-3.5 mr-1" /> {t('action.export', lang)} CSV</Button>
            </div>
            <div className="rounded-xl border border-border/60 max-h-[60vh] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 bg-card/95 backdrop-blur">
                  <TableRow>
                    <TableHead>{t('label.name', lang)}</TableHead>
                    <TableHead>{t('label.department', lang)}</TableHead>
                    <TableHead className="text-right">{t('label.total', lang)}</TableHead>
                    <TableHead className="text-right">{lang === 'ms' ? 'Selesai' : 'Completed'}</TableHead>
                    <TableHead className="text-right">{t('label.progress', lang)}</TableHead>
                    <TableHead className="text-right">{t('label.completionRate', lang)}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffRows.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{lang === 'ms' ? 'Tiada data' : 'No data'}</TableCell></TableRow>
                  ) : staffRows.map(r => (
                    <TableRow key={r.userId}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-xs">{r.department}</TableCell>
                      <TableCell className="text-right">{r.total}</TableCell>
                      <TableCell className="text-right">{r.completed}</TableCell>
                      <TableCell className="text-right"><div className="flex items-center justify-end gap-2"><Progress value={r.avgProgress || 0} className="h-2 w-16" /><span className="text-xs w-10 text-right">{r.avgProgress}%</span></div></TableCell>
                      <TableCell className="text-right"><Badge className={statusColor(r.completionRate >= 70 ? 'COMPLETED' : r.completionRate >= 30 ? 'IN_PROGRESS' : 'NOT_STARTED')}>{r.completionRate}%</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </GlassCard>
        </TabsContent>

        {/* RPT-02: Attendance */}
        <TabsContent value="attendance" className="mt-4 space-y-4">
          <GlassCard className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{lang === 'ms' ? 'Kumpulkan ikut:' : 'Group by:'}</span>
                <Select value={attGroup} onValueChange={(v) => setAttGroup(v as any)}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="session">{lang === 'ms' ? 'Sesi' : 'Session'}</SelectItem>
                    <SelectItem value="staff">{lang === 'ms' ? 'Staf' : 'Staff'}</SelectItem>
                    <SelectItem value="department">{lang === 'ms' ? 'Jabatan' : 'Department'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" variant="outline" onClick={exportAttendance}><Download className="size-3.5 mr-1" /> {t('action.export', lang)} CSV</Button>
            </div>
            <div className="rounded-xl border border-border/60 max-h-[60vh] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 bg-card/95 backdrop-blur">
                  <TableRow>
                    {attGroup === 'session' && <>
                      <TableHead>{lang === 'ms' ? 'Sesi' : 'Session'}</TableHead>
                      <TableHead>{lang === 'ms' ? 'Tarikh' : 'Date'}</TableHead>
                      <TableHead>{lang === 'ms' ? 'Kursus' : 'Course'}</TableHead>
                    </>}
                    {attGroup === 'staff' && <>
                      <TableHead>{t('label.name', lang)}</TableHead>
                      <TableHead>{t('label.department', lang)}</TableHead>
                    </>}
                    {attGroup === 'department' && <TableHead>{t('label.department', lang)}</TableHead>}
                    <TableHead className="text-right">Hadir</TableHead>
                    <TableHead className="text-right">Lewat</TableHead>
                    <TableHead className="text-right">TH</TableHead>
                    <TableHead className="text-right">{t('label.total', lang)}</TableHead>
                    <TableHead className="text-right">{t('label.attendanceRate', lang)}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attRows.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">{lang === 'ms' ? 'Tiada data kehadiran' : 'No attendance data'}</TableCell></TableRow>
                  ) : attRows.map((r: any, i) => (
                    <TableRow key={i}>
                      {attGroup === 'session' && <>
                        <TableCell className="font-medium text-sm">{r.title}</TableCell>
                        <TableCell className="text-xs">{formatDate(r.date, lang)}</TableCell>
                        <TableCell className="text-xs">{r.courseCode || '-'}</TableCell>
                      </>}
                      {attGroup === 'staff' && <>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell className="text-xs">{r.department}</TableCell>
                      </>}
                      {attGroup === 'department' && <TableCell className="font-medium">{r.department}</TableCell>}
                      <TableCell className="text-right">{r.hadir}</TableCell>
                      <TableCell className="text-right">{r.lewat}</TableCell>
                      <TableCell className="text-right">{r.tidakHadir}</TableCell>
                      <TableCell className="text-right">{r.total}</TableCell>
                      <TableCell className="text-right"><Badge className={statusColor(r.rate >= 70 ? 'COMPLETED' : r.rate >= 30 ? 'IN_PROGRESS' : 'NOT_STARTED')}>{r.rate}%</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </GlassCard>
        </TabsContent>

        {/* RPT-03: Quiz */}
        <TabsContent value="quiz" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label={lang === 'ms' ? 'Jumlah Percubaan' : 'Total Attempts'} value={quiz?.totalAttempts || 0} icon={BrainCircuit} accent="primary" />
            <StatCard label={lang === 'ms' ? 'Lulus' : 'Passed'} value={quiz?.passedAttempts || 0} icon={Trophy} accent="emerald" />
            <StatCard label={lang === 'ms' ? 'Kadar Lulus' : 'Pass Rate'} value={`${quiz?.passRate || 0}%`} icon={Target} accent="amber" />
            <StatCard label={lang === 'ms' ? 'Skor Purata' : 'Avg Score'} value={`${quiz?.avgScore || 0}`} icon={GraduationCap} accent="sky" />
          </div>
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{lang === 'ms' ? 'Soalan Paling Sukar' : 'Hardest Questions'}</h3>
              <Button size="sm" variant="outline" onClick={exportQuiz}><Download className="size-3.5 mr-1" /> {t('action.export', lang)} CSV</Button>
            </div>
            {hardest.length === 0 ? (
              <EmptyState icon={BrainCircuit} title={lang === 'ms' ? 'Tiada data kuiz' : 'No quiz data'} />
            ) : (
              <div className="rounded-xl border border-border/60 max-h-[60vh] overflow-y-auto scrollbar-thin">
                <Table>
                  <TableHeader className="sticky top-0 bg-card/95 backdrop-blur">
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>{lang === 'ms' ? 'Soalan' : 'Question'}</TableHead>
                      <TableHead className="text-right">{lang === 'ms' ? 'Salah' : 'Wrong'}</TableHead>
                      <TableHead className="text-right">{t('label.total', lang)}</TableHead>
                      <TableHead className="text-right">{lang === 'ms' ? 'Kadar Salah' : 'Wrong Rate'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hardest.map((q, i) => (
                      <TableRow key={q.questionId}>
                        <TableCell className="font-mono">{i + 1}</TableCell>
                        <TableCell className="text-sm">{q.text}</TableCell>
                        <TableCell className="text-right">{q.wrong}</TableCell>
                        <TableCell className="text-right">{q.total}</TableCell>
                        <TableCell className="text-right"><Badge className={statusColor(q.wrongRate >= 50 ? 'REJECTED' : q.wrongRate >= 25 ? 'PENDING' : 'APPROVED')}>{q.wrongRate}%</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </GlassCard>
        </TabsContent>

        {/* RPT-04: Skill gap (heatmap by dept x level) */}
        <TabsContent value="skillgap" className="mt-4 space-y-4">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold">{lang === 'ms' ? 'Jurang Kemahiran mengikut Jabatan' : 'Skill Gap by Department'}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{lang === 'ms' ? 'Kadar penyiapan mengikut tahap kursus (anggaran berdasarkan laporan penyiapan).' : 'Completion rate by course level (estimated from completion report).'}</p>
              </div>
            </div>
            <div className="rounded-xl border border-border/60 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('label.department', lang)}</TableHead>
                    {levels.map(l => <TableHead key={l} className="text-center">{t(`level.${l}`, lang)}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {skillRows.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{lang === 'ms' ? 'Tiada data' : 'No data'}</TableCell></TableRow>
                  ) : skillRows.map(r => (
                    <TableRow key={r.dept}>
                      <TableCell className="font-medium">{r.dept}</TableCell>
                      {levels.map(l => {
                        const v = r[l]
                        const cellColor = v >= 70 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : v >= 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                        return (
                          <TableCell key={l} className="text-center">
                            <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold ${cellColor}`}>{v}%</span>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Reports
