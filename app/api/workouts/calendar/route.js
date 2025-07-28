import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

/**
 * GET /api/workouts/calendar - Get workouts grouped by date for calendar view
 */
export async function GET(request) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year')) || new Date().getFullYear()
    const month = parseInt(searchParams.get('month')) || new Date().getMonth() + 1
    
    // Calculate start and end dates for the month
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)
    
    const workouts = await prisma.workout.findMany({
      where: {
        userId: auth.user.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        id: true,
        title: true,
        date: true,
        notes: true
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Group workouts by date
    const workoutsByDate = {}
    workouts.forEach(workout => {
      const dateKey = workout.date.toISOString().split('T')[0]
      if (!workoutsByDate[dateKey]) {
        workoutsByDate[dateKey] = []
      }
      workoutsByDate[dateKey].push({
        id: workout.id,
        title: workout.title,
        notes: workout.notes
      })
    })

    return NextResponse.json({
      year,
      month,
      workouts: workoutsByDate
    })
  } catch (error) {
    console.error('Error fetching calendar workouts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    )
  }
}