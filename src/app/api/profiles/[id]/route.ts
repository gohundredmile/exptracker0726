import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userData = getUserFromRequest(request)
    if (!userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, type, currency, color } = body

    const profile = await db.profile.findFirst({
      where: { id, userId: userData.userId },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const updated = await db.profile.update({
      where: { id },
      data: { name, type, currency, color },
      include: { _count: { select: { expenses: true, budgets: true, categories: true } } },
    })

    return NextResponse.json({ profile: updated })
  } catch (error) {
    console.error('Profile PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userData = getUserFromRequest(request)
    if (!userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const profile = await db.profile.findFirst({
      where: { id, userId: userData.userId },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const userProfiles = await db.profile.findMany({
      where: { userId: userData.userId },
    })

    if (userProfiles.length <= 1) {
      return NextResponse.json({ error: 'Cannot delete the last profile' }, { status: 400 })
    }

    await db.profile.delete({ where: { id } })

    if (profile.isDefault) {
      const firstRemaining = await db.profile.findFirst({
        where: { userId: userData.userId },
      })
      if (firstRemaining) {
        await db.profile.update({
          where: { id: firstRemaining.id },
          data: { isDefault: true },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Profile DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}