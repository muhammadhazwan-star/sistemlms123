'use client'
import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ClipboardList, Check, X, ArrowRight, Inbox } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { t } from '@/lib/i18n'
import { formatDateTime, statusColor, relativeTime } from '@/lib/format'
import { PageHeader, GlassCard, EmptyState, LoadingState, ErrorState } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import type { Lang } from '@/lib/types'

export function ApproveCorrection() {
  const { user } = useAppStore()
  const lang = (user?.language as Lang) || 'ms'
  const qc = useQueryClient()
  const [tab, setTab] = React.useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['attendance', 'corrections', tab],
    queryFn: () => api.attendance.listCorrections(tab),
  })

  const reviewMut = useMutation({
    mutationFn: ({ attendanceId, state }: { attendanceId: string; state: 'APPROVED' | 'REJECTED' }) =>
      api.attendance.reviewCorrection(attendanceId, state),
    onSuccess: (_d, vars) => {
      toast.success(vars.state === 'APPROVED'
        ? (lang === 'ms' ? 'Pembetulan diluluskan' : 'Correction approved')
        : (lang === 'ms' ? 'Pembetulan ditolak' : 'Correction rejected'))
      qc.invalidateQueries({ queryKey: ['attendance', 'corrections'] })
    },
    onError: (e: any) => toast.error(e?.message || 'Ralat'),
  })

  if (isLoading) return <LoadingState label="Memuat pembetulan..." />
  if (isError) return <ErrorState message="Tidak dapat memuatkan pembetulan." />

  const corrections: any[] = data?.corrections || []

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ms' ? 'Lulus Pembetulan Kehadiran' : 'Approve Attendance Corrections'}
        subtitle={lang === 'ms' ? 'Semak dan luluskan permintaan pembetulan kehadiran staf.' : 'Review and approve staff attendance correction requests.'}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="PENDING">{lang === 'ms' ? 'Menunggu' : 'Pending'} <Badge variant="secondary" className="ml-1.5 text-[10px]">{corrections.length}</Badge></TabsTrigger>
          <TabsTrigger value="APPROVED">{lang === 'ms' ? 'Diluluskan' : 'Approved'}</TabsTrigger>
          <TabsTrigger value="REJECTED">{lang === 'ms' ? 'Ditolak' : 'Rejected'}</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <GlassCard className="p-4">
            {corrections.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title={lang === 'ms' ? 'Tiada permintaan' : 'No requests'}
                description={lang === 'ms' ? 'Tiada pembetulan dalam status ini.' : 'No corrections in this status.'}
              />
            ) : (
              <div className="rounded-xl border border-border/60 max-h-[70vh] overflow-y-auto scrollbar-thin">
                <Table>
                  <TableHeader className="sticky top-0 bg-card/95 backdrop-blur">
                    <TableRow>
                      <TableHead>{t('label.name', lang)}</TableHead>
                      <TableHead>{lang === 'ms' ? 'Sesi' : 'Session'}</TableHead>
                      <TableHead>{lang === 'ms' ? 'Kursus' : 'Course'}</TableHead>
                      <TableHead>{lang === 'ms' ? 'Status Lama' : 'Old Status'}</TableHead>
                      <TableHead>{lang === 'ms' ? 'Status Baru' : 'New Status'}</TableHead>
                      <TableHead>{lang === 'ms' ? 'Sebab' : 'Reason'}</TableHead>
                      <TableHead>{lang === 'ms' ? 'Diminta' : 'Requested'}</TableHead>
                      <TableHead>{lang === 'ms' ? 'Oleh' : 'By'}</TableHead>
                      <TableHead className="text-right">{t('label.actions', lang)}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {corrections.map(c => {
                      const att = c.attendance
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{att?.user?.name}</TableCell>
                          <TableCell className="text-xs">{att?.session?.title}</TableCell>
                          <TableCell className="text-xs">{att?.session?.course?.code || '-'}</TableCell>
                          <TableCell><Badge className={statusColor(c.oldStatus)}>{t(`att.${c.oldStatus}`, lang)}</Badge></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <ArrowRight className="size-3 text-muted-foreground" />
                              <Badge className={statusColor(c.newStatus)}>{t(`att.${c.newStatus}`, lang)}</Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs max-w-40 truncate" title={c.reason}>{c.reason}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">{formatDateTime(c.createdAt, lang)}<div className="text-[10px] text-muted-foreground">{relativeTime(c.createdAt)}</div></TableCell>
                          <TableCell className="text-xs">{c.requester?.name || '-'}</TableCell>
                          <TableCell className="text-right">
                            {c.state === 'PENDING' ? (
                              <div className="flex items-center justify-end gap-1">
                                <Button size="sm" variant="default" disabled={reviewMut.isPending} onClick={() => reviewMut.mutate({ attendanceId: c.attendanceId, state: 'APPROVED' })}>
                                  <Check className="size-3.5 mr-1" /> {t('action.approve', lang)}
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="outline" disabled={reviewMut.isPending}>
                                      <X className="size-3.5 mr-1" /> {t('action.reject', lang)}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>{lang === 'ms' ? 'Tolak pembetulan?' : 'Reject correction?'}</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {lang === 'ms'
                                          ? `Permintaan oleh ${att?.user?.name} akan ditolak. Tindakan ini tidak boleh dibuat asal.`
                                          : `Request by ${att?.user?.name} will be rejected. This action cannot be undone.`}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>{t('action.cancel', lang)}</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => reviewMut.mutate({ attendanceId: c.attendanceId, state: 'REJECTED' })}>
                                        {t('action.reject', lang)}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            ) : (
                              <Badge variant="outline" className={statusColor(c.state)}>{t(c.state, lang)}</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ApproveCorrection
