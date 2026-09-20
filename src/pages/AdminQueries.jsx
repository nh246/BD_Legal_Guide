import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Search, Filter, MessageSquare, ExternalLink } from 'lucide-react';

const AdminQueries = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data for queries since we don't have the specific endpoint yet
  const queries = [
    { id: 1, user: 'lawyer@example.com', query: 'What is the punishment for murder?', response_time: 1.2, timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 2, user: 'student@example.com', query: 'Define cyber bullying under Digital Security Act', response_time: 0.8, timestamp: new Date(Date.now() - 7200000).toISOString() },
    { id: 3, user: 'admin@example.com', query: 'What are the rights of a female worker?', response_time: 1.5, timestamp: new Date(Date.now() - 86400000).toISOString() },
    { id: 4, user: 'lawyer@example.com', query: 'Procedure for registering a trade union', response_time: 1.1, timestamp: new Date(Date.now() - 90000000).toISOString() },
  ];

  const filteredQueries = queries.filter(q => 
    q.query.toLowerCase().includes(searchQuery.toLowerCase()) || 
    q.user.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow pt-24 pb-12 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Query Audit Log</h1>
            <p className="text-gray-400">Monitor all AI queries made by users across the system.</p>
          </div>
          
          <div className="flex space-x-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search queries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors w-full sm:w-64"
              />
            </div>
            <button className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg flex items-center transition-colors">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-300 w-1/2">Query</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-300">User</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-300">Time / Latency</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-300 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredQueries.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No queries found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredQueries.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-white text-sm font-medium line-clamp-2">{log.query}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {log.user}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-400">{new Date(log.timestamp).toLocaleString()}</div>
                        <div className="text-xs text-blue-400 mt-1">{log.response_time}s</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="inline-flex items-center text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">
                          View details <ExternalLink className="w-3 h-3 ml-1" />
                        </button>
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

export default AdminQueries;
