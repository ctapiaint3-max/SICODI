'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Documento {
  id: number;
  nombre_archivo: string;
  ruta_fisica: string;
  hash_sha256: string;
  firma_digital: string | null;
  uploaded_by: number;
  created_at: string;
  uploader_nombre: string;
}

export default function DocumentosPage() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [previewDoc, setPreviewDoc] = useState<Documento | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  const [showFirmaModal, setShowFirmaModal] = useState(false);
  const [pinFirma, setPinFirma] = useState('');
  const [signing, setSigning] = useState(false);

  const fetchDocumentos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/documentos');
      if (res.data.status === 'success') {
        setDocumentos(res.data.data);
      }
    } catch (error) {
       // Mock fallback
       setDocumentos([
         { id: 1, nombre_archivo: 'Resolucion_045.pdf', ruta_fisica: '/storage/docs/Res045.pdf', hash_sha256: 'a2b3c4d5e6...', firma_digital: 'FIRMADO_VALIDO', uploaded_by: 1, created_at: new Date().toISOString(), uploader_nombre: 'Admin' },
         { id: 2, nombre_archivo: 'Anexo_Tecnico_Servidores.pdf', ruta_fisica: '/storage/docs/Anexo2.pdf', hash_sha256: 'f8g9h0i1j2...', firma_digital: null, uploaded_by: 2, created_at: new Date(Date.now() - 86400000).toISOString(), uploader_nombre: 'Ing. Sistemas' }
       ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentos();
  }, []);

  useEffect(() => {
    if (previewDoc) {
      setPdfUrl(null);
      api.get(`/documentos/${previewDoc.id}/download?view=1`, { responseType: 'blob' })
        .then(res => {
           const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
           setPdfUrl(url);
        })
        .catch(e => {
           console.error('Error cargando PDF:', e);
        });
    } else {
      if (pdfUrl) window.URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  }, [previewDoc]);

  const handleDownload = async (id: number, nombre: string) => {
    try {
      const res = await api.get(`/documentos/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nombre);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (e) {
      alert('En modo demo offline la descarga requiere conexión al storage físico.');
    }
  };

  const handleFirmar = async () => {
    if (!pinFirma || !previewDoc) { alert('Ingrese su PIN corporativo.'); return; }
    setSigning(true);
    try {
      const res = await api.post('/firmas/estampar', { documento_id: previewDoc.id, codigo_pin: pinFirma });
      if (res.data.status === 'success') {
         alert('Documento firmado con éxito. Hash generado: ' + res.data.data.hash_generado);
         setShowFirmaModal(false);
         setPinFirma('');
         fetchDocumentos();
         setPreviewDoc({ ...previewDoc, firma_digital: 'FIRMADO_VALIDO', hash_sha256: res.data.data.hash_generado });
      }
    } catch (e: any) {
       alert(e.response?.data?.message || 'Error al firmar documento. PIN inválido.');
    } finally {
       setSigning(false);
    }
  };

  const filteredDocs = documentos.filter(d => d.nombre_archivo.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Columna Izquierda: Lista de Documentos */}
      <div className="w-1/2 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Repositorio Institucional</h2>
            <p className="text-xs text-slate-500 mt-0.5">Gestión de archivos físicos centralizados en el NAS.</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium shadow transition flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Subir Documento
          </button>
        </div>
        
        <div className="p-4 border-b border-slate-100">
           <input 
             type="text" 
             placeholder="Buscar documento por nombre..." 
             className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500"
             value={search}
             onChange={e => setSearch(e.target.value)}
           />
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
          {loading ? (
             <div className="p-8 text-center text-slate-400 text-sm">Cargando documentos...</div>
          ) : filteredDocs.length === 0 ? (
             <div className="p-8 text-center text-slate-400 text-sm">No se encontraron documentos físicos.</div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map(doc => (
                <div 
                  key={doc.id} 
                  onClick={() => setPreviewDoc(doc)}
                  className={`relative p-5 rounded-xl border bg-white cursor-pointer transition-all flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md ${previewDoc?.id === doc.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-blue-300'}`}
                >
                  <div className="bg-red-50 p-4 rounded-full mb-3 shadow-inner">
                      <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="w-full">
                    <p className="text-sm font-bold text-slate-800 truncate px-2" title={doc.nombre_archivo}>{doc.nombre_archivo}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(doc.created_at).toLocaleDateString()}</p>
                    <p className="text-[10px] font-semibold text-slate-500 truncate">{doc.uploader_nombre || 'Sistema'}</p>
                    
                    {doc.firma_digital && (
                      <div className="mt-2 inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded text-[9px] font-black border border-emerald-100">
                        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        FIRMADO
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDownload(doc.id, doc.nombre_archivo); }}
                    className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded bg-white transition-colors"
                    title="Descargar Físico"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Columna Derecha: Visor de PDF Integrado */}
      <div className="w-1/2 flex flex-col bg-slate-100 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
        {previewDoc ? (
          <>
            <div className="bg-slate-800 p-4 flex justify-between items-center text-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="bg-red-500 p-1.5 rounded">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div className="truncate">
                  <p className="text-sm font-bold truncate">{previewDoc.nombre_archivo}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate border-t border-slate-700 pt-0.5">SHA-256: {previewDoc.hash_sha256}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0 ml-4">
                 {!previewDoc.firma_digital && (
                    <button className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-bold transition-colors flex items-center gap-1" onClick={() => setShowFirmaModal(true)}>
                      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      Firmar Físico
                    </button>
                 )}
                 <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs font-medium transition-colors" onClick={() => handleDownload(previewDoc.id, previewDoc.nombre_archivo)}>Descargar original</button>
                 <button className="p-1 text-slate-400 hover:text-white" onClick={() => setPreviewDoc(null)}>✕</button>
              </div>
            </div>
            
            <div className="flex-1 bg-slate-200 p-4 relative overflow-hidden flex flex-col">
               {pdfUrl ? (
                 <iframe src={pdfUrl} className="w-full h-full border border-slate-300 rounded shadow-inner" title="Visor de PDF Seguro"></iframe>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                    <svg className="w-8 h-8 animate-spin mb-4 text-blue-500" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    <p className="font-medium text-sm">Recuperando binario físico seguro del NAS...</p>
                 </div>
               )}

               {previewDoc.firma_digital && (
                 <div className="absolute bottom-8 right-8 border-2 border-emerald-600 rounded p-3 w-40 transform rotate-[-2deg] opacity-90 z-10 bg-white shadow-2xl pointer-events-none">
                    <p className="text-[8px] font-bold text-emerald-800 text-center uppercase border-b border-emerald-200 pb-1 mb-1">Firmado Electrónicamente</p>
                    <p className="text-[6px] text-emerald-600 font-mono text-center break-all">{previewDoc.hash_sha256.substring(0,25)}...</p>
                    <p className="text-[7px] text-emerald-600 text-center mt-1">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                    <div className="w-full h-8 mt-1 border border-emerald-100 flex items-center justify-center">
                      <span className="text-emerald-300 text-[10px] italic font-serif">Validez Legal</span>
                    </div>
                 </div>
               )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <svg className="w-20 h-20 mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <p className="text-lg font-medium text-slate-500">Visor de Documentos Institucionales</p>
            <p className="text-sm mt-2 max-w-sm">Seleccione un documento físico de la lista a la izquierda para previsualizar su contenido de manera segura sin necesidad de descargarlo.</p>
          </div>
        )}
      </div>

      {/* Modal Firma Digital */}
      {showFirmaModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
            <div className="bg-emerald-600 p-4 text-center">
               <svg className="w-10 h-10 text-white mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
               <h3 className="text-lg font-bold text-white mt-2">Suscripción Electrónica</h3>
               <p className="text-emerald-100 text-xs mt-1">Autorización institucional vinculante.</p>
            </div>
            <div className="p-6">
               <p className="text-sm text-slate-600 text-center mb-6">Está a punto de firmar y encriptar el documento <strong>{previewDoc?.nombre_archivo}</strong>. Esta acción ingresará al audit log inmutable.</p>
               <div className="space-y-4">
                 <div>
                   <label className="block text-xs font-bold font-mono text-slate-500 uppercase tracking-widest mb-1 text-center">PIN Corporativo de Firma</label>
                   <input
                     type="password"
                     maxLength={6}
                     value={pinFirma}
                     onChange={e => setPinFirma(e.target.value.replace(/\D/g, ''))}
                     className="w-full text-center text-3xl font-mono tracking-[0.5em] px-3 py-3 border-2 border-slate-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50"
                     placeholder="••••••"
                     autoFocus
                   />
                 </div>
               </div>
               <div className="mt-8 flex gap-3">
                 <button onClick={() => { setShowFirmaModal(false); setPinFirma(''); }} className="flex-1 px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-colors">Cancelar</button>
                 <button disabled={signing || pinFirma.length < 4} onClick={handleFirmar} className="flex-1 px-4 py-2 border border-transparent shadow-sm text-sm font-bold rounded-md text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                    {signing ? <span className="animate-pulse">Firmando...</span> : 'Autorizar Sello'}
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
