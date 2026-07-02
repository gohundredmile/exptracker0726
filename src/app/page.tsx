'use client'

import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/stores/app-store'
import AuthPage from '@/components/app/auth-page'
import AppShell from '@/components/app/app-shell'
import DashboardView from '@/components/app/dashboard-view'
import ExpensesView from '@/components/app/expenses-view'
import BudgetsView from '@/components/app/budgets-view'
import ProfilesView from '@/components/app/profiles-view'
import { ThemeProvider } from 'next-themes'

function AppContent() {
  const { user, token, hydrated } = useAppStore()
  const [loading, setLoading] = useState(true)
  const hasChecked = useRef(false)

  useEffect(() => {
    if (!hydrated || hasChecked.current) return
    hasChecked.current = true

    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) {
            useAppStore.getState().logout()
          }
        })
        .catch(() => {
          useAppStore.getState().logout()
        })
        .finally(() => {
          requestAnimationFrame(() => setLoading(false))
        })
    } else {
      requestAnimationFrame(() => setLoading(false))
    }
  }, [hydrated, token])

  if (!hydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !token) {
    return <AuthPage />
  }

  const renderView = (view: string) => {
    switch (view) {
      case 'dashboard':
        return <DashboardView />
      case 'expenses':
        return <ExpensesView />
      case 'budgets':
        return <BudgetsView />
      case 'profiles':
        return <ProfilesView />
      default:
        return <DashboardView />
    }
  }

  return <AppShell>{renderView}</AppShell>
}

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AppContent />
    </ThemeProvider>
  )
}