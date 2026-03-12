'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Expediente {
  id: number;
  codigo: string;
  asunto: string;
  estado: string;
  prioridad: string;
  fecha_apertura: string;
  created_at: string;
  creador_nombre: string;
}

export default function ExpedientesPage() {
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newExp, setNewExp] = useState({ asunto: '', descripcion: '', prioridad: 'NORMAL', area_id: 1 });

  const fetchExpedientes = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/expedientes?search=${search}&estado=${estadoFilter}`);
      if (res.data.status === 'success') setExpedientes(res.data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpedientes(); }, [search, estadoFilter]);

  const handleCreate = async () => {
    if (!newExp.asunto.trim()) { alert('El asunto es obligatorio'); return; }
    setSaving(true);
    try {
      await api.post('/expedientes', newExp);
      setShowModal(false);
      setNewExp({ asunto: '', descripcion: '', prioridad: 'NORMAL', area_id: 1 });
      fetchExpedientes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al crear expediente');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (id: number) => {
    if (!confirm('¿Archivar este expediente?')) return;
    try {
      await api.delete(`/expedientes/${id}`);
      fetchExpedientes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al archivar');
    }
  };

  const getStatusColor = (estado: string) => {
    const map: Record<string, string> = {
      'INGRESADO': 'bg-blue-100 text-blue-800',
      'EN_PROCESO': 'bg-amber-100 text-amber-800',
      'RESUELTO': 'bg-emerald-100 text-emerald-800',
      'ARCHIVADO': 'bg-slate-100 text-slate-500',
    };
    return map[estado] || 'bg-slate-100 text-slate-800';
  };

  const getPriorityDot = (p: string) => {
    if (p === 'ALTA' || p === 'URGENTE') return 'bg-red-500';
    if (p === 'NORMAL') return 'bg-amber-400';
    return 'bg-emerald-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Expedientes</h1>
          <p className="text-sm text-slate-500 mt-1">Administre los expedientes institucionales. {expedientes.length} registros.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Expediente
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código o asunto..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-md bg-white text-sm text-slate-700"
          >
            <option value="">Todos los estados</option>
            <option value="INGRESADO">Ingresado</option>
            <option value="EN_PROCESO">En Proceso</option>
            <option value="RESUELTO">Resuelto</option>
            <option value="ARCHIVADO">Archivado</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Asunto</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Apertura</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Prioridad</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">SLA</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-400">Cargando expedientes...</td></tr>
              ) : expedientes.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-400">No se encontraron expedientes.</td></tr>
              ) : (
                expedientes.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-700 font-mono">{exp.codigo}</td>
                    <td className="px-6 py-4 text-sm text-slate-700 max-w-xs truncate" title={exp.asunto}>{exp.asunto}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {exp.fecha_apertura || new Date(exp.created_at).toLocaleDateString('es-ES')}
                      <div className="text-xs text-slate-400">{exp.creador_nombre || 'Sistema'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${getPriorityDot(exp.prioridad)}`}></div>
                        <span className="text-xs text-slate-600">{exp.prioridad}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(exp.estado)}`}>
                        {exp.estado.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex justify-center mt-2.5">
                       <div 
                         title={exp.prioridad === 'URGENTE' ? 'Tiempo Límite Excedido (>100%)' : (exp.prioridad === 'ALTA' ? 'Alerta Prevención (70-100%)' : 'Sano (<70%)')}
                         className={`w-3.5 h-3.5 rounded-full shadow-sm ring-2 ring-white ${
                            exp.prioridad === 'URGENTE' ? 'bg-red-500 animate-pulse' : (exp.prioridad === 'ALTA' ? 'bg-amber-400' : 'bg-emerald-500')
                         }`}>
                       </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <a href={`/expedientes/${exp.id}`} className="text-indigo-600 hover:text-indigo-900">Ver</a>
                      {exp.estado !== 'ARCHIVADO' && (
                        <button onClick={() => handleArchive(exp.id)} className="text-slate-400 hover:text-red-600">Archivar</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Expediente */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Nuevo Expediente Institucional</h2>
              <p className="text-sm text-slate-500 mt-1">El código se asignará automáticamente.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Asunto *</label>
                <input
                  type="text"
                  value={newExp.asunto}
                  onChange={(e) => setNewExp({...newExp, asunto: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Solicitud de viáticos para comisión..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={newExp.descripcion}
                  onChange={(e) => setNewExp({...newExp, descripcion: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descripción detallada del trámite..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prioridad</label>
                <select
                  value={newExp.prioridad}
                  onChange={(e) => setNewExp({...newExp, prioridad: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                >
                  <option value="BAJA">Baja</option>
                  <option value="NORMAL">Normal</option>
                  <option value="ALTA">Alta</option>
                  <option value="URGENTE">Urgente</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 rounded-md transition-colors"
              >
                {saving ? 'Creando...' : 'Crear Expediente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
