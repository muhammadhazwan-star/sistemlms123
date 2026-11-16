'use client'
import * as React from 'react'
import Link from 'next/link'
import { GraduationCap, Menu, X, Bell, Sun, Moon, LogOut, ChevronDown, UserCog, RefreshCw, Globe } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { t } from '@/lib/i18n'
import { initials } from '@/lib/format'
import type { Role } from '@/lib/types'

type NavItem = { view: string; label: string; icon: any }

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  STAFF: [
    { view: 'dashboard', label: 'nav.dashboard', icon: GraduationCap },
    { view: 'catalog', label: 'nav.catalog', icon: GraduationCap },
    { view: 'my-courses', label: 'nav.myCourses', icon: GraduationCap },
    { view: 'my-attendance', label: 'nav.myAttendance', icon: GraduationCap },
    { view: 'my-certificates', label: 'nav.myCertificates', icon: GraduationCap },
    { view: 'profile', label: 'nav.profile', icon: UserCog },
  ],
  TRAINER: [
    { view: 'dashboard', label: 'nav.dashboard', icon: GraduationCap },
    { view: 'trainer-courses', label: 'nav.myTeaching', icon: GraduationCap },
    { view: 'course-editor', label: 'nav.courseEditor', icon: GraduationCap },
    { view: 'session-schedule', label: 'nav.sessionSchedule', icon: GraduationCap },
    { view: 'qr-display', label: 'nav.qrDisplay', icon: GraduationCap },
    { view: 'attendance-list', label: 'nav.attendanceList', icon: GraduationCap },
    { view: 'profile', label: 'nav.profile', icon: UserCog },
  ],
  HR: [
    { view: 'dashboard', label: 'nav.dashboard', icon: GraduationCap },
    { view: 'team-dashboard', label: 'nav.teamDashboard', icon: GraduationCap },
    { view: 'assign-course', label: 'nav.assignCourse', icon: GraduationCap },
    { view: 'approve-correction', label: 'nav.approveCorrection', icon: GraduationCap },
    { view: 'reports', label: 'nav.reports', icon: GraduationCap },
    { view: 'profile', label: 'nav.profile', icon: UserCog },
  ],
  ADMIN: [
    { view: 'dashboard', label: 'nav.dashboard', icon: GraduationCap },
    { view: 'users', label: 'nav.users', icon: GraduationCap },
    { view: 'departments', label: 'nav.departments', icon: GraduationCap },
    { view: 'reports', label: 'nav.reports', icon: GraduationCap },
    { view: 'audit-log', label: 'nav.auditLog', icon: GraduationCap },
    { view: 'verify-certificate', label: 'nav.verifyCertificate', icon: GraduationCap },
    { view: 'reset-data', label: 'nav.resetData', icon: GraduationCap },
    { view: 'profile', label: 'nav.profile', icon: UserCog },
  ],
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, view, navigate } = useAppStore()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const lang = (user?.language as 'ms' | 'en') || 'ms'
  const items = user ? NAV_BY_ROLE[user.role] : []

  const SidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 flex items-center gap-3 border-b border-border/50">
        <div className="size-10 rounded-2xl gradient-primary flex items-center justify-center text-white shadow-md shrink-0">
          <GraduationCap className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-sm truncate">LMS Al Amin</div>
          <div className="text-[11px] text-muted-foreground truncate">Latihan AI</div>
        </div>
      </div>
      <ScrollArea className="flex-1 px-3 py-4 scrollbar-thin">
        <nav className="space-y-1">
          {items.map(item => {
            const active = view === item.view
            return (
              <button key={item.view} onClick={() => { navigate(item.view); setMobileOpen(false) }}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all
                  ${active ? 'gradient-primary text-white shadow-md' : 'hover:bg-accent/60 text-foreground/80 hover:text-foreground'}`}>
                <item.icon className="size-4 shrink-0" />
                <span className="truncate">{t(item.label, lang)}</span>
              </button>
            )
          })}
        </nav>
      </ScrollArea>
      <div className="px-3 py-3 border-t border-border/50">
        <Link href="/?view=verify-certificate" className="text-[11px] text-muted-foreground hover:text-primary block text-center">
          Pengesahan Sijil Awam
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 glass-strong border-b border-border/50">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 glass-nav">
              {SidebarContent}
            </SheetContent>
          </Sheet>

          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-base sm:text-lg truncate">{t(`nav.${viewToNavKey(view)}`, lang)}</h1>
          </div>

          <NotificationsBell />
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>

      {/* Main + sidebar */}
      <div className="flex-1 flex w-full">
        <aside className="hidden lg:flex w-64 shrink-0 glass-nav flex-col sticky top-16 self-start h-[calc(100vh-4rem)]">
          {SidebarContent}
        </aside>
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <footer className="mt-auto border-t border-border/50 glass">
        <div className="container mx-auto max-w-7xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span>(c) 2026 Al Amin Edu Oasis - Prototaip LMS v1.0</span>
          <span>Data dummy | PDPA 2010 | Asia/Kuala_Lumpur (UTC+8)</span>
        </div>
      </footer>
    </div>
  )
}

function viewToNavKey(view: string): string {
  // map view id to nav key for the page title
  const map: Record<string, string> = {
    dashboard: 'dashboard', catalog: 'catalog', 'my-courses': 'myCourses', 'my-attendance': 'myAttendance',
    'my-certificates': 'myCertificates', profile: 'profile', 'trainer-courses': 'myTeaching', 'course-editor': 'courseEditor',
    'session-schedule': 'sessionSchedule', 'qr-display': 'qrDisplay', 'attendance-list': 'attendanceList',
    'team-dashboard': 'teamDashboard', 'assign-course': 'assignCourse', 'approve-correction': 'approveCorrection',
    'reports': 'reports', 'users': 'users', 'departments': 'departments', 'audit-log': 'auditLog',
    'settings': 'settings', 'reset-data': 'resetData', 'verify-certificate': 'verifyCertificate',
  }
  return map[view] || 'dashboard'
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  if (!mounted) return <Button variant="ghost" size="icon" className="size-9"><Sun className="size-4" /></Button>
  return (
    <Button variant="ghost" size="icon" className="size-9" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}

function NotificationsBell() {
  const { user } = useAppStore()
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: api.notifications.list,
    refetchInterval: 30000,
    enabled: !!user,
  })
  const unread = data?.notifications?.filter(n => !n.read) || []

  async function markAllRead() {
    await api.notifications.markAllRead()
    qc.invalidateQueries({ queryKey: ['notifications'] })
    toast.success('Semua notifikasi ditanda dibaca')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-9 relative">
          <Bell className="size-4" />
          {unread.length > 0 && (
            <span className="absolute top-1.5 right-1.5 size-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
              {unread.length > 9 ? '9+' : unread.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 glass-strong">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
          <span className="font-semibold text-sm">Notifikasi</span>
          {unread.length > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">Tanda semua dibaca</button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {data?.notifications?.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-muted-foreground">Tiada notifikasi</div>
          ) : (
            <div className="divide-y divide-border/40">
              {data?.notifications?.slice(0, 20).map(n => (
                <div key={n.id} className={`px-3 py-2.5 text-xs ${!n.read ? 'bg-accent/30' : ''}`}>
                  <div className="font-medium">{n.message}</div>
                  <div className="text-muted-foreground mt-0.5">{new Date(n.createdAt).toLocaleString('ms-MY')}</div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function UserMenu() {
  const { user, setUser } = useAppStore()
  const qc = useQueryClient()
  if (!user) return null
  const lang = (user.language as 'ms' | 'en') || 'ms'

  async function logout() {
    try { await api.auth.logout() } catch { /* ignore */ }
    setUser(null)
    qc.clear()
    toast.success('Anda telah log keluar')
  }

  async function switchRole(role: string) {
    try {
      const { user: newU } = await api.auth.switchRole(role)
      setUser(newU)
      qc.clear()
      toast.success(`Bertukar ke peranan: ${t(`role.${role}`, lang)}`)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function toggleLang() {
    const newLang = user!.language === 'ms' ? 'en' : 'ms'
    try {
      const { user: updated } = await api.users.update(user!.id, { language: newLang, name: user!.name, email: user!.email, role: user!.role, departmentId: user!.departmentId, position: user!.position, status: 'ACTIVE', avatarColor: user!.avatarColor })
      setUser(updated)
      toast.success(newLang === 'ms' ? 'Bahasa: Bahasa Malaysia' : 'Language: English')
    } catch (err: any) { toast.error(err.message) }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-accent/50 transition">
          <Avatar className="size-8 border-2 border-white/50 dark:border-white/10" style={{ backgroundColor: user.avatarColor }}>
            <AvatarFallback className="text-white font-semibold text-xs" style={{ backgroundColor: user.avatarColor }}>
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold truncate max-w-[140px]">{user.name}</div>
            <div className="text-[10px] text-muted-foreground">{t(`role.${user.role}`, lang)}</div>
          </div>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 glass-strong">
        <DropdownMenuLabel className="py-3">
          <div className="font-semibold text-sm truncate">{user.name}</div>
          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          <Badge variant="secondary" className="mt-1.5 text-[10px]">{t(`role.${user.role}`, lang)}</Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => useAppStore.getState().navigate('profile')}>
          <UserCog className="size-4 mr-2" /> Profil saya
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleLang}>
          <Globe className="size-4 mr-2" /> {lang === 'ms' ? 'Tukar ke English' : 'Switch to Malay'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Tukar Peranan (Demo)</DropdownMenuLabel>
        {(['ADMIN', 'HR', 'TRAINER', 'STAFF'] as const).map(r => (
          <DropdownMenuItem key={r} onClick={() => switchRole(r)}>
            <RefreshCw className="size-4 mr-2" /> {t(`role.${r}`, lang)}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-rose-600 focus:text-rose-700">
          <LogOut className="size-4 mr-2" /> Log Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
