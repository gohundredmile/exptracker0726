import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const userData = getUserFromRequest(request)
    if (!userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profiles = await db.profile.findMany({
      where: { userId: userData.userId },
      include: {
        _count: { select: { expenses: true, budgets: true, categories: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('Profiles GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = getUserFromRequest(request)
    if (!userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, currency, color } = body

    if (!name) {
      return NextResponse.json({ error: 'Profile name is required' }, { status: 400 })
    }

    const userProfiles = await db.profile.findMany({
      where: { userId: userData.userId },
    })

    const isDefault = userProfiles.length === 0

    const profile = await db.profile.create({
      data: {
        name,
        type: type || 'personal',
        currency: currency || 'USD',
        color: color || '#10b981',
        isDefault,
        userId: userData.userId,
      },
    })

    const defaultCategories = [
      { name: 'Food & Dining', icon: 'utensils', color: '#f97316', type: 'expense' },
      { name: 'Transportation', icon: 'car', color: '#3b82f6', type: 'expense' },
      { name: 'Shopping', icon: 'shopping-bag', color: '#ec4899', type: 'expense' },
      { name: 'Entertainment', icon: 'gamepad-2', color: '#8b5cf6', type: 'expense' },
      { name: 'Bills & Utilities', icon: 'zap', color: '#eab308', type: 'expense' },
      { name: 'Healthcare', icon: 'heart-pulse', color: '#ef4444', type: 'expense' },
      { name: 'Education', icon: 'graduation-cap', color: '#06b6d4', type: 'expense' },
      { name: 'Travel', icon: 'plane', color: '#14b8a6', type: 'expense' },
      { name: 'Income', icon: 'wallet', color: '#22c55e', type: 'income' },
      { name: 'Freelance', icon: 'laptop', color: '#6366f1', type: 'income' },
    ]

    await db.category.createMany({
      data: defaultCategories.map((cat) => ({ ...cat, profileId: profile.id })),
    })

    const createdProfile = await db.profile.findUnique({
      where: { id: profile.id },
      include: { _count: { select: { expenses: true, budgets: true, categories: true } } },
    })

    return NextResponse.json({ profile: createdProfile }, { status: 201 })
  } catch (error) {
    console.error('Profiles POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}