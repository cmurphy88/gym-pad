import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';
import { validateSavingsGoal } from '@/lib/validations';

/**
 * GET /api/savings-goals
 * Get all savings goals for the authenticated user
 */
export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const goals = await prisma.savingsGoal.findMany({
      where: { userId: auth.user.id },
      include: {
        transactions: {
          orderBy: { date: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate current balance for each goal
    const goalsWithBalance = goals.map(goal => ({
      ...goal,
      currentBalance: goal.transactions.reduce((sum, t) => {
        return t.type === 'WITHDRAWAL' ? sum - t.amount : sum + t.amount;
      }, 0)
    }));

    return NextResponse.json({ goals: goalsWithBalance });
  } catch (error) {
    console.error('Error fetching savings goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch savings goals' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/savings-goals
 * Create a new savings goal
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

    // Create the new goal (no longer deleting existing goals)
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
