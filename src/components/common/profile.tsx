'use client'
import * as React from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { PageHeader, GlassCard } from '@/components/common/ui-bits'
import { initials } from '@/lib/format'
import { t } from '@/lib/i18n'
import { User, Mail, Save, Building2, Briefcase, Globe, Palette } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

const AVATAR_COLORS = ['#0d9488', '#0891b2', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#dc2626', '#4f46e5']

export function Profile() {
  const { user, setUser } = useAppStore()
  const qc = useQueryClient()
  const lang = (user?.language as 'ms' | 'en') || 'ms'
  const [name, setName] = React.useState(user?.name || '')
  const [email, setEmail] = React.useState(user?.email || '')
  const [position, setPosition] = React.useState(user?.position || '')
  const [language, setLanguage] = React.useState(user?.language || 'ms')
  const [color, setColor] = React.useState(user?.avatarColor || AVATAR_COLORS[0])
  const [saving, setSaving] = React.useState(false)

  const { data: deptData } = useQuery({ queryKey: ['departments'], queryFn: api.departments.list })
  const dept = deptData?.departments.find(d => d.id === user?.departmentId)

  async function save() {
    if (!user) return
    setSaving(true)
    try {
      const { user: updated } = await api.users.update(user.id, {
        name, email, position, language, avatarColor: color,
        role: user.role, departmentId: user.departmentId, status: 'ACTIVE',
      })
      setUser(updated)
      toast.success('Profil dikemas kini')
    } catch (err: any) {
      toast.error(err.message)
    } finally { setSaving(false) }
  }

  if (!user) return null

  return (
    <div>
      <PageHeader title={t('nav.profile', lang)} subtitle="Kemas kini butiran peribadi dan keutamaan anda." />
      <div className="grid lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-1 p-6">
          <div className="flex flex-col items-center text-center">
            <Avatar className="size-24 border-4 border-white/60 dark:border-white/10 shadow-lg" style={{ backgroundColor: color }}>
              <AvatarFallback className="text-white text-2xl font-bold" style={{ backgroundColor: color }}>
                {initials(name || user.name)}
              </AvatarFallback>
            </Avatar>
            <h2 className="font-bold text-lg mt-4">{user.name}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
              <Badge variant="secondary">{t(`role.${user.role}`, lang)}</Badge>
              {dept && <Badge variant="outline">{dept.name}</Badge>}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 w-full text-left text-xs">
              <div className="glass rounded-xl p-3">
                <div className="text-muted-foreground">Nombor Staf</div>
                <div className="font-semibold">{user.staffNo}</div>
              </div>
              <div className="glass rounded-xl p-3">
                <div className="text-muted-foreground">Jabatan</div>
                <div className="font-semibold truncate">{dept?.name || '-'}</div>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2 p-6">
          <h3 className="font-semibold text-lg mb-4">Maklumat Peribadi</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="flex items-center gap-2"><User className="size-3.5" /> Nama Penuh</Label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="flex items-center gap-2"><Mail className="size-3.5" /> E-mel</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} type="email" />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2"><Briefcase className="size-3.5" /> Jawatan</Label>
              <Input value={position || ''} onChange={e => setPosition(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2"><Building2 className="size-3.5" /> Jabatan</Label>
              <Input value={dept?.name || '-'} disabled />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2"><Globe className="size-3.5" /> Bahasa Pilihan</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="glass-strong">
                  <SelectItem value="ms">Bahasa Malaysia</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2"><Palette className="size-3.5" /> Warna Avatar</Label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    className={`size-8 rounded-full border-2 transition ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} aria-label={`Pilih warna ${c}`} />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={save} disabled={saving} className="gradient-primary text-white">
              <Save className="size-4 mr-2" /> {saving ? 'Menyimpan...' : t('action.save', lang)}
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
