'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore, type Budget, type Category } from '@/stores/app-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  Pencil,
  Trash2,
  PiggyBank,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'

function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const icons: Record<string, string> = {
    utensils: '🍽️', car: '🚗', 'shopping-bag': '🛍️', 'gamepad-2': '🎮',
    zap: '⚡', 'heart-pulse': '❤️', 'graduation-cap': '🎓', plane: '✈️',
    wallet: '💰', laptop: '💻', circle: '⭕',
  }
  return <span className={className}>{icons[icon] || '⭕'}</span>
}

const emptyBudget = { amount: '', period: 'monthly', categoryId: '' }

export default function BudgetsView() {
  const { token, activeProfile } = useAppStore()
  const { toast } = useToast()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyBudget)
  const [formLoading, setFormLoading] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const currency = activeProfile?.currency || 'USD'

  const fetchCategories = useCallback(async () => {
    if (!token || !activeProfile) return
    try {
      const res = await fetch(`/api/categories?profileId=${activeProfile.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) setCategories(data.categories)
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }, [token, activeProfile])

  const fetchBudgets = useCallback(async () => {
    if (!token || !activeProfile) return
    setLoading(true)
    try {
      const res = await fetch(`/api/budgets?profileId=${activeProfile.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) setBudgets(data.budgets)
    } catch (err) {
      console.error('Failed to fetch budgets:', err)
    } finally {
      setLoading(false)
    }
  }, [token, activeProfile])

  useEffect(() => { fetchCategories() }, [fetchCategories])
  useEffect(() => { fetchBudgets() }, [fetchBudgets])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyBudget)
    setFormOpen(true)
  }

  const openEdit = (budget: Budget) => {
    setEditingId(budget.id)
    setForm({
      amount: String(budget.amount),
      period: budget.period,
      categoryId: budget.categoryId,
    })
    setFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.amount || !form.categoryId) return

    setFormLoading(true)
    try {
      const url = editingId ? `/api/budgets/${editingId}` : '/api/budgets'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          period: form.period,
          categoryId: form.categoryId,
          profileId: activeProfile?.id,
        }),
      })
      if (res.ok) {
        toast({
          title: editingId ? 'Budget updated' : 'Budget created',
          description: editingId ? 'Your budget has been updated.' : 'New budget has been set.',
        })
        setFormOpen(false)
        fetchBudgets()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/budgets/${deleteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        toast({ title: 'Deleted', description: 'Budget has been removed.' })
        fetchBudgets()
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' })
    } finally {
      setDeleteLoading(false)
      setDeleteId(null)
    }
  }

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0)
  const overBudget = budgets.filter((b) => (b.percentage || 0) >= 100).length

  const expenseCategories = categories.filter((c) => c.type === 'expense')
  const existingBudgetCategoryIds = budgets.map((b) => b.categoryId)
  const availableCategories = expenseCategories.filter(
    (c) => !existingBudgetCategoryIds.includes(c.id) || editingId
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground">Set spending limits and track your progress</p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Set Budget
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-sm text-muted-foreground">Total Budget</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalBudget, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalSpent, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className={`text-2xl font-bold mt-1 ${totalBudget - totalSpent < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {formatCurrency(totalBudget - totalSpent, currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <PiggyBank className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium">No budgets set</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Create budgets for your categories to track spending limits
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((budget) => {
            const pct = budget.percentage || 0
            const isOver = pct >= 100
            const isWarning = pct >= 80 && pct < 100

            return (
              <Card key={budget.id} className={`relative overflow-hidden ${isOver ? 'border-red-200 dark:border-red-800' : isWarning ? 'border-amber-200 dark:border-amber-800' : ''}`}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${budget.category.color}15` }}
                      >
                        <CategoryIcon icon={budget.category.icon} />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">{budget.category.name}</CardTitle>
                        <CardDescription className="text-xs capitalize">{budget.period}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {isOver ? (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Over
                        </Badge>
                      ) : isWarning ? (
                        <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Warning
                        </Badge>
                      ) : (
                        <Badge className="text-xs bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          On Track
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Spent</p>
                      <p className="text-lg font-bold">{formatCurrency(budget.spent || 0, currency)}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      of {formatCurrency(budget.amount, currency)}
                    </p>
                  </div>
                  <Progress
                    value={Math.min(pct, 100)}
                    className={`h-2.5 ${isOver ? '[&>div]:bg-red-500' : isWarning ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500'}`}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{pct.toFixed(1)}% used</span>
                    <span className={`text-xs font-medium ${isOver ? 'text-red-600' : 'text-emerald-600'}`}>
                      {isOver
                        ? `${formatCurrency(Math.abs(budget.remaining || 0), currency)} over`
                        : `${formatCurrency(budget.remaining || 0, currency)} left`}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-1 border-t border-border">
                    <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs" onClick={() => openEdit(budget)}>
                      <Pencil className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => setDeleteId(budget.id)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Budget' : 'Set New Budget'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Update the budget limit.' : 'Set a spending limit for a category.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="budget-category">Category</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => setForm({ ...form, categoryId: v })}
                >
                  <SelectTrigger id="budget-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <CategoryIcon icon={cat.icon} className="text-xs" />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableCategories.length === 0 && (
                  <p className="text-xs text-muted-foreground">All expense categories already have budgets</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="budget-amount">Budget Limit</Label>
                  <Input
                    id="budget-amount"
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Period</Label>
                  <Select
                    value={form.period}
                    onValueChange={(v) => setForm({ ...form, period: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={formLoading}>
                {formLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingId ? 'Update' : 'Set Budget'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this budget? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}