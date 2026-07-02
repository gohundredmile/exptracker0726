import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  name: string
  avatar: string | null
}

export interface Profile {
  id: string
  name: string
  type: string
  currency: string
  color: string
  isDefault: boolean
  _count?: { expenses: number; budgets: number; categories: number }
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  type: string
  _count?: { expenses: number; budgets: number }
}

export interface Expense {
  id: string
  amount: number
  description: string
  date: string
  note: string | null
  categoryId: string
  profileId: string
  category: Category
  createdAt: string
}

export interface Budget {
  id: string
  amount: number
  period: string
  startDate: string
  categoryId: string
  profileId: string
  category: Category
  spent?: number
  remaining?: number
  percentage?: number
  createdAt: string
}

interface AppState {
  // Auth
  user: User | null
  token: string | null
  activeProfile: Profile | null

  // Auth actions
  setAuth: (user: User, token: string, profile?: Profile | null) => void
  logout: () => void
  setActiveProfile: (profile: Profile) => void

  // Hydration
  hydrated: boolean
  setHydrated: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      activeProfile: null,
      hydrated: false,

      setAuth: (user, token, profile) =>
        set({ user, token, activeProfile: profile || null }),

      logout: () =>
        set({ user: null, token: null, activeProfile: null }),

      setActiveProfile: (profile) =>
        set({ activeProfile: profile }),

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'expense-tracker-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    }
  )
)