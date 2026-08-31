import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() { return NextResponse.json({ tasks: store.tasks.slice(0, 60), stations: store.stations }); }
