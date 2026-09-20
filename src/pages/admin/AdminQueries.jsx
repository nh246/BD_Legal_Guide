import React from 'react';
import { Search, Bot, Zap, Filter } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function AdminQueries() {
  const queries = [
    { id: 'q1', user: 'Mohammed Ali', text: 'What is the punishment for theft?', mode: 'gemini', time: '10:42 AM, Today' },
    { id: 'q2', user: 'Sarah Rahman', text: 'Section 302 of the Penal Code', mode: 'rag', time: '10:15 AM, Today' },
    { id: 'q3', user: 'Kazi Hassan', text: 'Can a landlord evict a tenant without notice?', mode: 'gemini', time: '09:30 AM, Today' },
    { id: 'q4', user: 'Nusrat Jahan', text: 'Analyze this property deed [Attached Document]', mode: 'rag', time: 'Yesterday' },
    { id: 'q5', user: 'Anonymous', text: 'How to file for divorce?', mode: 'gemini', time: 'Yesterday' }
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-50">Query Logs</h1>
          <p className="text-zinc-400 mt-1">Monitor AI usage, query patterns, and mode distribution.</p>
        </div>

        <Card className="overflow-hidden border-zinc-800">
          <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/50">
            <div className="w-full max-w-sm">
              <Input iconLeft={Search} placeholder="Search queries or users..." className="h-9" />
            </div>
            <div className="flex gap-3 shrink-0">
              <Button variant="secondary" size="sm" className="gap-2">
                <Filter className="h-4 w-4" /> Mode: All
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-medium w-48">Timestamp</th>
                  <th className="px-6 py-4 font-medium w-48">User</th>
                  <th className="px-6 py-4 font-medium">Query Text</th>
                  <th className="px-6 py-4 font-medium w-32">AI Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-900">
                {queries.map((q) => (
                  <tr key={q.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-4 text-zinc-400 whitespace-nowrap">
                      {q.time}
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-300">
                      {q.user}
                    </td>
                    <td className="px-6 py-4 text-zinc-100 max-w-md truncate">
                      {q.text}
                    </td>
                    <td className="px-6 py-4">
                      {q.mode === 'rag' ? (
                        <Badge variant="pro" className="gap-1 px-2"><Zap className="h-3 w-3" /> RAG</Badge>
                      ) : (
                        <Badge variant="default" className="gap-1 px-2 text-zinc-300 bg-zinc-800 border border-zinc-700"><Bot className="h-3 w-3" /> Gemini</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between text-sm text-zinc-400">
            <span>Showing 5 of 1,842 queries</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-zinc-800 rounded hover:text-zinc-200 transition-colors">Prev</button>
              <button className="px-3 py-1 bg-zinc-800 rounded hover:text-zinc-200 transition-colors">Next</button>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
