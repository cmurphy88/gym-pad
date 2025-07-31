import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';

export async function POST(request) {
  try {
    const token = request.cookies.get('session-token')?.value;
    
    if (token) {
      await deleteSession(token);
    }
    
    const response = NextResponse.json({ success: true });
    
    response.cookies.set('session-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    });
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    
    // Handle database connection errors - for logout, we still clear the cookie
    if (error.message === 'Database connection failed') {
      // Even if database is down, we can still clear the cookie client-side
      const response = NextResponse.json(
        { success: true, warning: 'Session cleared locally (database temporarily unavailable)' },
        { status: 200 }
      );
      
      response.cookies.set('session-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0
      });
      
      return response;
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}