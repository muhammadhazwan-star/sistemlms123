'use client'
import * as React from 'react'
import { GraduationCap, Mail, Lock, LogIn, Sparkles, ShieldCheck, Users, QrCode, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

const DEMO_ACCOUNTS = [
  { role: 'ADMIN', email: 'user1000@alaamin.my', label: 'Pentadbir' },
  { role: 'HR', email: 'user1001@alaamin.my', label: 'HR / Pengurus' },
  { role: 'TRAINER', email: 'user1003@alaamin.my', label: 'Jurulatih' },
  { role: 'STAFF', email: 'user1007@alaamin.my', label: 'Staf' },
]

export function LoginScreen() {
  const setUser = useAppStore(s => s.setUser)
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  async function submit(e?: React.FormEvent, overrideEmail?: string, overridePassword?: string) {
    e?.preventDefault()
    const loginEmail = overrideEmail ?? email
    const loginPassword = overridePassword ?? password
    if (!loginEmail || !loginPassword) { toast.error('Sila isi e-mel dan kata laluan'); return }
    setLoading(true)
    try {
      const { user } = await api.auth.login(loginEmail, loginPassword)
      setUser(user)
      toast.success(`Selamat datang, ${user.name}`)
    } catch (err: any) {
      toast.error(err.message || 'Log masuk gagal')
    } finally { setLoading(false) }
  }

  function quickLogin(acc: typeof DEMO_ACCOUNTS[number]) {
    setEmail(acc.email)
    setPassword('demo123')
    submit(undefined, acc.email, 'demo123')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-6 lg:gap-8 items-center">
          {/* Hero */}
          <Card className="glass p-8 lg:p-12 rounded-3xl hidden lg:block">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-12 rounded-2xl gradient-primary flex items-center justify-center text-white shadow-lg">
                <GraduationCap className="size-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">LMS Al Amin</h1>
                <p className="text-sm text-muted-foreground">Latihan Kecerdasan Buatan</p>
              </div>
            </div>
            <h2 className="text-3xl font-bold leading-tight mb-3">
              <span className="gradient-text">Padankan kemahiran AI</span><br />setiap kakitangan.
            </h2>
            <p className="text-muted-foreground mb-8">
              Platform pembelajaran pusat untuk latihan AI, kehadiran digital automatik, dan pensijilan
              boleh disahkan - direka untuk Al Amin, Malaysia.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: QrCode, title: 'Kehadiran QR', desc: 'Imbasan automatik' },
                { icon: Award, title: 'Sijil Digital', desc: 'Pengesahan awam' },
                { icon: Users, title: '4 Peranan', desc: 'RBAC lengkap' },
                { icon: ShieldCheck, title: 'PDPA 2010', desc: 'Tadbir urus data' },
              ].map((f) => (
                <div key={f.title} className="glass rounded-2xl p-4">
                  <f.icon className="size-5 text-primary mb-2" />
                  <div className="font-semibold text-sm">{f.title}</div>
                  <div className="text-xs text-muted-foreground">{f.desc}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Login form */}
          <Card className="glass p-6 sm:p-8 rounded-3xl">
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="size-11 rounded-2xl gradient-primary flex items-center justify-center text-white">
                <GraduationCap className="size-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">LMS Al Amin</h1>
                <p className="text-xs text-muted-foreground">Latihan AI Kakitangan</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-1">Log Masuk</h2>
            <p className="text-sm text-muted-foreground mb-6">Gunakan akaun demo untuk meneroka sistem.</p>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mel</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="anda@alaamin.my" className="pl-9" autoComplete="email" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Kata Laluan</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="demo123" className="pl-9" autoComplete="current-password" />
                </div>
              </div>
              <Button type="submit" className="w-full gradient-primary text-white shadow-lg" disabled={loading}>
                {loading ? <Sparkles className="size-4 animate-pulse" /> : <LogIn className="size-4" />}
                <span className="ml-2">{loading ? 'Mengesahkan...' : 'Log Masuk'}</span>
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Sparkles className="size-3.5" /> Akaun Demo (klik untuk log masuk pantas)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map(acc => (
                  <button key={acc.role} type="button" onClick={() => quickLogin(acc)}
                    className="glass rounded-xl p-3 text-left hover:ring-2 hover:ring-primary/40 transition text-xs">
                    <div className="font-semibold">{acc.label}</div>
                    <div className="text-muted-foreground truncate">{acc.email}</div>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">Kata laluan demo: <code className="font-mono bg-muted px-1.5 py-0.5 rounded">demo123</code></p>
            </div>
          </Card>
        </div>
      </main>
      <footer className="mt-auto border-t border-border/60 glass">
        <div className="container mx-auto max-w-6xl px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>(c) 2026 Al Amin Edu Oasis, Malaysia. Prototaip LMS.</span>
          <span>Data dummy - tiada maklumat peribadi sebenar.</span>
        </div>
      </footer>
    </div>
  )
}
