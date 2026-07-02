import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function POST(
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

    await db.profile.updateMany({
      where: { userId: userData.userId },
      data: { isDefault: false },
    })

    await db.profile.update({
      where: { id },
      data: { isDefault: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Set default profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}