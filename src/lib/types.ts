export type TaskType = '进港' | '出港' | '移泊/移位' | '特殊作业';
export type TaskStatus = '待排' | '已排草案' | '待确认' | '已发布' | '执行中' | '已完成' | '已取消';
export type RiskLevel = '通过' | '提示' | '风险' | '冲突';

export interface Station {
  id: string;
  name: string;
  code: string;
  areaNames: string[];
}

export interface Pilot {
  id: string;
  name: string;
  employeeNo: string;
  stationId: string;
  team: string;
  status: '可用' | '请假' | '培训' | '临时不可用';
  level: 'A' | 'B' | 'C';
  waters: string[];
  vesselTypes: string[];
  tasksToday: number;
  workMinutesToday: number;
  lastEndedAt: string | null;
  nightTasks: number;
}

export interface Task {
  id: string;
  taskNo: string;
  vesselName: string;
  vesselType: string;
  tonnage: number;
  type: TaskType;
  stationId: string;
  stationName: string;
  area: string;
  startsAt: string;
  endsAt: string;
  priority: '普通' | '重点' | '紧急';
  status: TaskStatus;
  locked: boolean;
  special: boolean;
  assignedPilotId?: string;
  dataQuality: '完整' | '待补充';
}

export interface Conflict {
  taskId: string;
  level: RiskLevel;
  rule: string;
  message: string;
  pilotId?: string;
  remedy: string;
}

export interface Assignment {
  taskId: string;
  pilotId: string;
  pilotName: string;
  source: 'ENGINE' | '人工调整';
  score: number;
  reason: string;
}

export interface ScheduleSolution {
  id: string;
  version: number;
  status: '草案' | '待审核' | '待确认' | '已发布';
  generatedAt: string;
  dataBatch: string;
  ruleVersion: string;
  algorithm: string;
  score: number;
  assignments: Assignment[];
  conflicts: Conflict[];
  unassigned: { taskId: string; taskNo: string; reason: string }[];
}

export interface ChangeEvent {
  id: string;
  taskId: string;
  taskNo: string;
  type: '延误' | '取消' | '提前' | '插单' | '人员不可用' | '人工换班';
  beforeValue: string;
  afterValue: string;
  status: '待处理' | '处理中' | '已完成';
  reason: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  role: string;
  action: string;
  objectType: string;
  objectId: string;
  detail: string;
  createdAt: string;
}

export interface RuleVersion {
  id: string;
  stationId: string;
  stationName: string;
  name: string;
  level: '硬约束' | '软约束' | '提示';
  status: '待业务确认' | '模拟中' | '已生效' | '已停用';
  value: string;
  source: string;
  version: string;
  updatedAt: string;
}

export interface ImportBatch {
  id: string;
  fileName: string;
  template: string;
  status: '预览' | '已导入' | '已回退';
  rowCount: number;
  successCount: number;
  errorCount: number;
  createdAt: string;
}

export interface DemoState {
  stations: Station[];
  pilots: Pilot[];
  tasks: Task[];
  solutions: ScheduleSolution[];
  changes: ChangeEvent[];
  audits: AuditLog[];
  rules: RuleVersion[];
  imports: ImportBatch[];
}
