'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';

interface BpmnNode {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
}

export default function ConfiguracionBPMNPage() {
  const [nodes, setNodes] = useState<BpmnNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/config').then(res => {
       if (res.data?.data?.bpmn_diagrama_json) {
         try {
           setNodes(JSON.parse(res.data.data.bpmn_diagrama_json));
         } catch { /* ignore parse error */ }
       }
       if (nodes.length === 0 && !res.data?.data?.bpmn_diagrama_json) {
         setNodes([
           { id: 'start', type: 'START_EVENT', label: 'Inicio', x: 50, y: 150 },
           { id: 'task1', type: 'USER_TASK', label: 'Análisis Mesa', x: 200, y: 150 },
           { id: 'gw1', type: 'EXCLUSIVE_GATEWAY', label: '¿Requiere Técnica?', x: 400, y: 150 },
           { id: 'task2', type: 'USER_TASK', label: 'Revisión Técnica', x: 550, y: 50 },
           { id: 'task3', type: 'SERVICE_TASK', label: 'Aprobación / Firma', x: 550, y: 250 },
           { id: 'end', type: 'END_EVENT', label: 'Archivo', x: 800, y: 150 },
         ]);
       }
       setLoading(false);
    }).catch(() => {
       setNodes([
         { id: 'start', type: 'START_EVENT', label: 'Inicio', x: 50, y: 150 },
         { id: 'task1', type: 'USER_TASK', label: 'Análisis Mesa', x: 200, y: 150 },
         { id: 'gw1', type: 'EXCLUSIVE_GATEWAY', label: '¿Requiere Técnica?', x: 400, y: 150 },
         { id: 'task2', type: 'USER_TASK', label: 'Revisión Técnica', x: 550, y: 50 },
         { id: 'task3', type: 'SERVICE_TASK', label: 'Aprobación / Firma', x: 550, y: 250 },
         { id: 'end', type: 'END_EVENT', label: 'Archivo', x: 800, y: 150 },
       ]);
       setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveDiagram = async () => {
    setSaving(true);
    try {
      await api.put('/config', { bpmn_diagrama_json: JSON.stringify(nodes) });
      alert('Diagrama BPMN guardado y persistido en el Backend institucional.');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error al persistir el diagrama.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Motor de Procesos (BPMN)</h1>
          <p className="text-sm text-slate-500 mt-1">Configuración gráfica de los flujos de trabajo institucionales.</p>
        </div>
        <button 
          onClick={handleSaveDiagram}
          disabled={saving || loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 text-sm font-medium rounded-md shadow-sm transition flex gap-2 items-center"
        >
            {saving ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            )}
            {saving ? 'Guardando...' : 'Guardar Diagrama'}
        </button>
      </div>

      <div className="flex h-[600px] gap-6">
         {/* Paleta de Nodos */}
         <div className="w-64 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 text-sm font-bold text-slate-800">Elementos BPMN</div>
            <div className="p-4 space-y-4 overflow-y-auto">
               <div className="border hover:border-blue-500 p-3 rounded cursor-move bg-emerald-50 text-emerald-800 flex items-center justify-center font-semibold text-xs transition">START_EVENT</div>
               <div className="border hover:border-blue-500 p-3 rounded cursor-move bg-slate-100 text-slate-800 flex items-center justify-center font-semibold text-xs transition shadow-sm">USER_TASK</div>
               <div className="border hover:border-blue-500 p-3 rounded cursor-move bg-amber-50 text-amber-800 flex items-center justify-center font-semibold text-xs transition shadow-sm">SERVICE_TASK</div>
               <div className="border hover:border-blue-500 p-3 rounded cursor-move bg-blue-50 text-blue-800 whitespace-nowrap flex items-center justify-center text-[10px] font-bold rotate-45 w-16 h-16 mx-auto mt-4 mb-4 transition">GATEWAY</div>
               <div className="border hover:border-blue-500 p-3 rounded cursor-move bg-red-100/50 text-red-800 border-red-300 border-4 border-double flex items-center justify-center font-bold text-xs transition">END_EVENT</div>
            </div>
         </div>

         {/* Lienzo Visual (Canvas Simulador) */}
         <div className="flex-1 bg-slate-50 rounded-xl shadow-inner border border-slate-300 relative overflow-hidden" 
              style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
             
             {/* Simulación de Canvas SVG para Conexiones */}
             <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-slate-400 stroke-2 fill-none">
                <path d="M 90 170 L 200 170" markerEnd="url(#arrowhead)" />
                <path d="M 320 170 L 400 170" markerEnd="url(#arrowhead)" />
                <path d="M 440 170 L 490 170 L 490 70 L 550 70" markerEnd="url(#arrowhead)" />
                <path d="M 440 170 L 490 170 L 490 270 L 550 270" markerEnd="url(#arrowhead)" />
                <path d="M 670 70 L 730 70 L 730 170 L 800 170" markerEnd="url(#arrowhead)" />
                <path d="M 670 270 L 730 270 L 730 170 L 800 170" markerEnd="url(#arrowhead)" />
                <defs>
                   <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                     <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                   </marker>
                </defs>
             </svg>

             {/* Nodos */}
             {nodes.map(node => (
                <div 
                   key={node.id} 
                   className={`absolute flex items-center justify-center shadow-md border-2 border-slate-700 bg-white cursor-pointer ring-slate-400 hover:ring-2
                      ${node.type === 'START_EVENT' ? 'w-10 h-10 rounded-full border-4 border-emerald-500 bg-emerald-50 text-[8px] font-bold text-emerald-700' : ''}
                      ${node.type === 'END_EVENT' ? 'w-10 h-10 rounded-full border-4 border-double border-red-600 bg-red-50 text-[8px] font-bold text-red-700' : ''}
                      ${node.type === 'EXCLUSIVE_GATEWAY' ? 'w-12 h-12 transform rotate-45 border-amber-500 bg-amber-50' : ''}
                      ${node.type.includes('TASK') ? 'w-32 h-16 rounded border-blue-600 bg-blue-50 text-blue-900 text-xs font-bold text-center px-2' : ''}
                   `}
                   style={{ left: node.x, top: node.y }}
                   title={node.type}
                >
                   <span className={node.type === 'EXCLUSIVE_GATEWAY' ? 'transform -rotate-45 block text-[8px] font-bold text-amber-700 mt-5' : ''}>
                      {node.type === 'START_EVENT' || node.type === 'END_EVENT' ? '' : node.label}
                   </span>
                </div>
             ))}

             {/* Propiedades Overlay */}
             <div className="absolute right-4 top-4 w-64 bg-white/95 backdrop-blur shadow-lg border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">Propiedades del Nodo</h3>
                <div className="space-y-3">
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">ID Interno</label>
                     <input type="text" readOnly value="task2" className="w-full text-xs p-1.5 bg-slate-100 border border-slate-200 rounded text-slate-600" />
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Tipo Nodo</label>
                     <select className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded text-slate-800 font-medium">
                        <option>USER_TASK</option>
                        <option>SERVICE_TASK</option>
                     </select>
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Área Asignada (SLA)</label>
                     <select className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded text-slate-800">
                        <option>Tecnología Informática</option>
                        <option>Dirección General</option>
                        <option>Departamento Jurídico</option>
                     </select>
                   </div>
                </div>
             </div>
         </div>
      </div>
    </div>
  );
}
