import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';

const targetDir = path.join(process.cwd(), 'public', 'sample-data');
fs.mkdirSync(targetDir, { recursive: true });
const workbook = XLSX.utils.book_new();
const rows = [
  { 计划编号: 'PLAN-20260831-001', 版本: 1, 船舶编号: 'VESSEL-001', 船名: '海岳1', 任务类型: '进港', 站点: '北湾引航站', 水域: '外锚地', 计划开始: '2026-08-31 14:00', 计划结束: '2026-08-31 16:00', 优先级: '紧急' },
  { 计划编号: 'PLAN-20260831-002', 版本: 1, 船舶编号: 'VESSEL-002', 船名: '远航12', 任务类型: '特殊作业', 站点: '深水引航站', 水域: '主航道', 计划开始: '2026-08-31 19:30', 计划结束: '2026-08-31 22:00', 优先级: '重点' },
];
XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), '船舶计划');
XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{ 字段: '计划编号', 必填: '是', 说明: '同一来源内唯一，变更不覆盖原版本' }, { 字段: '任务类型', 必填: '是', 说明: '进港、出港、移泊/移位、特殊作业' }]), '字段说明');
XLSX.writeFile(workbook, path.join(targetDir, '船舶计划模板.xlsx'));
