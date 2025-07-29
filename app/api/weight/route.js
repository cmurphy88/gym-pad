import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';
import { validateWeightEntry } from '@/lib/validations';

/**
 * GET /api/weight - Get all weight entries for authenticated user
 */
export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    
    const weightEntries = await prisma.weightEntry.findMany({
      where: {
        userId: auth.user.id
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json(weightEntries);
  } catch (error) {
    console.error('Error fetching weight entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weight entries' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/weight - Create a new weight entry
 */
export async function POST(request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    
    const data = await request.json();
    
    // Validate the weight entry data
    const validation = validateWeightEntry(data);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Create weight entry
    const weightEntry = await prisma.weightEntry.create({
      data: {
        userId: auth.user.id,
        weight: data.weight,
        date: new Date(data.date),
      }
    });

    return NextResponse.json(weightEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating weight entry:', error);
    return NextResponse.json(
      { error: 'Failed to create weight entry' },
      { status: 500 }
    );
  }
}