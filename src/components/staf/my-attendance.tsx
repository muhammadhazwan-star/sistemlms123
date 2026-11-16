'use client'
import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CalendarClock, ClipboardList, KeyRound, QrCode, CheckCircle2, AlertTriangle, History,
  Clock, MapPin, Video, ListChecks, MessageSquare
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { t } from '@/lib/i18n'
import { formatDate, formatDateTime, formatTime, statusColor } from '@/lib/format'
import { PageHeader, GlassCard, EmptyState, LoadingState, ErrorState } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import type { Attendance, Session, AttendanceStatus, Lang } from '@/lib/types'

const ATT_STATUSES: AttendanceStatus[] = ['HADIR', 'LEWAT', 'TIDAK_HADIR', 'CUTI', 'DIKECUALIKAN']

export function MyAttendance() {
  const { user, params } = useAppStore()
  const lang = (user?.language as Lang) || 'ms'
  const preselectSessionId = params?.sessionId as string | undefined
  const qc = useQueryClient()

  const { data: attData, isLoading: attLoading, isError: attError } = useQuery({
    queryKey: ['attendance', user?.id],
    queryFn: () => api.attendance.list({ userId: user!.id }),
    enabled: !!user?.id,
  })
  const { data: sesData } = useQuery({
    queryKey: ['sessions', 'all'],
    queryFn: () => api.sessions.list({ period: 'all' }),
  })

  const checkInMut = useMutation({
    mutationFn: (vars: { sessionId: string; payload: { code6?: string; qrToken?: string } }) =>
      api.sessions.checkIn(vars.sessionId, vars.payload),
    onSuccess: (res) => {
      if (res.late) toast.warning(lang === 'ms' ? 'Daftar berjaya tetapi lewat!' : 'Checked in but late!')
      else toast.success(lang === 'ms' ? 'Kehadiran berjaya didaftarkan!' : 'Attendance recorded!')
      qc.invalidateQueries({ queryKey: ['attendance', user?.id] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const correctionMut = useMutation({
    mutationFn: (vars: { attendanceId: string; newStatus: string; reason: string }) =>
      api.attendance.requestCorrection(vars.attendanceId, vars.newStatus, vars.reason),
    onSuccess: () => {
      toast.success(lang === 'ms' ? 'Permohonan pembetulan dihantar' : 'Correction request submitted')
      qc.invalidateQueries({ queryKey: ['attendance', user?.id] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (attLoading) return <LoadingState label={lang === 'ms' ? 'Memuat kehadiran...' : 'Loading attendance...'} />
  if (attError) return <ErrorState message={lang === 'ms' ? 'Tidak dapat memuatkan kehadiran.' : 'Failed to load attendance.'} />

  const attendances: Attendance[] = attData?.attendances || []
  const sessions: Session[] = (sesData?.sessions || []).filter((s) => {
    const d = new Date(s.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return d >= today
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.myAttendance', lang)}
        subtitle={lang === 'ms' ? 'Daftar kehadiran sesi dan lihat sejarah.' : 'Check into sessions and view history.'}
      />

      {/* Check-in card */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="size-5 text-primary" />
          <h2 className="font-semibold text-lg">{lang === 'ms' ? 'Daftar Kehadiran Sesi' : 'Session Check-In'}</h2>
        </div>

        <Tabs defaultValue={preselectSessionId ? 'pick' : 'code'}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="code"><KeyRound className="size-3.5 mr-1" /> {lang === 'ms' ? 'Kod Sesi' : 'Session Code'}</TabsTrigger>
            <TabsTrigger value="qr"><QrCode className="size-3.5 mr-1" /> {lang === 'ms' ? 'Imbas QR' : 'Scan QR'}</TabsTrigger>
            <TabsTrigger value="pick"><ListChecks className="size-3.5 mr-1" /> {lang === 'ms' ? 'Pilih Sesi' : 'Pick Session'}</TabsTrigger>
          </TabsList>

          {/* Code method */}
          <TabsContent value="code" className="mt-4">
            <CodeCheckIn lang={lang} sessions={sessions} onSubmit={(sessionId, code6) => checkInMut.mutate({ sessionId, payload: { code6 } })} pending={checkInMut.isPending} />
          </TabsContent>

          {/* QR fallback */}
          <TabsContent value="qr" className="mt-4">
            <div className="rounded-xl border border-dashed border-border p-6 text-center bg-card/40">
              <QrCode className="size-12 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">{lang === 'ms' ? 'Imbasan QR' : 'QR Scan'}</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                {lang === 'ms'
                  ? 'Demo: gunakan kod sesi 6-digit yang dipaparkan oleh jurulatih. Masukkan kod di bawah atau pilih sesi dari senarai.'
                  : 'Demo: use the 6-digit session code shown by the trainer. Enter below or pick from the list.'}
              </p>
              <CodeCheckIn lang={lang} sessions={sessions} onSubmit={(sessionId, code6) => checkInMut.mutate({ sessionId, payload: { code6 } })} pending={checkInMut.isPending} />
            </div>
          </TabsContent>

          {/* Pick session */}
          <TabsContent value="pick" className="mt-4">
            <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin pr-1">
              {sessions.length === 0 ? (
                <EmptyState icon={CalendarClock} title={lang === 'ms' ? 'Tiada sesi tersedia' : 'No sessions available'} description={lang === 'ms' ? 'Tiada sesi hari ini atau akan datang.' : 'No sessions today or upcoming.'} />
              ) : sessions.map((s) => (
                <div key={s.id} className="rounded-xl border border-border/60 bg-card/40 p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant="outline" className="text-[10px]">{t(`session.${s.mode}`, lang)}</Badge>
                      {s.course && <Badge variant="secondary" className="text-[10px]">{s.course.code}</Badge>}
                    </div>
                    <div className="font-medium text-sm truncate">{s.title}</div>
                    <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3">
                      <span className="inline-flex items-center gap-1"><CalendarClock className="size-3" />{formatDate(s.date, lang)}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="size-3" />{formatTime(s.startTime)}</span>
                      {s.location && <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{s.location}</span>}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={checkInMut.isPending}
                    onClick={() => checkInMut.mutate({ sessionId: s.id, payload: { code6: s.code6 } })}
                  >
                    {lang === 'ms' ? 'Daftar' : 'Check In'}
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </GlassCard>

      {/* History */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <History className="size-5 text-primary" />
          <h2 className="font-semibold text-lg">{lang === 'ms' ? 'Sejarah Kehadiran Saya' : 'My Attendance History'}</h2>
        </div>
        {attendances.length === 0 ? (
          <EmptyState icon={History} title={lang === 'ms' ? 'Tiada rekod kehadiran' : 'No attendance records'} description={lang === 'ms' ? 'Rekod kehadiran anda akan dipaparkan di sini.' : 'Your attendance records will appear here.'} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{lang === 'ms' ? 'Tarikh' : 'Date'}</TableHead>
                  <TableHead>{lang === 'ms' ? 'Sesi' : 'Session'}</TableHead>
                  <TableHead>{lang === 'ms' ? 'Kursus' : 'Course'}</TableHead>
                  <TableHead>{t('label.status', lang)}</TableHead>
                  <TableHead>{lang === 'ms' ? 'Daftar Masuk' : 'Check-In'}</TableHead>
                  <TableHead>{lang === 'ms' ? 'Kaedah' : 'Method'}</TableHead>
                  <TableHead className="text-right">{t('label.actions', lang)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendances.map((a) => (
                  <AttendanceRow key={a.id} attendance={a} lang={lang} onCorrect={(newStatus, reason) => correctionMut.mutate({ attendanceId: a.id, newStatus, reason })} pending={correctionMut.isPending} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCard>
    </div>
  )
}

function CodeCheckIn({ lang, sessions, onSubmit, pending }: {
  lang: Lang
  sessions: Session[]
  onSubmit: (sessionId: string, code6: string) => void
  pending: boolean
}) {
  const [code, setCode] = React.useState('')
  const submit = () => {
    const c = code.trim()
    if (c.length !== 6) {
      toast.error(lang === 'ms' ? 'Kod mesti 6 digit' : 'Code must be 6 digits')
      return
    }
    const session = sessions.find((s) => s.code6 === c)
    if (!session) {
      toast.error(lang === 'ms' ? 'Sesi tidak dijumpai untuk kod ini' : 'No session found for this code')
      return
    }
    onSubmit(session.id, c)
  }
  return (
    <div className="space-y-3 max-w-md">
      <div className="space-y-1.5">
        <Label htmlFor="code6">{lang === 'ms' ? 'Kod Sesi 6-Digit' : '6-Digit Session Code'}</Label>
        <Input
          id="code6"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          className="text-center text-lg font-mono tracking-widest"
          inputMode="numeric"
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
        />
      </div>
      <Button disabled={pending} onClick={submit}>
        {pending ? (lang === 'ms' ? 'Mendaftar...' : 'Checking in...') : (lang === 'ms' ? 'Daftar Kehadiran' : 'Check In')}
      </Button>
    </div>
  )
}

function AttendanceRow({ attendance, lang, onCorrect, pending }: {
  attendance: Attendance
  lang: Lang
  onCorrect: (newStatus: string, reason: string) => void
  pending: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [newStatus, setNewStatus] = React.useState<string>(attendance.status)
  const [reason, setReason] = React.useState('')
  const session = attendance.session

  const submit = () => {
    if (!reason.trim()) { toast.error(lang === 'ms' ? 'Sila berikan sebab' : 'Please provide a reason'); return }
    onCorrect(newStatus, reason)
    setOpen(false)
    setReason('')
  }

  return (
    <TableRow>
      <TableCell className="whitespace-nowrap text-sm">{formatDate(session?.date, lang)}</TableCell>
      <TableCell className="text-sm font-medium">{session?.title}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{session?.course?.code || '-'}</TableCell>
      <TableCell><Badge className={statusColor(attendance.status)}>{t(`att.${attendance.status}`, lang)}</Badge></TableCell>
      <TableCell className="text-sm whitespace-nowrap">{attendance.checkInAt ? formatDateTime(attendance.checkInAt, lang) : '-'}</TableCell>
      <TableCell className="text-xs text-muted-foreground uppercase">{attendance.method}</TableCell>
      <TableCell className="text-right">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm"><MessageSquare className="size-3.5 mr-1" /> {lang === 'ms' ? 'Pembetulan' : 'Request Correction'}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{lang === 'ms' ? 'Minta Pembetulan Kehadiran' : 'Request Attendance Correction'}</DialogTitle>
              <DialogDescription>
                {session?.title} · {formatDate(session?.date, lang)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label>{lang === 'ms' ? 'Status Semasa' : 'Current Status'}</Label>
                <div className="text-sm"><Badge className={statusColor(attendance.status)}>{t(`att.${attendance.status}`, lang)}</Badge></div>
              </div>
              <div className="space-y-1.5">
                <Label>{lang === 'ms' ? 'Status Baru' : 'New Status'}</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ATT_STATUSES.filter((s) => s !== attendance.status).map((s) => (
                      <SelectItem key={s} value={s}>{t(`att.${s}`, lang)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{lang === 'ms' ? 'Sebab' : 'Reason'}</Label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder={lang === 'ms' ? 'Nyatakan sebab pembetulan...' : 'Explain the reason for correction...'} />
              </div>
              <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-2 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
                {lang === 'ms' ? 'Permohonan akan dihantar ke HR untuk kelulusan.' : 'Request will be sent to HR for approval.'}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>{t('action.cancel', lang)}</Button>
              <Button disabled={pending} onClick={submit}>{lang === 'ms' ? 'Hantar Permohonan' : 'Submit Request'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TableCell>
    </TableRow>
  )
}

export default MyAttendance
