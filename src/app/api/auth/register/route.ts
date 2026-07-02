import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)

    const user = await db.user.create({
      data: { email, password: hashedPassword, name },
    })

    const defaultProfile = await db.profile.create({
      data: {
        name: 'My Budget',
        type: 'personal',
        currency: 'USD',
        color: '#10b981',
        isDefault: true,
        userId: user.id,
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
      data: defaultCategories.map((cat) => ({ ...cat, profileId: defaultProfile.id })),
    })

    const token = createToken({ userId: user.id, email: user.email })

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
      token,
      profile: defaultProfile,
    }, { status: 201 })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}