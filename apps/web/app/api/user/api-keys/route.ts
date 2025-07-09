import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractTokenFromHeader } from '@greed-advisor/auth'
import { apiKeysSchema } from '@greed-advisor/validations'

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const result = apiKeysSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      )
    }

    const { openAiKey, t212Key } = result.data

    // Update user API keys
    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        openAiKey: openAiKey || undefined,
        t212Key: t212Key || undefined
      },
      select: {
        id: true,
        email: true,
        openAiKey: true,
        t212Key: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      message: 'API keys updated successfully',
      user
    })

  } catch (error) {
    console.error('Update API keys error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
