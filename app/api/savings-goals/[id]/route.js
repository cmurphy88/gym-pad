import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';
import { validateSavingsGoal } from '@/lib/validations';

/**
 * GET /api/savings-goals/[id]
 * Get a specific savings goal by ID
 */
export async function GET(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const goalId = parseInt(id, 10);

    if (isNaN(goalId)) {
      return NextResponse.json(
        { error: 'Invalid goal ID' },
        { status: 400 }
      );
    }

    const goal = await prisma.savingsGoal.findFirst({
      where: {
        id: goalId,
        userId: auth.user.id
      },
      include: {
        transactions: {
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!goal) {
      return NextResponse.json(
        { error: 'Savings goal not found' },
        { status: 404 }
      );
    }

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
 * PUT /api/savings-goals/[id]
 * Update a specific savings goal
 */
export async function PUT(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const goalId = parseInt(id, 10);

    if (isNaN(goalId)) {
      return NextResponse.json(
        { error: 'Invalid goal ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = validateSavingsGoal(body);

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Find existing goal and verify ownership
    const existingGoal = await prisma.savingsGoal.findFirst({
      where: {
        id: goalId,
        userId: auth.user.id
      }
    });

    if (!existingGoal) {
      return NextResponse.json(
        { error: 'Savings goal not found' },
        { status: 404 }
      );
    }

    // Update the goal
    const goal = await prisma.savingsGoal.update({
      where: { id: goalId },
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
 * DELETE /api/savings-goals/[id]
 * Delete a specific savings goal
 */
export async function DELETE(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const goalId = parseInt(id, 10);

    if (isNaN(goalId)) {
      return NextResponse.json(
        { error: 'Invalid goal ID' },
        { status: 400 }
      );
    }

    // Find and verify ownership
    const existingGoal = await prisma.savingsGoal.findFirst({
      where: {
        id: goalId,
        userId: auth.user.id
      }
    });

    if (!existingGoal) {
      return NextResponse.json(
        { error: 'Savings goal not found' },
        { status: 404 }
      );
    }

    // Delete the goal (cascades to transactions)
    await prisma.savingsGoal.delete({
      where: { id: goalId }
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
