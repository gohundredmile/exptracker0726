'use client'

import { useState, useEffect } from 'react'
import { useAppStore, type Expense, type Budget, type Category } from '@/stores/app-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface DashboardData {
  thisMonth: { total: number; count: number }
  lastMonth: { total: number }
  monthChange: number
  recentExpenses: Expense[]
  categoryBreakdown: Array<{
    categoryId: string
    name: string
    icon: string
    color: string
    total: number
    count: number
  }>
  budgetSummary: Budget[]
  dailyExpenses: Array<{ date: string; total: number }>
}

function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const icons: Record<string, string> = {
    utensils: '🍽️',
    car: '🚗',
    'shopping-bag': '🛍️',
    'gamepad-2': '🎮',
    zap: '⚡',
    'heart-pulse': '❤️',
    'graduation-cap': '🎓',
    plane: '✈️',
    wallet: '💰',
    laptop: '💻',
    circle: '⭕',
  }
  return <span className={className}>{icons[icon] || '⭕'}</span>
}

export default function DashboardView() {
  const { token, activeProfile } = useAppStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token && activeProfile) {
      fetchDashboard()
    }
  }, [token, activeProfile])

  const fetchDashboard = async () => {
    if (!activeProfile) return
    setLoading(true)
    try {
      const res = await fetch(
        `/api/dashboard?profileId=${activeProfile.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const result = await res.json()
      if (res.ok) setData(result)
    } catch (err) {
      console.error('Failed to fetch dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const currency = activeProfile?.currency || 'USD'

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-1" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <h3 className="text-lg font-medium">No data yet</h3>
        <p className="text-muted-foreground text-sm mt-1">Start adding expenses to see your dashboard</p>
      </div>
    )
  }

  const stats = [
    {
      title: 'This Month',
      value: formatCurrency(data.thisMonth.total, currency),
      subtitle: `${data.thisMonth.count} transactions`,
      icon: DollarSign,
      trend: data.monthChange,
      color: 'emerald',
    },
    {
      title: 'Last Month',
      value: formatCurrency(data.lastMonth.total, currency),
      subtitle: 'Previous period',
      icon: Receipt,
      trend: null,
      color: 'slate',
    },
    {
      title: 'Daily Average',
      value: formatCurrency(data.thisMonth.total / Math.max(new Date().getDate(), 1), currency),
      subtitle: 'This month so far',
      icon: TrendingDown,
      trend: null,
      color: 'amber',
    },
    {
      title: 'Budget Alerts',
      value: String(data.budgetSummary.filter((b) => (b.percentage || 0) > 80).length),
      subtitle: 'Near limit budgets',
      icon: AlertTriangle,
      trend: null,
      color: 'red',
    },
  ]

  const pieData = data.categoryBreakdown.slice(0, 6).map((c) => ({
    name: c.name,
    value: c.total,
    color: c.color,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your spending for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  {stat.trend !== null && (
                    <Badge
                      variant="secondary"
                      className={`text-xs px-1.5 py-0 ${
                        stat.trend <= 0
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                          : 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                      }`}
                    >
                      {stat.trend <= 0 ? (
                        <ArrowDownRight className="w-3 h-3 mr-0.5" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3 mr-0.5" />
                      )}
                      {Math.abs(stat.trend).toFixed(1)}%
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{stat.subtitle}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily Spending Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Daily Spending</CardTitle>
            <CardDescription>Your spending pattern this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.dailyExpenses}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => new Date(v).getDate().toString()}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${currency === 'USD' ? '$' : currency} ${v}`}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--foreground)',
                    }}
                    formatter={(value: number) => [formatCurrency(value, currency), 'Spent']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Category</CardTitle>
            <CardDescription>Where your money goes</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--card)',
                        color: 'var(--foreground)',
                      }}
                      formatter={(value: number) => [formatCurrency(value, currency), 'Total']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                No spending data
              </div>
            )}
            <div className="space-y-2 mt-2">
              {data.categoryBreakdown.slice(0, 5).map((cat) => (
                <div key={cat.categoryId} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="truncate">{cat.name}</span>
                  </div>
                  <span className="font-medium flex-shrink-0 ml-2">{formatCurrency(cat.total, currency)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Budget Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Budget Progress</CardTitle>
            <CardDescription>Track your spending limits</CardDescription>
          </CardHeader>
          <CardContent>
            {data.budgetSummary.length > 0 ? (
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {data.budgetSummary.map((budget) => (
                  <div key={budget.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <CategoryIcon icon={budget.category.icon} className="text-sm" />
                        <span className="font-medium">{budget.category.name}</span>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {formatCurrency(budget.spent || 0, currency)} / {formatCurrency(budget.amount, currency)}
                      </span>
                    </div>
                    <Progress
                      value={budget.percentage || 0}
                      className={`h-2 ${(budget.percentage || 0) > 90 ? '[&>div]:bg-red-500' : (budget.percentage || 0) > 70 ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500'}`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No budgets set. Create budgets to track your spending limits.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Transactions</CardTitle>
            <CardDescription>Your latest expense entries</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentExpenses.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {data.recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${expense.category.color}15` }}
                    >
                      <CategoryIcon icon={expense.category.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{expense.description}</p>
                      <p className="text-xs text-muted-foreground">{expense.category.name}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold">-{formatCurrency(expense.amount, currency)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No expenses yet. Start tracking your spending!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}