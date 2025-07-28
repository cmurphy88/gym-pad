import { validateSession } from './auth.js';
import { NextResponse } from 'next/server';

export async function requireAuth(request) {
  const token = request.cookies.get('session-token')?.value;
  
  const auth = await validateSession(token);
  
  if (!auth) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  return auth;
}

export async function getOptionalAuth(request) {
  const token = request.cookies.get('session-token')?.value;
  return await validateSession(token);
}