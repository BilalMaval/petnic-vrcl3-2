import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 32) || 'petnic-secret-key-fallback-32ch');

export async function verifyAuth(request) {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;

  try {
    const { payload } = await jwtVerify(auth.split(' ')[1], JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function requireAdmin(request) {
  const user = await verifyAuth(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  return user;
}
