'use client';

import { ReactNode, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import api from '@/lib/api';

interface DashboardLayoutProps { children: ReactNode; }

interface Notification {
  id: number;
  tipo: string;
  titulo: string;
  mensaje?: string;
  url_accion?: string;
  created_at: string;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser]                 = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifCount, setNotifCount]     = useState(0);
  const [showNotifs, setShowNotifs]     = useState(false);
  const [authChecked, setAuthChecked]   = useState(false);

  // ── Auth Guard (BYPASS TEMPORAL — MODO DEMO) ─────────────────
  useEffect(() => {
    const token = localStorage.getItem('sicodi_token');
    const raw   = localStorage.getItem('sicodi_user');

    // BYPASS: si no hay token, inyectamos usuario demo automáticamente
    if (!token) {
      localStorage.setItem('sicodi_token', 'demo-bypass-token-2026');
      localStorage.setItem('sicodi_user', JSON.stringify({
        id: 1, username: 'admin', full_name: 'Administrador',
        email: 'admin@sicodi.intranet', roles: ['ADMIN'],
      }));
    }

    const userData = raw ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : null;
    setUser(userData ?? { id: 1, username: 'admin', full_name: 'Administrador', roles: ['ADMIN'] });
    setAuthChecked(true);
  }, [pathname]);

  // ── Notificaciones en tiempo real (polling 30s) ──────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const [cntRes, listRes] = await Promise.all([
        api.get('/notifications/count'),
        api.get('/notifications'),
      ]);
      setNotifCount(cntRes.data?.data?.count ?? 0);
      setNotifications(listRes.data?.data ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [authChecked, fetchNotifications]);

  // ── Marcar todas leídas ──────────────────────────────────────
  const markAllRead = async () => {
    try {
      await api.put('/notifications/todas-leidas');
      setNotifCount(0);
      setNotifications([]);
    } catch {}
    setShowNotifs(false);
  };

  // ── Logout ────────────────────────────────────────────────────
  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('sicodi_token');
    localStorage.removeItem('sicodi_user');
    document.cookie = 'sicodi_token=; path=/; max-age=0; SameSite=Strict';
    router.replace('/login');
  };

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Verificando sesión…</p>
        </div>
      </div>
    );
  }

  const initials = (user?.full_name ?? user?.username ?? 'U')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const tipoColor: Record<string, string> = {
    TAREA:  'bg-blue-100 text-blue-700',
    SLA:    'bg-red-100 text-red-700',
    ALERTA: 'bg-amber-100 text-amber-700',
    INFO:   'bg-slate-100 text-slate-600',
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ─── Header ───────────────────────────────────────────── */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-8 z-10">
          <h2 className="text-xl font-semibold text-slate-800">
            Sistema de Control Documental Institucional
          </h2>

          <div className="flex items-center space-x-4">

            {/* Campana de notificaciones */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(v => !v)}
                className="relative p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="Notificaciones"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </button>

              {/* Dropdown de notificaciones */}
              {showNotifs && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <span className="text-sm font-semibold text-slate-800">Notificaciones</span>
                    {notifCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                        Marcar todas leídas
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <p className="text-sm">Sin nuevas notificaciones</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => { if (n.url_accion) { router.push(n.url_accion); setShowNotifs(false); } }}
                          className="flex gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <span className={`text-xs font-bold px-2 py-1 rounded-full h-fit whitespace-nowrap ${tipoColor[n.tipo] ?? tipoColor.INFO}`}>
                            {n.tipo}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{n.titulo}</p>
                            {n.mensaje && <p className="text-xs text-slate-500 mt-0.5 truncate">{n.mensaje}</p>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-center">
                    <button onClick={() => { router.push('/bandeja'); setShowNotifs(false); }} className="text-xs text-blue-600 hover:underline">
                      Ver mi bandeja →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Cerrar sesión */}
            <button
              onClick={handleLogout}
              title="Cerrar Sesión"
              className="text-slate-500 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>

            {/* Avatar */}
            <div
              className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white font-bold cursor-pointer shadow-sm select-none"
              title={user?.full_name ?? 'Usuario'}
            >
              {initials}
            </div>
          </div>
        </header>

        {/* ─── Main Content ─────────────────────────────────────── */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-8">
          {children}
        </main>
      </div>

      {/* Click-away para cerrar dropdown */}
      {showNotifs && (
        <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
      )}
    </div>
  );
}
