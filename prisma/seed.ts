import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const stationNames = ['北湾引航站', '东港引航站', '南湾引航站', '西港引航站', '临港引航站', '深水引航站'];
const areaNames = ['外锚地', '主航道', '集装箱港区', '散货港区', '液体化工区', '内港水域'];
const vesselTypes = ['集装箱船', '散货船', '油轮', 'LNG船', '客船'];
const taskTypes = ['进港', '出港', '移泊/移位', '特殊作业'];

async function main() {
  await prisma.auditLog.deleteMany(); await prisma.assignment.deleteMany(); await prisma.scheduleSolution.deleteMany(); await prisma.changeEvent.deleteMany(); await prisma.executionRecord.deleteMany(); await prisma.task.deleteMany(); await prisma.plan.deleteMany(); await prisma.vessel.deleteMany(); await prisma.qualification.deleteMany(); await prisma.shift.deleteMany(); await prisma.pilot.deleteMany(); await prisma.area.deleteMany(); await prisma.ruleVersion.deleteMany(); await prisma.station.deleteMany(); await prisma.organization.deleteMany();
  const org = await prisma.organization.create({ data: { id: 'org-demo', name: '港口调度中心' } });
  const stations = [] as { id: string; name: string; code: string }[];
  for (let i = 0; i < stationNames.length; i += 1) { const station = await prisma.station.create({ data: { id: `st-${i + 1}`, name: stationNames[i], code: `P${String(i + 1).padStart(2, '0')}`, organizationId: org.id } }); stations.push(station); await prisma.area.create({ data: { id: `area-${i + 1}`, stationId: station.id, name: areaNames[i], kind: '作业水域' } }); }
  const pilots = [] as { id: string; stationId: string }[];
  for (let i = 0; i < 180; i += 1) { const station = stations[i % stations.length]; const pilot = await prisma.pilot.create({ data: { id: `pilot-${i + 1}`, employeeNo: `PY${String(i + 1).padStart(4, '0')}`, name: `引航员${String(i + 1).padStart(3, '0')}`, stationId: station.id, team: `${station.code}-${(i % 3) + 1}班`, status: i % 47 === 0 ? '请假' : 'AVAILABLE' } }); pilots.push(pilot); await prisma.qualification.create({ data: { id: `qual-${i + 1}`, pilotId: pilot.id, level: i % 5 === 0 ? 'B' : 'A', waters: areaNames[i % areaNames.length], vesselTypes: vesselTypes.slice(0, 3).join(','), expiresAt: new Date(Date.now() + 365 * 86400000) } }); }
  const vessels = [] as { id: string }[]; for (let i = 0; i < 120; i += 1) vessels.push(await prisma.vessel.create({ data: { id: `vessel-${i + 1}`, name: `${['海岳', '远航', '华东', '蓝鲸', '新港'][i % 5]}${i + 1}`, vesselType: vesselTypes[i % vesselTypes.length], tonnage: 18000 + (i % 16) * 12500 } }));
  const plans = [] as { id: string; stationId: string }[]; for (let i = 0; i < stations.length; i += 1) plans.push(await prisma.plan.create({ data: { id: `plan-${i + 1}`, planNo: `PLAN-20260831-${String(i + 1).padStart(2, '0')}`, stationId: stations[i].id, source: 'DEMO', owner: '调度员01' } }));
  const base = Date.now() + 2 * 3600000; for (let i = 0; i < 500; i += 1) { const stationIndex = i % stations.length; const type = taskTypes[i % taskTypes.length]; const start = new Date(base + (i % 96) * 30 * 60000); const end = new Date(start.getTime() + (type === '特殊作业' ? 150 : type === '移泊/移位' ? 90 : 120) * 60000); await prisma.task.create({ data: { id: `task-${i + 1}`, taskNo: `PILOT-${String(i + 1).padStart(4, '0')}`, planId: plans[stationIndex].id, vesselId: vessels[i % vessels.length].id, stationId: stations[stationIndex].id, areaId: `area-${stationIndex + 1}`, taskType: type, priority: i % 29 === 0 ? 'URGENT' : i % 11 === 0 ? 'IMPORTANT' : 'NORMAL', startsAt: start, endsAt: end, special: type === '特殊作业', locked: i >= 18 && i < 21 } }); }
  for (let i = 0; i < 5; i += 1) await prisma.ruleVersion.create({ data: { id: `rule-${i + 1}`, stationId: i === 4 ? stations[0].id : stations[i % stations.length].id, name: ['资质有效期校验', '同人时间冲突', '最低休息时间', '任务负荷均衡', '跨站调派授权'][i], level: i === 2 || i === 0 || i === 1 ? '硬约束' : i === 3 ? '软约束' : '提示', source: i < 2 ? '首期演示规则' : '待业务确认', content: i === 2 ? '演示阈值 8 小时，具体制度待确认' : '按业务配置执行', status: i < 2 ? 'ACTIVE' : 'DRAFT', version: i < 2 ? 1 : 0 } });
  console.log(`seeded ${stations.length} stations, ${pilots.length} pilots and 500 tasks`);
}

main().finally(() => prisma.$disconnect());
