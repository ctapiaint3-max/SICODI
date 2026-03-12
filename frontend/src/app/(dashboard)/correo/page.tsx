'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────
interface Email {
  id: number;
  asunto: string;
  remitente_nombre: string;
  remitente_email?: string;
  cuerpo: string;
  tipo: string;
  leido: number;
  status?: string;
  urgencia?: string;
  fecha_limite?: string;
  read_at?: string;
  labels?: string[];
  starred?: boolean;
  thread_id?: string;
  has_adjunto?: boolean;
  cc?: string;
  bcc?: string;
  created_at: string;
}

interface ComposeData {
  para: string;
  cc: string;
  bcc: string;
  asunto: string;
  cuerpo: string;
  urgencia: string;
  firma: boolean;
  confidencial: boolean;
  programado: string;
  adjuntos: File[];
}

// ─────────────────────────────────────────────
// SLA POR URGENCIA
// ─────────────────────────────────────────────
const SLA_HORAS: Record<string, number> = {
  URGENTE: 24,
  ALTA: 48,
  NORMAL: 72,
  BAJA: 120,
};

const SLA_STYLE: Record<string, { border: string; badge: string; badgeText: string; label: string; hours: number }> = {
  URGENTE: { border: 'border-l-red-600', badge: 'bg-red-600', badgeText: 'text-white', label: 'Urgente', hours: 24 },
  ALTA: { border: 'border-l-orange-400', badge: 'bg-orange-100', badgeText: 'text-orange-700', label: 'Alta', hours: 48 },
  NORMAL: { border: 'border-l-blue-400', badge: 'bg-blue-100', badgeText: 'text-blue-700', label: 'Normal', hours: 72 },
  BAJA: { border: 'border-l-emerald-400', badge: 'bg-emerald-100', badgeText: 'text-emerald-700', label: 'Baja', hours: 120 },
  BLOCKED: { border: 'border-l-slate-400', badge: 'bg-slate-700', badgeText: 'text-white', label: 'Bloqueado', hours: 0 },
};

function getSlaStyle(urgencia?: string, status?: string) {
  if (status === 'BLOCKED') return SLA_STYLE.BLOCKED;
  return SLA_STYLE[urgencia ?? 'NORMAL'] ?? SLA_STYLE.NORMAL;
}

function slaTimeLeft(fecha_limite?: string): string {
  if (!fecha_limite) return '';
  const diff = new Date(fecha_limite).getTime() - Date.now();
  if (diff < 0) return 'Vencido';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m restantes`;
}

function calcFechaLimite(urgencia?: string): string {
  const h = SLA_HORAS[urgencia ?? 'NORMAL'] ?? 72;
  return new Date(Date.now() + h * 3600000).toISOString();
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3600000;
  if (diffH < 24) return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short' });
}

// ─────────────────────────────────────────────
// ICONOS SVG (inline, sin dependencias)
// ─────────────────────────────────────────────
const Icon = {
  Inbox: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>,
  Sent: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
  Lock: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  Compose: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Search: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Reply: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>,
  Forward: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6" /></svg>,
  Archive: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
  Mail: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Attach: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a4 4 0 00-5.656-5.656l-6.586 6.586a6 6 0 108.485 8.485L20.5 13" /></svg>,
  Signature: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
  Clock: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Close: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Tag: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
  Alert: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  Unread: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" /></svg>,
};

// ─────────────────────────────────────────────
// DATOS MOCK
// ─────────────────────────────────────────────
const MOCK: Email[] = [
  {
    id: 1, tipo: 'TAREA', leido: 0, urgencia: 'URGENTE', starred: false, has_adjunto: false,
    asunto: 'Nueva tarea asignada — EXP-2026-00001',
    remitente_nombre: 'Sistema SICODI', remitente_email: 'noreply@sicodi.intranet',
    cuerpo: 'Se le ha asignado una nueva tarea en el expediente EXP-2026-00001 "Solicitud de Viáticos".\n\nPor favor revise su bandeja para procesar el trámite antes del vencimiento del SLA institucional.',
    labels: ['TAREA'], thread_id: 'th-001',
    fecha_limite: calcFechaLimite('URGENTE'),
    created_at: new Date().toISOString(),
  },
  {
    id: 2, tipo: 'SLA', leido: 0, urgencia: 'ALTA', starred: false, has_adjunto: true,
    asunto: 'SLA próximo a vencer — EXP-2026-00002',
    remitente_nombre: 'Sistema SICODI', remitente_email: 'alertas@sicodi.intranet',
    cuerpo: 'El expediente EXP-2026-00002 "Adquisición de Equipos Informáticos" tiene menos de 5 horas antes de vencer el SLA institucional.',
    labels: ['SLA'],
    fecha_limite: calcFechaLimite('ALTA'),
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 3, tipo: 'INFO', leido: 1, urgencia: 'NORMAL', starred: false, has_adjunto: false,
    asunto: 'Bienvenido al Sistema SICODI — Cuenta Activada',
    remitente_nombre: 'Administrador Sistema', remitente_email: 'admin@sicodi.intranet',
    cuerpo: 'Estimado usuario,\n\nSu cuenta en el Sistema de Control Documental Institucional ha sido activada exitosamente.\n\nAtentamente,\nAdministración SICODI',
    labels: ['INFO'],
    read_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    fecha_limite: calcFechaLimite('NORMAL'),
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4, tipo: 'CORRESPONDENCIA', leido: 0, urgencia: 'ALTA', starred: false, has_adjunto: true,
    asunto: 'OFICIO MULTIPLE 027/2026 — Dirección General',
    remitente_nombre: 'Dirección General', remitente_email: 'dir.general@institucion.gov',
    cuerpo: 'Por medio del presente se comunica la disposición número 027/2026 relativa al ajuste del presupuesto operativo del ejercicio fiscal 2026.',
    labels: ['OFICIAL'],
    fecha_limite: calcFechaLimite('ALTA'),
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
];

const LABEL_COLORS: Record<string, string> = {
  URGENTE: 'bg-red-500',
  ALTA: 'bg-orange-400',
  SLA: 'bg-orange-400',
  INFO: 'bg-blue-500',
  OFICIAL: 'bg-indigo-500',
  CORRESPONDENCIA: 'bg-purple-500',
  TAREA: 'bg-cyan-500',
  NORMAL: 'bg-slate-400',
};

const FIRMA_DEFAULT = `\n\n---\nSistema de Control Documental Institucional\nSICODI | Gestión Documental\nnoreply@sicodi.intranet`;

const FOLDERS = [
  { key: 'inbox', Icon: Icon.Inbox, label: 'Recibidos' },
  { key: 'sent', Icon: Icon.Sent, label: 'Enviados' },
  { key: 'blocked', Icon: Icon.Lock, label: 'Bloqueados' },
];

// ─────────────────────────────────────────────
// COMPONENTE INTERNO (usa useSearchParams)
// ─────────────────────────────────────────────
function CorreoInner() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');
  const expParam = searchParams.get('exp');

  const [emails, setEmails] = useState<Email[]>([]);
  const [folder, setFolder] = useState('inbox');
  const [activeId, setActiveId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(expParam ?? '');
  const [sinLeer, setSinLeer] = useState(0);
  const [showCompose, setShowCompose] = useState(false);
  const [sending, setSending] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [compose, setCompose] = useState<ComposeData>({
    para: '', cc: '', bcc: '', asunto: '', cuerpo: '',
    urgencia: 'NORMAL', firma: true, confidencial: false, programado: '', adjuntos: [],
  });

  // ─── Carga ───────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/correo/inbox');
      const data: Email[] = res.data?.data ?? [];
      if (data.length > 0) {
        const enriched = data.map(e => ({
          ...e,
          fecha_limite: e.fecha_limite ?? calcFechaLimite(e.urgencia),
        }));
        setEmails(enriched);
        setSinLeer(enriched.filter(e => !e.leido).length);
        setActiveId(enriched[0]?.id ?? null);
        return;
      }
    } catch { }
    try {
      const res2 = await api.get('/notifications');
      const notifs: any[] = res2.data?.data ?? [];
      if (notifs.length > 0) {
        const mapped = notifs.map((n: any) => ({
          id: n.id, asunto: n.titulo ?? '', remitente_nombre: 'Sistema SICODI',
          remitente_email: 'system@sicodi.intranet',
          cuerpo: n.mensaje ?? '', tipo: n.tipo ?? 'INFO',
          leido: n.leida ? 1 : 0, created_at: n.created_at,
          urgencia: n.urgencia ?? 'NORMAL', labels: [n.tipo ?? 'INFO'],
          fecha_limite: calcFechaLimite(n.urgencia),
        }));
        setEmails(mapped);
        setSinLeer(mapped.filter((e: Email) => !e.leido).length);
        setActiveId(mapped[0]?.id ?? null);
        return;
      }
    } catch { }
    setEmails(MOCK);
    setSinLeer(MOCK.filter(e => !e.leido).length);
    setActiveId(MOCK[0].id);
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  // Pre-seleccionar desde URL params (viene de Mi Bandeja)
  useEffect(() => {
    if (emailParam) setActiveId(parseInt(emailParam));
    if (expParam) setSearch(expParam);
  }, [emailParam, expParam]);

  // ─── Filtrado ────────────────────────────
  const filtered = emails.filter(e => {
    if (folder === 'blocked') return e.status === 'BLOCKED';
    if (folder === 'sent') return e.status === 'SENT';
    const q = search.toLowerCase();
    if (q) return (
      (e.asunto ?? '').toLowerCase().includes(q) ||
      (e.remitente_nombre ?? '').toLowerCase().includes(q) ||
      (e.cuerpo ?? '').toLowerCase().includes(q)
    );
    return folder === 'inbox';
  });

  const active = emails.find(e => e.id === activeId);

  // ─── Acciones ────────────────────────────
  const openEmail = async (email: Email) => {
    setActiveId(email.id);
    if (email.status === 'BLOCKED') return;
    if (!email.leido) {
      setEmails(prev => prev.map(e => e.id === email.id
        ? { ...e, leido: 1, read_at: new Date().toISOString() } : e));
      setSinLeer(prev => Math.max(0, prev - 1));
      try { await api.put(`/notifications/${email.id}/leida`); } catch { }
    }
  };

  const markUnread = (id: number) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, leido: 0, read_at: undefined } : e));
    setSinLeer(prev => prev + 1);
  };

  const archiveEmail = (id: number) => {
    setEmails(prev => prev.filter(e => e.id !== id));
    setActiveId(null);
  };

  const replyEmail = (email: Email) => {
    setCompose(p => ({
      ...p,
      para: email.remitente_email ?? '',
      asunto: `Re: ${email.asunto}`,
      cuerpo: `\n\n--- Mensaje original ---\nDe: ${email.remitente_nombre}\nFecha: ${fmtDate(email.created_at)}\n\n${email.cuerpo}`,
    }));
    setShowCompose(true);
  };

  const forwardEmail = (email: Email) => {
    setCompose(p => ({
      ...p, para: '',
      asunto: `Fwd: ${email.asunto}`,
      cuerpo: `\n\n--- Mensaje reenviado ---\nDe: ${email.remitente_nombre}\n${email.cuerpo}`,
    }));
    setShowCompose(true);
  };

  const sendEmail = async () => {
    if (!compose.para || !compose.asunto) { alert('Destinatario y Asunto son obligatorios.'); return; }
    setSending(true);
    const body = compose.cuerpo + (compose.firma ? FIRMA_DEFAULT : '');
    try {
      await api.post('/correo/enviar', { ...compose, cuerpo: body });
    } catch { }
    alert('Correo despachado correctamente.');
    setShowCompose(false);
    resetCompose();
    setSending(false);
  };

  const resetCompose = () => setCompose({
    para: '', cc: '', bcc: '', asunto: '', cuerpo: '',
    urgencia: 'NORMAL', firma: true, confidencial: false, programado: '', adjuntos: [],
  });

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-5rem)] flex rounded-xl border-2 border-slate-300 bg-slate-100 overflow-hidden shadow-md">

      {/* ── Col 1: Sidebar ───────────────── */}
      <div className="w-56 flex-shrink-0 bg-slate-900 text-white flex flex-col border-r-2 border-slate-800 z-20">
        <div className="p-4 border-b-2 border-slate-700">
          <button
            onClick={() => { setShowCompose(true); resetCompose(); }}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2 rounded-lg transition-colors"
          >
            <Icon.Compose /> Redactar
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {FOLDERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFolder(f.key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors rounded-lg mx-1 my-0.5 ${folder === f.key ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-slate-300 hover:bg-slate-700'
                }`}
            >
              <f.Icon />
              <span>{f.label}</span>
              {f.key === 'inbox' && sinLeer > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  {sinLeer}
                </span>
              )}
            </button>
          ))}

          {/* Etiquetas */}
          <div className="px-3 pt-4 pb-1">
            <p className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              <Icon.Tag /> Etiquetas
            </p>
            {Object.entries(LABEL_COLORS).map(([label, color]) => (
              <button
                key={label}
                onClick={() => setSearch(label)}
                className="flex items-center gap-2 text-[11px] text-slate-400 hover:text-white py-1 w-full"
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
                {label}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* ── Col 2: Lista de correos ──────── */}
      <div className="w-[360px] flex-shrink-0 bg-white border-r-2 border-slate-300 flex flex-col z-10 shadow-[8px_0_20px_-10px_rgba(0,0,0,0.15)] relative">
        {/* Búsqueda */}
        <div className="p-4 border-b-2 border-slate-200 bg-slate-50 sticky top-0 z-20">
          <div className="relative group">
            <span className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors"><Icon.Search /></span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Búsqueda de correos..."
              className="w-full pl-9 pr-8 py-2.5 text-xs font-medium border-2 border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-red-500 transition-colors bg-white rounded-full">
                <Icon.Close />
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 px-0.5">
            {filtered.length} mensajes · {sinLeer} sin leer
          </p>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto bg-white pt-1">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Sincronizando…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Icon.Mail />
              <p className="text-sm mt-2">Sin mensajes</p>
            </div>
          ) : filtered.map(email => {
            const sl = getSlaStyle(email.urgencia, email.status);
            return (
              <div
                key={email.id}
                onClick={() => openEmail(email)}
                className={`px-4 py-4 cursor-pointer transition-all border-b-2 border-slate-200 relative group flex flex-col gap-1.5 ${activeId === email.id ? 'bg-blue-50/80 ring-2 ring-blue-500 ring-inset z-10 shadow-sm' : 'hover:bg-slate-100'
                  }`}
              >
                {/* Indicador SLA */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${sl.border}`}></div>

                {/* Remitente + hora */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex-shrink-0 flex items-center justify-center text-[10px] font-bold uppercase ring-1 ring-white shadow-sm">
                      {(email.remitente_nombre ?? 'S')[0].toUpperCase()}
                    </div>
                    <span className={`text-xs tracking-wide truncate ${!email.leido ? 'font-black text-slate-900' : 'font-semibold text-slate-600'}`}>
                      {email.remitente_nombre}
                    </span>
                  </div>
                  <span className={`text-[10px] whitespace-nowrap flex-shrink-0 ${!email.leido ? 'font-black text-blue-600' : 'text-slate-500 font-semibold'}`}>{fmtDate(email.created_at)}</span>
                </div>

                {/* Asunto */}
                <div className="flex items-start gap-2">
                  {!email.leido && <span className="w-2 h-2 rounded-full bg-blue-600 mt-1 flex-shrink-0 ring-2 ring-blue-100"></span>}
                  <p className={`text-[13px] tracking-wide leading-snug truncate ${!email.leido && email.status !== 'BLOCKED' ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                    {email.status === 'BLOCKED' && <span className="inline-flex mr-1 align-middle text-red-600"><Icon.Lock /></span>}
                    {email.asunto}
                  </p>
                </div>

                {/* Preview cuerpo */}
                <p className="text-[11px] text-slate-500 truncate mt-1 leading-relaxed pl-2.5">
                  {email.status === 'BLOCKED'
                    ? 'SLA Caducado – mensaje bloqueado'
                    : (email.cuerpo ?? '').replace(/<[^>]*>/g, '').substring(0, 60)}
                </p>

                {/* Badges */}
                <div className="flex items-center gap-2 mt-2 flex-wrap pl-2.5">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${sl.badge} ${sl.badgeText}`}>
                    {sl.label}
                  </span>
                  {email.has_adjunto && (
                    <span className="text-slate-500 bg-slate-100 p-0.5 rounded border border-slate-200"><Icon.Attach /></span>
                  )}
                  {email.fecha_limite && email.status !== 'BLOCKED' && (
                    <span className="ml-auto text-[10px] font-bold text-slate-500 flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 shadow-sm">
                      <Icon.Clock /> {slaTimeLeft(email.fecha_limite).replace(' restantes', '')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Col 3: Visor ─────────────────── */}
      <div className="flex-1 bg-slate-50 flex flex-col overflow-y-auto relative">
        {active ? (
          <div className="max-w-4xl mx-auto w-full pb-10">
            {/* Header */}
            <div className="px-8 py-6 border-b-2 border-slate-300 bg-white shadow-sm z-10 rounded-b-xl mb-6 mx-4 mt-4">
              {/* Barra de urgencia */}
              {(() => {
                const sl = getSlaStyle(active.urgencia, active.status);
                return (
                  <div className={`text-xs font-bold px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 mb-4 ${sl.badge} ${sl.badgeText}`}>
                    {active.status === 'BLOCKED' ? <Icon.Lock /> : <Icon.Alert />}
                    {active.status === 'BLOCKED'
                      ? 'Bloqueado por vencimiento SLA'
                      : `${sl.label} — Tiempo límite: ${SLA_HORAS[active.urgencia ?? 'NORMAL'] ?? 72}h`
                    }
                    {active.fecha_limite && active.status !== 'BLOCKED' && (
                      <span className="ml-2 font-normal opacity-80">({slaTimeLeft(active.fecha_limite)})</span>
                    )}
                  </div>
                );
              })()}

              <div className="flex items-start justify-between gap-6">
                <h1 className="text-xl font-black text-slate-900 leading-tight">{active.asunto}</h1>
                {/* Acciones: Responder y Reenviar únicamente — los correos recibidos son registros permanentes */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => replyEmail(active)} title="Responder" className="flex items-center gap-1.5 text-xs px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition shadow-sm"><Icon.Reply /> Responder</button>
                  <button onClick={() => forwardEmail(active)} title="Reenviar" className="flex items-center gap-1.5 text-xs px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold transition border-2 border-slate-300"><Icon.Forward /> Reenviar</button>
                  {active.leido && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 border-2 border-emerald-300 px-2 py-1.5 rounded-lg shadow-sm">
                      <Icon.Lock /> Registro sellado
                    </span>
                  )}
                </div>
              </div>

              {/* Metadatos */}
              <div className="flex items-center gap-4 mt-6 bg-slate-50 p-4 rounded-xl border-2 border-slate-200 shadow-inner">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-black text-base flex-shrink-0 ring-2 ring-slate-300">
                  {(active.remitente_nombre ?? 'S')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-slate-900 text-sm tracking-wide">{active.remitente_nombre}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">&lt;{active.remitente_email ?? 'sistema@sicodi.intranet'}&gt; <span className="mx-2 text-slate-300">|</span> {fmtDate(active.created_at)}</p>
                  {active.cc && <p className="text-[11px] text-slate-500 mt-0.5 font-bold">Cc: {active.cc}</p>}
                </div>
              </div>
            </div>

            {/* Cuerpo y Contenido del Correo */}
            <div className="px-4 space-y-6">
              {active.status === 'BLOCKED' ? (
                <div className="bg-white border-2 border-red-200 rounded-2xl p-10 text-center shadow-sm max-w-2xl mx-auto mt-10">
                  <div className="flex justify-center mb-4 text-red-500 bg-red-50 p-4 rounded-full w-16 h-16 mx-auto items-center"><Icon.Lock /></div>
                  <h2 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Acceso Bloqueado (SLA Vencido)</h2>
                  <p className="text-slate-600 text-base max-w-md mx-auto leading-relaxed">
                    Este correo no fue leído dentro del límite de tiempo institucional. El acceso a su contenido ha sido <span className="font-bold text-red-600">revocado automáticamente</span> y se ha notificado al remitente y a la mesa de control.
                  </p>
                </div>
              ) : (
                <div className="w-full space-y-6">
                  {/* Caja de contenido principal estilo documento */}
                  <div className="bg-white p-8 rounded-2xl shadow-md border-2 border-slate-300 min-h-[350px]">
                    <div className="text-[13px] text-slate-900 leading-relaxed whitespace-pre-wrap font-serif">
                      {active.cuerpo}
                    </div>
                  </div>

                  {/* Adjuntos */}
                  {active.has_adjunto && (
                    <div className="p-5 bg-white rounded-xl border-2 border-slate-300 shadow-md">
                      <p className="text-xs font-black text-slate-800 mb-4 uppercase tracking-widest flex items-center gap-2">
                        <Icon.Attach /> Archivos Adjuntos (2)
                      </p>
                      <div className="flex gap-4 flex-wrap">
                        {['Documento_Oficial.pdf', 'Ficha_Tecnica.xlsx'].map(name => (
                          <div key={name} className="flex items-center gap-3 bg-slate-50 border-2 border-slate-200 rounded-lg px-4 py-2 text-xs cursor-pointer hover:bg-blue-50 hover:border-blue-400 hover:shadow-sm transition-all group">
                            <span className="text-slate-400 group-hover:text-blue-600"><Icon.Attach /></span>
                            <div>
                              <p className="font-bold text-slate-800 group-hover:text-blue-700 tracking-wide">{name}</p>
                              <p className="text-[10px] text-slate-500 font-bold mt-0.5 uppercase">Visor Seguro</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA Bandeja */}
                  {(active.tipo === 'TAREA' || active.tipo === 'SLA') && (
                    <div className={`mt-6 p-4 rounded-xl border ${active.tipo === 'SLA' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                      <p className={`text-sm font-semibold mb-2 ${active.tipo === 'SLA' ? 'text-red-700' : 'text-blue-700'}`}>
                        {active.tipo === 'SLA' ? 'Acción urgente requerida' : 'Tarea pendiente asignada'}
                      </p>
                      <a href="/bandeja" className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium ${active.tipo === 'SLA' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        Ir a Mi Bandeja
                      </a>
                    </div>
                  )}
                  {/* Trazabilidad SLA y Auditoría */}
                  <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-5 rounded-xl shadow-sm border-2 border-slate-300 flex flex-col justify-center text-center">
                      <strong className="block text-slate-500 mb-2 uppercase text-[10px] font-black tracking-widest">Estatus</strong>
                      <div className="flex justify-center items-center gap-1 font-black text-slate-900 text-sm">
                        {active.status === 'BLOCKED' ? <span className="text-red-700 flex items-center gap-1.5"><Icon.Lock /> BLOQUEADO</span> : (active.leido ? <span className="text-emerald-700 flex items-center gap-1.5"><Icon.Lock /> LEÍDO Y SELLADO</span> : <span className="text-blue-700">PENDIENTE SLA</span>)}
                      </div>
                    </div>
                    {active.read_at && (
                      <div className="bg-white p-5 rounded-xl shadow-sm border-2 border-slate-300 flex flex-col justify-center text-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
                        <strong className="block text-slate-500 mb-2 uppercase text-[10px] font-black tracking-widest">Apertura (Timestamp)</strong>
                        <p className="font-mono text-xs text-slate-900 font-bold bg-white/90 inline-block mx-auto px-3 py-1.5 rounded-lg shadow-sm border border-slate-200">{new Date(active.read_at).toLocaleString('es')}</p>
                      </div>
                    )}
                    {active.fecha_limite && (
                      <div className={`p-5 rounded-xl shadow-sm border-2 flex flex-col justify-center text-center ${new Date(active.fecha_limite) < new Date() ? 'bg-red-50 border-red-400' : 'bg-white border-slate-300'}`}>
                        <strong className="block text-slate-500 mb-2 uppercase text-[10px] font-black tracking-widest">Fecha Límite SLA</strong>
                        <p className={`font-mono text-sm font-black flex items-center justify-center gap-2 ${new Date(active.fecha_limite) < new Date() ? 'text-red-700' : 'text-slate-900'}`}>
                          <Icon.Clock /> {new Date(active.fecha_limite).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-slate-300">
              <div className="flex justify-center mb-4 scale-150"><Icon.Mail /></div>
              <p className="font-semibold text-slate-400 text-base">Seleccione un correo</p>
              <p className="text-sm text-slate-300 mt-1">Bandeja de correo institucional SICODI</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: Redactar ───────────────── */}
      {showCompose && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border-2 border-slate-300">
            {/* Header modal */}
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white border-b-2 border-slate-700">
              <h3 className="font-bold text-sm flex items-center gap-2 tracking-wide"><Icon.Compose /> Redactar mensaje interno</h3>
              <button onClick={() => setShowCompose(false)} className="text-slate-400 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-lg"><Icon.Close /></button>
            </div>

            {/* Campos de Redacción */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">

              {/* Bloque Destinatarios */}
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest w-16">Para</label>
                  <div className="flex-1 relative">
                    <input type="email" value={compose.para} onChange={e => setCompose(p => ({ ...p, para: e.target.value }))}
                      className="w-full text-sm font-bold border-2 border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none shadow-sm transition-all text-slate-900"
                      placeholder="destinatario@institucion.gov" />
                    <div className="absolute right-3 top-2.5 flex gap-3 text-xs font-bold text-slate-400">
                      <button onClick={() => setShowCc(!showCc)} className="hover:text-blue-600 transition-colors uppercase px-1">Cc</button>
                      <button onClick={() => setShowBcc(!showBcc)} className="hover:text-blue-600 transition-colors uppercase px-1">Cco</button>
                    </div>
                  </div>
                </div>

                {showCc && (
                  <div className="flex items-center gap-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest w-16">Cc</label>
                    <input type="email" value={compose.cc} onChange={e => setCompose(p => ({ ...p, cc: e.target.value }))}
                      className="flex-1 text-xs font-bold border-2 border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none shadow-sm transition-all text-slate-900"
                      placeholder="cc@institucion.gov" />
                  </div>
                )}
                {showBcc && (
                  <div className="flex items-center gap-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest w-16">Cco</label>
                    <input type="email" value={compose.bcc} onChange={e => setCompose(p => ({ ...p, bcc: e.target.value }))}
                      className="flex-1 text-xs font-bold border-2 border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none shadow-sm transition-all text-slate-900"
                      placeholder="copiaoculta@institucion.gov" />
                  </div>
                )}
              </div>

              {/* Separador */}
              <hr className="border-t-2 border-slate-200" />

              {/* Asunto y SLA */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest w-16 hidden sm:block">Asunto</label>
                <input type="text" value={compose.asunto} onChange={e => setCompose(p => ({ ...p, asunto: e.target.value }))}
                  className="flex-1 w-full text-base font-black border-2 border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none shadow-sm transition-all text-slate-900"
                  placeholder="Escriba el asunto del mensaje..." />

                <div className="flex-shrink-0 flex items-center gap-2 bg-slate-100 border-2 border-slate-300 rounded-lg px-3 py-2 w-full sm:w-auto">
                  <span className="text-xs font-black text-slate-700">Prioridad:</span>
                  <select
                    value={compose.urgencia}
                    onChange={e => {
                      const urg = e.target.value;
                      const h = SLA_HORAS[urg] ?? 72;
                      const limite = new Date(Date.now() + h * 3600000);
                      const pad = (n: number) => String(n).padStart(2, '0');
                      const fmt = `${limite.getFullYear()}-${pad(limite.getMonth() + 1)}-${pad(limite.getDate())}T${pad(limite.getHours())}:${pad(limite.getMinutes())}`;
                      setCompose(p => ({ ...p, urgencia: urg, programado: fmt }));
                    }}
                    className="text-sm bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="BAJA">Baja SLA 120h</option>
                    <option value="NORMAL">Normal SLA 72h</option>
                    <option value="ALTA">Alta SLA 48h</option>
                    <option value="URGENTE">Urgente SLA 24h</option>
                  </select>
                </div>
              </div>

              {/* Cuerpo del Mensaje */}
              <div className="mt-4 bg-slate-50 border-2 border-slate-300 rounded-xl overflow-hidden shadow-sm focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-600 transition-all flex flex-col min-h-[350px]">
                <textarea value={compose.cuerpo} onChange={e => setCompose(p => ({ ...p, cuerpo: e.target.value }))}
                  className="flex-1 w-full bg-transparent p-6 text-sm text-slate-900 outline-none resize-none leading-relaxed font-serif"
                  placeholder="Redactar el cuerpo del mensaje Institucional..." />

                {compose.firma && (
                  <div className="px-5 pb-5 pt-2 text-xs text-slate-400 whitespace-pre-line font-mono select-none">
                    {FIRMA_DEFAULT}
                  </div>
                )}
              </div>

            </div>

            {/* Footer de Acciones y Adjuntos */}
            <div className="bg-slate-50 border-t-2 border-slate-300 flex flex-col">

              {/* Área de Adjuntos Expandible */}
              {compose.adjuntos.length > 0 && (
                <div className="px-6 py-4 bg-white flex gap-3 flex-wrap border-b-2 border-slate-200">
                  {compose.adjuntos.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-50 border-2 border-slate-300 shadow-sm rounded-lg px-3 py-2 text-xs font-bold text-slate-800">
                      <span className="text-slate-400"><Icon.Attach /></span>
                      <span className="truncate max-w-[150px]">{f.name}</span>
                      <button onClick={() => setCompose(p => ({ ...p, adjuntos: p.adjuntos.filter((_, j) => j !== i) }))}
                        className="text-red-400 hover:text-red-700 bg-white hover:bg-red-50 p-1 border-2 border-slate-200 hover:border-red-200 rounded transition-colors"><Icon.Close /></button>
                    </div>
                  ))}
                </div>
              )}

              {/* Barra Inferior */}
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => fileInputRef.current?.click()} title="Adjuntar Archivo"
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:text-blue-700 hover:bg-blue-50 border-2 border-slate-300 hover:border-blue-300 rounded-lg transition-all shadow-sm">
                    <Icon.Attach /> <span className="hidden sm:inline">Adjuntar</span>
                  </button>
                  <input ref={fileInputRef} type="file" multiple className="hidden"
                    onChange={e => setCompose(p => ({ ...p, adjuntos: [...p.adjuntos, ...Array.from(e.target.files ?? [])] }))} />

                  <div className="h-6 w-px bg-slate-300 mx-2 hidden sm:block"></div>

                  <button onClick={() => setCompose(p => ({ ...p, firma: !p.firma }))} title="Incluir Firma Digital"
                    className={`p-2 rounded-lg transition-all border-2 ${compose.firma ? 'text-blue-700 bg-blue-100 border-blue-400 shadow-sm ring-2 ring-blue-50' : 'text-slate-500 hover:bg-slate-200 border-slate-300 bg-white shadow-sm'}`}>
                    <Icon.Signature />
                  </button>
                  <button onClick={() => setCompose(p => ({ ...p, confidencial: !p.confidencial }))} title="Marcar como Confidencial"
                    className={`p-2 rounded-lg transition-all border-2 ${compose.confidencial ? 'text-red-700 bg-red-100 border-red-400 shadow-sm ring-2 ring-red-50' : 'text-slate-500 hover:bg-slate-200 border-slate-300 bg-white shadow-sm'}`}>
                    <Icon.Lock />
                  </button>

                  {/* Input fecha programada camuflado */}
                  <div className="relative group ml-2 hidden sm:block">
                    <input type="datetime-local" value={compose.programado}
                      onChange={e => setCompose(p => ({ ...p, programado: e.target.value }))}
                      className="opacity-0 absolute inset-0 w-full cursor-pointer z-10"
                      title="Programar envío" />
                    <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white border-2 border-slate-300 hover:bg-slate-100 rounded-lg transition-all group-hover:border-slate-400 shadow-sm">
                      <Icon.Clock /> {compose.programado ? 'Envío Programado' : 'Programar'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button onClick={() => setShowCompose(false)} className="text-xs font-bold px-4 py-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors">
                    Descartar
                  </button>
                  <button onClick={sendEmail} disabled={sending}
                    className="flex items-center gap-2 text-sm px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-black shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5">
                    <Icon.Sent /> {sending ? 'Enviando...' : 'Enviar Mensaje'}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// EXPORT CON SUSPENSE (requerido por useSearchParams)
// ─────────────────────────────────────────────
export default function CorreoPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CorreoInner />
    </Suspense>
  );
}
