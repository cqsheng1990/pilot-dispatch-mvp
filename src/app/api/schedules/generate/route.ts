import { NextResponse } from 'next/server';
import { z } from 'zod';
import { store, generate } from '@/lib/store';

const schema = z.object({ station: z.string().optional(), taskType: z.string().optional(), range: z.enum(['未来 24 小时', '未来 72 小时']).optional(), allowCrossStation: z.boolean().optional() });

export async function POST(request: Request) {
  const input = schema.parse(await request.json());
  const stationIds = input.station && input.station !== '全部站点' ? store.stations.filter((station) => station.name === input.station).map((station) => station.id) : undefined;
  const taskTypes = input.taskType && input.taskType !== '全部任务类型' ? [input.taskType] : undefined;
  const solution = generate({ stationIds, taskTypes, withinHours: input.range === '未来 72 小时' ? 72 : 24, allowCrossStation: input.allowCrossStation });
  const rows = solution.assignments.slice(0, 10).map((assignment) => {
    const task = store.tasks.find((item) => item.id === assignment.taskId);
    const pilot = store.pilots.find((item) => item.id === assignment.pilotId);
    return { name: assignment.pilotName, station: task?.stationName ?? '跨站候选', level: pilot?.level ?? 'A', load: Math.round(((pilot?.workMinutesToday ?? 0) + 120) / 60), task };
  });
  return NextResponse.json({ solution, rows });
}
