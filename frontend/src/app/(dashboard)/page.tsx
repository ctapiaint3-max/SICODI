'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend
);

interface DashboardStats {
  kpis: {
    expedientes_activos: number;
    documentos_mensuales: number;
    tramites_pendientes: number;
    alertas_criticas: number;
  };
  semaforo: {
    color: 'VERDE' | 'AMARILLO' | 'ROJO';
    riesgo_porcentaje: number;
    mensaje: string;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isJefe, setIsJefe] = useState(false); // Demo toggle para mostrar UI de Nivel 2

  useEffect(() => {
    const fetchKpis = async () => {
       try {
         const res = await api.get('/dashboard/kpis');
         if (res.data?.data) {
           setStats(res.data.data);
         }
       } catch (error) {
         console.error('Error fetching KPIs', error);
       } finally {
         setLoading(false);
       }
    };
    fetchKpis();
  }, []);

  const getSemaforoBg = (color: string) => {
     if (color === 'VERDE') return 'bg-emerald-50 text-emerald-600 border-emerald-200';
     if (color === 'AMARILLO') return 'bg-amber-50 text-amber-600 border-amber-200';
     return 'bg-red-50 text-red-600 border-red-200';
  };

  const getPointerRotation = (percentage: number) => {
     // Gauge va de -90deg (0%) a 90deg (100%)
     const mapped = (percentage / 100) * 180 - 90;
     return Math.min(Math.max(mapped, -90), 90);
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-500 animate-pulse">Cargando métricas institucionales...</div>;
  }

  const data = stats || {
    kpis: { expedientes_activos: 0, documentos_mensuales: 0, tramites_pendientes: 0, alertas_criticas: 0 },
    semaforo: { color: 'VERDE', riesgo_porcentaje: 0, mensaje: 'Sin datos' }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              Dashboard Institucional 
              {isJefe && <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold border border-amber-300">MODO JEFATURA</span>}
           </h1>
           <p className="mt-1 text-sm text-slate-500">Resumen y estado del sistema en tiempo real.</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
              onClick={() => setIsJefe(!isJefe)} 
              className={`text-xs font-bold px-3 py-1.5 rounded-md border transition-colors ${isJefe ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
              title="Cambiar vista a Nivel 2 (Jefatura) / Operador"
           >
              Toggle Rol: {isJefe ? 'Jefe / Director' : 'Estándar'}
           </button>
           <button className="bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 transition-colors shadow-sm">
              Generar Reporte
           </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Card 1 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center hover:shadow-md transition-shadow">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
             </svg>
          </div>
          <div className="ml-5">
            <p className="text-sm font-medium text-slate-500 truncate">Total Expedientes</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{data.kpis.expedientes_activos}</h3>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center hover:shadow-md transition-shadow">
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
             </svg>
          </div>
          <div className="ml-5">
            <p className="text-sm font-medium text-slate-500 truncate">Docs. Mensuales</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{data.kpis.documentos_mensuales}</h3>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center hover:shadow-md transition-shadow">
          <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
          </div>
          <div className="ml-5">
            <p className="text-sm font-medium text-slate-500 truncate">Trámites en Cola</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{data.kpis.tramites_pendientes}</h3>
          </div>
        </div>

        {/* Card 4 - Semáforo Institucional */}
        <div className={`rounded-xl shadow-sm border p-6 flex items-center transition-colors ${getSemaforoBg(data.semaforo.color)}`}>
          <div className={`p-3 rounded-lg bg-white bg-opacity-50`}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
          </div>
          <div className="ml-5">
            <p className="text-sm font-medium opacity-80 truncate">Vencidos Críticos</p>
            <h3 className="text-2xl font-bold mt-1">{data.kpis.alertas_criticas}</h3>
          </div>
        </div>

      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
         {/* Bandeja Dinámica según Rol */}
         <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className={`px-6 py-5 border-b flex justify-between items-center ${isJefe ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
               <h3 className={`text-lg font-bold flex items-center gap-2 ${isJefe ? 'text-amber-900' : 'text-slate-900'}`}>
                  {isJefe ? (
                      <><svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" /></svg> Bandeja de Jefatura (Derivación)</>
                  ) : 'Actividad Reciente'}
               </h3>
               {!isJefe && <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">Ver todo</button>}
            </div>
            <div className="p-0">
               {isJefe ? (
                 <ul className="divide-y divide-slate-100">
                   <li className="p-5 hover:bg-amber-50/30 transition-colors">
                     <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                           <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                           <p className="text-sm font-bold text-slate-800">EXP-2026-NUEVO-DOC</p>
                        </div>
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Ingreso Mesa</span>
                     </div>
                     <p className="text-xs text-slate-600 mb-3 truncate">Oficio enviado por INCOGMAR. Requiere análisis y derivación a área responsable.</p>
                     <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-mono text-slate-400">Hace 10 min. (Pendiente de Apertura)</span>
                        <button className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold uppercase tracking-wide rounded shadow-sm transition-colors flex items-center gap-1">
                           <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>
                           Abrir y Derivar a Área
                        </button>
                     </div>
                   </li>
                   <li className="p-5 hover:bg-amber-50/30 transition-colors">
                     <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                           <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                           <p className="text-sm font-bold text-slate-800">EXP-2026-6731</p>
                        </div>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Derivado</span>
                     </div>
                     <p className="text-xs text-slate-600 mb-2 truncate">Atendido por Área Operativa (Sistemas). Resolución firmada.</p>
                     <p className="text-[10px] font-mono text-slate-400">Hace 2 horas.</p>
                   </li>
                 </ul>
               ) : (
                 <ul className="p-6 space-y-4">
                   <li className="flex gap-4">
                     <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                     <div>
                       <p className="text-sm text-slate-800 font-medium">Expediente EXP-2026-00125 Creado</p>
                       <p className="text-xs text-slate-500 mt-0.5">Hace 5 minutos por Ventanilla Única</p>
                     </div>
                   </li>
                   <li className="flex gap-4">
                     <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500"></div>
                     <div>
                       <p className="text-sm text-slate-800 font-medium">Oficio firmado: Resolución 045</p>
                       <p className="text-xs text-slate-500 mt-0.5">Hace 45 minutos por Jefatura</p>
                     </div>
                   </li>
                   <li className="flex gap-4">
                     <div className="w-2 h-2 mt-2 rounded-full bg-amber-500"></div>
                     <div>
                       <p className="text-sm text-slate-800 font-medium">Asignación de Análisis Técnico</p>
                       <p className="text-xs text-slate-500 mt-0.5">Hace 2 horas por Dirección Legal</p>
                     </div>
                   </li>
                 </ul>
               )}
            </div>
         </div>

          {/* Distribution Chart Placeholder */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center items-center min-h-[300px] relative overflow-hidden">
             <div className="absolute top-4 left-4 z-10 w-full">
                <h3 className="font-bold text-slate-800">Semáforo de Cumplimiento Institucional (SLA)</h3>
                <p className="text-xs text-slate-500 mt-1">{data.semaforo.mensaje}</p>
             </div>
             
             <div className="mt-12 w-full h-[250px] flex items-center justify-center relative">
                 <Doughnut 
                    data={{
                        labels: ['En Plazo (Verde)', 'Próximos a Vencer (Amarillo)', 'Vencidos Críticos (Rojo)'],
                        datasets: [{
                            data: [75, 15, data.kpis.alertas_criticas || 10],
                            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                            borderWidth: 0,
                        }]
                    }}
                    options={{
                        cutout: '75%',
                        plugins: {
                            legend: { display: false }
                        }
                    }}
                 />
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <p className="text-3xl font-black text-slate-800">{data.semaforo.riesgo_porcentaje}%</p>
                     <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-1">Nivel Riesgo</p>
                 </div>
             </div>
             
             <div className="w-full flex justify-center gap-4 mt-6">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span><span className="text-[10px] text-slate-600 font-bold">Verde (75%)</span></div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span><span className="text-[10px] text-slate-600 font-bold">Amarillo (15%)</span></div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500"></span><span className="text-[10px] text-slate-600 font-bold">Rojo (10%)</span></div>
             </div>
          </div>
       </div>

       {/* Tendencia LineChart */}
       <div className="grid grid-cols-1 mt-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-6">Volumetría Semanal de Trámites vs Derivaciones</h3>
              <div className="h-[300px] w-full">
                 <Line 
                    options={{ responsive: true, maintainAspectRatio: false }}
                    data={{
                        labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
                        datasets: [
                            {
                                label: 'Ingresos por Mesa',
                                data: [65, 59, 80, 81, 56],
                                borderColor: '#3b82f6',
                                backgroundColor: '#93c5fd',
                                tension: 0.4
                            },
                            {
                                label: 'Trámites Resueltos (Firmados)',
                                data: [28, 48, 40, 79, 86],
                                borderColor: '#10b981',
                                backgroundColor: '#6ee7b7',
                                tension: 0.4
                            }
                        ]
                    }}
                 />
              </div>
          </div>
       </div>
    </div>
  );
}
