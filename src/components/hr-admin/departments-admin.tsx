'use client'
import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building2, Tag, Plus, Pencil, Trash2, Users as UsersIcon, BookOpen, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { t } from '@/lib/i18n'
import { PageHeader, GlassCard, EmptyState, LoadingState, ErrorState } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Lang, Department, Category, User } from '@/lib/types'

export function DepartmentsAdmin() {
  const { user } = useAppStore()
  const lang = (user?.language as Lang) || 'ms'

  const { data: deptData, isLoading: dL, isError: dE } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.departments.list(),
  })
  const { data: catData, isLoading: cL, isError: cE } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list(),
  })
  const { data: usersData } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => api.users.list({}),
  })

  if (dL || cL) return <LoadingState label="Memuat..." />
  if (dE || cE) return <ErrorState message="Tidak dapat memuatkan data." />

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ms' ? 'Jabatan & Kategori' : 'Departments & Categories'}
        subtitle={lang === 'ms' ? 'Urus data induk jabatan dan kategori kursus.' : 'Manage department and course category master data.'}
      />
      <Tabs defaultValue="departments">
        <TabsList>
          <TabsTrigger value="departments"><Building2 className="size-4 mr-1.5" /> {lang === 'ms' ? 'Jabatan' : 'Departments'}</TabsTrigger>
          <TabsTrigger value="categories"><Tag className="size-4 mr-1.5" /> {lang === 'ms' ? 'Kategori' : 'Categories'}</TabsTrigger>
        </TabsList>
        <TabsContent value="departments" className="mt-4">
          <DepartmentsTab departments={deptData?.departments || []} users={usersData?.users || []} lang={lang} />
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <CategoriesTab categories={catData?.categories || []} lang={lang} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DepartmentsTab({ departments, users, lang }: { departments: Department[]; users: User[]; lang: Lang }) {
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Department | null>(null)
  const [code, setCode] = React.useState('')
  const [name, setName] = React.useState('')
  const [headUserId, setHeadUserId] = React.useState('')

  const open = (d?: Department) => {
    if (d) {
      setEditing(d); setCode(d.code); setName(d.name); setHeadUserId(d.headUserId || '')
    } else {
      setEditing(null); setCode(''); setName(''); setHeadUserId('')
    }
    setDialogOpen(true)
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = { code, name, headUserId: headUserId || null }
      if (editing) return api.departments.update(editing.id, payload)
      return api.departments.create(payload)
    },
    onSuccess: () => {
      toast.success(editing ? (lang === 'ms' ? 'Jabatan dikemaskini' : 'Department updated') : (lang === 'ms' ? 'Jabatan dicipta' : 'Department created'))
      setDialogOpen(false)
      qc.invalidateQueries({ queryKey: ['departments'] })
    },
    onError: (e: any) => toast.error(e?.message || 'Ralat'),
  })

  const delMut = useMutation({
    mutationFn: (id: string) => api.departments.delete(id),
    onSuccess: () => {
      toast.success(lang === 'ms' ? 'Jabatan dipadam' : 'Department deleted')
      qc.invalidateQueries({ queryKey: ['departments'] })
      qc.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (e: any) => toast.error(e?.message || 'Ralat'),
  })

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{lang === 'ms' ? 'Senarai Jabatan' : 'Department List'}</h3>
        <Button size="sm" onClick={() => open()}><Plus className="size-4 mr-1" /> {lang === 'ms' ? 'Tambah' : 'Add'}</Button>
      </div>
      {departments.length === 0 ? (
        <EmptyState icon={Building2} title={lang === 'ms' ? 'Tiada jabatan' : 'No departments'} />
      ) : (
        <div className="rounded-xl border border-border/60 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang === 'ms' ? 'Kod' : 'Code'}</TableHead>
                <TableHead>{t('label.name', lang)}</TableHead>
                <TableHead>{lang === 'ms' ? 'Ketua' : 'Head'}</TableHead>
                <TableHead className="text-right">{lang === 'ms' ? 'Ahli' : 'Members'}</TableHead>
                <TableHead className="text-right">{t('label.actions', lang)}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map(d => {
                const members = (d as any).users?.length ?? 0
                return (
                  <TableRow key={d.id}>
                    <TableCell><Badge variant="outline" className="font-mono">{d.code}</Badge></TableCell>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-sm">{d.head?.name || '-'}</TableCell>
                    <TableCell className="text-right"><span className="inline-flex items-center gap-1 text-xs"><UsersIcon className="size-3 text-muted-foreground" />{members}</span></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => open(d)}><Pencil className="size-3.5 mr-1" /> {t('action.edit', lang)}</Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-rose-600"><Trash2 className="size-3.5 mr-1" /> {t('action.delete', lang)}</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{lang === 'ms' ? 'Padam jabatan?' : 'Delete department?'}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {lang === 'ms' ? `Ahli jabatan ${d.name} akan ditanggalkan dari jabatan ini (akaun kekal).` : `Members of ${d.name} will be detached (accounts remain).`}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('action.cancel', lang)}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => delMut.mutate(d.id)}>{t('action.delete', lang)}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? (lang === 'ms' ? 'Sunting Jabatan' : 'Edit Department') : (lang === 'ms' ? 'Tambah Jabatan' : 'Add Department')}</DialogTitle>
            <DialogDescription>{lang === 'ms' ? 'Maklumat jabatan.' : 'Department info.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div>
              <Label className="mb-1.5 block text-xs">{lang === 'ms' ? 'Kod' : 'Code'}</Label>
              <Input value={code} onChange={e => setCode(e.target.value)} placeholder="cth: IT, HR, FN" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">{t('label.name', lang)}</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder={lang === 'ms' ? 'Nama jabatan' : 'Department name'} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">{lang === 'ms' ? 'Ketua Jabatan' : 'Department Head'}</Label>
              <Select value={headUserId || 'none'} onValueChange={(v) => setHeadUserId(v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder={lang === 'ms' ? 'Tanpa ketua' : 'No head'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{lang === 'ms' ? 'Tanpa Ketua' : 'No Head'}</SelectItem>
                  {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name} ({u.staffNo})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('action.cancel', lang)}</Button>
            <Button disabled={!code || !name || saveMut.isPending} onClick={() => saveMut.mutate()}>
              {saveMut.isPending && <Loader2 className="size-4 mr-1 animate-spin" />}
              {editing ? t('action.save', lang) : t('action.create', lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GlassCard>
  )
}

function CategoriesTab({ categories, lang }: { categories: Category[]; lang: Lang }) {
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Category | null>(null)
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')

  const open = (c?: Category) => {
    if (c) { setEditing(c); setName(c.name); setDescription(c.description || '') }
    else { setEditing(null); setName(''); setDescription('') }
    setDialogOpen(true)
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = { name, description: description || null }
      if (editing) return api.categories.update(editing.id, payload)
      return api.categories.create(payload)
    },
    onSuccess: () => {
      toast.success(editing ? (lang === 'ms' ? 'Kategori dikemaskini' : 'Category updated') : (lang === 'ms' ? 'Kategori dicipta' : 'Category created'))
      setDialogOpen(false)
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (e: any) => toast.error(e?.message || 'Ralat'),
  })

  const delMut = useMutation({
    mutationFn: (id: string) => api.categories.delete(id),
    onSuccess: () => {
      toast.success(lang === 'ms' ? 'Kategori dipadam' : 'Category deleted')
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['courses'] })
    },
    onError: (e: any) => toast.error(e?.message || 'Ralat'),
  })

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{lang === 'ms' ? 'Senarai Kategori' : 'Category List'}</h3>
        <Button size="sm" onClick={() => open()}><Plus className="size-4 mr-1" /> {lang === 'ms' ? 'Tambah' : 'Add'}</Button>
      </div>
      {categories.length === 0 ? (
        <EmptyState icon={Tag} title={lang === 'ms' ? 'Tiada kategori' : 'No categories'} />
      ) : (
        <div className="rounded-xl border border-border/60 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('label.name', lang)}</TableHead>
                <TableHead>{lang === 'ms' ? 'Penerangan' : 'Description'}</TableHead>
                <TableHead className="text-right">{lang === 'ms' ? 'Kursus' : 'Courses'}</TableHead>
                <TableHead className="text-right">{t('label.actions', lang)}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{c.description || '-'}</TableCell>
                  <TableCell className="text-right"><span className="inline-flex items-center gap-1 text-xs"><BookOpen className="size-3 text-muted-foreground" />{c._count?.courses || 0}</span></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => open(c)}><Pencil className="size-3.5 mr-1" /> {t('action.edit', lang)}</Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-rose-600"><Trash2 className="size-3.5 mr-1" /> {t('action.delete', lang)}</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{lang === 'ms' ? 'Padam kategori?' : 'Delete category?'}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {lang === 'ms' ? `Kursus di bawah ${c.name} akan dikeluarkan dari kategori ini (kursus kekal).` : `Courses under ${c.name} will be detached (courses remain).`}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('action.cancel', lang)}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => delMut.mutate(c.id)}>{t('action.delete', lang)}</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? (lang === 'ms' ? 'Sunting Kategori' : 'Edit Category') : (lang === 'ms' ? 'Tambah Kategori' : 'Add Category')}</DialogTitle>
            <DialogDescription>{lang === 'ms' ? 'Maklumat kategori kursus.' : 'Course category info.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div>
              <Label className="mb-1.5 block text-xs">{t('label.name', lang)}</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder={lang === 'ms' ? 'cth: Pengaturcaraan' : 'e.g. Programming'} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">{lang === 'ms' ? 'Penerangan' : 'Description'}</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('action.cancel', lang)}</Button>
            <Button disabled={!name || saveMut.isPending} onClick={() => saveMut.mutate()}>
              {saveMut.isPending && <Loader2 className="size-4 mr-1 animate-spin" />}
              {editing ? t('action.save', lang) : t('action.create', lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GlassCard>
  )
}

export default DepartmentsAdmin
