import { NextResponse } from 'next/server';
import { publish } from '@/lib/store';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const result = publish(params.id);
  if (!result.ok) return NextResponse.json({ message: result.message }, { status: 400 });
  return NextResponse.json({ message: '排班已发布，已生成站内待办和审计记录。', solution: result.solution });
}
