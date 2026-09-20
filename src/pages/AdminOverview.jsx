import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../lib/api';
import { Users, MessageSquare, Database, Activity, Loader2, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/stats');
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch admin stats", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, linkTo }) => (
    <Link to={linkTo || "#"} className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col hover:border-white/20 hover:bg-white/5 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {linkTo && <ArrowUpRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />}
      </div>
      <div>
        <h3 className="text-3xl font-bold text-white mb-1">
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-gray-400" /> : value}
        </h3>
        <p className="text-sm text-gray-400 font-medium">{title}</p>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow pt-24 pb-12 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">System Overview</h1>
            <p className="text-gray-400">Admin dashboard for BD Legal AI.</p>
          </div>
          
          <div className="flex space-x-2">
            <Link to="/admin/users" className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors border border-white/10">
              Manage Users
            </Link>
            <Link to="/admin/queries" className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors border border-white/10">
              View Queries
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Users" 
            value={stats?.total_users || 0} 
            icon={Users} 
            color="bg-blue-500" 
            linkTo="/admin/users"
          />
          <StatCard 
            title="Total Queries" 
            value={stats?.total_queries || 0} 
            icon={MessageSquare} 
            color="bg-purple-500" 
            linkTo="/admin/queries"
          />
          <StatCard 
            title="Total Sessions" 
            value={stats?.total_sessions || 0} 
            icon={Activity} 
            color="bg-emerald-500" 
          />
          <StatCard 
            title="Database Size" 
            value="1.4K Acts" 
            icon={Database} 
            color="bg-orange-500" 
          />
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-white/10">
          <h2 className="text-xl font-bold text-white mb-6">System Health</h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">API Status</span>
                <span className="text-sm font-medium text-emerald-400">Online</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">FAISS Index Memory Usage</span>
                <span className="text-sm font-medium text-blue-400">162 MB</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '32%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">Google Gemini API Quota</span>
                <span className="text-sm font-medium text-yellow-400">24% Used</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '24%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminOverview;
