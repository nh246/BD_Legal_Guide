import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../lib/api';
import { MessageSquare, Clock, Zap, Crown, Loader2, Calendar } from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/chat/sessions');
        setSessions(response.data);
      } catch (error) {
        console.error("Failed to fetch sessions for dashboard", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow pt-24 pb-12 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.full_name?.split(' ')[0] || 'User'}</h1>
          <p className="text-gray-400">Here's an overview of your legal research activity.</p>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 flex items-center">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mr-4">
              <Crown className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium mb-1">Current Plan</p>
              <h3 className="text-xl font-bold text-white capitalize">{user?.plan_type || 'Free'}</h3>
            </div>
          </div>
          
          <div className="glass-panel p-6 rounded-2xl border border-white/10 flex items-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mr-4">
              <MessageSquare className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium mb-1">Total Chat Sessions</p>
              <h3 className="text-xl font-bold text-white">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : sessions.length}
              </h3>
            </div>
          </div>
          
          <div className="glass-panel p-6 rounded-2xl border border-white/10 flex items-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mr-4">
              <Zap className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium mb-1">Account Status</p>
              <h3 className="text-xl font-bold text-emerald-400">Active</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Sessions */}
          <div className="lg:col-span-2 glass-panel rounded-2xl border border-white/10 overflow-hidden flex flex-col h-[500px]">
            <div className="p-6 border-b border-white/5 bg-white/5">
              <h2 className="text-xl font-semibold text-white">Recent Research Sessions</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
                  <p>You haven't started any research yet.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {sessions.slice(0, 10).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group cursor-pointer">
                      <div className="flex items-center space-x-4 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                          <MessageSquare className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="truncate">
                          <h4 className="text-white font-medium truncate text-sm sm:text-base">{session.title || 'Untitled Session'}</h4>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(session.created_at)}
                          </div>
                        </div>
                      </div>
                      <a href={`/chat`} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors ml-4 flex-shrink-0">
                        Continue
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* User Profile */}
          <div className="glass-panel rounded-2xl border border-white/10 p-6 h-fit">
            <h2 className="text-xl font-semibold text-white mb-6">Profile Details</h2>
            
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Full Name</p>
                <p className="text-white font-medium bg-white/5 px-4 py-2.5 rounded-lg border border-white/5">{user?.full_name}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Email Address</p>
                <p className="text-white font-medium bg-white/5 px-4 py-2.5 rounded-lg border border-white/5">{user?.email}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Member Since</p>
                <div className="flex items-center text-white font-medium bg-white/5 px-4 py-2.5 rounded-lg border border-white/5">
                  <Calendar className="w-4 h-4 mr-2 text-blue-400" />
                  {formatDate(user?.created_at)}
                </div>
              </div>
            </div>
            
            <button className="w-full mt-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20">
              Manage Subscription
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DashboardPage;
