'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Anchor, Bell, BookOpenCheck, ClipboardList, FileSpreadsheet, Gauge, History, Users, Waves } from 'lucide-react';

const nav = [
  { href: '/dashboard', label: '调度驾驶舱', icon: Gauge },
  { href: '/schedule', label: '排班工作台', icon: Waves },
  { href: '/plans', label: '计划与任务', icon: ClipboardList },
  { href: '/imports', label: 'Excel 数据批次', icon: FileSpreadsheet },
  { href: '/people', label: '人员与资质', icon: Users },
  { href: '/rules', label: '规则中心', icon: BookOpenCheck },
  { href: '/changes', label: '变更与重排', icon: Bell },
  { href: '/review', label: '审核与发布', icon: ClipboardList },
  { href: '/audit', label: '审计复盘', icon: History },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/login') return <>{children}</>;
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Anchor size={18} /></div><div><div className="brand-title">引航站调度</div><div className="brand-subtitle">PILOT CONTROL / MVP</div></div></div>
      <div className="nav-label">工作区</div>
      <nav className="nav-list">{nav.map(({ href, label, icon: Icon }) => <Link key={href} className={`nav-link ${pathname.startsWith(href) ? 'active' : ''}`} href={href}><Icon size={16} /><span>{label}</span></Link>)}</nav>
      <div className="sidebar-footer"><div className="profile"><div className="avatar">调</div><div><div className="profile-name">调度员 01</div><div className="profile-role">中心调度 · 全站点</div></div></div></div>
    </aside>
    <div className="main">
      <header className="topbar"><div className="breadcrumb">港口调度中心 <strong>{nav.find((item) => pathname.startsWith(item.href))?.label ?? '工作区'}</strong></div><div className="top-actions"><span className="clock">数据批次 DEMO-20260831-1030 · 11:32 更新</span><button className="btn btn-quiet" title="查看通知"><Bell size={14} /> <span>待办 6</span></button></div></header>
      {children}
    </div>
  </div>;
}
