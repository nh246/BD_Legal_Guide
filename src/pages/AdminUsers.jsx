import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../lib/api';
import { Loader2, Search, Shield, UserX, UserCheck } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Normally this would be a real endpoint
        const response = await api.get('/admin/stats');
        // Since we don't have a real users endpoint yet, we'll mock it for the UI
        setUsers([
          { id: 1, email: 'admin@example.com', full_name: 'Admin User', is_admin: true, plan_type: 'enterprise', created_at: new Date().toISOString() },
          { id: 2, email: 'lawyer@example.com', full_name: 'Jane Doe', is_admin: false, plan_type: 'pro', created_at: new Date(Date.now() - 86400000).toISOString() },
          { id: 3, email: 'student@example.com', full_name: 'John Smith', is_admin: false, plan_type: 'free', created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
        ]);
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow pt-24 pb-12 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
            <p className="text-gray-400">View and manage all registered users.</p>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors w-full sm:w-64"
            />
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-300">User</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-300">Plan</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-300">Role</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-300">Joined</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-300 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center">
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No users found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold mr-3 flex-shrink-0">
                            {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-white font-medium">{user.full_name || 'No Name'}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${
                          user.plan_type === 'enterprise' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                          user.plan_type === 'pro' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}>
                          {user.plan_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.is_admin ? (
                          <span className="inline-flex items-center text-sm text-amber-400">
                            <Shield className="w-4 h-4 mr-1" /> Admin
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">User</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Edit User">
                            <UserCheck className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Ban User">
                            <UserX className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminUsers;
