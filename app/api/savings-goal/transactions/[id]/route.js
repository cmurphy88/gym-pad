import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';
import { validateSavingsTransaction } from '@/lib/validations';

/**
 * PUT /api/savings-goal/transactions/[id]
 * Update a savings transaction
 */
export async function PUT(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const transactionId = parseInt(id, 10);

    if (isNaN(transactionId)) {
      return NextResponse.json(
        { error: 'Invalid transaction ID' },
        { status: 400 }
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

    // Find the transaction and verify ownership
    const existing = await prisma.savingsTransaction.findUnique({
      where: { id: transactionId },
      include: {
        goal: true
      }
    });

    if (!existing || existing.goal.userId !== auth.user.id) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Update the transaction
    const transaction = await prisma.savingsTransaction.update({
      where: { id: transactionId },
      data: {
        amount: body.amount,
        note: body.note?.trim() || null,
        date: body.date ? new Date(body.date) : existing.date
      }
    });

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('Error updating savings transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/savings-goal/transactions/[id]
 * Delete a savings transaction
 */
export async function DELETE(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const transactionId = parseInt(id, 10);

    if (isNaN(transactionId)) {
      return NextResponse.json(
        { error: 'Invalid transaction ID' },
        { status: 400 }
      );
    }

    // Find the transaction and verify ownership
    const existing = await prisma.savingsTransaction.findUnique({
      where: { id: transactionId },
      include: {
        goal: true
      }
    });

    if (!existing || existing.goal.userId !== auth.user.id) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Delete the transaction
    await prisma.savingsTransaction.delete({
      where: { id: transactionId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting savings transaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
