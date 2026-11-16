'use client'
import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function GlassCard({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Card className={`glass rounded-2xl ${className}`} {...props}>
      {children}
    </Card>
  )
}

export function StatCard({ label, value, icon: Icon, accent = 'primary', hint }: {
  label: string; value: React.ReactNode; icon: any; accent?: 'primary' | 'emerald' | 'amber' | 'rose' | 'sky'; hint?: string
}) {
  const accents: Record<string, string> = {
    primary: 'gradient-primary text-white',
    emerald: 'bg-emerald-500 text-white',
    amber: 'bg-amber-500 text-white',
    rose: 'bg-rose-500 text-white',
    sky: 'bg-sky-500 text-white',
  }
  return (
    <Card className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className="text-2xl font-bold mt-1.5 truncate">{value}</div>
          {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
        </div>
        <div className={`size-10 rounded-xl flex items-center justify-center shadow-md shrink-0 ${accents[accent]}`}>
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  )
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: any; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <Card className="glass rounded-2xl p-10 text-center">
      <div className="mx-auto size-14 rounded-2xl bg-accent/60 flex items-center justify-center mb-4">
        <Icon className="size-7 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-base">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </Card>
  )
}

export function LoadingState({ label = 'Memuat...' }: { label?: string }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48 rounded-xl" />
      <div className="grid sm:grid-cols-3 gap-4">
        {[0,1,2].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
      <p className="text-xs text-muted-foreground text-center">{label}</p>
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <Card className="glass rounded-2xl p-10 text-center border-rose-200">
      <div className="mx-auto size-14 rounded-2xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center mb-4">
        <span className="text-2xl">!</span>
      </div>
      <h3 className="font-semibold text-base">Ralat</h3>
      <p className="text-sm text-muted-foreground mt-1">{message}</p>
    </Card>
  )
}
