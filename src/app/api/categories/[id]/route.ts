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
    const { name, icon, color, type } = body

    const category = await db.category.findFirst({
      where: { id },
      include: { profile: true },
    })

    if (!category || category.profile.userId !== userData.userId) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const updated = await db.category.update({
      where: { id },
      data: { name, icon, color, type },
    })

    return NextResponse.json({ category: updated })
  } catch (error) {
    console.error('Category PUT error:', error)
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

    const category = await db.category.findFirst({
      where: { id },
      include: { profile: true },
    })

    if (!category || category.profile.userId !== userData.userId) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    await db.category.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Category DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}