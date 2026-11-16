'use client'
import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { ScrollText, Download, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { t } from '@/lib/i18n'
import { formatDateTime, statusColor, downloadFile, toCsv } from '@/lib/format'
import { PageHeader, GlassCard, EmptyState, LoadingState, ErrorState } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Lang, AuditLog } from '@/lib/types'

export function AuditLog() {
  const { user } = useAppStore()
  const lang = (user?.language as Lang) || 'ms'
  const [search, setSearch] = React.useState('')
  const [actionFilter, setActionFilter] = React.useState('all')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit', 200],
    queryFn: () => api.audit.list(200),
  })

  if (isLoading) return <LoadingState label="Memuat log audit..." />
  if (isError) return <ErrorState message="Tidak dapat memuatkan log audit." />

  const logs: (AuditLog & { user?: any })[] = data?.logs || []
  const actions = Array.from(new Set(logs.map(l => l.action)))

  const filtered = logs.filter(l => {
    if (actionFilter !== 'all' && l.action !== actionFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const hay = `${l.action} ${l.entity} ${l.entityId || ''} ${l.user?.name || ''} ${l.user?.staffNo || ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      ['Timestamp', 'User', 'Action', 'Entity', 'EntityID', 'Before', 'After'],
      ...filtered.map(l => [
        formatDateTime(l.timestamp, lang),
        l.user?.name || '-',
        l.action,
        l.entity,
        l.entityId || '-',
        l.before || '',
        l.after || '',
      ]),
    ]
    downloadFile(toCsv(rows), 'log-audit.csv', 'text/csv')
    toast.success(lang === 'ms' ? 'Dieksport' : 'Exported')
  }

  const truncate = (s: string | null | undefined, n = 60) => {
    if (!s) return '-'
    return s.length > n ? s.slice(0, n) + '…' : s
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ms' ? 'Log Audit' : 'Audit Log'}
        subtitle={lang === 'ms' ? 'Jejak semua tindakan penting dalam sistem.' : 'Track all important system actions.'}
        action={
          <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="size-4 mr-1" /> {t('action.export', lang)} CSV
          </Button>
        }
      />

      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="relative flex-1 min-w-48">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={lang === 'ms' ? 'Cari tindakan / entiti / pengguna...' : 'Search action / entity / user...'} className="pl-9" />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-56"><SelectValue placeholder={lang === 'ms' ? 'Semua tindakan' : 'All actions'} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === 'ms' ? 'Semua Tindakan' : 'All Actions'}</SelectItem>
              {actions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} / {logs.length} {lang === 'ms' ? 'rekod' : 'records'}</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={ScrollText} title={lang === 'ms' ? 'Tiada log' : 'No logs'} description={lang === 'ms' ? 'Cuba ubah penapis.' : 'Try changing filters.'} />
        ) : (
          <div className="rounded-xl border border-border/60 max-h-[70vh] overflow-y-auto scrollbar-thin">
            <Table>
              <TableHeader className="sticky top-0 bg-card/95 backdrop-blur">
                <TableRow>
                  <TableHead>{lang === 'ms' ? 'Waktu' : 'Timestamp'}</TableHead>
                  <TableHead>{lang === 'ms' ? 'Pengguna' : 'User'}</TableHead>
                  <TableHead>{lang === 'ms' ? 'Tindakan' : 'Action'}</TableHead>
                  <TableHead>{lang === 'ms' ? 'Entiti' : 'Entity'}</TableHead>
                  <TableHead>{lang === 'ms' ? 'ID' : 'ID'}</TableHead>
                  <TableHead>Before</TableHead>
                  <TableHead>After</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs whitespace-nowrap">{formatDateTime(l.timestamp, lang)}</TableCell>
                    <TableCell className="text-sm">{l.user?.name || '-'}{l.user?.staffNo && <div className="text-[10px] text-muted-foreground">{l.user.staffNo}</div>}</TableCell>
                    <TableCell><Badge variant="outline" className="font-mono text-[10px]">{l.action}</Badge></TableCell>
                    <TableCell className="text-xs">{l.entity}</TableCell>
                    <TableCell className="font-mono text-[10px] text-muted-foreground">{truncate(l.entityId, 12)}</TableCell>
                    <TableCell className="font-mono text-[10px] max-w-48"><span title={l.before || ''}>{truncate(l.before)}</span></TableCell>
                    <TableCell className="font-mono text-[10px] max-w-48"><span title={l.after || ''}>{truncate(l.after)}</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCard>
    </div>
  )
}

export default AuditLog
