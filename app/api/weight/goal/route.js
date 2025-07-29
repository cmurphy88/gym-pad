import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';
import { validateWeightGoal } from '@/lib/validations';

/**
 * GET /api/weight/goal - Get active weight goal for authenticated user
 */
export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    
    const activeGoal = await prisma.weightGoal.findFirst({
      where: {
        userId: auth.user.id,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(activeGoal);
  } catch (error) {
    console.error('Error fetching weight goal:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to fetch weight goal', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/weight/goal - Create a new weight goal
 */
export async function POST(request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    
    const data = await request.json();
    
    // Validate the weight goal data
    const validation = validateWeightGoal(data);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Deactivate any existing active goals
    await prisma.weightGoal.updateMany({
      where: {
        userId: auth.user.id,
        isActive: true
      },
      data: {
        isActive: false
      }
    });

    // Create new weight goal
    const weightGoal = await prisma.weightGoal.create({
      data: {
        userId: auth.user.id,
        targetWeight: data.targetWeight,
        goalType: data.goalType,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        isActive: true,
      }
    });

    return NextResponse.json(weightGoal, { status: 201 });
  } catch (error) {
    console.error('Error creating weight goal:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to create weight goal', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/weight/goal - Update the active weight goal
 */
export async function PUT(request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    
    const data = await request.json();
    
    // Validate the weight goal data
    const validation = validateWeightGoal(data);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Find the active goal
    const activeGoal = await prisma.weightGoal.findFirst({
      where: {
        userId: auth.user.id,
        isActive: true
      }
    });

    if (!activeGoal) {
      return NextResponse.json(
        { error: 'No active weight goal found' },
        { status: 404 }
      );
    }

    // Update the active goal
    const updatedGoal = await prisma.weightGoal.update({
      where: {
        id: activeGoal.id
      },
      data: {
        targetWeight: data.targetWeight,
        goalType: data.goalType,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
      }
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('Error updating weight goal:', error);
    return NextResponse.json(
      { error: 'Failed to update weight goal' },
      { status: 500 }
    );
  }
}