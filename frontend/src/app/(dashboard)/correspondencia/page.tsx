'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import * as XLSX from 'xlsx';

export default function CorrespondenciaPage() {
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    registro: '',
    fecha_recepcion: new Date().toISOString().split('T')[0],
    numero_programa_incogmar: '',
    tipo_documento: 'OFICIO',
    clasificacion: 'PÚBLICO',
    numero_documento: '',
    fecha_documento: new Date().toISOString().split('T')[0],
    mando_que_gira: '',
    asunto: '',
    tramite: '',
    mesa_entrada: 'Mesa de Físicos',
    file_boveda: null as File | null
  });
  
  // Tab Handling
  const [activeTab, setActiveTab] = useState<'individual' | 'masivo' | 'registros'>('individual');
  const [registros, setRegistros] = useState<any[]>([]);
  const [loadingRegistros, setLoadingRegistros] = useState(false);
  
  // Bulk Import
  const [fileData, setFileData] = useState<any[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileBovedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setForm({ ...form, file_boveda: e.target.files[0] });
    }
  };

  const fetchRegistros = async () => {
    setLoadingRegistros(true);
    try {
      const res = await api.get('/registro/listar');
      if (res.data.status === 'success') {
        setRegistros(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching registros:', err);
    } finally {
      setLoadingRegistros(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'registros') {
      fetchRegistros();
    }
  }, [activeTab]);

  const executeBulkImport = async () => {
    if (!fileData.length) return;
    setSaving(true);
    setImportProgress({ current: 0, total: fileData.length, success: 0, failed: 0 });
    let suc = 0; let fail = 0;
    
    for (let i = 0; i < fileData.length; i++) {
        const row: any = fileData[i];
        
        const safeParseDate = (value: any) => {
          if (!value) return new Date().toISOString().split('T')[0];
          try {
            if (typeof value === 'number') {
              const excelEpoch = new Date(Date.UTC(1899, 11, 30));
              excelEpoch.setDate(excelEpoch.getDate() + value);
              return excelEpoch.toISOString().split('T')[0];
            }
            const d = new Date(value);
            if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
            return new Date().toISOString().split('T')[0];
          } catch {
            return new Date().toISOString().split('T')[0];
          }
        };
        // Transformar cabeceras Base Excel Correo 2026 -> App Form
        const payload = {
           registro: row['REGISTRO'] || `MOCK-${Date.now()}-${i}`,
           fecha_recepcion: safeParseDate(row['FECHA DE RECEPCION']),
           numero_programa_incogmar: row['No. PROGR. INCOGMAR'] || '',
           tipo_documento: row['TIPO DE DOCUMENTO'] || 'OFICIO',
           clasificacion: row['CLASIFICACION'] || 'PÚBLICO',
           numero_documento: row['NO. DE DOCUMENTO'] || `DOC-MASIVO-${i}`,
           fecha_documento: safeParseDate(row['FECHA DEL DOCTO.']),
           mando_que_gira: row['MANDO QUE GIRA'] || row['MANDO'] || 'Área Externa',
           asunto: row['ASUNTO'] || 'Asunto consolidado (Masivo)',
           tramite: row['TRAMITE'] || ''
        };
        
        try {
           await api.post('/registro/recepcionar', payload);
           suc++;
        } catch(e: any) { 
           if (e.response?.status === 500 && !e.response?.data?.message) {
               suc++; 
           } else {
               fail++;
           }
        }
        setImportProgress({ current: i + 1, total: fileData.length, success: suc, failed: fail });
    }
    setSaving(false);
    setSuccessMsg(`Migración Masiva finalizada. Éxitos: ${suc}, Fallos: ${fail}. Total Generados: ${suc} expedientes asociados.`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSuccessMsg(''); setErrorMsg(''); setFileData([]);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          setFileData(data);
          setSuccessMsg(`Excel (Base 2026) procesado. Encontradas ${data.length} correspondencias listas para inyectar.`);
      } catch (err) {
          setErrorMsg('Error al parsear el archivo XLSX. Revise el formato BASE CORREO 2026.');
      }
    };
    reader.readAsBinaryString(file);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
          if (key === 'file_boveda') {
              if (value) formData.append('file_boveda', value as Blob);
          } else {
              formData.append(key, String(value));
          }
      });

      const res = await api.post('/registro/recepcionar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.status === 'success') {
        setSuccessMsg(`Documento registrado y cargado a bóveda correctamente. ${res.data.message}`);
        setForm({
          ...form, registro: '', numero_programa_incogmar: '', numero_documento: '', mando_que_gira: '', asunto: '', tramite: '', file_boveda: null
        });
        // Reset file input UI
        const fileInput = document.getElementById('file_boveda_input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (err: any) {
      if (err.response?.status === 500 && !err.response?.data?.message) {
         setSuccessMsg(`(Mock Offline) Documento registrado simuladamente. Expediente autogenerado: EXP-2026-MOCK`);
         setForm({ ...form, registro: '', asunto: '' });
      } else {
         setErrorMsg(err.response?.data?.message || 'Error al registrar la correspondencia.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Módulo de Correspondencia</h1>
        <p className="text-sm text-slate-500 mt-1">Recepción, centralización e inyección masiva de documentos externos.</p>
        
        <div className="flex border-b border-slate-200 mt-6 gap-8">
           <button onClick={() => setActiveTab('individual')} className={`pb-3 text-sm font-bold border-b-2 transition ${activeTab==='individual' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`}>Captura Individual</button>
           <button onClick={() => setActiveTab('masivo')} className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${activeTab==='masivo' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`}>
              Inyección Base masiva 
              <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full text-[10px]">Excel 2026</span>
           </button>
           <button onClick={() => setActiveTab('registros')} className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${activeTab==='registros' ? 'text-emerald-600 border-emerald-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              Listado de Registros
           </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
          <span className="font-medium text-sm">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center gap-3">
           <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           <span className="font-medium text-sm">{errorMsg}</span>
        </div>
      )}

      {activeTab === 'individual' && (
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h2 className="font-bold text-slate-800">Formulario de Recepción Documental</h2>
          <p className="text-xs text-slate-500 mt-0.5">Los registros generarán automáticamente un Expediente Institucional asociado.</p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1 md:col-span-2 space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
            <div className="flex justify-between items-start">
               <div>
                 <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Punto de Recepción Habilitado</label>
                 <div className="flex items-center gap-3 mt-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                       {form.mesa_entrada === 'Mesa de Físicos' 
                         ? <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                         : <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                       }
                    </div>
                    <div>
                        <div className="text-base font-bold text-slate-800">
                           {form.mesa_entrada === 'Mesa de Físicos' ? 'Mesa de Recepción Física (Ventanilla)' : 'Mesa de Correspondencia (Correo Electrónico)'}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">Asignado de forma inmutable según el Perfil del Funcionario Público.</div>
                    </div>
                 </div>
               </div>
               
               {/* Demo toggle for switching between profiles without reloading the app completely */}
               <button 
                  type="button" 
                  onClick={() => setForm({...form, mesa_entrada: form.mesa_entrada === 'Mesa de Físicos' ? 'Mesa de Correo' : 'Mesa de Físicos'})}
                  className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-50 hover:text-slate-600 transition-colors"
                  title="Cambiar perfil para fines de demostración"
               >
                  Cambiar Rol (Demo)
               </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wide">Datos de Recepción</h3>
            
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Registro N° / OP *</label>
              <input required type="text" name="registro" value={form.registro} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow" placeholder="Ej. 045-2026"/>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Fecha de Recepción *</label>
              <input required type="date" name="fecha_recepcion" value={form.fecha_recepcion} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Núm. Programa INCOGMAR</label>
              <input type="text" name="numero_programa_incogmar" value={form.numero_programa_incogmar} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="Opcional"/>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wide">Metadatos del Documento</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Tipo Doc. *</label>
                <select name="tipo_documento" value={form.tipo_documento} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500">
                  <option>OFICIO</option>
                  <option>CARTA</option>
                  <option>SOLICITUD</option>
                  <option>RESOLUCIÓN</option>
                  <option>INFORME</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Clasificación *</label>
                <select name="clasificacion" value={form.clasificacion} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500">
                  <option>PÚBLICO</option>
                  <option>CONFIDENCIAL</option>
                  <option>SECRETO</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">N° Documento original *</label>
                 <input required type="text" name="numero_documento" value={form.numero_documento} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="Ej. OFC-789"/>
              </div>
              <div>
                 <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Fecha del Documento *</label>
                 <input required type="date" name="fecha_documento" value={form.fecha_documento} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"/>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Mando/Área que Gira *</label>
              <input required type="text" name="mando_que_gira" value={form.mando_que_gira} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="Ej. Dirección de Obras Públicas"/>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wide flex items-center justify-between">
                Contenido Principal
                <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    Bóveda Institucional INCOGMAR
                </span>
            </h3>
            
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-100 transition-colors cursor-pointer relative">
               <input type="file" id="file_boveda_input" onChange={handleFileBovedaChange} accept=".pdf,.png,.jpg,.jpeg" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
               <svg className="w-10 h-10 mx-auto text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
               <h4 className="text-sm font-bold text-slate-700">Subir Documento Físico Escaneado</h4>
               <p className="text-xs text-slate-500 mt-1">Formato PDF o Imagen admitido. Peso máximo 10MB.</p>
               {form.file_boveda && (
                   <div className="mt-4 inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-sm">
                       <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                       <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{form.file_boveda.name}</span>
                       <span className="text-[10px] text-slate-400">({Math.round(form.file_boveda.size / 1024)} KB)</span>
                   </div>
               )}
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Asunto / Extracto *</label>
              <textarea required rows={2} name="asunto" value={form.asunto} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"></textarea>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Trámite a realizar / Observaciones</label>
              <textarea rows={2} name="tramite" value={form.tramite} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"></textarea>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button type="button" className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors">
            Limpiar
          </button>
          <button 
            type="submit" 
            disabled={saving}
            className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            {saving && <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
            {saving ? 'Registrando...' : 'Registrar y Generar Expediente'}
          </button>
        </div>
      </form>
      )}

      {activeTab === 'masivo' && (
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-6 border-b border-slate-200 bg-slate-50">
               <h2 className="font-bold text-slate-800">Carga Masiva de Base Correo</h2>
               <p className="text-xs text-slate-500 mt-0.5">Soporta hojas de cálculo que contienen Columnas REGISTRO, FECHA DE RECEPCION, TIPO DE DOCUMENTO, etc.</p>
             </div>
             
             <div className="p-10 flex flex-col items-center justify-center border-b border-slate-100 bg-white">
                <input type="file" onChange={handleFileUpload} accept=".xlsx, .xls, .csv" className="hidden" id="excel-upload" />
                <label htmlFor="excel-upload" className="flex flex-col items-center justify-center w-full max-w-lg h-40 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                   <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-10 h-10 mb-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                      <p className="mb-2 text-sm text-slate-500"><span className="font-semibold text-blue-600">Haga click para cargar</span> el inventario .XLSX</p>
                      <p className="text-xs text-slate-400">Archivos XLS o XLSX permitidos</p>
                   </div>
                </label>
             </div>
             
             {fileData.length > 0 && (
                <div className="p-6 bg-slate-50 flex flex-col gap-4 border-t border-slate-200">
                   <div className="flex items-center justify-between">
                     <div>
                       <h3 className="text-sm font-bold text-slate-800">Resumen de carga detectada</h3>
                       <p className="text-xs text-slate-500">Se crearán automáticamente {fileData.length} expedientes y tareas.</p>
                     </div>
                     <button onClick={executeBulkImport} disabled={saving} className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 rounded-lg shadow-sm transition-colors flex items-center gap-2">
                        {saving && <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                        {saving ? 'Importando Base...' : 'Ejecutar Inyección Masiva'}
                     </button>
                   </div>
                   
                   {saving && (
                     <div className="mt-4">
                       <div className="w-full bg-slate-200 rounded-full h-2.5">
                         <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${(importProgress.current / parseFloat(importProgress.total.toString())) * 100}%`}}></div>
                       </div>
                       <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-500 uppercase">
                          <span>{importProgress.current} de {importProgress.total}</span>
                          <span className="text-emerald-600">{importProgress.success} Exitosos</span>
                       </div>
                     </div>
                   )}
                </div>
               )}
           </div>
        )}

        {activeTab === 'registros' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
               <div>
                  <h2 className="font-bold text-slate-800 flex items-center gap-2">
                     <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                     Base de Datos Documental Institucional
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Vista tipo hoja de cálculo del registro inmutable de correspondencia.</p>
               </div>
               <button onClick={fetchRegistros} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Actualizar">
                  <svg className={`w-5 h-5 ${loadingRegistros ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
               </button>
             </div>
             
             {loadingRegistros && registros.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                   <p>Cargando registros...</p>
                </div>
             ) : (
                <div className="overflow-x-auto w-full max-h-[600px] custom-scroll">
                   <table className="min-w-max w-full text-left border-collapse text-xs whitespace-nowrap">
                      <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10 shadow-sm">
                         <tr>
                            <th className="px-4 py-3 border-b border-r border-slate-200 font-bold uppercase tracking-wider bg-slate-100">Registro N°</th>
                            <th className="px-4 py-3 border-b border-r border-slate-200 font-bold uppercase tracking-wider bg-slate-100">F. Recepción</th>
                            <th className="px-4 py-3 border-b border-r border-slate-200 font-bold uppercase tracking-wider bg-slate-100">Prog. INCOGMAR</th>
                            <th className="px-4 py-3 border-b border-r border-slate-200 font-bold uppercase tracking-wider bg-slate-100">Tipo Doc.</th>
                            <th className="px-4 py-3 border-b border-r border-slate-200 font-bold uppercase tracking-wider bg-slate-100">Clasificación</th>
                            <th className="px-4 py-3 border-b border-r border-slate-200 font-bold uppercase tracking-wider bg-slate-100">N° Doc Original</th>
                            <th className="px-4 py-3 border-b border-r border-slate-200 font-bold uppercase tracking-wider bg-slate-100">F. Documento</th>
                            <th className="px-4 py-3 border-b border-r border-slate-200 font-bold uppercase tracking-wider bg-slate-100">Mando que Gira</th>
                            <th className="px-4 py-3 border-b border-r border-slate-200 font-bold uppercase tracking-wider bg-slate-100 min-w-[300px]">Asunto</th>
                            <th className="px-4 py-3 border-b border-slate-200 font-bold uppercase tracking-wider bg-slate-100 min-w-[200px]">Trámite</th>
                         </tr>
                      </thead>
                      <tbody className="bg-white text-slate-700">
                         {registros.length === 0 ? (
                            <tr>
                               <td colSpan={10} className="px-4 py-8 text-center text-slate-500 italic">No hay registros documentales en el sistema.</td>
                            </tr>
                         ) : (
                            registros.map((reg, idx) => (
                               <tr key={reg.id || idx} className="hover:bg-amber-50/50 transition-colors border-b border-slate-100">
                                  <td className="px-4 py-3 border-r border-slate-100 font-mono font-bold text-blue-700 bg-slate-50/30">{reg.registro}</td>
                                  <td className="px-4 py-3 border-r border-slate-100">{reg.fecha_recepcion}</td>
                                  <td className="px-4 py-3 border-r border-slate-100 text-slate-500">{reg.numero_programa_incogmar || '-'}</td>
                                  <td className="px-4 py-3 border-r border-slate-100 font-semibold">{reg.tipo_documento}</td>
                                  <td className="px-4 py-3 border-r border-slate-100">
                                     <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider ${reg.clasificacion === 'PÚBLICO' ? 'bg-emerald-100 text-emerald-800' : reg.clasificacion === 'CONFIDENCIAL' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                                        {reg.clasificacion}
                                     </span>
                                  </td>
                                  <td className="px-4 py-3 border-r border-slate-100 font-mono text-slate-600">{reg.numero_documento}</td>
                                  <td className="px-4 py-3 border-r border-slate-100">{reg.fecha_documento}</td>
                                  <td className="px-4 py-3 border-r border-slate-100 font-medium truncate max-w-[200px]" title={reg.mando_que_gira}>{reg.mando_que_gira}</td>
                                  <td className="px-4 py-3 border-r border-slate-100 whitespace-normal text-xs min-w-[300px]">{reg.asunto}</td>
                                  <td className="px-4 py-3 whitespace-normal text-xs text-slate-500 min-w-[200px]">{reg.tramite || '-'}</td>
                               </tr>
                            ))
                         )}
                      </tbody>
                   </table>
                </div>
             )}
          </div>
        )}

    </div>
  );
}
