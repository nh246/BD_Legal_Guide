import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Video, MessageSquare } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

export default function MyBookingsPage() {
  // Mock bookings
  const bookings = [
    {
      id: 'b1',
      lawyerName: 'Adv. Sarah Rahman',
      date: 'Oct 15, 2026',
      time: '10:00 AM',
      status: 'confirmed',
      meetLink: 'https://meet.google.com/abc-defg-hij',
      // Simulate that this meeting is happening very soon
      isJoinable: true 
    },
    {
      id: 'b2',
      lawyerName: 'Adv. Kazi Hassan',
      date: 'Oct 18, 2026',
      time: '02:00 PM',
      status: 'pending',
      isJoinable: false
    },
    {
      id: 'b3',
      lawyerName: 'Adv. Nusrat Jahan',
      date: 'Sep 20, 2026',
      time: '11:00 AM',
      status: 'completed',
      isJoinable: false
    }
  ];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'confirmed': return <Badge variant="success">Confirmed</Badge>;
      case 'pending': return <Badge variant="warning">Pending Approval</Badge>;
      case 'completed': return <Badge variant="default">Completed</Badge>;
      case 'cancelled': return <Badge variant="danger">Cancelled</Badge>;
      default: return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-50">My Consultations</h1>
          <p className="text-zinc-400 mt-2">Manage your upcoming and past legal consultations.</p>
        </div>

        {bookings.length === 0 ? (
          <EmptyState 
            icon={Calendar}
            title="No bookings yet"
            description="You haven't booked any consultations with our verified lawyers yet."
            action={
              <Link to="/lawyers">
                <Button>Find a Lawyer</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-6">
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-zinc-500 mb-1">Lawyer</div>
                    <div className="font-semibold text-zinc-50">{booking.lawyerName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-500 mb-1">Date & Time</div>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Clock className="h-4 w-4" />
                      {booking.date} at {booking.time}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-500 mb-1">Status</div>
                    <div>{getStatusBadge(booking.status)}</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 md:shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-800">
                  {booking.status === 'confirmed' ? (
                    <Button 
                      className={`gap-2 ${booking.isJoinable ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}
                      disabled={!booking.isJoinable}
                    >
                      <Video className="h-4 w-4" /> 
                      {booking.isJoinable ? 'Join Meeting' : 'Join Link Not Ready'}
                    </Button>
                  ) : booking.status === 'completed' ? (
                    <Button variant="secondary" className="gap-2">
                      Leave Review
                    </Button>
                  ) : null}
                  
                  <Link to={`/consultation/${booking.id}`}>
                    <Button variant="ghost" className="w-full sm:w-auto gap-2">
                      <MessageSquare className="h-4 w-4" /> Message
                    </Button>
                  </Link>
                </div>
                
              </Card>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
