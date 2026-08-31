import { NextResponse } from 'next/server';
import { dashboard } from '@/lib/store';
export const dynamic = 'force-dynamic';

export async function GET() { return NextResponse.json(dashboard()); }
