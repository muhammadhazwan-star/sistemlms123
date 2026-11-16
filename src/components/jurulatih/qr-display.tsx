'use client'
import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, QrCode as QrIcon, CalendarClock, Clock, MapPin, Video, CheckCircle2, ArrowLeft } from 'lucide-react'
import QRCode from 'qrcode'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { t } from '@/lib/i18n'
import { formatDate, formatTime, initials } from '@/lib/format'
import { PageHeader, GlassCard, LoadingState, ErrorState } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Session, Lang } from '@/lib/types'

export function QrDisplay() {
  const { user, params, navigate } = useAppStore()
  const lang = (user?.language as Lang) || 'ms'
  const qc = useQueryClient()

  const [sessionId, setSessionId] = React.useState<string>((params.sessionId as string) || '')

  // Sync params.sessionId -> local state (handles navigation from other views)
  React.useEffect(() => {
    if (params.sessionId && params.sessionId !== sessionId) {
      setSessionId(params.sessionId as string)
    }
  }, [params.sessionId, sessionId])

  const { data: listData } = useQuery({
    queryKey: ['sessions', 'qr-list', user?.id],
    queryFn: () => api.sessions.list({ trainerId: user!.id, period: 'today' }),
    enabled: !!user?.id && !sessionId,
  })
  const { data: sesData, isLoading, isError } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => api.sessions.get(sessionId),
    enabled: !!sessionId,
    refetchInterval: 10_000,
  })

  const regenMut = useMutation({
    mutationFn: (id: string) => api.sessions.regenerateCode(id),
    onSuccess: () => { toast.success('Kod baharu dijana.'); qc.invalidateQueries({ queryKey: ['session', sessionId] }) },
    onError: (e: Error) => toast.error(e.message),
  })

  if (!sessionId) {
    const sessions: Session[] = listData?.sessions || []
    return (
      <div className="space-y-6">
        <PageHeader title={lang === 'ms' ? 'Skrin QR Sesi' : 'Session QR Screen'} subtitle={lang === 'ms' ? 'Pilih sesi untuk paparan QR.' : 'Select a session for QR display.'} />
        <GlassCard className="p-5">
          <div className="space-y-3">
            <label className="text-sm font-medium">Pilih Sesi</label>
            <Select value={sessionId} onValueChange={setSessionId}>
              <SelectTrigger><SelectValue placeholder="Pilih sesi hari ini..." /></SelectTrigger>
              <SelectContent>
                {sessions.length === 0 && <SelectItem value="none" disabled>Tiada sesi hari ini</SelectItem>}
                {sessions.map((s) => <SelectItem key={s.id} value={s.id}>{s.title} — {formatDate(s.date, lang)} {formatTime(s.startTime)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </GlassCard>
      </div>
    )
  }

  if (isLoading) return <LoadingState label="Memuat sesi..." />
  if (isError || !sesData?.session) return <ErrorState message="Tidak dapat memuatkan sesi." />

  const session: Session = sesData.session
  const checkedIn = (session.attendances || []).filter((a) => a.checkInAt)

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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* QR + code */}
        <GlassCard className="lg:col-span-2 p-8 flex flex-col items-center justify-center text-center">
          <QrPanel session={session} lang={lang} />
          <div className="mt-6 flex flex-col items-center gap-3">
            <Button className="gradient-primary text-white" onClick={() => regenMut.mutate(session.id)} disabled={regenMut.isPending}>
              <RefreshCw className={`size-4 mr-1 ${regenMut.isPending ? 'animate-spin' : ''}`} /> {lang === 'ms' ? 'Jana Semula Kod' : 'Regenerate Code'}
            </Button>
            <p className="text-sm text-muted-foreground max-w-md">
              {lang === 'ms' ? 'Staf boleh mengimbas kod ini dengan kamera telefon atau memasukkan kod 6 digit.' : 'Staff may scan this QR with phone camera or enter the 6-digit code.'}
            </p>
          </div>
        </GlassCard>

        {/* Session info + check-in list */}
        <div className="space-y-4">
          <GlassCard className="p-5">
            <h3 className="font-semibold mb-3">{lang === 'ms' ? 'Maklumat Sesi' : 'Session Info'}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><CalendarClock className="size-4 text-muted-foreground" /> {formatDate(session.date, lang)}</div>
              <div className="flex items-center gap-2"><Clock className="size-4 text-muted-foreground" /> {formatTime(session.startTime)} - {formatTime(session.endTime)}</div>
              <div className="flex items-center gap-2"><Badge variant="secondary">{t(`session.${session.mode}`, lang)}</Badge></div>
              {session.mode === 'BERSEMUKA' && session.location && <div className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" /> {session.location}</div>}
              {session.mode === 'DALAM_TALIAN' && session.url && <div className="flex items-center gap-2"><Video className="size-4 text-muted-foreground" /> <a href={session.url} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">{session.url}</a></div>}
              <div className="flex items-center gap-2"><QrIcon className="size-4 text-muted-foreground" /> Kapasiti: {session.capacity}</div>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{lang === 'ms' ? 'Senarai Daftar Masuk' : 'Check-in List'}</h3>
              <Button size="sm" variant="ghost" onClick={() => qc.invalidateQueries({ queryKey: ['session', sessionId] })}>
                <RefreshCw className="size-3.5" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mb-3">{checkedIn.length} {lang === 'ms' ? 'telah daftar masuk' : 'checked in'} · {(session.attendances || []).length} {lang === 'ms' ? 'jumlah' : 'total'}</div>
            {checkedIn.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">{lang === 'ms' ? 'Belum ada yang daftar masuk.' : 'No check-ins yet.'}</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin pr-1">
                {checkedIn.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/60 p-2">
                    <Avatar className="size-8"><AvatarFallback className="text-[10px]">{initials(a.user?.name || '?')}</AvatarFallback></Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{a.user?.name}</div>
                      <div className="text-[10px] text-muted-foreground">{a.user?.staffNo} · {a.user?.department?.name}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{a.status}</Badge>
                    <CheckCircle2 className="size-4 text-emerald-500" />
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

function QrPanel({ session, lang }: { session: Session; lang: Lang }) {
  const [qrUrl, setQrUrl] = React.useState<string>('')

  React.useEffect(() => {
    QRCode.toDataURL(session.qrToken, { width: 360, margin: 2 }).then(setQrUrl).catch(() => setQrUrl(''))
  }, [session.qrToken])

  const expiry = session.codeExpiry ? new Date(session.codeExpiry).getTime() : 0
  const [remaining, setRemaining] = React.useState(Math.max(0, Math.floor((expiry - Date.now()) / 1000)))
  React.useEffect(() => {
    const tick = () => setRemaining(Math.max(0, Math.floor((expiry - Date.now()) / 1000)))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [expiry])

  const expired = remaining <= 0
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="rounded-2xl bg-white p-4 shadow-md">
        {qrUrl ? <img src={qrUrl} alt="QR" width={320} height={320} className="size-80 max-w-full" /> : <div className="size-80 animate-pulse bg-muted" />}
      </div>
      <div className="text-center">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">{lang === 'ms' ? 'Kod 6 Digit' : '6-Digit Code'}</div>
        <div className={`text-4xl sm:text-5xl font-bold tracking-[0.4em] mt-1 ${expired ? 'text-rose-500' : 'text-primary'}`}>
          {session.code6}
        </div>
        {!expired ? (
          <div className="mt-2 text-sm text-muted-foreground">{lang === 'ms' ? 'Tamat tempoh dalam' : 'Expires in'} <span className="font-mono font-semibold">{mm}:{ss}</span></div>
        ) : (
          <div className="mt-2 text-sm font-medium text-rose-500">{lang === 'ms' ? 'Kod tamat tempoh — sila jana semula.' : 'Code expired — please regenerate.'}</div>
        )}
      </div>
    </div>
  )
}

export default QrDisplay
