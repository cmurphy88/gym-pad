import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

/**
 * DELETE /api/weight/[id] - Delete a weight entry
 */
export async function DELETE(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    
    const weightEntryId = parseInt(params.id);
    
    if (isNaN(weightEntryId)) {
      return NextResponse.json(
        { error: 'Invalid weight entry ID' },
        { status: 400 }
      );
    }

    // Check if weight entry exists and belongs to the user
    const weightEntry = await prisma.weightEntry.findFirst({
      where: {
        id: weightEntryId,
        userId: auth.user.id
      }
    });

    if (!weightEntry) {
      return NextResponse.json(
        { error: 'Weight entry not found' },
        { status: 404 }
      );
    }

    // Delete the weight entry
    await prisma.weightEntry.delete({
      where: {
        id: weightEntryId
      }
    });

    return NextResponse.json({ message: 'Weight entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting weight entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete weight entry' },
      { status: 500 }
    );
  }
}