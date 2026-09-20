import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Video, Check, Clock } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';

export default function BookingDetailPage() {
  const { id } = useParams();
  const [meetLink, setMeetLink] = useState('');

  // Mock data
  const req = {
    clientName: 'Mohammed Ali',
    date: 'Oct 19, 2026',
    time: '11:00 AM',
    brief: 'I need consultation regarding property inheritance laws. My father recently passed away without a will, and I need to understand how the property will be divided among 3 siblings according to Muslim Law.',
    status: 'pending' // pending | confirmed
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        
        <div className="mb-8">
          <Link to="/lawyer/dashboard" className="inline-flex items-center text-sm text-zinc-400 hover:text-zinc-50 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-zinc-50">Review Booking Request</h1>
        </div>

        <Card className="p-6 md:p-8 border-blue-500/20 shadow-xl shadow-blue-900/10 mb-6">
          <div className="flex items-center gap-2 text-sm text-blue-400 font-medium mb-6 bg-blue-500/10 w-fit px-3 py-1 rounded-full border border-blue-500/20">
            <Clock className="h-4 w-4" /> Requested for: {req.date} at {req.time}
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-zinc-500 mb-1">Client Name</h3>
              <p className="text-lg font-semibold text-zinc-50">{req.clientName}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-zinc-500 mb-2">Case Brief</h3>
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-zinc-300 leading-relaxed text-sm">
                {req.brief}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 md:p-8">
          <h2 className="text-xl font-semibold text-zinc-50 mb-2">Accept & Send Link</h2>
          <p className="text-sm text-zinc-400 mb-6">Provide a Google Meet or Zoom link to confirm this consultation.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="flex-1 w-full">
              <Input 
                iconLeft={Video}
                placeholder="https://meet.google.com/..."
                value={meetLink}
                onChange={(e) => setMeetLink(e.target.value)}
              />
            </div>
            <Button 
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 gap-2" 
              disabled={!meetLink.startsWith('http')}
            >
              <Check className="h-4 w-4" /> Confirm Booking
            </Button>
          </div>
        </Card>

      </div>
    </div>
  );
}
