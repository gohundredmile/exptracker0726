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

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const [thisMonthExpenses, lastMonthExpenses, recentExpenses, categoryBreakdown, budgetSummary] =
      await Promise.all([
        db.expense.aggregate({
          where: {
            profileId,
            date: { gte: startOfMonth },
            category: { type: 'expense' },
          },
          _sum: { amount: true },
          _count: true,
        }),

        db.expense.aggregate({
          where: {
            profileId,
            date: { gte: startOfLastMonth, lte: endOfLastMonth },
            category: { type: 'expense' },
          },
          _sum: { amount: true },
        }),

        db.expense.findMany({
          where: { profileId },
          include: { category: true },
          orderBy: { date: 'desc' },
          take: 5,
        }),

        db.expense.groupBy({
          by: ['categoryId'],
          where: {
            profileId,
            date: { gte: startOfMonth },
            category: { type: 'expense' },
          },
          _sum: { amount: true },
          _count: true,
          orderBy: { _sum: { amount: 'desc' } },
        }),

        db.budget.findMany({
          where: { profileId },
          include: { category: true },
        }),
      ])

    const categoriesWithNames = await Promise.all(
      categoryBreakdown.map(async (item) => {
        const cat = await db.category.findUnique({ where: { id: item.categoryId } })
        return {
          categoryId: item.categoryId,
          name: cat?.name || 'Unknown',
          icon: cat?.icon || 'circle',
          color: cat?.color || '#6366f1',
          total: item._sum.amount || 0,
          count: item._count,
        }
      })
    )

    const budgetsWithSpent = await Promise.all(
      budgetSummary.map(async (budget) => {
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

        return {
          ...budget,
          spent: spent._sum.amount || 0,
          remaining: budget.amount - (spent._sum.amount || 0),
          percentage: budget.amount > 0 ? Math.min(((spent._sum.amount || 0) / budget.amount) * 100, 100) : 0,
        }
      })
    )

    const thisMonthTotal = thisMonthExpenses._sum.amount || 0
    const lastMonthTotal = lastMonthExpenses._sum.amount || 0
    const monthChange = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0

    const dailyExpenses = await db.$queryRaw<Array<{ date: string; total: number }>>`
      SELECT DATE(date) as date, SUM(amount) as total
      FROM Expense
      WHERE profileId = ${profileId} AND date >= ${startOfMonth}
      GROUP BY DATE(date)
      ORDER BY DATE(date) ASC
    `

    return NextResponse.json({
      thisMonth: {
        total: thisMonthTotal,
        count: thisMonthExpenses._count,
      },
      lastMonth: {
        total: lastMonthTotal,
      },
      monthChange,
      recentExpenses,
      categoryBreakdown: categoriesWithNames,
      budgetSummary: budgetsWithSpent,
      dailyExpenses: dailyExpenses.map((d) => ({
        date: d.date,
        total: d.total,
      })),
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}