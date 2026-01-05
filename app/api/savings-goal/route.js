import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';
import { validateSavingsGoal } from '@/lib/validations';

/**
 * GET /api/savings-goal
 * Get the user's active savings goal with transactions
 */
export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const goal = await prisma.savingsGoal.findFirst({
      where: { userId: auth.user.id },
      include: {
        transactions: {
          orderBy: { date: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!goal) {
      return NextResponse.json({ goal: null });
    }

    // Calculate current balance from transactions
    const currentBalance = goal.transactions.reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      goal: {
        ...goal,
        currentBalance
      }
    });
  } catch (error) {
    console.error('Error fetching savings goal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch savings goal' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/savings-goal
 * Create a new savings goal (replaces existing if any)
 */
export async function POST(request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const validation = validateSavingsGoal(body);

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Delete any existing goals for this user (single goal at a time)
    await prisma.savingsGoal.deleteMany({
      where: { userId: auth.user.id }
    });

    // Create the new goal
    const goal = await prisma.savingsGoal.create({
      data: {
        userId: auth.user.id,
        name: body.name.trim(),
        targetAmount: body.targetAmount,
        endDate: new Date(body.endDate)
      },
      include: {
        transactions: true
      }
    });

    return NextResponse.json({
      goal: {
        ...goal,
        currentBalance: 0
      }
    });
  } catch (error) {
    console.error('Error creating savings goal:', error);
    return NextResponse.json(
      { error: 'Failed to create savings goal' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/savings-goal
 * Update the current savings goal
 */
export async function PUT(request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const validation = validateSavingsGoal(body);

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Find existing goal
    const existingGoal = await prisma.savingsGoal.findFirst({
      where: { userId: auth.user.id }
    });

    if (!existingGoal) {
      return NextResponse.json(
        { error: 'No savings goal found' },
        { status: 404 }
      );
    }

    // Update the goal
    const goal = await prisma.savingsGoal.update({
      where: { id: existingGoal.id },
      data: {
        name: body.name.trim(),
        targetAmount: body.targetAmount,
        endDate: new Date(body.endDate)
      },
      include: {
        transactions: {
          orderBy: { date: 'desc' }
        }
      }
    });

    const currentBalance = goal.transactions.reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      goal: {
        ...goal,
        currentBalance
      }
    });
  } catch (error) {
    console.error('Error updating savings goal:', error);
    return NextResponse.json(
      { error: 'Failed to update savings goal' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/savings-goal
 * Delete the current savings goal
 */
export async function DELETE(request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    await prisma.savingsGoal.deleteMany({
      where: { userId: auth.user.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting savings goal:', error);
    return NextResponse.json(
      { error: 'Failed to delete savings goal' },
      { status: 500 }
    );
  }
}
