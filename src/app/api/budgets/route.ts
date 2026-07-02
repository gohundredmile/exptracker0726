import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const userData = getUserFromRequest(request)
    if (!userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId')

    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 })
    }

    const profile = await db.profile.findFirst({
      where: { id: profileId, userId: userData.userId },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const budgets = await db.budget.findMany({
      where: { profileId },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    })

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const now = new Date()
        let startDate: Date

        switch (budget.period) {
          case 'weekly':
            startDate = new Date(now)
            startDate.setDate(now.getDate() - now.getDay())
            startDate.setHours(0, 0, 0, 0)
            break
          case 'yearly':
            startDate = new Date(now.getFullYear(), 0, 1)
            break
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            break
        }

        const spent = await db.expense.aggregate({
          where: {
            categoryId: budget.categoryId,
            profileId,
            date: { gte: startDate },
          },
          _sum: { amount: true },
        })

        const spentAmount = spent._sum.amount || 0
        const percentage = budget.amount > 0 ? (spentAmount / budget.amount) * 100 : 0

        return {
          ...budget,
          spent: spentAmount,
          remaining: budget.amount - spentAmount,
          percentage: Math.min(percentage, 100),
        }
      })
    )

    return NextResponse.json({ budgets: budgetsWithSpent })
  } catch (error) {
    console.error('Budgets GET error:', error)
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
    const { amount, period, categoryId, profileId } = body

    if (!amount || !categoryId || !profileId) {
      return NextResponse.json({ error: 'Amount, category, and profile are required' }, { status: 400 })
    }

    const profile = await db.profile.findFirst({
      where: { id: profileId, userId: userData.userId },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const budget = await db.budget.create({
      data: {
        amount: parseFloat(amount),
        period: period || 'monthly',
        categoryId,
        profileId,
        userId: userData.userId,
      },
      include: { category: true },
    })

    return NextResponse.json({ budget }, { status: 201 })
  } catch (error) {
    console.error('Budgets POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}