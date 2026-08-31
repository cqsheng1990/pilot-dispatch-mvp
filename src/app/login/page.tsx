'use client';

import { Anchor, ArrowRight, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter(); const [error, setError] = useState('');
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); if (data.get('username') === 'dispatcher' && data.get('password') === 'pilot123') { document.cookie = 'pilot_session=dispatcher; path=/'; router.push('/dashboard'); } else setError('演示账号或密码不正确。请使用 dispatcher / pilot123'); }
  return <main className="login-screen"><div className="login-card"><div className="brand" style={{ margin: '0 0 26px' }}><div className="brand-mark"><Anchor size={18} /></div><div><div className="brand-title">引航站调度</div><div className="brand-subtitle">PILOT CONTROL / PRIVATE MVP</div></div></div><div className="eyebrow">内网工作台</div><h1>欢迎回来</h1><p className="lede">登录后进入多站点计划和排班工作区。</p><form onSubmit={submit}><div className="login-field"><label htmlFor="username">账号</label><input className="input" id="username" name="username" defaultValue="dispatcher" autoComplete="username" /></div><div className="login-field"><label htmlFor="password">密码</label><input className="input" id="password" name="password" type="password" defaultValue="pilot123" autoComplete="current-password" /></div>{error && <div className="login-error">{error}</div>}<button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 22 }}><LockKeyhole size={14} /> 进入调度工作区 <ArrowRight size={14} /></button></form><div style={{ marginTop: 25, color: '#8a969b', fontSize: 10 }}>演示环境 · 数据不连接外部港口系统</div></div></main>;
}
