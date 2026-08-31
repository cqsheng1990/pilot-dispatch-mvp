import { format } from 'date-fns';
import { seedDemoState } from './demo-data';
import { generateSchedule } from './scheduler';
import type { AuditLog, ChangeEvent, DemoState, ScheduleSolution } from './types';

const globalStore = globalThis as typeof globalThis & { __pilotDispatchStore?: DemoState };
export const store: DemoState = globalStore.__pilotDispatchStore ?? seedDemoState();
globalStore.__pilotDispatchStore = store;

function audit(action: string, objectType: string, objectId: string, detail: string, role = '调度员') {
  const row: AuditLog = { id: `audit-${Date.now()}-${store.audits.length}`, actor: role === '值班负责人' ? '值班负责人01' : '调度员01', role, action, objectType, objectId, detail, createdAt: new Date().toISOString() };
  store.audits.unshift(row);
}

export function dashboard() {
  const openTasks = store.tasks.filter((task) => task.status === '待排' || task.status === '待确认');
  const conflicts = store.tasks.filter((task) => task.dataQuality === '待补充' || task.priority === '紧急').length;
  return { taskCount: store.tasks.length, openCount: openTasks.length, stationCount: store.stations.length, pilotCount: store.pilots.length, conflictCount: conflicts, unconfirmedCount: store.tasks.filter((task) => task.status === '待确认').length, changes: store.changes.filter((item) => item.status !== '已完成').slice(0, 5), hotTasks: store.tasks.filter((task) => task.priority !== '普通').slice(0, 8), pilots: [...store.pilots].sort((a, b) => b.workMinutesToday - a.workMinutesToday).slice(0, 8), recentAudits: store.audits.slice(0, 8), lastUpdated: format(new Date(), 'yyyy-MM-dd HH:mm') };
}

export function generate(input: { stationIds?: string[]; allowCrossStation?: boolean; taskTypes?: string[]; withinHours?: number }) {
  const cutoff = input.withinHours ? Date.now() + input.withinHours * 60 * 60 * 1000 : Number.POSITIVE_INFINITY;
  const scopedTasks = store.tasks.filter((task) => (!input.taskTypes?.length || input.taskTypes.includes(task.type)) && new Date(task.startsAt).getTime() <= cutoff);
  const solution = generateSchedule({ tasks: scopedTasks, pilots: store.pilots, stationIds: input.stationIds?.length ? input.stationIds : store.stations.map((station) => station.id), allowCrossStation: Boolean(input.allowCrossStation), solutionId: `solution-${Date.now()}`, dataBatch: `DEMO-${format(new Date(), 'yyyyMMdd-HHmm')}`, ruleVersion: 'R1.0 + R0.3', });
  store.solutions.unshift(solution);
  for (const assignment of solution.assignments) {
    const task = store.tasks.find((item) => item.id === assignment.taskId);
    if (task) task.assignedPilotId = assignment.pilotId;
  }
  audit('生成候选排班', 'ScheduleSolution', solution.id, `生成${solution.assignments.length}条分配，${solution.unassigned.length}条未分配`);
  return solution;
}

export function validate(solutionId: string) {
  const solution = store.solutions.find((item) => item.id === solutionId);
  if (!solution) return null;
  audit('校验排班方案', 'ScheduleSolution', solution.id, `硬冲突${solution.conflicts.filter((item) => item.level === '冲突').length}条`);
  return solution;
}

export function updateSolution(solutionId: string, taskId: string, pilotId: string, reason: string) {
  const solution = store.solutions.find((item) => item.id === solutionId);
  const pilot = store.pilots.find((item) => item.id === pilotId);
  const assignment = solution?.assignments.find((item) => item.taskId === taskId);
  if (!solution || !pilot || !assignment) return null;
  assignment.pilotId = pilot.id; assignment.pilotName = pilot.name; assignment.source = '人工调整'; assignment.reason = reason;
  const task = store.tasks.find((item) => item.id === taskId);
  if (task) task.assignedPilotId = pilot.id;
  audit('人工调整人员', 'Assignment', `${solutionId}:${taskId}`, reason);
  return solution;
}

export function submitReview(solutionId: string) {
  const solution = store.solutions.find((item) => item.id === solutionId);
  if (!solution || solution.conflicts.some((item) => item.level === '冲突')) return { ok: false, message: '存在硬冲突，不能提交审核' };
  solution.status = '待审核'; audit('提交审核', 'ScheduleSolution', solutionId, '调度员提交值班负责人审核'); return { ok: true, solution };
}

export function publish(solutionId: string) {
  const solution = store.solutions.find((item) => item.id === solutionId);
  if (!solution) return { ok: false, message: '方案不存在' };
  if (solution.status !== '待审核' && solution.status !== '待确认') return { ok: false, message: '方案尚未通过审核' };
  solution.status = '已发布';
  for (const assignment of solution.assignments) {
    const task = store.tasks.find((item) => item.id === assignment.taskId);
    if (task && !task.special) task.status = '已发布';
  }
  audit('发布排班', 'ScheduleSolution', solutionId, '值班负责人确认发布', '值班负责人'); return { ok: true, solution };
}

export function createChange(input: { taskId: string; type: ChangeEvent['type']; afterValue: string; reason: string }) {
  const task = store.tasks.find((item) => item.id === input.taskId);
  if (!task) return null;
  const change: ChangeEvent = { id: `change-${Date.now()}`, taskId: task.id, taskNo: task.taskNo, type: input.type, beforeValue: `${task.startsAt} - ${task.endsAt}`, afterValue: input.afterValue, status: '待处理', reason: input.reason, createdAt: new Date().toISOString() };
  store.changes.unshift(change); audit('登记计划变更', 'ChangeEvent', change.id, `${change.type}：${change.reason}`); return change;
}

export function replan(changeId: string) {
  const change = store.changes.find((item) => item.id === changeId);
  if (!change) return null;
  change.status = '处理中';
  const solution = generate({ stationIds: [store.tasks.find((item) => item.id === change.taskId)?.stationId ?? ''] });
  change.status = '已完成'; audit('完成局部重排', 'ChangeEvent', changeId, `生成方案 ${solution.id}`); return solution;
}
