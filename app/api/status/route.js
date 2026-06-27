import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Petnic Studio API - Running', version: '2.0' });
}
