'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function ExpedienteDetallePage() {
  const params = useParams();
  const router = useRouter();
  const [expediente, setExpediente] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Estado para Flujo Nivel 3 (INCOGMAR)
  const [isAbierto, setIsAbierto] = useState(false);
  const [fechaApertura, setFechaApertura] = useState('');

  const handleAbrirTramite = () => {
     setIsAbierto(true);
     setFechaApertura(new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }));
     // Notificar al Jefe vía API y empezar Reloj SLA
     api.post(`/workflow/iniciar/${params.id}`, { tipo: 'apertura_nivel3' }).catch(() => {});
  };

  // Estados BPMN permitidos y su flujo visual para el Timeline
  const bpmnFlow = ['INGRESADO', 'EN_PROCESO', 'ANALISIS_TECNICO', 'FIRMADO', 'RESUELTO', 'ARCHIVADO'];

  useEffect(() => {
    const fetchDetalle = async () => {
      try {
        const res = await api.get(`/expedientes/${params.id}`);
        if (res.data.status === 'success') {
          setExpediente(res.data.data);
        }
      } catch (error) {
        // Fallback demo
        setExpediente({
          codigo: 'EXP-2026-00001', estado: 'FIRMADO', prioridad: 'ALTA', asunto: 'Solicitud de Viáticos - Misión Oficial',
          fecha_apertura: '2026-03-01', creador_nombre: 'Administrador Sistema',
          registro_origen: { clasificacion: 'CONFIDENCIAL', mando_que_gira: 'Mando Activo 1', tramite: 'Aprobación urgente requerida.' },
          documentos: [{ id: 1, nombre_archivo: 'Resolucion_045.pdf', hash_sha256: 'a2b3c4d5e6...', firma_digital: 'VALIDA' }],
          historial: [
            { created_at: '2026-03-01T10:00:00', accion: 'Creación', detalles: 'Expediente creado desde correspondencia.' },
            { created_at: '2026-03-02T11:30:00', accion: 'Transición a EN_PROCESO', detalles: 'Análisis iniciado por mesa de entrada.' },
            { created_at: '2026-03-05T09:15:00', accion: 'Firma Digital', detalles: 'Documento Resolucion_045 firmado por el Director.' }
          ]
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (params.id) fetchDetalle();
  }, [params.id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando expediente...</div>;
  if (!expediente) return <div className="p-8 text-center text-red-500">Expediente no encontrado.</div>;

  const getStepStatus = (step: string) => {
    const currentIndex = bpmnFlow.indexOf(expediente.estado);
    const stepIndex = bpmnFlow.indexOf(step);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-3 mb-2">
              <button onClick={() => router.back()} className="text-slate-400 hover:text-blue-600 transition-colors bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
              </button>
              <h1 className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{expediente.codigo}</h1>
              <span className={`px-2.5 py-1 text-xs font-bold rounded-md bg-blue-100 text-blue-800 border border-blue-200 shadow-sm`}>{expediente.estado.replace('_', ' ')}</span>
              {expediente.prioridad === 'ALTA' && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
          </div>
          <p className="text-sm font-medium text-slate-700 mt-2">{expediente.asunto}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
             <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> Ingreso: {expediente.fecha_apertura}</span>
             <span className="flex items-center gap-1 font-semibold text-amber-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> Prioridad {expediente.prioridad}</span>
          </div>
        </div>
        
        {/* INCOGMAR SLA Trigger Nivel 3 */}
        <div className="text-right flex flex-col items-end">
           {!isAbierto ? (
               <button 
                  onClick={handleAbrirTramite}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md hover:shadow-lg focus:ring-4 focus:ring-orange-200 transition-all flex items-center gap-2"
               >
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                   Acusar y Abrir Sobre
               </button>
           ) : (
               <div className="bg-slate-900 border border-slate-700 text-white px-6 py-3 rounded-xl shadow-inner flex items-center gap-5">
                   <div>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Acuse Generado Nivel 3</p>
                       <p className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                          Abierto: {fechaApertura}
                       </p>
                   </div>
                   <div className="border-l border-slate-700 pl-5">
                       <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Tiempo SLA</p>
                       {/* Timer Visual (Mock countdown) */}
                       <p className="text-xl font-black font-mono tracking-widest text-white drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">47:59<span className="text-sm opacity-50 ml-1">HRS</span></p>
                   </div>
               </div>
           )}
        </div>
      </div>

      {/* BPMN Progress Bar */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">Flujo de Proceso (BPMN)</h3>
         <div className="relative">
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-slate-100">
               <div style={{ width: `${(Math.max(0, bpmnFlow.indexOf(expediente.estado)) / (bpmnFlow.length - 1)) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"></div>
            </div>
            <div className="flex justify-between w-full text-xs font-medium text-slate-500 relative">
               {bpmnFlow.map((step, idx) => {
                  const status = getStepStatus(step);
                  return (
                     <div key={step} className={`flex flex-col items-center ${status === 'current' ? 'text-blue-700 font-bold scale-110 transform transition-transform' : status === 'completed' ? 'text-blue-500' : 'text-slate-400'}`}>
                        <div className={`w-4 h-4 rounded-full mb-1 border-2 ${status === 'completed' ? 'bg-blue-500 border-blue-500' : status === 'current' ? 'bg-white border-blue-600 ring-4 ring-blue-100' : 'bg-white border-slate-300'}`}></div>
                        <span className="mt-2 text-[10px] md:text-xs text-center max-w-[80px] leading-tight">{step.replace('_', ' ')}</span>
                     </div>
                  );
               })}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Información de Origen
                    </h3>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-6 text-sm">
                      <div>
                          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">Clasificación</p>
                          <p className="text-slate-800 font-medium inline-block px-2.5 py-1 bg-slate-100 rounded text-xs">{expediente.registro_origen?.clasificacion || 'INSTITUCIONAL'}</p>
                      </div>
                      <div>
                          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">Mando que Gira</p>
                          <p className="text-slate-800 font-medium">{expediente.registro_origen?.mando_que_gira || 'S/N'}</p>
                      </div>
                      <div className="col-span-2">
                          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">Trámite e Instrucciones</p>
                          <p className="text-slate-800 bg-amber-50/50 p-4 rounded-lg border border-amber-100/50 leading-relaxed min-h-[5rem]">{expediente.registro_origen?.tramite || expediente.descripcion || 'Sin instrucciones adicionales provistas.'}</p>
                      </div>
                  </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                      Documentos Anexos ({expediente.documentos?.length || 0})
                    </h3>
                    <button className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded transition">Añadir Físico</button>
                  </div>
                  <div className="p-0">
                    {expediente.documentos && expediente.documentos.length > 0 ? (
                        <ul className="divide-y divide-slate-100">
                            {expediente.documentos.map((doc: any) => (
                                <li key={doc.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors group cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-red-100 p-2.5 rounded-lg text-red-600 group-hover:bg-red-200 transition-colors">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                          </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{doc.nombre_archivo}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                              {doc.firma_digital ? (
                                                <span className="inline-flex items-center gap-1 bg-emerald-100/50 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-emerald-200">
                                                  <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                  Firmado Digitalmente
                                                </span>
                                              ) : (
                                                <span className="text-[10px] text-slate-400 font-mono">SHA-256: {doc.hash_sha256}</span>
                                              )}
                                            </div>
                                        </div>
                                    </div>
                                    <button className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-blue-600 transition-all rounded-full hover:bg-blue-50" title="Ver Documento">
                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-slate-500 italic p-6 text-center">No hay documentos anexos físicos en este expediente.</p>}
                  </div>
              </div>
          </div>

          <div className="space-y-6">
             {/* Timeline (Trazabilidad) */}
             <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 text-slate-300">
                  <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest border-b border-slate-700 pb-3 flex items-center justify-between">
                    Trazabilidad
                    <span className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">AUDIT LOG</span>
                  </h3>
                  <div className="relative border-l-2 border-slate-700 ml-3 space-y-8 pb-2">
                      {expediente.historial && expediente.historial.map((hist: any, idx: number) => {
                          const isNew = idx === expediente.historial.length - 1;
                          return (
                            <div key={idx} className="relative pl-6">
                                <span className={`absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-4 border-slate-900 ${isNew ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-slate-600'}`}></span>
                                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                                  <p className="text-[10px] text-slate-400 font-mono mb-1 flex items-center gap-2">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {new Date(hist.created_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                                  </p>
                                  <p className={`text-sm font-bold ${isNew ? 'text-white' : 'text-slate-200'}`}>{hist.accion}</p>
                                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{hist.detalles}</p>
                                </div>
                            </div>
                          );
                      })}
                      {(!expediente.historial || expediente.historial.length === 0) && (
                          <p className="pl-6 text-sm text-slate-500 italic">Sin trazas registradas en blockchain legal.</p>
                      )}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
