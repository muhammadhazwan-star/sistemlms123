'use client'
import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle, Database, Loader2, CheckCircle2, XCircle, RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { t } from '@/lib/i18n'
import { PageHeader, GlassCard, LoadingState, ErrorState } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import type { Lang } from '@/lib/types'

export function ResetData() {
  const { user } = useAppStore()
  const lang = (user?.language as Lang) || 'ms'
  const qc = useQueryClient()

  const { data: enrData, isLoading: eL } = useQuery({ queryKey: ['enrollments', 'all'], queryFn: () => api.enrollments.list({}) })
  const { data: attData, isLoading: aL } = useQuery({ queryKey: ['attendance', 'all'], queryFn: () => api.attendance.list({}) })
  const { data: certData, isLoading: cL } = useQuery({ queryKey: ['certificates', 'all'], queryFn: () => api.certificates.list() })
  const { data: sesData, isLoading: sL } = useQuery({ queryKey: ['sessions', 'all-reset'], queryFn: () => api.sessions.list({}) })

  const resetMut = useMutation({
    mutationFn: () => api.admin.reset(),
    onSuccess: () => {
      toast.success(lang === 'ms' ? 'Data dummy telah direset' : 'Dummy data has been reset')
      qc.invalidateQueries()
    },
    onError: (e: any) => toast.error(e?.message || 'Ralat'),
  })

  if (eL || aL || cL || sL) return <LoadingState label="Memuatkan kiraan data..." />
  if (!enrData || !attData || !certData || !sesData) return <ErrorState message="Tidak dapat memuatkan kiraan data." />

  const counts = [
    { label: lang === 'ms' ? 'Pendaftaran Kursus' : 'Course Enrollments', count: (enrData.enrollments || []).length },
    { label: lang === 'ms' ? 'Rekod Kehadiran' : 'Attendance Records', count: (attData.attendances || []).length },
    { label: lang === 'ms' ? 'Sijil' : 'Certificates', count: (certData.certificates || []).length },
    { label: lang === 'ms' ? 'Sesi' : 'Sessions', count: (sesData.sessions || []).length },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ms' ? 'Reset Data Dummy' : 'Reset Dummy Data'}
        subtitle={lang === 'ms' ? 'Padam semua data transaksi dan kembali ke keadaan dummy.' : 'Erase all transactional data and return to dummy state.'}
      />

      <Alert variant="destructive" className="glass">
        <AlertTriangle className="size-4" />
        <AlertTitle>{lang === 'ms' ? 'Amaran Penting' : 'Important Warning'}</AlertTitle>
        <AlertDescription>
          {lang === 'ms'
            ? 'Tindakan ini akan memadam SEMUA data transaksi. Tindakan ini TIDAK BOLEH dibuat asal. Pastikan anda membuat sandaran jika perlu.'
            : 'This action will delete ALL transactional data. This CANNOT be undone. Backup if necessary.'}
        </AlertDescription>
      </Alert>

      <div className="grid sm:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="size-5 text-rose-500" />
            <h2 className="font-semibold text-lg">{lang === 'ms' ? 'Akan Dipadam' : 'Will Be Deleted'}</h2>
          </div>
          <div className="space-y-2">
            {counts.map(c => (
              <div key={c.label} className="flex items-center justify-between rounded-lg bg-rose-50 dark:bg-rose-900/20 px-3 py-2">
                <span className="text-sm">{c.label}</span>
                <Badge variant="secondary" className="font-mono">{c.count}</Badge>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg bg-rose-50 dark:bg-rose-900/20 px-3 py-2">
              <span className="text-sm">{lang === 'ms' ? 'Log Audit & Pemberitahuan' : 'Audit Logs & Notifications'}</span>
              <Badge variant="secondary">—</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-rose-50 dark:bg-rose-900/20 px-3 py-2">
              <span className="text-sm">{lang === 'ms' ? 'Kursus, Modul, Kuiz' : 'Courses, Modules, Quizzes'}</span>
              <Badge variant="secondary">—</Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {lang === 'ms'
              ? 'Nota: Endpoint reset semasa juga memadam kursus, modul dan kuiz untuk membolehkan re-seed penuh.'
              : 'Note: Current reset endpoint also clears courses, modules and quizzes for full re-seed.'}
          </p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="size-5 text-emerald-500" />
            <h2 className="font-semibold text-lg">{lang === 'ms' ? 'Akan Dikekalkan' : 'Will Be Kept'}</h2>
          </div>
          <div className="space-y-2">
            {[
              lang === 'ms' ? 'Pengguna (staf, jurulatih, HR, admin)' : 'Users (staff, trainers, HR, admin)',
              lang === 'ms' ? 'Jabatan' : 'Departments',
              lang === 'ms' ? 'Kategori Kursus' : 'Course Categories',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {lang === 'ms' ? 'Data induk dikekalkan supaya anda boleh terus menggunakan sistem.' : 'Master data is kept so you can continue using the system.'}
          </p>
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
              <Database className="size-5 text-rose-600" />
            </div>
            <div>
              <div className="font-semibold">{lang === 'ms' ? 'Reset Data Dummy' : 'Reset Dummy Data'}</div>
              <div className="text-xs text-muted-foreground">{lang === 'ms' ? 'Memerlukan pengesahan sebelum pelaksanaan.' : 'Requires confirmation before execution.'}</div>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={resetMut.isPending}>
                {resetMut.isPending ? <Loader2 className="size-4 mr-1 animate-spin" /> : <RefreshCw className="size-4 mr-1" />}
                {lang === 'ms' ? 'Reset Data Dummy' : 'Reset Dummy Data'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{lang === 'ms' ? 'Sahkan reset data?' : 'Confirm data reset?'}</AlertDialogTitle>
                <AlertDialogDescription>
                  {lang === 'ms'
                    ? 'Semua pendaftaran, kehadiran, sijil, sesi, kursus dan log audit akan dipadam secara kekal. Pengguna, jabatan dan kategori dikekalkan. Tindakan ini TIDAK boleh dibuat asal.'
                    : 'All enrollments, attendances, certificates, sessions, courses and audit logs will be permanently deleted. Users, departments and categories are kept. This CANNOT be undone.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('action.cancel', lang)}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                  onClick={() => resetMut.mutate()}
                >
                  {lang === 'ms' ? 'Ya, Reset Sekarang' : 'Yes, Reset Now'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </GlassCard>
    </div>
  )
}

export default ResetData
