import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';
import { validateSavingsTransaction } from '@/lib/validations';

/**
 * POST /api/savings-goals/[id]/transactions
 * Add a new transaction to a specific savings goal
 */
export async function POST(request, { params }) {
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

    // Find the goal and verify ownership
    const goal = await prisma.savingsGoal.findFirst({
      where: {
        id: goalId,
        userId: auth.user.id
      }
    });

    if (!goal) {
      return NextResponse.json(
        { error: 'Savings goal not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = validateSavingsTransaction(body);

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Create the transaction
    const transaction = await prisma.savingsTransaction.create({
      data: {
        goalId: goal.id,
        amount: body.amount,
        note: body.note?.trim() || null,
        date: body.date ? new Date(body.date) : new Date()
      }
    });

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('Error creating savings transaction:', error);
    return NextResponse.json(
      { error: 'Failed to add savings transaction' },
      { status: 500 }
    );
  }
}
