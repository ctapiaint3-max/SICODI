'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';

// Importar los componentes completos que servirán como pestañas
import AuditoriaPage from '../configuracion/auditoria/page';
import ConfiguracionBPMNPage from '../configuracion/page';

interface User {
    id: number;
    username: string;
    email: string;
    full_name: string;
    status: string;
    area_id?: string;
    area_nombre: string;
    roles: string[];
}

const MODULOS_SISTEMA = [
    { id: 'dashboard', label: 'Dashboard KPI', icon: <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg> },
    { id: 'expedientes', label: 'Gestor Expedientes', icon: <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg> },
    { id: 'documentos', label: 'Repo. Documentos', icon: <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> },
    { id: 'correspondencia', label: 'Correspondencia', icon: <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg> },
    { id: 'bandeja', label: 'Mi Bandeja (BPMN)', icon: <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { id: 'correo', label: 'Correo Interno', icon: <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
    { id: 'reportes', label: 'Reportes Inst.', icon: <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg> },
];

const INIT_MOCK_AREAS = [
    { id: 1, name: 'Dirección General' },
    { id: 2, name: 'Subdirección de Análisis' },
    { id: 3, name: 'Mesa de Trámite Físico' },
    { id: 4, name: 'Operaciones Técnicas' },
];

const INIT_MOCK_ROLES = [
    { id: 1, name: 'SuperAdmin', description: 'Acceso total y configuración BPMN' },
    { id: 2, name: 'Jefe', description: 'Visualización y Derivación' },
    { id: 3, name: 'Operador', description: 'Ejecución de áreas técnicas' },
    { id: 4, name: 'Mesa_Partes', description: 'Recepción y digitación documental' }
];

const INIT_MOCK_USERS = [
    { id: 1, username: 'admin', email: 'admin@institucion.gov', full_name: 'Administrador Sistema', status: 'ACTIVE', area_id: '1', area_nombre: 'Dirección General', roles: ['SUPERADMIN'] },
    { id: 2, username: 'jefe01', email: 'jefe@institucion.gov', full_name: 'Roberto Hernández', status: 'ACTIVE', area_id: '1', area_nombre: 'Dirección General', roles: ['JEFE'] },
    { id: 3, username: 'ope01', email: 'ope@institucion.gov', full_name: 'Carlos Ruiz', status: 'ACTIVE', area_id: '4', area_nombre: 'Operaciones Técnicas', roles: ['OPERADOR'] },
    { id: 4, username: 'mesa01', email: 'mesa@institucion.gov', full_name: 'Ana López', status: 'ACTIVE', area_id: '3', area_nombre: 'Mesa de Trámite Físico', roles: ['MESA_PARTES'] },
];

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'bpmn' | 'areas' | 'roles'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [areas, setAreas] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals de creación y edición
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const [newUser, setNewUser] = useState({
        username: '', email: '', full_name: '', password: '', area_id: '', role_id: '', permisos: [] as string[]
    });

    const [newArea, setNewArea] = useState({ name: '' });
    const [newRole, setNewRole] = useState({ name: '', description: '' });

    const [showAreaModal, setShowAreaModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    
    const [showEditAreaModal, setShowEditAreaModal] = useState(false);
    const [showEditRoleModal, setShowEditRoleModal] = useState(false);

    const [editArea, setEditArea] = useState({ id: 0, name: '' });
    const [editRole, setEditRole] = useState({ id: 0, name: '', description: '' });

    const [editUser, setEditUser] = useState({
        id: 0, full_name: '', password: '', area_id: '', role_id: '', permisos: [] as string[]
    });

    const fetchUsersData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/users');
            if (res.data?.data) setUsers(res.data.data);
        } catch (e) {
            const stored = localStorage.getItem('sicodi_mock_users');
            if (stored) {
                setUsers(JSON.parse(stored));
            } else {
                setUsers(INIT_MOCK_USERS);
                localStorage.setItem('sicodi_mock_users', JSON.stringify(INIT_MOCK_USERS));
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchAreasData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/areas');
            if (res.data?.data) setAreas(res.data.data);
        } catch (e) {
            const stored = localStorage.getItem('sicodi_mock_areas');
            if (stored) {
                setAreas(JSON.parse(stored));
            } else {
                setAreas(INIT_MOCK_AREAS);
                localStorage.setItem('sicodi_mock_areas', JSON.stringify(INIT_MOCK_AREAS));
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchRolesData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/roles');
            if (res.data?.data) setRoles(res.data.data);
        } catch (e) {
            const stored = localStorage.getItem('sicodi_mock_roles');
            if (stored) {
                setRoles(JSON.parse(stored));
            } else {
                setRoles(INIT_MOCK_ROLES);
                localStorage.setItem('sicodi_mock_roles', JSON.stringify(INIT_MOCK_ROLES));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id: number) => {
        try {
            const res = await api.put(`/admin/users/${id}/toggle`);
            if (res.data.status === 'success') fetchUsersData();
        } catch (e) {
            // MOCK Fallback
            const currentUsers = [...users];
            const idx = currentUsers.findIndex(u => u.id === id);
            if(idx > -1) {
                currentUsers[idx].status = currentUsers[idx].status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                setUsers(currentUsers);
                localStorage.setItem('sicodi_mock_users', JSON.stringify(currentUsers));
            }
        }
    };

    const togglePermiso = (modId: string, isEdit = false) => {
        if (isEdit) {
            setEditUser(prev => {
                const p = prev.permisos;
                return { ...prev, permisos: p.includes(modId) ? p.filter(x => x !== modId) : [...p, modId] };
            });
        } else {
            setNewUser(prev => {
                const p = prev.permisos;
                return { ...prev, permisos: p.includes(modId) ? p.filter(x => x !== modId) : [...p, modId] };
            });
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/admin/users/create', newUser);
            if (res.data.status === 'success') {
                setShowCreateModal(false);
                setNewUser({ username: '', email: '', full_name: '', password: '', area_id: '', role_id: '', permisos: [] });
                fetchUsersData();
            }
        } catch (e) {
            // MOCK Fallback
            const currentUsers = [...users];
            // Encontrar area_nombre basado en ID mock
            const areaName = areas.find(a => a.id.toString() === newUser.area_id)?.name || 'Sin área';
            const roleName = roles.find(r => r.id.toString() === newUser.role_id)?.name.toUpperCase() || 'USUARIO';
            
            const nUser: User = {
                id: Date.now(),
                username: newUser.username || 'user',
                email: newUser.email,
                full_name: newUser.full_name,
                status: 'ACTIVE',
                area_id: newUser.area_id,
                area_nombre: areaName,
                roles: [roleName]
            };
            currentUsers.push(nUser);
            setUsers(currentUsers);
            localStorage.setItem('sicodi_mock_users', JSON.stringify(currentUsers));
            setShowCreateModal(false);
            setNewUser({ username: '', email: '', full_name: '', password: '', area_id: '', role_id: '', permisos: [] });
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                full_name: editUser.full_name,
                password: editUser.password, // Solo si se escribe
                area_id: editUser.area_id,
                role_id: editUser.role_id,
                permisos: editUser.permisos
            };
            const res = await api.put(`/admin/users/${editUser.id}/update`, payload);
            if (res.data.status === 'success') {
                setShowEditModal(false);
                fetchUsersData();
            }
        } catch (e) {
            // MOCK Fallback
            const currentUsers = [...users];
            const idx = currentUsers.findIndex(u => u.id === editUser.id);
            if(idx > -1) {
                const areaName = areas.find(a => a.id.toString() === editUser.area_id.toString())?.name || 'Sin área';
                let roleName = currentUsers[idx].roles[0] || 'USUARIO';
                const r = roles.find(r => r.id.toString() === editUser.role_id.toString());
                if(r) roleName = r.name.toUpperCase();
                
                currentUsers[idx].full_name = editUser.full_name;
                currentUsers[idx].area_id = editUser.area_id.toString();
                currentUsers[idx].area_nombre = areaName;
                currentUsers[idx].roles = [roleName];
                
                setUsers(currentUsers);
                localStorage.setItem('sicodi_mock_users', JSON.stringify(currentUsers));
            }
            setShowEditModal(false);
        }
    };

    const handleCreateArea = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/admin/areas', newArea);
            if (res.data.status === 'success') {
                setShowAreaModal(false);
                setNewArea({ name: '' });
                fetchAreasData();
            }
        } catch (e) {
            const current = [...areas];
            current.push({ id: Date.now(), name: newArea.name });
            setAreas(current);
            localStorage.setItem('sicodi_mock_areas', JSON.stringify(current));
            setShowAreaModal(false);
            setNewArea({ name: '' });
        }
    };

    const handleUpdateArea = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.put(`/admin/areas/${editArea.id}`, { name: editArea.name });
            if (res.data.status === 'success') {
                setShowEditAreaModal(false);
                fetchAreasData();
            }
        } catch (e) {
            const current = [...areas];
            const idx = current.findIndex(a => a.id === editArea.id);
            if(idx > -1) {
                current[idx].name = editArea.name;
                setAreas(current);
                localStorage.setItem('sicodi_mock_areas', JSON.stringify(current));
            }
            setShowEditAreaModal(false);
        }
    };

    const handleUpdateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.put(`/admin/roles/${editRole.id}`, { name: editRole.name, description: editRole.description });
            if (res.data.status === 'success') {
                setShowEditRoleModal(false);
                fetchRolesData();
            }
        } catch (e) {
            const current = [...roles];
            const idx = current.findIndex(a => a.id === editRole.id);
            if(idx > -1) {
                current[idx].name = editRole.name;
                current[idx].description = editRole.description;
                setRoles(current);
                localStorage.setItem('sicodi_mock_roles', JSON.stringify(current));
            }
            setShowEditRoleModal(false);
        }
    };

    const handleCreateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/admin/roles', newRole);
            if (res.data.status === 'success') {
                setShowRoleModal(false);
                setNewRole({ name: '', description: '' });
                fetchRolesData();
            }
        } catch (e) {
            const current = [...roles];
            current.push({ id: Date.now(), name: newRole.name, description: newRole.description });
            setRoles(current);
            localStorage.setItem('sicodi_mock_roles', JSON.stringify(current));
            setShowRoleModal(false);
            setNewRole({ name: '', description: '' });
        }
    };

    const openEditModal = (user: User) => {
        // Intentar deducir role_id en base al primer rol para el Select (Mock)
        let rId = "3";
        if (user.roles?.includes('ADMIN')) rId = "1";
        else if (user.roles?.includes('GERENTE')) rId = "2";
        else if (user.roles?.includes('RECEPCION')) rId = "4";

        // Intentar deducir permisos mock basados en el rol si no existen explícitamente listados en BD
        const mockPerms = rId === "1" ? MODULOS_SISTEMA.map(m => m.id) : ['dashboard', 'bandeja'];

        setEditUser({
            id: user.id,
            full_name: user.full_name,
            password: '',
            area_id: user.area_id || "1", // Mock area fallback
            role_id: rId,
            permisos: mockPerms
        });
        setShowEditModal(true);
    };

    useEffect(() => {
        if (activeTab === 'users') fetchUsersData();
        if (activeTab === 'areas') fetchAreasData();
        if (activeTab === 'roles') fetchRolesData();
    }, [activeTab]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Panel de Configuración</h1>
                    <p className="mt-1 text-sm text-slate-500">Gestión central de usuarios, auditoría en tiempo real.</p>
                </div>
                {activeTab === 'users' && (
                    <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-colors flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Registrar Usuario
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Tabs Navigator */}
                <div className="flex border-b border-slate-200 overflow-x-auto custom-scroll">
                    <button
                        className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                        onClick={() => setActiveTab('users')}
                    >
                        Control de Identidades
                    </button>
                    <button
                        className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'areas' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                        onClick={() => setActiveTab('areas')}
                    >
                        Áreas Institucionales
                    </button>
                    <button
                        className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'roles' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                        onClick={() => setActiveTab('roles')}
                    >
                        Perfiles (Roles RBAC)
                    </button>
                    <button
                        className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'audit' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                        onClick={() => setActiveTab('audit')}
                    >
                        Auditoría General (Logs)
                    </button>
                    <button
                        className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'bpmn' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                        onClick={() => setActiveTab('bpmn')}
                    >
                        Motor de Procesos (BPMN)
                    </button>
                </div>

                {/* Contenido Dinámico de las Pestañas */}
                <div className={activeTab === 'users' ? 'p-0' : 'p-6 bg-slate-50/30'}>

                    {/* TAB: AUDITORIA */}
                    {activeTab === 'audit' && <div className="max-w-[100vw]"><AuditoriaPage /></div>}

                    {/* TAB: BPMN */}
                    {activeTab === 'bpmn' && <div className="max-w-[100vw]"><ConfiguracionBPMNPage /></div>}

                    {/* TAB: USUARIOS */}
                    {activeTab === 'users' && loading && <div className="py-20 text-center text-slate-500">Recopilando identidades...</div>}
                    {activeTab === 'users' && !loading && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Identidad</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Área Institucional</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Roles (RBAC)</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado de Acceso</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50 cursor-default">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 text-white font-bold text-sm shadow-sm border border-slate-700">
                                                        {user.full_name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-bold text-slate-900">{user.full_name}</div>
                                                        <div className="text-xs font-medium text-slate-500">{user.email} &bull; @{user.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-600">
                                                {user.area_nombre || 'No asignada'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                <div className="flex flex-wrap gap-1">
                                                    {user.roles && user.roles.length > 0 ? user.roles.map(role => (
                                                        <span key={role} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                                                            {role}
                                                        </span>
                                                    )) : <span className="text-slate-400 italic text-xs">Sin Rol</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-[10px] uppercase tracking-wider font-bold rounded-md ${user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                                    {user.status === 'ACTIVE' ? 'Habilitado' : 'Suspendido'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => openEditModal(user)} className="px-3 py-1.5 rounded-md border text-xs font-bold transition-all border-blue-200 text-blue-600 hover:bg-blue-50">
                                                        Modificar
                                                    </button>
                                                    <button onClick={() => handleToggleStatus(user.id)} className={`px-3 py-1.5 rounded-md border text-xs font-bold transition-all ${user.status === 'ACTIVE' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>
                                                        {user.status === 'ACTIVE' ? 'Inhabilitar' : 'Reactivar'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {users.length === 0 && <p className="text-center py-6 text-slate-500">No se recuperaron identidades del sistema.</p>}
                        </div>
                    )}

                    {/* TAB: AREAS */}
                    {activeTab === 'areas' && (
                        <div className="p-0">
                            <div className="p-4 border-b border-slate-200 flex justify-end">
                                <button onClick={() => setShowAreaModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-colors">
                                    + Añadir Nueva Área
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Nombre del Área / Dependencia</th>
                                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {areas.map(area => (
                                            <tr key={area.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">#{area.id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{area.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button onClick={() => { setEditArea({ id: area.id, name: area.name }); setShowEditAreaModal(true); }} className="px-3 py-1.5 rounded-md border text-xs font-bold transition-all border-emerald-200 text-emerald-600 hover:bg-emerald-50">
                                                        Modificar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB: ROLES */}
                    {activeTab === 'roles' && (
                        <div className="p-0">
                            <div className="p-4 border-b border-slate-200 flex justify-end">
                                <button onClick={() => setShowRoleModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-colors">
                                    + Crear Perfil Gbl. (Rol)
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Clave</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Descripción / Nivel de Acceso</th>
                                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {roles.map(role => (
                                            <tr key={role.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                                                    <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded border border-indigo-200">{role.name}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{role.description}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button onClick={() => { setEditRole({ id: role.id, name: role.name, description: role.description }); setShowEditRoleModal(true); }} className="px-3 py-1.5 rounded-md border text-xs font-bold transition-all border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                                                        Modificar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal para alta de Empleado Público */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden border border-slate-200 relative animate-in fade-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white shrink-0 shadow-sm z-10">
                            <h3 className="font-bold text-lg tracking-tight">Registrar Usuario</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white transition-colors p-1 bg-slate-800 rounded-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="p-6 overflow-y-auto custom-scroll">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Nombre Completo</label>
                                    <input required type="text" value={newUser.full_name} onChange={e => setNewUser({ ...newUser, full_name: e.target.value })} className="w-full px-3 py-2.5 bg-white border-2 border-slate-300 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Usuario</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                                            <input required type="text" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} className="w-full pl-8 pr-3 py-2.5 bg-white border-2 border-slate-300 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Contraseña (BCrypt)</label>
                                        <input required type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="w-full px-3 py-2.5 bg-white border-2 border-slate-300 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Correo Electrónico</label>
                                        <input required type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="w-full px-3 py-2.5 bg-white border-2 border-slate-300 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Área Institucional</label>
                                        <select required value={newUser.area_id} onChange={e => setNewUser({ ...newUser, area_id: e.target.value })} className="w-full px-3 py-2.5 bg-white border-2 border-slate-300 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm">
                                            <option value="">Seleccione una dependencia...</option>
                                            <option value="1">Dirección General</option>
                                            <option value="2">Asuntos Jurídicos</option>
                                            <option value="3">Recursos Humanos</option>
                                            <option value="4">Mesa de Partes</option>
                                            <option value="5">Área Técnica A</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Perfil del Sistema (RBAC)</label>
                                    <select required value={newUser.role_id} onChange={e => setNewUser({ ...newUser, role_id: e.target.value })} className="w-full px-3 py-2.5 bg-white border-2 border-slate-300 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm">
                                        <option value="">Seleccione Nivel Organizacional...</option>
                                        <option value="1">ADMIN - Super Administrador (Acceso Total)</option>
                                        <option value="2">GERENTE - Director / Jefatura (Analista)</option>
                                        <option value="3">OPERADOR - Especialista de Procesos</option>
                                        <option value="4">MESA_PARTES - Recepcionista Institucional</option>
                                    </select>
                                </div>
                            </div>

                            <hr className="my-6 border-slate-200" />

                            {/* Sección de Permisos */}
                            <div>
                                <label className="block text-xs font-bold text-slate-900 mb-3 uppercase tracking-wide">
                                    Otorgar Permisos de Acceso a Módulos (Funciones)
                                </label>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                    {MODULOS_SISTEMA.map(mod => {
                                        const isChecked = newUser.permisos.includes(mod.id);
                                        return (
                                            <label key={mod.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer select-none transition-all shadow-sm ${isChecked ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-500/10' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                                                <div className="flex-shrink-0 text-lg flex items-center justify-center">{mod.icon}</div>
                                                <div className="flex-1 text-xs font-bold text-slate-700">{mod.label}</div>
                                                <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-slate-50'}`}>
                                                    {isChecked && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                </div>
                                                <input type="checkbox" className="hidden" checked={isChecked} onChange={() => togglePermiso(mod.id, false)} />
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="pt-6 mt-6 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 bg-white shadow-[0_-15px_15px_-15px_rgba(0,0,0,0.1)] pb-2 z-10 w-full">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 bg-white border-2 border-slate-300 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
                                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all border-2 border-blue-600">Añadir usuario</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal para Edición de Usuario */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden border border-slate-200 relative animate-in fade-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-amber-500/20 flex justify-between items-center bg-slate-900 text-white border-t-4 border-t-amber-500 shrink-0 shadow-sm z-10">
                            <h3 className="font-bold text-lg tracking-tight flex items-center gap-2">
                                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                Modificar Usuario
                            </h3>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white transition-colors p-1 bg-slate-800 rounded-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleUpdateUser} className="p-6 overflow-y-auto custom-scroll">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Nombre Completo</label>
                                    <input required type="text" value={editUser.full_name} onChange={e => setEditUser({ ...editUser, full_name: e.target.value })} className="w-full px-3 py-2.5 bg-white border-2 border-slate-300 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Cambiar Contraseña (Opcional)</label>
                                    <input type="password" placeholder="Dejar en blanco para mantener la actual" value={editUser.password} onChange={e => setEditUser({ ...editUser, password: e.target.value })} className="w-full px-3 py-2.5 bg-white border-2 border-slate-300 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-sm" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Área Institucional</label>
                                        <select required value={editUser.area_id} onChange={e => setEditUser({ ...editUser, area_id: e.target.value })} className="w-full px-3 py-2.5 bg-white border-2 border-slate-300 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-sm">
                                            <option value="1">Dirección General</option>
                                            <option value="2">Asuntos Jurídicos</option>
                                            <option value="3">Recursos Humanos</option>
                                            <option value="4">Mesa de Partes</option>
                                            <option value="5">Área Técnica A</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Perfil del Sistema (RBAC)</label>
                                        <select required value={editUser.role_id} onChange={e => setEditUser({ ...editUser, role_id: e.target.value })} className="w-full px-3 py-2.5 bg-white border-2 border-slate-300 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-sm">
                                            <option value="1">ADMIN - Super Administrador</option>
                                            <option value="2">GERENTE - Director / Jefatura</option>
                                            <option value="3">OPERADOR - Especialista</option>
                                            <option value="4">MESA_PARTES - Recepción</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <hr className="my-6 border-slate-200" />

                            {/* Permisos */}
                            <div>
                                <label className="block text-xs font-bold text-slate-900 mb-3 uppercase tracking-wide">
                                    Otorgar Permisos de Acceso a Módulos (Funciones)
                                </label>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                    {MODULOS_SISTEMA.map(mod => {
                                        const isChecked = editUser.permisos.includes(mod.id);
                                        return (
                                            <label key={mod.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer select-none transition-all shadow-sm ${isChecked ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-500/10' : 'bg-white border-slate-200 hover:border-amber-300'}`}>
                                                <div className="flex-shrink-0 text-lg flex items-center justify-center">{mod.icon}</div>
                                                <div className="flex-1 text-xs font-bold text-slate-700">{mod.label}</div>
                                                <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${isChecked ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-300 bg-slate-50'}`}>
                                                    {isChecked && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                </div>
                                                <input type="checkbox" className="hidden" checked={isChecked} onChange={() => togglePermiso(mod.id, true)} />
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="pt-6 mt-6 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 bg-white shadow-[0_-15px_15px_-15px_rgba(0,0,0,0.1)] pb-2 z-10 w-full">
                                <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2.5 bg-white border-2 border-slate-300 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
                                <button type="submit" className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold shadow-md hover:bg-amber-600 hover:shadow-lg transition-all border-2 border-amber-500">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

          {/* Modals Áreas y Roles */}
      {showAreaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95">
               <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                  <h3 className="font-bold text-slate-800">Crear Nueva Área</h3>
                  <button onClick={() => setShowAreaModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
               </div>
               <form onSubmit={handleCreateArea} className="p-6">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Nombre del Área Institucional</label>
                  <input required type="text" value={newArea.name} onChange={e => setNewArea({name: e.target.value})} className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm mb-6" placeholder="Ej: Recursos Humanos" />
                  <div className="flex justify-end gap-2">
                     <button type="button" onClick={() => setShowAreaModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-sm rounded-lg">Cancelar</button>
                     <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg">Guardar Área</button>
                  </div>
               </form>
            </div>
        </div>
      )}

      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95">
               <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                  <h3 className="font-bold text-slate-800">Crear Perfil del Sistema</h3>
                  <button onClick={() => setShowRoleModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
               </div>
               <form onSubmit={handleCreateRole} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Clave Única (Ej: AUDITOR)</label>
                    <input required type="text" value={newRole.name} onChange={e => setNewRole({...newRole, name: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm" placeholder="Ej: ASESOR" />
                  </div>
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Descripción Corta</label>
                    <input required type="text" value={newRole.description} onChange={e => setNewRole({...newRole, description: e.target.value})} className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm" placeholder="Ej: Perfil para asesoría jurídica" />
                  </div>
                  <div className="flex justify-end gap-2 border-t pt-4">
                     <button type="button" onClick={() => setShowRoleModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-sm rounded-lg">Cancelar</button>
                     <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg">Guardar Perfil</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {showEditAreaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95">
               <div className="px-6 py-4 border-b border-emerald-500/20 flex justify-between items-center bg-slate-900 text-white border-t-4 border-t-emerald-500 rounded-t-2xl">
                  <h3 className="font-bold">Modificar Área / Dependencia</h3>
                  <button onClick={() => setShowEditAreaModal(false)} className="text-slate-400 hover:text-white">×</button>
               </div>
               <form onSubmit={handleUpdateArea} className="p-6">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Nombre del Área</label>
                  <input required type="text" value={editArea.name} onChange={e => setEditArea({...editArea, name: e.target.value})} className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm mb-6" />
                  <div className="flex justify-end gap-2">
                     <button type="button" onClick={() => setShowEditAreaModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-sm rounded-lg">Cancelar</button>
                     <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg">Guardar Cambios</button>
                  </div>
               </form>
            </div>
        </div>
      )}

      {showEditRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95">
               <div className="px-6 py-4 border-b border-indigo-500/20 flex justify-between items-center bg-slate-900 text-white border-t-4 border-t-indigo-500 rounded-t-2xl">
                  <h3 className="font-bold">Modificar Perfil del Sistema</h3>
                  <button onClick={() => setShowEditRoleModal(false)} className="text-slate-400 hover:text-white">×</button>
               </div>
               <form onSubmit={handleUpdateRole} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Clave Única</label>
                    <input required type="text" value={editRole.name} onChange={e => setEditRole({...editRole, name: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Descripción</label>
                    <input required type="text" value={editRole.description} onChange={e => setEditRole({...editRole, description: e.target.value})} className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div className="flex justify-end gap-2 border-t pt-4">
                     <button type="button" onClick={() => setShowEditRoleModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-sm rounded-lg">Cancelar</button>
                     <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg">Guardar Cambios</button>
                  </div>
               </form>
            </div>
        </div>
      )}

        </div>
    );
}
