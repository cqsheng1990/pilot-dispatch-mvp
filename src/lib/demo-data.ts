import { addHours, addMinutes, formatISO, startOfHour } from 'date-fns';
import type { DemoState, Pilot, RuleVersion, Station, Task } from './types';

const stationNames = ['北湾引航站', '东港引航站', '南湾引航站', '西港引航站', '临港引航站', '深水引航站'];
const areas = ['外锚地', '主航道', '集装箱港区', '散货港区', '液体化工区', '内港水域'];
const vesselTypes = ['集装箱船', '散货船', '油轮', 'LNG船', '客船'];
const taskTypes = ['进港', '出港', '移泊/移位', '特殊作业'] as const;

export function seedDemoState(): DemoState {
  const stations: Station[] = stationNames.map((name, index) => ({
    id: `st-${index + 1}`,
    code: `P${String(index + 1).padStart(2, '0')}`,
    name,
    areaNames: [areas[index], areas[(index + 1) % areas.length], areas[(index + 2) % areas.length]],
  }));

  const pilots: Pilot[] = [];
  for (let i = 0; i < 180; i += 1) {
    const station = stations[i % stations.length];
    const level = i % 11 === 0 ? 'C' : i % 5 === 0 ? 'B' : 'A';
    pilots.push({
      id: `pilot-${i + 1}`,
      name: `引航员${String(i + 1).padStart(3, '0')}`,
      employeeNo: `PY${String(i + 1).padStart(4, '0')}`,
      stationId: station.id,
      team: `${station.code}-${(i % 3) + 1}班`,
      status: i % 47 === 0 ? '请假' : i % 53 === 0 ? '培训' : '可用',
      level,
      waters: [station.areaNames[0], station.areaNames[1], ...(i % 4 === 0 ? ['主航道'] : [])],
      vesselTypes: i % 3 === 0 ? vesselTypes.slice(0, 4) : vesselTypes.slice(0, 3),
      tasksToday: i % 7,
      workMinutesToday: (i % 7) * 105,
      lastEndedAt: i % 9 === 0 ? formatISO(addHours(new Date(), -2)) : null,
      nightTasks: i % 6 === 0 ? 1 : 0,
    });
  }

  const base = startOfHour(addHours(new Date(), 2));
  const tasks: Task[] = [];
  for (let i = 0; i < 500; i += 1) {
    const station = stations[i % stations.length];
    const type = taskTypes[i % taskTypes.length];
    const start = addMinutes(base, (i % 96) * 30);
    const duration = type === '特殊作业' ? 150 : type === '移泊/移位' ? 90 : 120;
    const special = type === '特殊作业';
    tasks.push({
      id: `task-${i + 1}`,
      taskNo: `PILOT-${String(i + 1).padStart(4, '0')}`,
      vesselName: `${['海岳', '远航', '华东', '蓝鲸', '新港'][i % 5]}${(i % 99) + 1}`,
      vesselType: vesselTypes[i % vesselTypes.length],
      tonnage: 18000 + (i % 16) * 12500,
      type,
      stationId: station.id,
      stationName: station.name,
      area: station.areaNames[i % station.areaNames.length],
      startsAt: formatISO(start),
      endsAt: formatISO(addMinutes(start, duration)),
      priority: i % 29 === 0 ? '紧急' : i % 11 === 0 ? '重点' : '普通',
      status: i < 18 ? '待排' : i < 23 ? '已发布' : '待排',
      locked: i >= 18 && i < 21,
      special,
      dataQuality: i % 31 === 0 ? '待补充' : '完整',
    });
  }

  const now = formatISO(new Date());
  const rules: RuleVersion[] = [
    { id: 'rule-001', stationId: 'all', stationName: '全站点', name: '资质有效期校验', level: '硬约束', status: '已生效', value: '证书有效期必须覆盖任务开始时间', source: '首期演示规则', version: 'R1.0', updatedAt: now },
    { id: 'rule-002', stationId: 'all', stationName: '全站点', name: '同人时间冲突', level: '硬约束', status: '已生效', value: '任务时间不得重叠，前后任务保留交接时间', source: '首期演示规则', version: 'R1.0', updatedAt: now },
    { id: 'rule-003', stationId: 'all', stationName: '全站点', name: '最低休息时间', level: '硬约束', status: '待业务确认', value: '演示阈值 8 小时，具体制度待确认', source: '待业务确认', version: 'R0.1', updatedAt: now },
    { id: 'rule-004', stationId: 'all', stationName: '全站点', name: '任务负荷均衡', level: '软约束', status: '模拟中', value: '综合任务数、作业时长和夜班次数排序', source: '调度经验草案', version: 'R0.3', updatedAt: now },
    { id: 'rule-005', stationId: 'st-1', stationName: '北湾引航站', name: '跨站调派授权', level: '提示', status: '待业务确认', value: '默认不跨站，需授权且满足移动时间', source: '站点差异待确认', version: 'R0.1', updatedAt: now },
  ];

  return { stations, pilots, tasks, solutions: [], changes: [], audits: [], rules, imports: [] };
}
