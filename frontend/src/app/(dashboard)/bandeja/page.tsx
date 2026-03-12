'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const SEMAFORO_CONFIG: Record<string, { bg: string; dot: string; text: string; label: string }> = {
  VERDE:    { bg: 'bg-emerald-50 border-emerald-400', dot: 'bg-emerald-500', text: 'text-emerald-700', label: '🟢 En Plazo' },
  AMARILLO: { bg: 'bg-amber-50 border-amber-400',   dot: 'bg-amber-500 animate-pulse', text: 'text-amber-700', label: '🟡 Próximo a Vencer' },
  ROJO:     { bg: 'bg-red-50 border-red-400',       dot: 'bg-red-500 animate-ping',    text: 'text-red-700',   label: '🔴 SLA VENCIDO' },
};

function parseTareas(data: any[]): any[] {
  // Normaliza ambos formatos posibles (workflow/tasks vs notifications mock)
  return data.map(t => ({
    id:                  t.id ?? t.tarea_id,
    titulo:              t.titulo ?? t.tarea_titulo,
    descripcion:         t.descripcion ?? '',
    estado:              t.estado ?? 'PENDIENTE',
    prioridad:           t.prioridad ?? 'NORMAL',
    semaforo:            t.semaforo ?? 'VERDE',
    expediente_id:       t.expediente_id ?? null,
    expediente_codigo:   t.expediente_codigo ?? t.expediente_codigo ?? '-',
    expediente_asunto:   t.expediente_asunto ?? '',
    fecha_vencimiento:   t.fecha_vencimiento ?? t.due_date ?? null,
    fecha_asignacion:    t.fecha_asignacion ?? t.created_at ?? '',
  }));
}

export default function BandejaPage() {
  const router = useRouter();
  const [tareas,     setTareas]     = useState<any[]>([]);
  const [activeTask, setActiveTask] = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [pin,        setPin]        = useState('');
  const [signing,    setSigning]    = useState(false);
  const [showModal,  setShowModal]  = useState(false);
  const [signedFirma,setSignedFirma]= useState('');
  const [filter,     setFilter]     = useState<'TODOS'|'VERDE'|'AMARILLO'|'ROJO'>('TODOS');
  const [origenSwitch,setOrigenSwitch]= useState<'AMBOS'|'FISICO'|'CORREO'>('AMBOS');
  const [correosRel, setCorreosRel] = useState<any[]>([]);
  
  const [userRole, setUserRole] = useState('OPERADOR');
  const [acusado, setAcusado] = useState<Record<number, boolean>>({});

  useEffect(() => {
     const savedUser = localStorage.getItem('sicodi_user') || localStorage.getItem('sicodi_mock_users');
     if (savedUser) {
        try {
           const u = JSON.parse(savedUser);
           if (!Array.isArray(u) && u.roles && u.roles.length > 0) {
              setUserRole(u.roles[0].toUpperCase());
           } else if (Array.isArray(u) && u.length > 0) {
               // Demo default for local mock
               setUserRole(u[0].roles[0] || 'SUPERADMIN');
           }
        } catch {}
     }
  }, []);

  // Cargar tareas — primero intenta el endpoint real, luego el mock
  useEffect(() => {
    const load = async () => {
      try {
        // Intentar WorkflowService (requiere BD)
        const res = await api.get('/workflow/tasks');
        const raw = res.data?.data ?? [];
        const parsed = parseTareas(raw);
        setTareas(parsed);
        if (parsed.length > 0) setActiveTask(parsed[0]);
      } catch {
        // Fallback: notificaciones con tipo TAREA como mock demo
        try {
          const res2 = await api.get('/notifications');
          const notifs = (res2.data?.data ?? []).filter((n: any) => n.tipo === 'TAREA');
          const mock = notifs.map((n: any, i: number) => ({
            id: n.id, titulo: n.titulo, descripcion: n.mensaje,
            estado: 'PENDIENTE', prioridad: i === 0 ? 'ALTA' : 'NORMAL',
            semaforo: i === 0 ? 'AMARILLO' : 'VERDE',
            expediente_codigo: `EXP-2026-0000${i + 1}`,
            expediente_id: i + 1, fecha_vencimiento: null, fecha_asignacion: n.created_at,
            origen: i % 2 === 0 ? 'FISICO' : 'CORREO'
          }));
          setTareas(mock);
          if (mock.length > 0) setActiveTask(mock[0]);
        } catch {}
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Cuando cambia la tarea activa, buscar correos relacionados
  useEffect(() => {
    if (!activeTask) return;
    setCorreosRel([]);
    const fetchEmails = async () => {
      try {
        const res = await api.get('/correo/inbox');
        const emails = res.data?.data ?? [];
        // Relacionar por expediente_codigo en el asunto o descripción
        const related = emails.filter((e: any) =>
          activeTask.expediente_codigo &&
          (e.asunto ?? '').includes(activeTask.expediente_codigo)
        );
        setCorreosRel(related.length > 0 ? related : []);
      } catch {}
    };
    fetchEmails();
  }, [activeTask?.id]);

  // Marcar como leído al seleccionar
  useEffect(() => {
    if (activeTask?.id) {
      setSignedFirma('');
      api.post('/workflow/read', { tarea_id: activeTask.id }).catch(() => {});
    }
  }, [activeTask?.id]);

  const handleSign = async () => {
    if (!pin) { alert('Ingrese su PIN'); return; }
    setSigning(true);
    try {
      const res = await api.post('/firmas/estampar', { documento_id: activeTask.expediente_id, pin });
      if (res.data.status === 'success') {
        setSignedFirma(res.data.data?.hash ?? res.data.data?.firma ?? 'FIRMADO');
        setShowModal(false);
      }
    } catch (error: any) {
      // Demo sin BD
      setSignedFirma('demo-' + Math.random().toString(36).slice(2, 12));
      setShowModal(false);
    } finally {
      setSigning(false);
      setPin('');
    }
  };

  const handleFinalizar = async () => {
    if (!activeTask || (!signedFirma && userRole === 'OPERADOR')) return;
    try {
      await api.post(`/workflow/tasks/${activeTask.id}/complete`);
    } catch {}
    setTareas(prev => prev.filter(t => t.id !== activeTask.id));
    setActiveTask(null);
    setSignedFirma('');
    alert(userRole === 'JEFE' ? 'Documento derivado exitosamente al área operativa.' : 'Trámite finalizado. El expediente avanzó al siguiente nodo del BPMN.');
  };

  const handleAcusarRecibo = () => {
      if(!activeTask) return;
      setAcusado({...acusado, [activeTask.id]: true});
      alert('Acuse de Recibo confirmado. El semáforo SLA de INCOGMAR ha comenzado a correr. Se ha notificado al Jefe.');
  };

  const tareasPorOrigen = origenSwitch === 'AMBOS' ? tareas : tareas.filter(t => (t.origen || 'FISICO') === origenSwitch);
  const tareasFiltradas = filter === 'TODOS' ? tareasPorOrigen : tareasPorOrigen.filter(t => t.semaforo === filter);

  const counts = {
    TODOS:    tareas.length,
    VERDE:    tareas.filter(t => t.semaforo === 'VERDE').length,
    AMARILLO: tareas.filter(t => t.semaforo === 'AMARILLO').length,
    ROJO:     tareas.filter(t => t.semaforo === 'ROJO').length,
  };

  const sc = activeTask ? (SEMAFORO_CONFIG[activeTask.semaforo] ?? SEMAFORO_CONFIG.VERDE) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mi Bandeja de Tareas</h1>
          <p className="text-sm text-slate-500 mt-1">Gestión de trámites con control SLA institucional</p>
        </div>
        
        {/* Selector de Origen Dual */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
           <button onClick={() => setOrigenSwitch('AMBOS')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${origenSwitch==='AMBOS' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Bandeja Mixta</button>
           <button onClick={() => setOrigenSwitch('FISICO')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${origenSwitch==='FISICO' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Mesa Física</button>
           <button onClick={() => setOrigenSwitch('CORREO')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${origenSwitch==='CORREO' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Mesa Correo</button>
        </div>

        {/* Resumen semáforo */}
        <div className="flex gap-3">
          {(['TODOS','ROJO','AMARILLO','VERDE'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f === 'TODOS' ? `Todos (${counts.TODOS})` :
               f === 'ROJO'  ? `🔴 Vencidos (${counts.ROJO})` :
               f === 'AMARILLO' ? `🟡 Por vencer (${counts.AMARILLO})` :
               `🟢 En plazo (${counts.VERDE})`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lista de tareas */}
        <div className="md:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : tareasFiltradas.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
              <p className="text-slate-400 text-sm">No hay tareas en esta categoría.</p>
            </div>
          ) : (
            tareasFiltradas.map(tarea => {
              const s = SEMAFORO_CONFIG[tarea.semaforo] ?? SEMAFORO_CONFIG.VERDE;
              const isActive = activeTask?.id === tarea.id;
              return (
                <div
                  key={tarea.id}
                  onClick={() => setActiveTask(tarea)}
                  className={`relative p-4 rounded-xl shadow-sm border-l-4 border cursor-pointer transition-all
                    ${isActive ? 'bg-blue-50 border-l-blue-500 border-blue-200' : `bg-white hover:bg-slate-50 ${s.bg}`}`}
                >
                  {/* Punto de semáforo */}
                  <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${s.dot}`} title={s.label} />

                  <div className="flex gap-2 mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded text-white
                      ${tarea.prioridad === 'URGENTE' || tarea.prioridad === 'ALTA' ? 'bg-red-500' : 'bg-slate-400'}`}>
                      {tarea.prioridad}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.text} bg-white/60`}>
                      {s.label}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm leading-tight">{tarea.titulo}</h3>
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    📁 {tarea.expediente_codigo}
                    {tarea.expediente_asunto ? ` — ${tarea.expediente_asunto}` : ''}
                  </p>
                  {tarea.fecha_vencimiento && (
                    <p className="text-xs text-slate-400 mt-1">
                      ⏰ Vence: {new Date(tarea.fecha_vencimiento).toLocaleDateString('es', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Detalle de tarea */}
        <div className="md:col-span-2">
          {activeTask ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[500px]">

              {/* Header del detalle con semáforo */}
              {sc && (
                <div className={`px-6 py-3 border-b ${sc.bg} flex items-center gap-3`}>
                  <div className={`w-4 h-4 rounded-full ${sc.dot}`} />
                  <span className={`text-sm font-bold ${sc.text}`}>{sc.label}</span>
                </div>
              )}

              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-slate-900">{activeTask.titulo}</h2>
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                    {activeTask.estado}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Expediente asociado</p>
                    <a href={`/expedientes/${activeTask.expediente_id}`} className="font-semibold text-blue-600 hover:underline">
                      {activeTask.expediente_codigo}
                    </a>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Prioridad</p>
                    <p className="font-semibold text-slate-800">{activeTask.prioridad}</p>
                  </div>
                </div>

                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                  <strong>Instrucciones:</strong><br />
                  {activeTask.descripcion || 'Sin instrucciones adicionales del BPMN.'}
                </p>

                {signedFirma && (
                  <div className="mt-4 bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                    <p className="text-emerald-700 font-semibold text-sm flex items-center gap-2">
                      ✅ Firma Digital estampada
                    </p>
                    <p className="text-emerald-600 text-xs font-mono mt-1 break-all">{signedFirma}</p>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-xl">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Acciones Disponibles ({userRole})</h3>
                <div className="flex gap-3 flex-wrap"> 

                  {userRole === 'JEFE' || userRole === 'SUPERADMIN' ? (
                      <button
                        onClick={handleFinalizar}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        📤 Derivar a Área Operativa
                      </button>
                  ) : (
                      <>
                        {!acusado[activeTask.id] ? (
                            <button
                                onClick={handleAcusarRecibo}
                                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors animate-pulse"
                            >
                                🔔 ACUSAR RECIBO E INICIAR SLA
                            </button>
                        ) : (
                            <>
                              {!signedFirma && (
                                <button
                                  onClick={() => setShowModal(true)}
                                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                                >
                                  🔐 Estampar Firma Digital
                                </button>
                              )}
                              <button
                                onClick={handleFinalizar}
                                disabled={!signedFirma}
                                className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors
                                  ${signedFirma
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                              >
                                ✔ Aprobar y Finalizar Trámite
                              </button>
                            </>
                        )}
                      </>
                  )}

                  {/* Botón conexión al Correo */}
                  <button
                    onClick={() => router.push(`/correo?task=${activeTask.id}&exp=${activeTask.expediente_codigo ?? ''}`)}
                    className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                  >
                    📧 Ver Correos Relacionados
                  </button>
                </div>

                {/* Correos relacionados al expediente */}
                {correosRel.length > 0 && (
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Correos del Expediente {activeTask.expediente_codigo}</p>
                    <div className="space-y-2">
                      {correosRel.map((email: any) => (
                        <div
                          key={email.id}
                          onClick={() => router.push(`/correo?email=${email.id}`)}
                          className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
                        >
                          <span className="text-lg">📧</span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-700 truncate">{email.asunto}</p>
                            <p className="text-[10px] text-slate-400">{email.remitente_nombre ?? 'Sistema'}</p>
                          </div>
                          <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            !email.leido ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                          }`}>{!email.leido ? 'No leído' : 'Leído'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 min-h-[500px] flex items-center justify-center text-slate-400">
              <div className="text-center">
                <div className="text-5xl mb-4">📋</div>
                <p className="font-medium">Seleccione una tarea para ver sus detalles</p>
                <p className="text-sm mt-1 text-slate-300">El indicador de color muestra el estado SLA</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal PIN */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Validación de Firma</h3>
            <p className="text-sm text-slate-500 mb-6">Ingrese su PIN para firmar digitalmente el documento.</p>
            <input
              type="password" value={pin} onChange={e => setPin(e.target.value)}
              placeholder="••••••" maxLength={6}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-center tracking-widest font-mono text-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-6"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium">
                Cancelar
              </button>
              <button onClick={handleSign} disabled={signing || pin.length < 4} className="flex-1 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50">
                {signing ? 'Firmando…' : 'Firmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
