import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../AdminLayout';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  Users,
  Plus,
  Shield,
  Trash2,
  CheckCircle,
  AlertCircle,
  X,
  Lock,
  Mail,
  UserCheck
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { adminUser } = useApp();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EDITOR' as 'OWNER' | 'ADMIN' | 'EDITOR'
  });

  const defaultAdmin = adminUser || {
    id: 'user_owner',
    name: 'NIDPIK Super Admin',
    email: 'admin@nidpik.com',
    role: 'OWNER',
    status: 'active'
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.users.getAll();
      if (Array.isArray(data) && data.length > 0) {
        setUsers(data);
      } else {
        setUsers([defaultAdmin]);
      }
    } catch (err: any) {
      console.warn('API users fetch note:', err);
      setUsers([defaultAdmin]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [adminUser]);

  const safeUsers = Array.isArray(users) && users.length > 0 ? users : [defaultAdmin];

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.users.updateRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setToastMsg('User role updated');
    } catch (err: any) {
      alert(`Error updating role: ${err.message}`);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      await api.users.updateStatus(userId, nextStatus as any);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
      setToastMsg(`User marked as ${nextStatus}`);
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const handleDelete = async (u: any) => {
    if (u.id === adminUser?.id) {
      alert('You cannot delete your own account.');
      return;
    }
    if (!window.confirm(`Delete administrative user "${u.name}" (${u.email})?`)) return;
    try {
      await api.users.delete(u.id);
      setUsers(prev => prev.filter(x => x.id !== u.id));
      setToastMsg('User deleted');
    } catch (err: any) {
      alert(`Error deleting user: ${err.message}`);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.users.create(form);
      setModalOpen(false);
      setForm({ name: '', email: '', password: '', role: 'EDITOR' });
      setToastMsg('New administrative user created');
      await loadUsers();
    } catch (err: any) {
      alert(`Error creating user: ${err.message}`);
    }
  };

  return (
    <AdminLayout
      title="Admin Users &amp; Roles"
      subtitle="Role-Based Access Control (RBAC): Configure Owner, Admin, and Content Editor privileges"
      actions={
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New User</span>
        </button>
      }
    >
      <div className="space-y-4">
        
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="py-24 text-center text-xs text-slate-400">Loading user accounts...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">User</th>
                  <th className="py-3 px-5">Role</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Last Login</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {safeUsers.map((u) => {
                  const isCurrent = u.id === adminUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 uppercase">
                            {u.name.slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{u.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">You</span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono block">
                              {u.role === 'OWNER' || u.id === 'user_owner' ? 'admin@nidpik.com' : u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5">
                        {adminUser?.role === 'OWNER' && !isCurrent ? (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                          >
                            <option value="OWNER">OWNER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="EDITOR">EDITOR</option>
                          </select>
                        ) : (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            u.role === 'OWNER' ? 'bg-amber-100 text-amber-800' :
                            u.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {u.role}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-5">
                        <button
                          disabled={isCurrent}
                          onClick={() => handleStatusToggle(u.id, u.status)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          } ${isCurrent ? 'cursor-default' : 'cursor-pointer hover:opacity-80'}`}
                        >
                          {u.status}
                        </button>
                      </td>

                      <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px]">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        {!isCurrent && (
                          <button
                            onClick={() => handleDelete(u)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* CREATE MODAL */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-base text-slate-900">Add Staff Account</h3>
                <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="priya@nidpik.in"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Assigned Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="EDITOR">EDITOR (Manage content, cannot change critical users/security)</option>
                    <option value="ADMIN">ADMIN (Full content &amp; settings management)</option>
                    <option value="OWNER">OWNER (Superadmin, manages users and roles)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};
