import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import {
  Users, BarChart3, Activity, Zap, Server, Shield, ArrowLeft,
  UserPlus, Trash2, Edit3, Save, X, Loader2, Settings, AlertTriangle,
  Database, Cpu, CheckCircle, XCircle, Clock
} from 'lucide-react';

// ── Stat Card ──────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = 'brand' }) {
  const colors = {
    brand: 'bg-brand-500/15 text-brand-400 border-brand-500/20',
    green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    red: 'bg-red-500/15 text-red-400 border-red-500/20',
  };
  return (
    <div className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg border ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm text-text-secondary font-medium">{label}</span>
      </div>
      <div className="text-3xl font-extrabold tracking-tight">{value}</div>
    </div>
  );
}

// ── Main Admin Page ────────────────────────────────────────
export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [features, setFeatures] = useState({});
  const [system, setSystem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect non-admins
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/chat');
    }
  }, [user, navigate]);

  // Load all data on mount
  useEffect(() => {
    if (user?.role === 'admin') loadAll();
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, usersRes, featuresRes, systemRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/features'),
        api.get('/admin/system'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setFeatures(featuresRes.data);
      setSystem(systemRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  const handleToggleFeature = async (key, currentValue) => {
    try {
      const res = await api.put('/admin/features', { [key]: !currentValue });
      setFeatures(res.data);
    } catch (err) {
      alert('Failed to update feature');
    }
  };

  if (!user || user.role !== 'admin') return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'features', label: 'Features', icon: Settings },
    { id: 'system', label: 'System', icon: Server },
  ];

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Top Bar */}
      <div className="glass-panel border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link to="/chat" className="p-2 rounded-lg hover:bg-white/5 transition-colors text-text-secondary hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-400" />
            <h1 className="text-lg font-bold">Admin Dashboard</h1>
          </div>
        </div>
        <button onClick={loadAll} className="text-sm text-brand-400 hover:text-brand-300 font-medium transition-colors">
          Refresh Data
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1 glass-panel rounded-xl w-fit border border-white/5">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-brand-600 text-white shadow-lg' 
                  : 'text-text-secondary hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
          </div>
        ) : (
          <>
            {/* ── Overview Tab ── */}
            {activeTab === 'overview' && stats && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={Users} label="Total Users" value={stats.total_users} color="brand" />
                  <StatCard icon={BarChart3} label="Total Queries" value={stats.total_queries} color="purple" />
                  <StatCard icon={Activity} label="Queries Today" value={stats.today_queries} color="green" />
                  <StatCard icon={Clock} label="Avg Latency" value={`${stats.avg_latency_ms}ms`} color="amber" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="glass-panel p-6 rounded-2xl border border-white/5">
                    <h3 className="text-sm font-bold text-text-secondary mb-4 uppercase tracking-wider">User Plans Distribution</h3>
                    <div className="space-y-3">
                      {Object.entries(stats.plans).map(([plan, count]) => (
                        <div key={plan} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{plan}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full gradient-bg"
                                style={{ width: `${stats.total_users > 0 ? (count / stats.total_users) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-sm text-text-secondary w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-panel p-6 rounded-2xl border border-white/5">
                    <h3 className="text-sm font-bold text-text-secondary mb-4 uppercase tracking-wider">RAG Pipeline Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Index Loaded</span>
                        {stats.index_loaded ? (
                          <span className="flex items-center gap-1 text-emerald-400 text-sm"><CheckCircle className="w-4 h-4" /> Active</span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-400 text-sm"><XCircle className="w-4 h-4" /> Not Loaded</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Active Users</span>
                        <span className="text-sm text-text-secondary">{stats.active_users}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Sessions</span>
                        <span className="text-sm text-text-secondary">{stats.total_sessions}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Users Tab ── */}
            {activeTab === 'users' && (
              <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                  <h3 className="font-bold">Registered Users ({users.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-text-secondary text-left">
                        <th className="px-5 py-3 font-medium">ID</th>
                        <th className="px-5 py-3 font-medium">Name</th>
                        <th className="px-5 py-3 font-medium">Email</th>
                        <th className="px-5 py-3 font-medium">Plan</th>
                        <th className="px-5 py-3 font-medium">Role</th>
                        <th className="px-5 py-3 font-medium">Sessions</th>
                        <th className="px-5 py-3 font-medium">Queries</th>
                        <th className="px-5 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3 text-text-muted">{u.id}</td>
                          <td className="px-5 py-3 font-medium">{u.name}</td>
                          <td className="px-5 py-3 text-text-secondary">{u.email}</td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                              u.plan === 'Enterprise' ? 'bg-purple-500/20 text-purple-300' :
                              u.plan === 'Pro' ? 'bg-brand-500/20 text-brand-300' :
                              'bg-white/10 text-text-secondary'
                            }`}>{u.plan}</span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                              u.role === 'admin' ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-text-secondary'
                            }`}>{u.role}</span>
                          </td>
                          <td className="px-5 py-3 text-text-secondary">{u.sessions_count}</td>
                          <td className="px-5 py-3 text-text-secondary">{u.queries_count}</td>
                          <td className="px-5 py-3">
                            {u.role !== 'admin' && (
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Features Tab ── */}
            {activeTab === 'features' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'maintenance_mode', label: 'Maintenance Mode', desc: 'Disable all user-facing features', danger: true },
                  { key: 'allow_registrations', label: 'Allow Registrations', desc: 'Let new users sign up' },
                  { key: 'allow_free_tier', label: 'Allow Free Tier', desc: 'Enable the free usage tier' },
                  { key: 'hybrid_search_enabled', label: 'Hybrid Search', desc: 'Use BM25 + Vector for retrieval' },
                  { key: 'reranker_enabled', label: 'Reranker', desc: 'Enable cross-encoder reranking' },
                ].map(f => (
                  <div key={f.key} className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm">{f.label}</div>
                      <div className="text-xs text-text-muted mt-0.5">{f.desc}</div>
                    </div>
                    <button
                      onClick={() => handleToggleFeature(f.key, features[f.key])}
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        features[f.key] ? (f.danger ? 'bg-red-500' : 'bg-brand-500') : 'bg-white/10'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                        features[f.key] ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                ))}

                <div className="glass-panel p-5 rounded-2xl border border-white/5">
                  <div className="font-bold text-sm mb-1">AI Model</div>
                  <div className="text-xs text-text-muted mb-3">Currently active LLM</div>
                  <div className="text-lg font-mono text-brand-400">{features.ai_model || 'gemini-2.5-flash'}</div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-white/5">
                  <div className="font-bold text-sm mb-1">RAG Parameters</div>
                  <div className="text-xs text-text-muted mb-3">Retrieval configuration</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-text-secondary">Top K</span><span className="font-mono">{features.rag_top_k}</span></div>
                    <div className="flex justify-between"><span className="text-text-secondary">Rerank Top N</span><span className="font-mono">{features.rag_rerank_top_n}</span></div>
                    <div className="flex justify-between"><span className="text-text-secondary">Rate Limit/min</span><span className="font-mono">{features.rate_limit_per_min}</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* ── System Tab ── */}
            {activeTab === 'system' && system && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-2xl border border-white/5">
                  <h3 className="text-sm font-bold text-text-secondary mb-4 uppercase tracking-wider flex items-center gap-2">
                    <Cpu className="w-4 h-4" /> Server Info
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-text-secondary">Status</span><span className="text-emerald-400 font-bold">{system.status}</span></div>
                    <div className="flex justify-between"><span className="text-text-secondary">Python</span><span className="font-mono">{system.python_version}</span></div>
                    <div className="flex justify-between"><span className="text-text-secondary">Platform</span><span className="font-mono text-xs">{system.platform}</span></div>
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-white/5">
                  <h3 className="text-sm font-bold text-text-secondary mb-4 uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4" /> Database
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-text-secondary">Engine</span><span>{system.database.engine}</span></div>
                    <div className="flex justify-between"><span className="text-text-secondary">Size</span><span>{system.database.size_kb} KB</span></div>
                    <div className="flex justify-between"><span className="text-text-secondary">Users</span><span>{system.database.users_count}</span></div>
                    <div className="flex justify-between"><span className="text-text-secondary">Sessions</span><span>{system.database.sessions_count}</span></div>
                    <div className="flex justify-between"><span className="text-text-secondary">Messages</span><span>{system.database.messages_count}</span></div>
                    <div className="flex justify-between"><span className="text-text-secondary">Query Logs</span><span>{system.database.logs_count}</span></div>
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-white/5 md:col-span-2">
                  <h3 className="text-sm font-bold text-text-secondary mb-4 uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4" /> RAG Pipeline
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-text-muted text-xs mb-1">Index Loaded</div>
                      <div className={system.rag_pipeline.index_loaded ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {system.rag_pipeline.index_loaded ? 'Yes' : 'No'}
                      </div>
                    </div>
                    <div>
                      <div className="text-text-muted text-xs mb-1">Vector Store</div>
                      <div className="font-mono">{system.rag_pipeline.vector_store}</div>
                    </div>
                    <div>
                      <div className="text-text-muted text-xs mb-1">Vectors Indexed</div>
                      <div className="font-mono">{system.rag_pipeline.vectors_indexed}</div>
                    </div>
                    <div>
                      <div className="text-text-muted text-xs mb-1">Total Acts</div>
                      <div className="font-mono">{system.rag_pipeline.total_acts_corpus.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-text-muted text-xs mb-1">Total Sections</div>
                      <div className="font-mono">{system.rag_pipeline.total_sections_corpus.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-text-muted text-xs mb-1">Embedding Model</div>
                      <div className="font-mono text-xs">{system.rag_pipeline.embedding_model}</div>
                    </div>
                    <div>
                      <div className="text-text-muted text-xs mb-1">LLM Model</div>
                      <div className="font-mono text-xs">{system.rag_pipeline.llm_model}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
