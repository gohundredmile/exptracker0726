'use client'

import { useState, useEffect } from 'react'
import { useAppStore, type Profile } from '@/stores/app-store'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  Users,
  LogOut,
  Settings,
  ChevronDown,
  DollarSign,
  Moon,
  Sun,
  Menu,
  X,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from 'next-themes'

interface AppShellProps {
  children: (view: string) => React.ReactNode
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'budgets', label: 'Budgets', icon: PiggyBank },
  { id: 'profiles', label: 'Profiles', icon: Users },
]

export default function AppShell({ children }: AppShellProps) {
  const [activeView, setActiveView] = useState('dashboard')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, token, activeProfile, setActiveProfile, logout, hydrated } = useAppStore()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const controller = new AbortController()
    if (token) {
      const doFetch = async () => {
        const res = await fetch('/api/profiles', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        if (controller.signal.aborted) return
        const data = await res.json()
        if (res.ok) {
          setProfiles(data.profiles)
          const currentActive = useAppStore.getState().activeProfile
          if (!currentActive && data.profiles.length > 0) {
            const defaultProfile = data.profiles.find((p: Profile) => p.isDefault) || data.profiles[0]
            useAppStore.getState().setActiveProfile(defaultProfile)
          }
        }
      }
      doFetch()
    }
    return () => controller.abort()
  }, [token])

  const switchProfile = (profile: Profile) => {
    setActiveProfile(profile)
    setSidebarOpen(false)
  }

  const handleLogout = () => {
    logout()
    setSidebarOpen(false)
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">BudgetFlow</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Profile Switcher */}
        <div className="p-3 border-b border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between h-auto py-2.5 px-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-3 h-8 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: activeProfile?.color || '#10b981' }}
                  />
                  <div className="text-left min-w-0">
                    <p className="text-sm font-medium truncate">
                      {activeProfile?.name || 'Select Profile'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {activeProfile?.currency || 'USD'} · {activeProfile?.type || 'personal'}
                    </p>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              {profiles.map((profile) => (
                <DropdownMenuItem
                  key={profile.id}
                  onClick={() => switchProfile(profile)}
                  className="flex items-center gap-2.5 py-2.5"
                >
                  <div
                    className="w-3 h-6 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: profile.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{profile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {profile._count?.expenses || 0} expenses
                    </p>
                  </div>
                  {profile.isDefault && (
                    <Badge variant="secondary" className="ml-auto text-xs flex-shrink-0">
                      Default
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-3">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeView === item.id
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={`w-full justify-start gap-3 h-10 px-3 ${
                    isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 font-medium' : ''
                  }`}
                  onClick={() => {
                    setActiveView(item.id)
                    setSidebarOpen(false)
                  }}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                  {item.label}
                </Button>
              )
            })}
          </nav>
        </ScrollArea>

        {/* User section */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Top bar for mobile */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm">BudgetFlow</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            {activeProfile && (
              <Badge variant="outline" className="hidden sm:flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: activeProfile.color }}
                />
                {activeProfile.name}
              </Badge>
            )}
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          {children(activeView)}
        </div>
      </main>
    </div>
  )
}