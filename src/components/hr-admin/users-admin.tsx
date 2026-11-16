'use client'
import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users, Search, Plus, Pencil, UserX, Upload, Loader2, CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { t } from '@/lib/i18n'
import { statusColor } from '@/lib/format'
import { PageHeader, GlassCard, EmptyState, LoadingState, ErrorState } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import type { Lang, Role, User, Department } from '@/lib/types'

const ROLE_OPTIONS: Role[] = ['STAFF', 'TRAINER', 'HR', 'ADMIN']

interface FormState {
  staffNo: string; name: string; email: string; password: string
  role: Role; departmentId: string; position: string; language: string
}

const emptyForm: FormState = {
  staffNo: '', name: '', email: '', password: 'demo123',
  role: 'STAFF', departmentId: '', position: '', language: 'ms',
}

export function UsersAdmin() {
  const { user } = useAppStore()
  const lang = (user?.language as Lang) || 'ms'
  const qc = useQueryClient()

  const [search, setSearch] = React.useState('')
  const [roleFilter, setRoleFilter] = React.useState('all')
  const [deptFilter, setDeptFilter] = React.useState('all')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<User | null>(null)
  const [form, setForm] = React.useState<FormState>(emptyForm)
  const [importOpen, setImportOpen] = React.useState(false)

  const { data: usersData, isLoading, isError } = useQuery({
    queryKey: ['users', 'admin', roleFilter, deptFilter, search],
    queryFn: () => api.users.list({
      role: roleFilter === 'all' ? undefined : roleFilter,
      departmentId: deptFilter === 'all' ? undefined : deptFilter,
      search,
    }),
  })
  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.departments.list(),
  })

  const departments: Department[] = deptData?.departments || []
  const users: (User & { status?: string; department?: Department })[] = usersData?.users || []

  const saveMut = useMutation({
    mutationFn: async (data: FormState & { status?: string }) => {
      if (editing) {
        return api.users.update(editing.id, { ...data, departmentId: data.departmentId || null })
      }
      return api.users.create({ ...data, departmentId: data.departmentId || null })
    },
    onSuccess: () => {
      toast.success(editing ? (lang === 'ms' ? 'Pengguna dikemaskini' : 'User updated') : (lang === 'ms' ? 'Pengguna dicipta' : 'User created'))
      setDialogOpen(false)
      setEditing(null)
      setForm(emptyForm)
      qc.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (e: any) => toast.error(e?.message || 'Ralat'),
  })

  const deactivateMut = useMutation({
    mutationFn: (id: string) => api.users.deactivate(id),
    onSuccess: () => {
      toast.success(lang === 'ms' ? 'Pengguna dinyahaktifkan' : 'User deactivated')
      qc.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (e: any) => toast.error(e?.message || 'Ralat'),
  })

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true) }
  const openEdit = (u: User) => {
    setEditing(u)
    setForm({
      staffNo: u.staffNo, name: u.name, email: u.email, password: 'demo123',
      role: u.role, departmentId: u.departmentId || '', position: u.position || '',
      language: u.language || 'ms',
    })
    setDialogOpen(true)
  }

  if (isLoading) return <LoadingState label="Memuat pengguna..." />
  if (isError) return <ErrorState message="Tidak dapat memuatkan pengguna." />

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ms' ? 'Pengurusan Pengguna' : 'User Management'}
        subtitle={lang === 'ms' ? 'Tambah, sunting & nyahaktifkan akaun pengguna.' : 'Add, edit & deactivate user accounts.'}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="size-4 mr-1" /> {t('action.import', lang)} CSV
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4 mr-1" /> {lang === 'ms' ? 'Tambah Pengguna' : 'Add User'}
            </Button>
          </div>
        }
      />

      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="relative flex-1 min-w-48">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={lang === 'ms' ? 'Cari nama / no staf / emel...' : 'Search name / staff no / email...'} className="pl-9" />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder={t('label.role', lang)} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === 'ms' ? 'Semua Peranan' : 'All Roles'}</SelectItem>
              {ROLE_OPTIONS.map(r => <SelectItem key={r} value={r}>{t(`role.${r}`, lang)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder={t('label.department', lang)} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === 'ms' ? 'Semua Jabatan' : 'All Departments'}</SelectItem>
              {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.code} — {d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground ml-auto">{users.length} {lang === 'ms' ? 'pengguna' : 'users'}</span>
        </div>

        {users.length === 0 ? (
          <EmptyState icon={Users} title={lang === 'ms' ? 'Tiada pengguna' : 'No users'} description={lang === 'ms' ? 'Cuba ubah penapis atau tambah pengguna baharu.' : 'Try changing filters or add a new user.'} />
        ) : (
          <div className="rounded-xl border border-border/60 max-h-[65vh] overflow-y-auto scrollbar-thin">
            <Table>
              <TableHeader className="sticky top-0 bg-card/95 backdrop-blur">
                <TableRow>
                  <TableHead>{t('label.staffNo', lang)}</TableHead>
                  <TableHead>{t('label.name', lang)}</TableHead>
                  <TableHead>{t('label.email', lang)}</TableHead>
                  <TableHead>{t('label.role', lang)}</TableHead>
                  <TableHead>{t('label.department', lang)}</TableHead>
                  <TableHead>{t('label.position', lang)}</TableHead>
                  <TableHead>{t('label.status', lang)}</TableHead>
                  <TableHead className="text-right">{t('label.actions', lang)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono text-xs">{u.staffNo}</TableCell>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-xs">{u.email}</TableCell>
                    <TableCell><Badge variant="outline">{t(`role.${u.role}`, lang)}</Badge></TableCell>
                    <TableCell className="text-xs">{u.department?.code || '-'}<div className="text-[10px] text-muted-foreground">{u.department?.name}</div></TableCell>
                    <TableCell className="text-xs">{u.position || '-'}</TableCell>
                    <TableCell><Badge className={statusColor(u.status || 'ACTIVE')}>{t(u.status || 'ACTIVE', lang)}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(u)}>
                          <Pencil className="size-3.5 mr-1" /> {t('action.edit', lang)}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" disabled={(u.status || 'ACTIVE') === 'INACTIVE'}>
                              <UserX className="size-3.5 mr-1" /> {lang === 'ms' ? 'Nyahaktif' : 'Deactivate'}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{lang === 'ms' ? 'Nyahaktif pengguna?' : 'Deactivate user?'}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {lang === 'ms' ? `${u.name} akan ditandai sebagai TIDAK AKTIF. Tindakan ini boleh dibuat asal dengan menyunting pengguna.` : `${u.name} will be marked INACTIVE. This can be reversed by editing the user.`}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('action.cancel', lang)}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deactivateMut.mutate(u.id)}>{lang === 'ms' ? 'Nyahaktifkan' : 'Deactivate'}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCard>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? (lang === 'ms' ? 'Sunting Pengguna' : 'Edit User') : (lang === 'ms' ? 'Tambah Pengguna' : 'Add User')}</DialogTitle>
            <DialogDescription>{lang === 'ms' ? 'Isi maklumat pengguna di bawah.' : 'Fill in user details below.'}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div>
              <Label className="mb-1.5 block text-xs">{t('label.staffNo', lang)}</Label>
              <Input value={form.staffNo} onChange={e => setForm({ ...form, staffNo: e.target.value })} disabled={!!editing} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">{t('label.name', lang)}</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label className="mb-1.5 block text-xs">{t('label.email', lang)}</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">{t('label.password', lang)}</Label>
              <Input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="demo123" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">{t('label.role', lang)}</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(r => <SelectItem key={r} value={r}>{t(`role.${r}`, lang)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">{t('label.department', lang)}</Label>
              <Select value={form.departmentId || 'none'} onValueChange={(v) => setForm({ ...form, departmentId: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder={lang === 'ms' ? 'Tanpa jabatan' : 'No department'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{lang === 'ms' ? 'Tanpa Jabatan' : 'No Department'}</SelectItem>
                  {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.code} — {d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">{t('label.position', lang)}</Label>
              <Input value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label className="mb-1.5 block text-xs">{t('label.language', lang)}</Label>
              <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ms">Bahasa Malaysia</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('action.cancel', lang)}</Button>
            <Button
              disabled={!form.staffNo || !form.name || !form.email || saveMut.isPending}
              onClick={() => saveMut.mutate(form)}
            >
              {saveMut.isPending && <Loader2 className="size-4 mr-1 animate-spin" />}
              {editing ? t('action.save', lang) : t('action.create', lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} departments={departments} lang={lang} onDone={() => qc.invalidateQueries({ queryKey: ['users'] })} />
    </div>
  )
}

// CSV Import Dialog
function ImportDialog({ open, onOpenChange, departments, lang, onDone }: {
  open: boolean; onOpenChange: (v: boolean) => void; departments: Department[]; lang: Lang; onDone: () => void
}) {
  const [rows, setRows] = React.useState<{ staffNo: string; name: string; email: string; role: Role; departmentCode: string; position: string }[]>([])
  const [progress, setProgress] = React.useState<{ done: number; total: number; errors: string[] } | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    if (lines.length < 2) { toast.error(lang === 'ms' ? 'CSV kosong' : 'CSV empty'); return }
    const [header, ...body] = lines
    const cols = header.split(',').map(c => c.trim().toLowerCase())
    const idx = (k: string) => cols.indexOf(k)
    const parsed = body.map(line => {
      const parts = line.split(',')
      return {
        staffNo: (parts[idx('staffno')] || '').trim(),
        name: (parts[idx('name')] || '').trim(),
        email: (parts[idx('email')] || '').trim(),
        role: ((parts[idx('role')] || 'STAFF').trim().toUpperCase() as Role),
        departmentCode: (parts[idx('departmentcode')] || '').trim(),
        position: (parts[idx('position')] || '').trim(),
      }
    }).filter(r => r.staffNo && r.name && r.email)
    setRows(parsed)
  }

  const runImport = async () => {
    setProgress({ done: 0, total: rows.length, errors: [] })
    let done = 0
    const errors: string[] = []
    for (const r of rows) {
      try {
        const dept = departments.find(d => d.code.toLowerCase() === r.departmentCode.toLowerCase())
        await api.users.create({
          staffNo: r.staffNo, name: r.name, email: r.email, password: 'demo123',
          role: r.role, departmentId: dept?.id || null, position: r.position, language: 'ms',
        })
      } catch (e: any) {
        errors.push(`${r.staffNo}: ${e?.message || 'ralat'}`)
      }
      done++
      setProgress({ done, total: rows.length, errors })
    }
    toast.success(lang === 'ms' ? `Import selesai: ${done - errors.length}/${rows.length} berjaya` : `Import done: ${done - errors.length}/${rows.length} succeeded`)
    if (errors.length === 0) {
      onOpenChange(false); setRows([]); setProgress(null); onDone()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setRows([]); setProgress(null) } }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{lang === 'ms' ? 'Import Pengguna CSV' : 'Import Users CSV'}</DialogTitle>
          <DialogDescription>
            {lang === 'ms' ? 'Header: staffNo,name,email,role,departmentCode,position. Kata laluan lalai: demo123' : 'Header: staffNo,name,email,role,departmentCode,position. Default password: demo123'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={!!progress}>
            <Upload className="size-4 mr-1" /> {lang === 'ms' ? 'Pilih Fail CSV' : 'Select CSV File'}
          </Button>

          {rows.length > 0 && (
            <div className="text-xs text-muted-foreground">{rows.length} {lang === 'ms' ? 'baris dijumpai' : 'rows found'}</div>
          )}

          {rows.length > 0 && (
            <div className="rounded-xl border border-border/60 max-h-60 overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 bg-card/95">
                  <TableRow>
                    <TableHead>staffNo</TableHead><TableHead>name</TableHead><TableHead>email</TableHead><TableHead>role</TableHead><TableHead>dept</TableHead><TableHead>position</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 50).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{r.staffNo}</TableCell>
                      <TableCell className="text-sm">{r.name}</TableCell>
                      <TableCell className="text-xs">{r.email}</TableCell>
                      <TableCell className="text-xs">{r.role}</TableCell>
                      <TableCell className="text-xs">{r.departmentCode || '-'}</TableCell>
                      <TableCell className="text-xs">{r.position || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {rows.length > 50 && <div className="p-2 text-xs text-muted-foreground text-center">{lang === 'ms' ? `...dan ${rows.length - 50} lagi` : `...and ${rows.length - 50} more`}</div>}
            </div>
          )}

          {progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{lang === 'ms' ? `Mengimport... ${progress.done}/${progress.total}` : `Importing... ${progress.done}/${progress.total}`}</span>
                {progress.done === progress.total ? <CheckCircle2 className="size-4 text-emerald-500" /> : <Loader2 className="size-4 animate-spin text-primary" />}
              </div>
              <Progress value={progress.total ? (progress.done / progress.total) * 100 : 0} />
              {progress.errors.length > 0 && (
                <div className="rounded-md bg-rose-50 dark:bg-rose-900/20 p-2 text-xs text-rose-700 dark:text-rose-300 max-h-24 overflow-y-auto">
                  {progress.errors.map((e, i) => <div key={i}>{e}</div>)}
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={!!progress}>{t('action.cancel', lang)}</Button>
          <Button onClick={runImport} disabled={rows.length === 0 || !!progress}>
            {lang === 'ms' ? 'Import' : 'Import'} {rows.length > 0 && `(${rows.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default UsersAdmin
