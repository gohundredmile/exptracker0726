'use client'

import { useState, useEffect } from 'react'
import { useAppStore, type Profile } from '@/stores/app-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
  Users,
  Star,
  Check,
  Briefcase,
  Home,
  Heart,
  Loader2,
} from 'lucide-react'

const profileColors = [
  '#10b981', '#f97316', '#ec4899', '#8b5cf6', '#06b6d4',
  '#ef4444', '#eab308', '#14b8a6', '#6366f1', '#f43f5e',
]

const profileTypes = [
  { value: 'personal', label: 'Personal', icon: Home, desc: 'Personal finances' },
  { value: 'business', label: 'Business', icon: Briefcase, desc: 'Business expenses' },
  { value: 'family', label: 'Family', icon: Heart, desc: 'Family budget' },
  { value: 'project', label: 'Project', icon: Star, desc: 'Project-based tracking' },
]

const currencies = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'BDT', label: 'BDT (৳)' },
  { value: 'INR', label: 'INR (₹)' },
  { value: 'JPY', label: 'JPY (¥)' },
  { value: 'CNY', label: 'CNY (¥)' },
  { value: 'AUD', label: 'AUD (A$)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'SGD', label: 'SGD (S$)' },
]

const emptyProfile = { name: '', type: 'personal', currency: 'USD', color: '#10b981' }

export default function ProfilesView() {
  const { token, activeProfile, setActiveProfile, logout } = useAppStore()
  const { toast } = useToast()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyProfile)
  const [formLoading, setFormLoading] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchProfiles = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch('/api/profiles', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) setProfiles(data.profiles)
    } catch (err) {
      console.error('Failed to fetch profiles:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProfiles() }, [token])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyProfile)
    setFormOpen(true)
  }

  const openEdit = (profile: Profile) => {
    setEditingId(profile.id)
    setForm({
      name: profile.name,
      type: profile.type,
      currency: profile.currency,
      color: profile.color,
    })
    setFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) return

    setFormLoading(true)
    try {
      const url = editingId ? `/api/profiles/${editingId}` : '/api/profiles'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        toast({
          title: editingId ? 'Profile updated' : 'Profile created',
          description: editingId
            ? `"${form.name}" has been updated.`
            : `New profile "${form.name}" is ready to use!`,
        })
        setFormOpen(false)
        fetchProfiles()
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

  const handleSetDefault = async (profileId: string) => {
    try {
      const res = await fetch(`/api/profiles/${profileId}/default`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const profile = profiles.find((p) => p.id === profileId)
        if (profile) setActiveProfile({ ...profile, isDefault: true })
        fetchProfiles()
        toast({ title: 'Default updated', description: `"${profiles.find(p => p.id === profileId)?.name}" is now your default profile.` })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update default', variant: 'destructive' })
    }
  }

  const handleSwitch = (profile: Profile) => {
    setActiveProfile(profile)
    toast({ title: 'Switched', description: `Now viewing "${profile.name}"` })
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/profiles/${deleteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const deletedProfile = profiles.find((p) => p.id === deleteId)
        if (deletedProfile?.id === activeProfile?.id) {
          const remaining = profiles.filter((p) => p.id !== deleteId)
          if (remaining.length > 0) setActiveProfile(remaining[0])
        }
        toast({ title: 'Deleted', description: 'Profile has been removed.' })
        fetchProfiles()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' })
    } finally {
      setDeleteLoading(false)
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profiles</h1>
          <p className="text-muted-foreground">Manage your budget profiles — separate tracking for different purposes</p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          New Profile
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
        <CardContent className="pt-4 pb-4 px-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Users className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Why use profiles?</h3>
              <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80 mt-1">
                Profiles let you separate your finances. Create one for personal expenses, another for business,
                or one for each family member. Each profile has its own categories, expenses, and budgets.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profiles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => {
            const isActive = profile.id === activeProfile?.id
            const typeInfo = profileTypes.find((t) => t.value === profile.type)

            return (
              <Card
                key={profile.id}
                className={`relative overflow-hidden transition-all ${
                  isActive
                    ? 'ring-2 ring-emerald-500 border-emerald-300 dark:border-emerald-700'
                    : 'hover:shadow-md'
                }`}
              >
                {/* Color bar */}
                <div
                  className="h-1.5 w-full"
                  style={{ backgroundColor: profile.color }}
                />

                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: profile.color }}
                      >
                        {profile.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {profile.name}
                          {isActive && (
                            <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                              Active
                            </Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs capitalize">
                            {typeInfo?.label || profile.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{profile.currency}</span>
                        </div>
                      </div>
                    </div>
                    {profile.isDefault && (
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">{profile._count?.expenses || 0}</p>
                      <p className="text-xs text-muted-foreground">Expenses</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">{profile._count?.budgets || 0}</p>
                      <p className="text-xs text-muted-foreground">Budgets</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">{profile._count?.categories || 0}</p>
                      <p className="text-xs text-muted-foreground">Categories</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/50"
                        onClick={() => handleSwitch(profile)}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Switch
                      </Button>
                    )}
                    {!profile.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => handleSetDefault(profile.id)}
                      >
                        <Star className="w-3 h-3 mr-1" />
                        Set Default
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => openEdit(profile)}>
                      <Pencil className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => setDeleteId(profile.id)}
                      disabled={profiles.length <= 1}
                    >
                      <Trash2 className="w-3 h-3" />
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
              <DialogTitle>{editingId ? 'Edit Profile' : 'Create New Profile'}</DialogTitle>
              <DialogDescription>
                {editingId
                  ? 'Update your profile settings.'
                  : 'Set up a new budget profile with its own categories and budgets.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Profile Name</Label>
                <Input
                  id="profile-name"
                  placeholder="e.g., My Budget, Business"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Profile Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {profileTypes.map((pt) => {
                    const Icon = pt.icon
                    const isSelected = form.type === pt.value
                    return (
                      <button
                        key={pt.value}
                        type="button"
                        onClick={() => setForm({ ...form, type: pt.value })}
                        className={`flex items-center gap-2.5 p-3 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                            : 'border-border hover:border-muted-foreground/30'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                        <div>
                          <p className={`text-sm font-medium ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : ''}`}>
                            {pt.label}
                          </p>
                          <p className="text-xs text-muted-foreground">{pt.desc}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={form.currency}
                  onValueChange={(v) => setForm({ ...form, currency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {profileColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className={`w-8 h-8 rounded-lg transition-all ${
                        form.color === color ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={formLoading}>
                {formLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingId ? 'Update Profile' : 'Create Profile'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profile</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this profile and all its associated expenses, budgets, and categories. This action cannot be undone.
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
              Delete Profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}