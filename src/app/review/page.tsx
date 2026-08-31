'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Eye, Send } from 'lucide-react';
import type { ScheduleSolution } from '@/lib/types';

export default function ReviewPage() {
  const [solutions, setSolutions] = useState<ScheduleSolution[]>([]); const [message, setMessage] = useState('');
  async function refresh() { const response = await fetch('/api/review'); const json = await response.json(); setSolutions(json); }
  useEffect(() => { refresh(); }, []);
  async function publish(id: string) { const response = await fetch(`/api/schedules/${id}/publish`, { method: 'POST' }); const json = await response.json(); setMessage(json.message); refresh(); }
  return <main className="content"><div className="page-heading"><div><div className="eyebrow">Review / Release Control</div><h1>审核与发布</h1><p className="lede">值班负责人在这里复核硬冲突、不可排任务和人工调整，审核通过后才可发布。</p></div><button className="btn" onClick={refresh}><Eye size={14} /> 刷新方案</button></div>{message && <div className="notice" style={{ marginBottom: 16 }}>{message}</div>}<div className="notice" style={{ marginBottom: 16 }}><strong>发布边界：</strong>存在硬冲突的方案不能发布；特殊作业仍需人工补充分配，系统不会自动替代引航员判断。</div><div className="panel"><div className="panel-header"><div><div className="panel-title">待审核方案</div><div className="panel-kicker">从排班工作台生成方案后，在此页面复核</div></div><span className="tag">人工确认</span></div>{solutions.length ? <div className="panel-body">{solutions.map((solution) => <div className="status-row" key={solution.id}><div><div className="status-name">方案 {solution.id.slice(-8)} · {solution.algorithm}</div><div className="status-meta">{solution.generatedAt.slice(0, 16).replace('T', ' ')} · {solution.assignments.length} 条分配 · {solution.unassigned.length} 条人工处理</div></div><div><span className={`tag ${solution.conflicts.some((c) => c.level === '冲突') ? 'tag-warn' : 'tag'}`}>{solution.conflicts.some((c) => c.level === '冲突') ? '有硬冲突' : solution.status}</span></div><div className="status-number"><button className="btn btn-primary" onClick={() => publish(solution.id)} disabled={solution.conflicts.some((c) => c.level === '冲突') || solution.status === '已发布'}><Send size={12} /> 发布</button></div></div>)}</div> : <div className="empty"><ClipboardCheck size={20} style={{ marginBottom: 8 }} /><br />暂无方案。请先在排班工作台生成候选排班。</div>}</div></main>;
}
