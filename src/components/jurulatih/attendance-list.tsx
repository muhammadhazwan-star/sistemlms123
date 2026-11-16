'use client'
import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Upload, Download, FileText, BarChart3, ClipboardList, ArrowLeft, CheckCheck, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import Papa from 'papaparse'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, Legend } from 'recharts'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { t } from '@/lib/i18n'
import { formatDate, formatTime, statusColor, downloadFile, toCsv } from '@/lib/format'
import { PageHeader, GlassCard, LoadingState, ErrorState } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { Session, Attendance, User, AttendanceStatus, Lang } from '@/lib/types'

const STATUSES: AttendanceStatus[] = ['HADIR', 'LEWAT', 'TIDAK_HADIR', 'CUTI', 'DIKECUALIKAN']
const STATUS_COLORS: Record<AttendanceStatus, string> = {
  HADIR: '#10b981', LEWAT: '#f59e0b', TIDAK_HADIR: '#f43f5e', CUTI: '#0ea5e9', DIKECUALIKAN: '#8b5cf6',
}

interface Row {
  userId: string
  staffNo: string
  name: string
  department?: string
  status: AttendanceStatus
  checkInAt?: string | null
  method?: string
  remarks?: string
  attendanceId?: string
}

export function AttendanceList() {
  const { user, params, navigate } = useAppStore()
  const lang = (user?.language as Lang) || 'ms'
  const qc = useQueryClient()

  const [sessionId, setSessionId] = React.useState<string>((params.sessionId as string) || '')

  const { data: listData } = useQuery({
    queryKey: ['sessions', 'att-list', user?.id],
    queryFn: () => api.sessions.list({ trainerId: user!.id }),
    enabled: !!user?.id && !sessionId,
  })
  const { data: sesData, isLoading, isError } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => api.sessions.get(sessionId),
    enabled: !!sessionId,
  })

  if (!sessionId) {
    const sessions: Session[] = listData?.sessions || []
    return (
      <div className="space-y-6">
        <PageHeader title={lang === 'ms' ? 'Senarai Kehadiran' : 'Attendance List'} subtitle={lang === 'ms' ? 'Pilih sesi.' : 'Select a session.'} />
        <GlassCard className="p-5">
          <Select value={sessionId} onValueChange={setSessionId}>
            <SelectTrigger><SelectValue placeholder="Pilih sesi..." /></SelectTrigger>
            <SelectContent>
              {sessions.length === 0 && <SelectItem value="none" disabled>Tiada sesi</SelectItem>}
              {sessions.map((s) => <SelectItem key={s.id} value={s.id}>{s.title} — {formatDate(s.date, lang)}</SelectItem>)}
            </SelectContent>
          </Select>
        </GlassCard>
      </div>
    )
  }

  if (isLoading) return <LoadingState label="Memuat kehadiran..." />
  if (isError || !sesData?.session) return <ErrorState message="Tidak dapat memuatkan sesi." />

  const session: Session = sesData.session

  return (
    <div className="space-y-6">
      <PageHeader
        title={session.title}
        subtitle={`${formatDate(session.date, lang)} · ${formatTime(session.startTime)} - ${formatTime(session.endTime)}`}
        action={
          <Button variant="outline" onClick={() => navigate('session-schedule')}>
            <ArrowLeft className="size-4 mr-1" /> {t('action.back', lang)}
          </Button>
        }
      />

      <AttendanceTabs session={session} lang={lang} onChanged={() => qc.invalidateQueries({ queryKey: ['session', sessionId] })} />
    </div>
  )
}

function AttendanceTabs({ session, lang, onChanged }: { session: Session; lang: Lang; onChanged: () => void }) {
  const attendances: Attendance[] = session.attendances || []
  const attendedCount = attendances.filter((a) => a.status === 'HADIR' || a.status === 'LEWAT').length

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-muted-foreground uppercase">Kapasiti</div>
          <div className="text-2xl font-bold mt-1">{session.capacity}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-muted-foreground uppercase">Berdaftar</div>
          <div className="text-2xl font-bold mt-1">{attendances.length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-muted-foreground uppercase">Hadir</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">{attendedCount}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-muted-foreground uppercase">Kadar Kehadiran</div>
          <div className="text-2xl font-bold mt-1">{attendances.length ? Math.round((attendedCount / attendances.length) * 100) : 0}%</div>
        </GlassCard>
      </div>

      <Tabs defaultValue="list">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="list"><ClipboardList className="size-4 mr-1.5" /> Senarai</TabsTrigger>
          <TabsTrigger value="import"><Upload className="size-4 mr-1.5" /> Import CSV</TabsTrigger>
          <TabsTrigger value="export"><Download className="size-4 mr-1.5" /> Eksport</TabsTrigger>
          <TabsTrigger value="summary"><BarChart3 className="size-4 mr-1.5" /> Ringkasan</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <ListTab session={session} lang={lang} onChanged={onChanged} />
        </TabsContent>
        <TabsContent value="import" className="mt-4">
          <ImportTab session={session} lang={lang} onChanged={onChanged} />
        </TabsContent>
        <TabsContent value="export" className="mt-4">
          <ExportTab session={session} lang={lang} />
        </TabsContent>
        <TabsContent value="summary" className="mt-4">
          <SummaryTab session={session} lang={lang} />
        </TabsContent>
      </Tabs>
    </>
  )
}

// ---------------- List Tab (ATT-05) ----------------
function ListTab({ session, lang, onChanged }: { session: Session; lang: Lang; onChanged: () => void }) {
  const qc = useQueryClient()

  // Build rows from existing attendances + enrolled users not yet recorded
  const [rows, setRows] = React.useState<Row[]>([])

  const { data: enrData } = useQuery({
    queryKey: ['enrollments', session.courseId],
    queryFn: () => session.courseId ? api.enrollments.list({ courseId: session.courseId }) : Promise.resolve({ enrollments: [] }),
    enabled: !!session.courseId,
  })

  React.useEffect(() => {
    const att: Attendance[] = session.attendances || []
    const enrUsers: User[] = (enrData?.enrollments || []).map((e: any) => e.user).filter(Boolean)
    const seenUserIds = new Set(att.map((a) => a.userId))
    const extraRows: Row[] = enrUsers
      .filter((u) => !seenUserIds.has(u.id))
      .map((u) => ({
        userId: u.id, staffNo: u.staffNo, name: u.name, department: u.department?.name,
        status: 'TIDAK_HADIR' as AttendanceStatus, checkInAt: null, remarks: '',
      }))
    const baseRows: Row[] = att.map((a) => ({
      userId: a.userId, staffNo: a.user?.staffNo || '', name: a.user?.name || '—', department: a.user?.department?.name,
      status: a.status, checkInAt: a.checkInAt, method: a.method, remarks: a.remarks || '', attendanceId: a.id,
    }))
    setRows([...baseRows, ...extraRows])
  }, [session, enrData])

  const bulkMut = useMutation({
    mutationFn: (records: any[]) => api.sessions.bulk(session.id, records),
    onSuccess: (res) => { toast.success(`${res.count} rekod kehadiran disimpan.`); onChanged() },
    onError: (e: Error) => toast.error(e.message),
  })

  const setRow = (i: number, patch: Partial<Row>) => setRows((r) => r.map((row, idx) => idx === i ? { ...row, ...patch } : row))

  const markAllPresent = () => {
    const now = new Date()
    const checkInAt = new Date(session.date); const [sh, sm] = session.startTime.split(':').map(Number); checkInAt.setHours(sh, sm, 0, 0)
    setRows((r) => r.map((row) => ({ ...row, status: 'HADIR' as AttendanceStatus, checkInAt: row.checkInAt || checkInAt.toISOString() })))
    toast.info('Semua ditandakan HADIR. Klik Simpan untuk sahkan.')
  }

  const save = () => {
    const records = rows.map((r) => ({
      userId: r.userId,
      status: r.status,
      checkInAt: r.checkInAt || undefined,
      remarks: r.remarks || undefined,
    }))
    bulkMut.mutate(records)
  }

  return (
    <GlassCard className="p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">{rows.length} staf dalam senarai.</div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={markAllPresent}><CheckCheck className="size-4 mr-1" /> Tandakan Semua Hadir</Button>
          <Button size="sm" className="gradient-primary text-white" onClick={save} disabled={bulkMut.isPending}>
            <Save className="size-4 mr-1" /> {bulkMut.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Tiada staf. Tugaskan kursus kepada staf dahulu.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Staf</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Jabatan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Daftar Masuk</TableHead>
                <TableHead>Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={r.userId}>
                  <TableCell className="font-mono text-xs">{r.staffNo}</TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-xs">{r.department || '-'}</TableCell>
                  <TableCell>
                    <Select value={r.status} onValueChange={(v) => setRow(i, { status: v as AttendanceStatus })}>
                      <SelectTrigger className="w-36"><SelectValue /><Badge className={statusColor(r.status)}>{t(`att.${r.status}`, lang)}</Badge></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`att.${s}`, lang)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs">{r.checkInAt ? formatTime(r.checkInAt) : '-'}</TableCell>
                  <TableCell><Input value={r.remarks || ''} onChange={(e) => setRow(i, { remarks: e.target.value })} placeholder="—" className="h-8 text-xs" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </GlassCard>
  )
}

// ---------------- Import Tab (ATT-06) ----------------
function ImportTab({ session, lang, onChanged }: { session: Session; lang: Lang; onChanged: () => void }) {
  const [preview, setPreview] = React.useState<{ rows: any[]; valid: number; errors: number; errorList: any[]; committed: boolean } | null>(null)
  const [rawRows, setRawRows] = React.useState<any[]>([])

  const importMut = useMutation({
    mutationFn: ({ rows, commit }: { rows: any[]; commit: boolean }) => api.sessions.importCsv(session.id, rows, commit),
    onSuccess: (res) => {
      setPreview({ rows: res.preview, valid: res.valid, errors: res.errors, errorList: res.errorList, committed: res.committed })
      if (res.committed) {
        toast.success(`${res.valid} rekod kehadiran diimport.`)
        onChanged()
      } else {
        toast.info(`Pratonton: ${res.valid} sah, ${res.errors} ralat.`)
      }
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const onFile = (file: File) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as string[][]
        if (data.length < 2) { toast.error('CSV kosong atau tiada pengepala.'); return }
        const [, ...rows] = data
        const parsed = rows.map((r) => ({
          staffNo: r[0] || '', status: (r[1] || '').toUpperCase(), checkIn: r[2] || '', remarks: r[3] || '',
        }))
        setRawRows(parsed)
        importMut.mutate({ rows: parsed, commit: false })
      },
      error: (err: Error) => toast.error(`Gagal menghuraikan CSV: ${err.message}`),
    })
  }

  const downloadTemplate = () => {
    const csv = toCsv([
      ['staffNo', 'status', 'checkIn', 'remarks'],
      ['STF001', 'HADIR', '09:05', ''],
      ['STF002', 'LEWAT', '09:25', 'Trafik'],
      ['STF003', 'TIDAK_HADIR', '', 'MC'],
    ])
    downloadFile(csv, 'templat-kehadiran.csv', 'text/csv')
  }

  return (
    <GlassCard className="p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">Import Kehadiran dari CSV</h3>
          <p className="text-xs text-muted-foreground mt-1">Lajur: <code>staffNo, status, checkIn, remarks</code>. Status: HADIR, LEWAT, TIDAK_HADIR, CUTI, DIKECUALIKAN.</p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate}><Download className="size-4 mr-1" /> Muat Turun Templat CSV</Button>
      </div>

      <div>
        <Label htmlFor="csv-upload">Pilih fail CSV</Label>
        <Input id="csv-upload" type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      </div>

      {preview && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border/60 bg-card/40 p-3">
              <div className="text-xs text-muted-foreground">Jumlah Baris</div>
              <div className="text-xl font-bold">{rawRows.length}</div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
              <div className="text-xs text-emerald-700">Sah</div>
              <div className="text-xl font-bold text-emerald-700">{preview.valid}</div>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-3">
              <div className="text-xs text-rose-700">Ralat</div>
              <div className="text-xl font-bold text-rose-700">{preview.errors}</div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto scrollbar-thin rounded-lg border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Staf</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Status Semakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.rows.map((r, i) => (
                  <TableRow key={i} className={r.valid ? '' : 'bg-rose-50/40'}>
                    <TableCell className="font-mono text-xs">{r.staffNo}</TableCell>
                    <TableCell className="text-xs">{r.name || '-'}</TableCell>
                    <TableCell className="text-xs">{r.status}</TableCell>
                    <TableCell>
                      {r.valid ? <Badge className="bg-emerald-100 text-emerald-700">Sah</Badge> : <Badge className="bg-rose-100 text-rose-700">{r.reason}</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {!preview.committed && preview.valid > 0 && (
            <Button className="gradient-primary text-white" disabled={importMut.isPending} onClick={() => importMut.mutate({ rows: rawRows, commit: true })}>
              <Save className="size-4 mr-1" /> {importMut.isPending ? 'Menyimpan...' : 'Sahkan & Simpan'}
            </Button>
          )}
        </div>
      )}
    </GlassCard>
  )
}

// ---------------- Export Tab (ATT-07) ----------------
function ExportTab({ session, lang }: { session: Session; lang: Lang }) {
  return (
    <GlassCard className="p-6 space-y-4">
      <div>
        <h3 className="font-semibold">Eksport Kehadiran</h3>
        <p className="text-xs text-muted-foreground mt-1">Muat turun senarai kehadiran sesi ini dalam format CSV atau PDF.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button className="gradient-primary text-white" onClick={() => window.open(api.sessions.exportUrl(session.id, 'csv'), '_blank')}>
          <FileText className="size-4 mr-1" /> Eksport CSV
        </Button>
        <Button variant="outline" onClick={() => window.open(api.sessions.exportUrl(session.id, 'pdf'), '_blank')}>
          <FileText className="size-4 mr-1" /> Eksport PDF
        </Button>
      </div>
    </GlassCard>
  )
}

// ---------------- Summary Tab (ATT-11) ----------------
function SummaryTab({ session, lang }: { session: Session; lang: Lang }) {
  const attendances: Attendance[] = session.attendances || []
  const counts = STATUSES.map((s) => ({
    name: t(`att.${s}`, lang),
    key: s,
    value: attendances.filter((a) => a.status === s).length,
  })).filter((c) => c.value > 0)
  const total = attendances.length
  const attended = attendances.filter((a) => a.status === 'HADIR' || a.status === 'LEWAT').length
  const rate = total ? Math.round((attended / total) * 100) : 0

  return (
    <div className="space-y-4">
      {rate < 80 && total > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Kadar Kehadiran Rendah</AlertTitle>
          <AlertDescription>Kadar kehadiran ({rate}%) di bawah ambang 80%. Sila semak senarai staf yang tidak hadir.</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <div className="text-xs text-muted-foreground uppercase">Jumlah Staf</div>
          <div className="text-3xl font-bold mt-1">{total}</div>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="text-xs text-muted-foreground uppercase">Hadir / Lewat</div>
          <div className="text-3xl font-bold mt-1 text-emerald-600">{attended}</div>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="text-xs text-muted-foreground uppercase">Kadar Kehadiran</div>
          <div className={`text-3xl font-bold mt-1 ${rate < 80 ? 'text-rose-600' : 'text-emerald-600'}`}>{rate}%</div>
        </GlassCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <h3 className="font-semibold mb-3">Berdikut Status</h3>
          {counts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Tiada data.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={counts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e: any) => `${e.name}: ${e.value}`}>
                    {counts.map((c) => <Cell key={c.key} fill={STATUS_COLORS[c.key]} />)}
                  </Pie>
                  <Legend />
                  <RTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="font-semibold mb-3">Bilangan per Status</h3>
          {counts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Tiada data.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={counts}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <RTooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {counts.map((c) => <Cell key={c.key} fill={STATUS_COLORS[c.key]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}

export default AttendanceList
