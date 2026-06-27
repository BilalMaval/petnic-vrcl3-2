"use client";
import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, Calendar, Clock, Shield, Crown, Eye, EyeOff, MoreVertical, Edit, Trash2, UserPlus, Download, Filter } from 'lucide-react';

export default function UsersManager({ token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [membershipFilter, setMembershipFilter] = useState('all');
  const [showPassword, setShowPassword] = useState({});
  const [editingUser, setEditingUser] = useState(null);
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (membershipFilter !== 'all') params.set('membership', membershipFilter);
      
      const res = await fetch(`/api/admin/users?${params}`, { headers });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, [token, search, roleFilter, membershipFilter]);

  const updateUser = async (userId, updates) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id: userId, ...updates }),
      });
      loadUsers();
      setEditingUser(null);
    } catch (e) {
      console.error('Failed to update user:', e);
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE', headers });
      loadUsers();
    } catch (e) {
      console.error('Failed to delete user:', e);
    }
  };

  const exportUsers = () => {
    const csv = [
      ['Name', 'Email', 'Role', 'Membership', 'Signup Date', 'Last Login', 'Email Verified'].join(','),
      ...users.map(u => [
        `"${u.name}"`,
        u.email,
        u.role,
        u.membership_type || 'free',
        new Date(u.created_at).toLocaleDateString(),
        u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never',
        u.email_verified ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    premium: users.filter(u => u.membership_type === 'premium').length,
    vip: users.filter(u => u.membership_type === 'vip').length,
  };

  return (
    <div data-testid="admin-users-manager">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Playfair Display, serif' }}>Users Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage registered users and paid members</p>
        </div>
        <button onClick={exportUsers} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A2E]">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Users</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A2E]">{stats.admins}</p>
              <p className="text-xs text-gray-500">Admins</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Crown className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A2E]">{stats.premium}</p>
              <p className="text-xs text-gray-500">Premium</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Crown className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A2E]">{stats.vip}</p>
              <p className="text-xs text-gray-500">VIP Members</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 outline-none"
            data-testid="user-search-input"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-xl outline-none min-w-[140px]"
          data-testid="role-filter"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <select
          value={membershipFilter}
          onChange={(e) => setMembershipFilter(e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-xl outline-none min-w-[160px]"
          data-testid="membership-filter"
        >
          <option value="all">All Memberships</option>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
          <option value="vip">VIP Lifetime</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left py-4 px-4 font-medium text-gray-600">User</th>
                <th className="text-left py-4 px-4 font-medium text-gray-600">Role</th>
                <th className="text-left py-4 px-4 font-medium text-gray-600">Membership</th>
                <th className="text-left py-4 px-4 font-medium text-gray-600">Signup Date</th>
                <th className="text-left py-4 px-4 font-medium text-gray-600">Last Login</th>
                <th className="text-left py-4 px-4 font-medium text-gray-600">Status</th>
                <th className="text-right py-4 px-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No users found</td></tr>
              ) : users.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-200 to-orange-400 flex items-center justify-center text-white font-bold text-sm">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-[#1A1A2E]">{user.name}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role === 'admin' && <Shield className="w-3 h-3" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.membership_type === 'vip' ? 'bg-purple-100 text-purple-700' :
                      user.membership_type === 'premium' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {(user.membership_type === 'vip' || user.membership_type === 'premium') && <Crown className="w-3 h-3" />}
                      {user.membership_type || 'Free'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.email_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {user.email_verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setEditingUser(user)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-[#F97316]"
                        title="Edit user"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteUser(user.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-500 hover:text-red-500"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-[#1A1A2E] mb-4">Edit User</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg outline-none"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Membership</label>
                <select
                  value={editingUser.membership_type || 'free'}
                  onChange={(e) => setEditingUser({ ...editingUser, membership_type: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg outline-none"
                >
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                  <option value="vip">VIP Lifetime</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-gray-600 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => updateUser(editingUser.id, { 
                  name: editingUser.name, 
                  email: editingUser.email, 
                  role: editingUser.role,
                  membership_type: editingUser.membership_type 
                })}
                className="flex-1 px-4 py-3 bg-[#F97316] text-white rounded-lg font-medium hover:bg-[#EA6C10]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
