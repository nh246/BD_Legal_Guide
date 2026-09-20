import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, Video, ExternalLink } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function ConsultationChatPage() {
  const { id } = useParams();
  const [input, setInput] = useState('');
  
  // Mock data
  const lawyerName = "Adv. Sarah Rahman";
  const meetLink = "https://meet.google.com/abc-defg-hij";
  
  const [messages, setMessages] = useState([
    { id: 1, sender: 'lawyer', text: 'Hello! I have reviewed your case brief.', time: '10:30 AM' },
    { id: 2, sender: 'lawyer', text: 'Please ensure you have the tenancy agreement ready before our call.', time: '10:31 AM' },
    { id: 3, sender: 'client', text: 'Hi! Yes, I have it scanned and ready.', time: '10:35 AM' }
  ]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, {
      id: Date.now(),
      sender: 'client',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-zinc-950">
      
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/bookings" className="p-2 -ml-2 text-zinc-400 hover:text-zinc-50 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500 font-bold border border-blue-500/20">
              SR
            </div>
            <div>
              <h2 className="text-zinc-50 font-semibold">{lawyerName}</h2>
              <p className="text-xs text-zinc-400">Consultation #{id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pinned Meeting Banner */}
      <div className="bg-blue-600/10 border-b border-blue-500/20 px-4 py-3 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-blue-400">
          <Video className="h-5 w-5" />
          <span className="text-sm font-medium">Video Consultation Link</span>
        </div>
        <a href={meetLink} target="_blank" rel="noopener noreferrer">
          <Button size="sm" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white gap-2">
            Join Meeting <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'client' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
              msg.sender === 'client' 
                ? 'bg-blue-600 text-white rounded-tr-sm' 
                : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-sm'
            }`}>
              <p className="text-sm">{msg.text}</p>
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 px-1">{msg.time}</span>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-zinc-900 border-t border-zinc-800 shrink-0">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-50 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none max-h-32 scrollbar-thin scrollbar-thumb-zinc-800"
            rows="1"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className="h-[46px] w-[46px] shrink-0 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors"
          >
            <Send className="h-5 w-5 ml-1" />
          </button>
        </div>
      </div>

    </div>
  );
}
