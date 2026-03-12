'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const [user, setUser] = useState({ full_name: 'Cargando...', username: '' });

  useEffect(() => {
    const savedUser = localStorage.getItem('sicodi_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col min-h-screen">
      <div className="h-16 flex items-center justify-center border-b border-slate-800 p-2">
        <img src="/sicodi-logo.jpg?v=2" alt="Logo SICODI" className="h-full object-contain rounded-md" />
      </div>
      <nav className="flex-1 py-4 space-y-1">
        <Link 
          href="/" 
          className="flex items-center px-6 py-3 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <span className="font-medium">Dashboard</span>
        </Link>
        <Link 
          href="/expedientes" 
          className="flex items-center px-6 py-3 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <span className="font-medium">Expedientes</span>
        </Link>
        <Link 
          href="/documentos" 
          className="flex items-center px-6 py-3 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <span className="font-medium">Documentos</span>
        </Link>
        <Link 
          href="/correspondencia" 
          className="flex items-center px-6 py-3 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <span className="font-medium">Correspondencia (Recepción)</span>
        </Link>
        <Link 
          href="/bandeja" 
          className="flex items-center px-6 py-3 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <span className="font-medium">Mi Bandeja</span>
          <span className="ml-auto bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">3</span>
        </Link>
        <Link 
          href="/correo" 
          className="flex items-center px-6 py-3 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <span className="font-medium">Correo Interno</span>
        </Link>
        <Link 
          href="/reportes" 
          className="flex items-center px-6 py-3 hover:bg-slate-800 hover:text-white transition-colors border-t border-slate-800/50 mt-2"
        >
          <span className="font-medium">G. Reportes Institucionales</span>
        </Link>
        <Link 
          href="/admin" 
          className="flex items-center px-6 py-3 hover:bg-slate-800 hover:text-white transition-colors mt-auto border-t border-slate-800/50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="font-medium">Configuración</span>
        </Link>
      </nav>
      <div className="p-4 border-t border-slate-800 text-sm">
        <p className="text-slate-500">Sesión iniciada como:</p>
        <p className="font-bold text-white truncate" title={user.full_name}>{user.full_name}</p>
        <p className="text-xs text-slate-400 mt-0.5">@{user.username}</p>
      </div>
    </aside>
  );
}
