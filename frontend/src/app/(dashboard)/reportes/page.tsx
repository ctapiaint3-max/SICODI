'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// ─── Iconos SVG ───────────────────────────────
const Icon = {
  Chart:    () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  Download: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  File:     () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Alert:    () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  Folder:   () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
  Clock:    () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  PDF:      () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
};

export default function ReportesPage() {
  const [kpis,        setKpis]        = useState<any>(null);
  const [cumplimiento,setCumplimiento] = useState<any[]>([]);
  const [tiempos,     setTiempos]     = useState<any[]>([]);
  const [loadingCSV,  setLoadingCSV]  = useState(false);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [k, c, t] = await Promise.all([
          api.get('/reportes/kpis'),
          api.get('/reportes/cumplimiento'),
          api.get('/reportes/tiempos'),
        ]);
        setKpis(k.data.data);
        setCumplimiento(c.data.data ?? []);
        setTiempos(t.data.data ?? []);
      } catch {
        // Mock demo
        setKpis({
          kpis: { expedientes_activos: 124, documentos_mensuales: 536, tramites_pendientes: 18, alertas_criticas: 3 },
          semaforo: { color: 'AMARILLO', mensaje: 'Atención requerida', riesgo_porcentaje: 14 },
        });
        setCumplimiento([
          { area: 'Mesa de Partes',  total: 40, resueltos: 32, pendientes: 8  },
          { area: 'Dirección Gral.', total: 30, resueltos: 20, pendientes: 10 },
          { area: 'Logística',       total: 28, resueltos: 24, pendientes: 4  },
          { area: 'RRHH',            total: 22, resueltos: 18, pendientes: 4  },
        ]);
        setTiempos([
          { area: 'Mesa de Partes',  dias_promedio: '2.4' },
          { area: 'Dirección Gral.', dias_promedio: '5.1' },
          { area: 'Logística',       dias_promedio: '3.8' },
          { area: 'RRHH',            dias_promedio: '1.9' },
        ]);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const downloadCSV = async (tipo: string) => {
    setLoadingCSV(true);
    try {
      const res = await api.get('/reportes/tabular');
      let data = res.data.data ?? [];
      if (tipo === 'vencidos') data = data.filter((r: any) => !['RESUELTO','ARCHIVADO'].includes(r.estado));
      if (!data.length) { alert('Sin datos para exportar.'); return; }
      const headers = Object.keys(data[0]);
      const csv = [headers.join(','), ...data.map((r: any) => headers.map((h: string) => `"${r[h] ?? ''}"`).join(','))].join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `SICODI_${tipo}_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
    } catch { alert('Error exportando reporte.'); }
    finally { setLoadingCSV(false); }
  };

  const totalExpedientes = cumplimiento.reduce((s, d) => s + (d.total ?? 0), 0);
  const totalResueltos   = cumplimiento.reduce((s, d) => s + (d.resueltos ?? 0), 0);
  const totalPendientes  = cumplimiento.reduce((s, d) => s + (d.pendientes ?? 0), 0);

  const semaforoStyle = (color: string) => ({
    VERDE:    { bg: 'bg-emerald-50', border: 'border-emerald-300', dot: 'bg-emerald-500', text: 'text-emerald-700' },
    AMARILLO: { bg: 'bg-amber-50',   border: 'border-amber-300',   dot: 'bg-amber-400',   text: 'text-amber-700'   },
    ROJO:     { bg: 'bg-red-50',     border: 'border-red-300',     dot: 'bg-red-500',     text: 'text-red-700'     },
  }[color] ?? { bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-400', text: 'text-slate-700' });

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white">
            <Icon.Chart />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Reportes Institucionales</h1>
            <p className="text-xs text-slate-500">Analítica en tiempo real — cumplimiento SLA, tiempos de respuesta y exportaciones</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Expedientes Activos',  value: kpis?.kpis?.expedientes_activos  ?? '—', Icon: Icon.Folder, color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-100' },
          { label: 'Documentos del Mes',   value: kpis?.kpis?.documentos_mensuales ?? '—', Icon: Icon.File,   color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-100' },
          { label: 'Trámites Pendientes',  value: kpis?.kpis?.tramites_pendientes  ?? '—', Icon: Icon.Clock,  color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-100' },
          { label: 'Alertas Críticas',     value: kpis?.kpis?.alertas_criticas     ?? '—', Icon: Icon.Alert,  color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-100' },
        ].map(kpi => (
          <div key={kpi.label} className={`bg-white rounded-xl border ${kpi.border} shadow-sm p-5 flex items-center gap-4`}>
            <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center ${kpi.color} flex-shrink-0`}>
              <kpi.Icon />
            </div>
            <div>
              <p className={`text-2xl font-bold ${kpi.color}`}>
                {loading ? <span className="inline-block w-8 h-6 bg-slate-200 animate-pulse rounded" /> : kpi.value}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Semáforo institucional */}
      {kpis?.semaforo && (() => {
        const s = semaforoStyle(kpis.semaforo.color);
        return (
          <div className={`${s.bg} border ${s.border} rounded-xl p-4 flex items-center gap-4`}>
            <div className={`w-4 h-4 rounded-full ${s.dot} flex-shrink-0`} />
            <div>
              <p className={`font-bold text-sm ${s.text}`}>
                Semáforo Institucional — {kpis.semaforo.mensaje}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                {kpis.semaforo.riesgo_porcentaje}% de trámites en estado crítico
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className={`text-3xl font-black ${s.text}`}>{kpis.semaforo.riesgo_porcentaje}%</p>
              <p className="text-xs text-slate-400">riesgo</p>
            </div>
          </div>
        );
      })()}

      {/* Gráficas */}
      <div className="grid grid-cols-3 gap-4">

        {/* Donut */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm font-bold text-slate-800 mb-1">Estado de Expedientes</p>
          <p className="text-xs text-slate-400 mb-4">Total: {totalExpedientes}</p>
          <div className="flex justify-center">
            <div className="w-36 h-36">
              {!loading && (
                <Doughnut
                  data={{ labels: ['Resueltos', 'Pendientes'], datasets: [{ data: [totalResueltos, totalPendientes], backgroundColor: ['#10b981', '#f59e0b'], borderWidth: 0 }] }}
                  options={{ cutout: '72%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Barras tiempos */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm font-bold text-slate-800 mb-1">Días Promedio de Resolución</p>
          <p className="text-xs text-slate-400 mb-4">Por área</p>
          <div className="h-36">
            {tiempos.length > 0 && !loading ? (
              <Bar
                data={{ labels: tiempos.map(d => d.area), datasets: [{ label: 'Días', data: tiempos.map(d => parseFloat(d.dias_promedio ?? 0)), backgroundColor: '#6366f1' }] }}
                options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { font: { size: 10 } } }, x: { ticks: { font: { size: 9 } } } } }}
              />
            ) : <div className="h-full flex items-center justify-center text-slate-300 text-xs">Cargando…</div>}
          </div>
        </div>

        {/* Barras cumplimiento */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm font-bold text-slate-800 mb-1">Cumplimiento por Área</p>
          <p className="text-xs text-slate-400 mb-4">Resueltos vs Pendientes</p>
          <div className="h-36">
            {cumplimiento.length > 0 && !loading ? (
              <Bar
                data={{
                  labels: cumplimiento.map(d => d.area),
                  datasets: [
                    { label: 'Resueltos', data: cumplimiento.map(d => d.resueltos ?? 0), backgroundColor: '#10b981' },
                    { label: 'Pendientes', data: cumplimiento.map(d => d.pendientes ?? 0), backgroundColor: '#f59e0b' },
                  ]
                }}
                options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } }, scales: { x: { ticks: { font: { size: 9 } } } } }}
              />
            ) : <div className="h-full flex items-center justify-center text-slate-300 text-xs">Cargando…</div>}
          </div>
        </div>
      </div>

      {/* Tabla de cumplimiento por área */}
      {cumplimiento.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <Icon.Chart />
            <span className="text-sm font-bold text-slate-800">Detalle de Cumplimiento por Área</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                {['Área', 'Total', 'Resueltos', 'Pendientes', '% Cumplimiento'].map(h => (
                  <th key={h} className="px-5 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cumplimiento.map(d => {
                const pct = d.total > 0 ? Math.round((d.resueltos / d.total) * 100) : 0;
                return (
                  <tr key={d.area} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-800">{d.area}</td>
                    <td className="px-5 py-3 text-slate-600">{d.total}</td>
                    <td className="px-5 py-3 text-emerald-700 font-semibold">{d.resueltos}</td>
                    <td className="px-5 py-3 text-amber-700 font-semibold">{d.pendientes}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={`text-xs font-bold w-8 ${pct >= 80 ? 'text-emerald-700' : pct >= 50 ? 'text-amber-700' : 'text-red-700'}`}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Exportación */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <p className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Icon.Download /> Exportar Reportes</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { tipo: 'general',  label: 'Reporte General (CSV)',   Icon: Icon.Download, desc: 'Todos los expedientes' },
            { tipo: 'vencidos', label: 'SLA Vencidos (CSV)',       Icon: Icon.Alert,    desc: 'Solo expedientes con SLA excedido' },
          ].map(r => (
            <button key={r.tipo} onClick={() => downloadCSV(r.tipo)} disabled={loadingCSV}
              className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-left transition-all group disabled:opacity-50">
              <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-500 group-hover:text-blue-700 flex-shrink-0">
                <r.Icon />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">{r.label}</p>
                <p className="text-xs text-slate-400">{r.desc}</p>
              </div>
            </button>
          ))}
          <button
            onClick={() => window.open((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1') + '/dashboard/reports/pdf?tipo=general', '_blank')}
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-left transition-all group">
            <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-500 group-hover:text-blue-700 flex-shrink-0">
              <Icon.PDF />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">Reporte Tabular (PDF)</p>
              <p className="text-xs text-slate-400">Trazabilidad completa</p>
            </div>
          </button>
        </div>
      </div>

    </div>
  );
}
