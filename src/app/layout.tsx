import './globals.css';
import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';

export const metadata: Metadata = {
  title: '引航站调度 | Pilot Control',
  description: '引航计划合规校验与排班辅助工作台',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body><AppShell>{children}</AppShell></body></html>;
}
