'use client'
import * as React from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { LoginScreen } from '@/components/auth/login-screen'
import { AppShell } from '@/components/shell/app-shell'
import { Skeleton } from '@/components/ui/skeleton'

// View registry - imported dynamically to keep main bundle light
const ViewRouter = React.lazy(() => import('@/components/view-router').then(m => ({ default: m.ViewRouter })))

export default function Page() {
  const { user, loading, setUser, setLoading } = useAppStore()

  // Bootstrap session on mount
  React.useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const { user: u } = await api.auth.me()
        if (active) {
          setUser(u)
          // also read ?view= query for deep links (e.g., /?view=verify-certificate)
          const params = new URLSearchParams(window.location.search)
          const qv = params.get('view')
          if (qv) useAppStore.getState().navigate(qv)
        }
      } catch { /* ignore */ }
      finally { if (active) setLoading(false) }
    })()
    return () => { active = false }
  }, [setUser, setLoading])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-48 rounded-2xl" />
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
        </div>
      </div>
    )
  }

  if (!user) return <LoginScreen />

  return (
    <AppShell>
      <React.Suspense fallback={<Skeleton className="h-96 rounded-3xl" />}>
        <ViewRouter />
      </React.Suspense>
    </AppShell>
  )
}
