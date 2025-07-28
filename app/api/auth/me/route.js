import { NextResponse } from 'next/server';
import { getOptionalAuth } from '@/lib/middleware';

export async function GET(request) {
  try {
    console.log('Auth/me request received');
    const token = request.cookies.get('session-token')?.value;
    console.log('Token from cookie:', token ? 'exists' : 'missing');
    
    const auth = await getOptionalAuth(request);
    console.log('Auth result:', auth ? 'authenticated' : 'not authenticated');
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      user: auth.user
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}