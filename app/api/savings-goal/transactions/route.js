import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';
import { validateSavingsTransaction } from '@/lib/validations';

/**
 * POST /api/savings-goal/transactions
 * Add a new savings transaction
 */
export async function POST(request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const validation = validateSavingsTransaction(body);

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Find the user's active goal
    const goal = await prisma.savingsGoal.findFirst({
      where: { userId: auth.user.id }
    });

    if (!goal) {
      return NextResponse.json(
        { error: 'No active savings goal found' },
        { status: 404 }
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
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
