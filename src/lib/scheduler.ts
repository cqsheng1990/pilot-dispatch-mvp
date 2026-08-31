import { differenceInMinutes, isAfter, isBefore, parseISO } from 'date-fns';
import type { Assignment, Conflict, Pilot, ScheduleSolution, Task } from './types';

export interface GenerateScheduleInput {
  tasks: Task[];
  pilots: Pilot[];
  stationIds: string[];
  allowCrossStation: boolean;
  solutionId: string;
  dataBatch: string;
  ruleVersion: string;
}

function overlaps(a: Task, b: Task, bufferMinutes = 30) {
  const aStart = parseISO(a.startsAt);
  const aEnd = parseISO(a.endsAt);
  const bStart = parseISO(b.startsAt);
  const bEnd = parseISO(b.endsAt);
  return isBefore(aStart, new Date(bEnd.getTime() + bufferMinutes * 60000)) && isAfter(aEnd, new Date(bStart.getTime() - bufferMinutes * 60000));
}

function canPilotTakeTask(pilot: Pilot, task: Task, assigned: Task[], allowCrossStation: boolean): Conflict | null {
  if (!allowCrossStation && pilot.stationId !== task.stationId) {
    return { taskId: task.id, pilotId: pilot.id, level: '冲突', rule: '人员归属站点', message: `${pilot.name}归属${pilot.stationId}，默认不可跨站调派`, remedy: '选择本属站点人员或发起跨站授权' };
  }
  if (pilot.status !== '可用') {
    return { taskId: task.id, pilotId: pilot.id, level: '冲突', rule: '人员可用性', message: `${pilot.name}当前状态为${pilot.status}`, remedy: '解除不可用状态或选择其他人员' };
  }
  if (task.special) {
    return { taskId: task.id, pilotId: pilot.id, level: '提示', rule: '特殊作业人工排班', message: '特殊作业首期不自动生成候选排班', remedy: '由调度员人工分配并填写理由' };
  }
  if (!pilot.waters.includes(task.area) && !pilot.waters.includes('主航道')) {
    return { taskId: task.id, pilotId: pilot.id, level: '冲突', rule: '适用水域', message: `${pilot.name}未配置${task.area}适用水域`, remedy: '选择具备水域资质的人员' };
  }
  if (!pilot.vesselTypes.includes(task.vesselType)) {
    return { taskId: task.id, pilotId: pilot.id, level: '冲突', rule: '船型能力', message: `${pilot.name}未配置${task.vesselType}能力`, remedy: '选择具备船型能力的人员' };
  }
  if (assigned.some((other) => other.assignedPilotId === pilot.id && overlaps(task, other))) {
    return { taskId: task.id, pilotId: pilot.id, level: '冲突', rule: '同人时间冲突', message: `${pilot.name}已有重叠或衔接不足任务`, remedy: '调整任务时间或选择其他人员' };
  }
  const latest = assigned.filter((item) => item.assignedPilotId === pilot.id).sort((a, b) => b.endsAt.localeCompare(a.endsAt))[0];
  if (latest) {
    const restMinutes = differenceInMinutes(parseISO(task.startsAt), parseISO(latest.endsAt));
    if (restMinutes < 480) {
      return { taskId: task.id, pilotId: pilot.id, level: '冲突', rule: '最低休息时间', message: `${pilot.name}前序任务结束后仅休息${Math.max(restMinutes, 0)}分钟`, remedy: '按演示规则需要至少 480 分钟，实际阈值待业务确认' };
    }
  }
  return null;
}

export function generateSchedule(input: GenerateScheduleInput): ScheduleSolution {
  const candidateTasks = input.tasks.filter((task) => input.stationIds.includes(task.stationId) && !task.locked && task.status !== '已完成' && task.status !== '已取消');
  const lockedTasks = input.tasks.filter((task) => task.locked || task.status === '已发布' || task.status === '执行中');
  const assignments: Assignment[] = [];
  const assignedTasks: Task[] = lockedTasks.map((task) => ({ ...task, assignedPilotId: task.assignedPilotId ?? input.pilots.find((pilot) => pilot.stationId === task.stationId)?.id }));
  const conflicts: Conflict[] = [];
  const unassigned: ScheduleSolution['unassigned'] = [];
  const taskOrder = [...candidateTasks].sort((a, b) => (a.priority === '紧急' ? -1 : b.priority === '紧急' ? 1 : a.startsAt.localeCompare(b.startsAt)));

  for (const task of taskOrder) {
    if (task.special) {
      unassigned.push({ taskId: task.id, taskNo: task.taskNo, reason: '特殊作业首期需人工排班' });
      conflicts.push({ taskId: task.id, level: '提示', rule: '特殊作业人工排班', message: '该任务类型暂不自动生成候选方案', remedy: '人工分配后提交审核' });
      continue;
    }
    const ranked = input.pilots
      .map((pilot) => {
        const hardConflict = canPilotTakeTask(pilot, task, assignedTasks, input.allowCrossStation);
        const balancePenalty = pilot.tasksToday * 40 + Math.round(pilot.workMinutesToday / 20) + pilot.nightTasks * 30;
        const stationBonus = pilot.stationId === task.stationId ? -80 : 0;
        const areaBonus = pilot.waters.includes(task.area) ? -30 : 0;
        return { pilot, hardConflict, score: 1000 - balancePenalty + stationBonus + areaBonus };
      })
      .filter((item) => !item.hardConflict)
      .sort((a, b) => b.score - a.score);
    const selected = ranked[0];
    if (!selected) {
      const bestReason = input.pilots.map((pilot) => canPilotTakeTask(pilot, task, assignedTasks, input.allowCrossStation)).find(Boolean);
      unassigned.push({ taskId: task.id, taskNo: task.taskNo, reason: bestReason?.message ?? '没有满足硬约束的候选人员' });
      conflicts.push(bestReason ?? { taskId: task.id, level: '冲突', rule: '候选人员为空', message: '没有满足硬约束的候选人员', remedy: '检查资质、时间、休息和跨站授权' });
      continue;
    }
    assignments.push({ taskId: task.id, pilotId: selected.pilot.id, pilotName: selected.pilot.name, source: 'ENGINE', score: Math.max(0, Math.min(100, Math.round(selected.score / 10))), reason: `${selected.pilot.stationId === task.stationId ? '本属站点' : '跨站授权候选'}；综合负荷、适用水域和任务衔接排序` });
    assignedTasks.push({ ...task, assignedPilotId: selected.pilot.id });
  }

  const score = Math.round(assignments.length / Math.max(1, assignments.length + unassigned.length) * 100);
  return { id: input.solutionId, version: 1, status: '草案', generatedAt: new Date().toISOString(), dataBatch: input.dataBatch, ruleVersion: input.ruleVersion, algorithm: '确定性约束排班引擎 v0.1', score, assignments, conflicts, unassigned };
}
