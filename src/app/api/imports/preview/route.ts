import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { store } from '@/lib/store';

const schema = z.object({ name: z.string().min(1), template: z.string().min(1), rows: z.number().int().nonnegative(), errors: z.number().int().nonnegative() });

export async function POST(request: Request) {
  const form = await request.formData(); const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ message: '请选择 Excel 文件' }, { status: 400 });
  const bytes = await file.arrayBuffer(); const workbook = XLSX.read(bytes, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]]; const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  const parsed = schema.parse({ name: file.name, template: workbook.SheetNames[0] || '未识别模板', rows: rows.length, errors: rows.filter((row) => !Object.values(row).some(Boolean)).length });
  const batch = { id: `batch-${Date.now()}`, fileName: parsed.name, template: parsed.template, status: '预览' as const, rowCount: parsed.rows, successCount: parsed.rows - parsed.errors, errorCount: parsed.errors, createdAt: new Date().toISOString() };
  store.imports.unshift(batch);
  return NextResponse.json({ batch, columns: rows[0] ? Object.keys(rows[0]) : [], sample: rows.slice(0, 5) });
}
