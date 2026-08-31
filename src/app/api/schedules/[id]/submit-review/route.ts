import { NextResponse } from 'next/server';
import { submitReview } from '@/lib/store';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const result = submitReview(params.id);
  if (!result.ok) return NextResponse.json({ message: result.message }, { status: 400 });
  return NextResponse.json({ message: '已提交值班负责人审核，正式发布仍需人工确认。', solution: result.solution });
}
