'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

// ─────────────────────────────────────────────
// ICONOS SVG
// ─────────────────────────────────────────────
const Icon = {
  Shield:  () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  Filter:  () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>,
  Search:  () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Refresh: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  User:    () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Clock:   () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Lock:    () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  Chevron: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
};

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────
interface AuditRow {
  id: number;
  accion: string;
  entidad: string;
  entidad_id: number | null;
  usuario_nombre: string;
  username: string;
  ip_address: string;
  user_agent: string;
  datos_nuevos: any;
  datos_anteriores: any;
  created_at: string;
}

interface Meta { total: number; page: number; pages: number; limit: number; }

// Badge color por tipo de acción
function accionBadge(accion: string): string {
  if (accion.includes('LOGIN'))     return 'bg-blue-100 text-blue-700';
  if (accion.includes('LOGOUT'))    return 'bg-slate-100 text-slate-600';
  if (accion.includes('BLOQUEADO')) return 'bg-red-100 text-red-700';
  if (accion.includes('LEIDO'))     return 'bg-emerald-100 text-emerald-700';
  if (accion.includes('FIRMA'))     return 'bg-purple-100 text-purple-700';
  if (accion.includes('CREADO') || accion.includes('SUBIDO')) return 'bg-cyan-100 text-cyan-700';
  if (accion.includes('CONFIG'))    return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('es', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

// ─────────────────────────────────────────────
// COMPONENTE
// ─────────────────────────────────────────────
export default function AuditoriaPage() {
  // Guard de rol — leer del localStorage (mismo lugar que DashboardLayout)
  const [isAdmin, setIsAdmin]       = useState<boolean | null>(null);
  const [rows, setRows]             = useState<AuditRow[]>([]);
  const [meta, setMeta]             = useState<Meta>({ total: 0, page: 1, pages: 1, limit: 50 });
  const [loading, setLoading]       = useState(true);
  const [expanded, setExpanded]     = useState<number | null>(null);
  const [acciones, setAcciones]     = useState<string[]>([]);

  // Filtros
  const [fAccion,   setFAccion]   = useState('');
  const [fUsuario,  setFUsuario]  = useState('');
  const [fEntidad,  setFEntidad]  = useState('');
  const [fIp,       setFIp]       = useState('');
  const [fDesde,    setFDesde]    = useState('');
  const [fHasta,    setFHasta]    = useState('');
  const [page,      setPage]      = useState(1);

  // Verificar rol al montar
  useEffect(() => {
    const raw = localStorage.getItem('sicodi_user');
    if (raw) {
      try {
        const u = JSON.parse(raw);
        const roles: string[] = (u.roles ?? []).map((r: string) => r.toLowerCase());
        setIsAdmin(roles.includes('admin') || u.role === 'admin' || u.username === 'admin');
      } catch { setIsAdmin(false); }
    } else { setIsAdmin(false); }
  }, []);

  // Cargar acciones disponibles para el filtro
  useEffect(() => {
    if (!isAdmin) return;
    api.get('/audit/acciones').then(r => setAcciones(r.data?.data ?? [])).catch(() => {
      setAcciones(['LOGIN', 'LOGOUT', 'CORREO_LEIDO', 'CORREO_BLOQUEADO', 'EXPEDIENTE_CREADO', 'DOCUMENTO_SUBIDO', 'FIRMA_DIGITAL', 'TAREA_COMPLETADA', 'CONFIG_CAMBIADA']);
    });
  }, [isAdmin]);

  // Cargar registros
  const fetchLogs = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page };
      if (fAccion)  params.accion  = fAccion;
      if (fUsuario) params.usuario = fUsuario;
      if (fEntidad) params.entidad = fEntidad;
      if (fIp)      params.ip      = fIp;
      if (fDesde)   params.desde   = fDesde;
      if (fHasta)   params.hasta   = fHasta;

      const res = await api.get('/audit/log', { params });
      setRows(res.data?.data ?? []);
      setMeta(res.data?.meta ?? { total: 0, page: 1, pages: 1, limit: 50 });
    } catch {
      // Sin BD — datos demo inline
      setRows([
        { id: 1, accion: 'LOGIN',         entidad: 'users',         entidad_id: 1, usuario_nombre: 'Administrador', username: 'admin',     ip_address: '192.168.1.10', user_agent: 'Chrome/131 Windows', datos_nuevos: null, datos_anteriores: null, created_at: new Date(Date.now() - 5*60000).toISOString() },
        { id: 2, accion: 'CORREO_LEIDO',  entidad: 'mail_messages', entidad_id: 1, usuario_nombre: 'Administrador', username: 'admin',     ip_address: '192.168.1.10', user_agent: 'Chrome/131 Windows', datos_nuevos: { accion: 'Correo leído', read_at: new Date().toISOString() }, datos_anteriores: null, created_at: new Date(Date.now() - 3*60000).toISOString() },
        { id: 3, accion: 'EXPEDIENTE_CREADO', entidad: 'expedientes', entidad_id: 5, usuario_nombre: 'Operador SICODI', username: 'operador1', ip_address: '192.168.1.22', user_agent: 'Firefox/132 Windows', datos_nuevos: { codigo: 'EXP-2026-00005' }, datos_anteriores: null, created_at: new Date(Date.now() - 30*60000).toISOString() },
        { id: 4, accion: 'FIRMA_DIGITAL', entidad: 'tareas',        entidad_id: 3, usuario_nombre: 'Administrador', username: 'admin',     ip_address: '192.168.1.10', user_agent: 'Chrome/131 Windows', datos_nuevos: { pin_hash: '****' }, datos_anteriores: null, created_at: new Date(Date.now() - 60*60000).toISOString() },
        { id: 5, accion: 'CORREO_BLOQUEADO', entidad: 'mail_messages', entidad_id: 2, usuario_nombre: 'Sistema', username: 'sistema', ip_address: '127.0.0.1', user_agent: 'CRON/SICODI', datos_nuevos: { razon: 'SLA vencido' }, datos_anteriores: null, created_at: new Date(Date.now() - 2*60*60000).toISOString() },
      ]);
      setMeta({ total: 5, page: 1, pages: 1, limit: 50 });
    } finally {
      setLoading(false);
    }
  }, [isAdmin, page, fAccion, fUsuario, fEntidad, fIp, fDesde, fHasta]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // ─── Acceso denegado ─────────────────────
  if (isAdmin === null) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center h-96 text-slate-400">
      <div className="mb-4 text-red-400"><Icon.Lock /></div>
      <h2 className="text-xl font-bold text-slate-700 mb-2">Acceso Restringido</h2>
      <p className="text-sm">Este panel solo está disponible para Administradores del Sistema.</p>
    </div>
  );

  // ─────────────────────────────────────────
  // RENDER ADMIN
  // ─────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white">
            <Icon.Shield />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Panel de Auditoría Institucional</h1>
            <p className="text-xs text-slate-500">Registro inmutable de todas las acciones del sistema — Solo lectura</p>
          </div>
        </div>
        <button onClick={fetchLogs} className="flex items-center gap-1.5 text-xs px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition">
          <Icon.Refresh /> Actualizar
        </button>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Registros', value: meta.total, color: 'text-slate-900' },
          { label: 'En esta página', value: rows.length, color: 'text-blue-700' },
          { label: 'Página', value: `${meta.page} / ${meta.pages}`, color: 'text-slate-700' },
          { label: 'Modo', value: 'Solo Lectura', color: 'text-emerald-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-400 mb-1">{k.label}</p>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-600">
          <Icon.Filter /> Filtros de búsqueda
        </div>
        <div className="grid grid-cols-6 gap-3">
          <select value={fAccion} onChange={e => { setFAccion(e.target.value); setPage(1); }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">Todas las acciones</option>
            {acciones.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <input type="text" value={fUsuario} onChange={e => { setFUsuario(e.target.value); setPage(1); }}
            placeholder="Usuario/Empleado..." className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400" />
          <input type="text" value={fEntidad} onChange={e => { setFEntidad(e.target.value); setPage(1); }}
            placeholder="Entidad/Modific..." className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400" />
          <input type="text" value={fIp} onChange={e => { setFIp(e.target.value); setPage(1); }}
            placeholder="Dirección IP..." className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400" />
          <input type="date" value={fDesde} onChange={e => { setFDesde(e.target.value); setPage(1); }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400" />
          <input type="date" value={fHasta} onChange={e => { setFHasta(e.target.value); setPage(1); }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        {(fAccion || fUsuario || fEntidad || fIp || fDesde || fHasta) && (
          <button onClick={() => { setFAccion(''); setFUsuario(''); setFEntidad(''); setFIp(''); setFDesde(''); setFHasta(''); setPage(1); }}
            className="mt-2 text-xs text-slate-500 hover:text-slate-800 underline">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                {['ID', 'Acción', 'Entidad', 'Usuario', 'IP', 'Fecha y Hora', 'Detalle'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="py-16 text-center text-slate-400">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Cargando registros de auditoría…
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-slate-400">Sin registros para los filtros seleccionados.</td></tr>
              ) : rows.map(row => (
                <React.Fragment key={row.id}>
                  <tr className={`hover:bg-slate-50 transition-colors ${expanded === row.id ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">#{row.id}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${accionBadge(row.accion)}`}>
                        {row.accion}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-slate-700">{row.entidad}</p>
                      {row.entidad_id && <p className="text-[10px] text-slate-400">ID: {row.entidad_id}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {(row.usuario_nombre ?? 'S')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-700">{row.usuario_nombre}</p>
                          <p className="text-[10px] text-slate-400">@{row.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-600">{row.ip_address}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{fmtDate(row.created_at)}</td>
                    <td className="px-4 py-3">
                      {(row.datos_nuevos || row.datos_anteriores) ? (
                        <button
                          onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <span className={`transition-transform ${expanded === row.id ? 'rotate-90' : ''}`}><Icon.Chevron /></span>
                          Ver datos
                        </button>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                  </tr>
                  {/* Fila expandida — datos de auditoría */}
                  {expanded === row.id && (
                    <tr className="bg-blue-50">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          {row.datos_nuevos && (
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Datos Registrados</p>
                              <pre className="text-xs bg-white border border-slate-200 rounded-lg p-3 overflow-auto max-h-40 text-slate-700 font-mono">
                                {typeof row.datos_nuevos === 'string' ? row.datos_nuevos : JSON.stringify(row.datos_nuevos, null, 2)}
                              </pre>
                            </div>
                          )}
                          {row.datos_anteriores && (
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Datos Anteriores</p>
                              <pre className="text-xs bg-white border border-slate-200 rounded-lg p-3 overflow-auto max-h-40 text-slate-700 font-mono">
                                {typeof row.datos_anteriores === 'string' ? row.datos_anteriores : JSON.stringify(row.datos_anteriores, null, 2)}
                              </pre>
                            </div>
                          )}
                          <div className="col-span-2 text-[10px] text-slate-400 border-t border-blue-100 pt-2">
                            <strong>User Agent:</strong> {row.user_agent}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {meta.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <p className="text-xs text-slate-500">{meta.total} registros totales</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-100 transition">
                Anterior
              </button>
              <span className="text-xs text-slate-600 font-semibold">{page} / {meta.pages}</span>
              <button onClick={() => setPage(p => Math.min(meta.pages, p + 1))} disabled={page === meta.pages}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-100 transition">
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nota legal */}
      <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-slate-50 border border-slate-200 rounded-lg p-3">
        <Icon.Lock />
        <span>
          Este panel muestra el registro de auditoría institucional en <strong>modo solo lectura</strong>.
          Ningún registro puede ser modificado ni eliminado. Todos los eventos incluyen usuario, IP, timestamp y datos del navegador.
          Acceso restringido al rol <strong>ADMIN</strong>.
        </span>
      </div>
    </div>
  );
}
