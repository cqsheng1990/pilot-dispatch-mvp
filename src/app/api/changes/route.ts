import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createChange, store } from '@/lib/store';
export const dynamic = 'force-dynamic';

const schema = z.object({ taskId: z.string(), type: z.enum(['延误', '取消', '提前', '插单', '人员不可用', '人工换班']), afterValue: z.string(), reason: z.string().min(2) });
export async function GET() { return NextResponse.json(store.changes); }
export async function POST(request: Request) { const result = createChange(schema.parse(await request.json())); if (!result) return NextResponse.json({ message: '任务不存在' }, { status: 404 }); return NextResponse.json(result); }
