import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

/**
 * PUT /api/savings-goals/[id]/transactions/[transactionId]
 * Update a specific transaction
 */
export async function PUT(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id, transactionId } = await params;
    const goalId = parseInt(id, 10);
    const txId = parseInt(transactionId, 10);

    if (isNaN(goalId) || isNaN(txId)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      );
    }

    // Find the transaction and verify ownership through the goal
    const transaction = await prisma.savingsTransaction.findFirst({
      where: {
        id: txId,
        goalId: goalId,
        goal: {
          userId: auth.user.id
        }
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate amount if provided
    if (body.amount !== undefined && (typeof body.amount !== 'number' || body.amount <= 0)) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // Validate type if provided
    const validTypes = ['DEPOSIT', 'WITHDRAWAL'];
    if (body.type !== undefined && !validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: 'Type must be DEPOSIT or WITHDRAWAL' },
        { status: 400 }
      );
    }

    // Update the transaction
    const updatedTransaction = await prisma.savingsTransaction.update({
      where: { id: txId },
      data: {
        amount: body.amount ?? transaction.amount,
        type: body.type ?? transaction.type,
        note: body.note !== undefined ? (body.note?.trim() || null) : transaction.note,
        date: body.date ? new Date(body.date) : transaction.date
      }
    });

    return NextResponse.json({ transaction: updatedTransaction });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/savings-goals/[id]/transactions/[transactionId]
 * Delete a specific transaction
 */
export async function DELETE(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id, transactionId } = await params;
    const goalId = parseInt(id, 10);
    const txId = parseInt(transactionId, 10);

    if (isNaN(goalId) || isNaN(txId)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      );
    }

    // Find the transaction and verify ownership through the goal
    const transaction = await prisma.savingsTransaction.findFirst({
      where: {
        id: txId,
        goalId: goalId,
        goal: {
          userId: auth.user.id
        }
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Delete the transaction
    await prisma.savingsTransaction.delete({
      where: { id: txId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
