import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, MapPin, ShieldCheck, Clock, Calendar as CalendarIcon, Video } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';

export default function LawyerProfilePage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('about');

  // Mock data
  const lawyer = {
    name: 'Adv. Sarah Rahman',
    verificationStatus: 'gold_verified',
    barCouncilId: 'BD-****-892',
    specialties: ['Property', 'Family', 'Corporate'],
    locations: ['Dhaka', 'Chittagong'],
    hourlyRateBdt: 2000,
    rating: 4.9,
    reviewCount: 128,
    image: 'https://i.pravatar.cc/150?u=sarah',
    bio: 'With over 12 years of experience at the Supreme Court of Bangladesh, I specialize in complex property disputes and corporate litigation. I believe in providing clear, actionable legal advice to my clients.',
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950">
      
      {/* Profile Header Background */}
      <div className="h-48 bg-gradient-to-r from-zinc-900 to-blue-900/20 border-b border-zinc-800"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Profile Info */}
          <div className="flex-1 -mt-16">
            
            {/* Header Info */}
            <div className="flex flex-col sm:flex-row gap-6 items-start mb-8">
              <img src={lawyer.image} alt={lawyer.name} className="h-32 w-32 rounded-2xl object-cover border-4 border-zinc-950 shadow-xl" />
              <div className="pt-2 sm:pt-16">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-zinc-50">{lawyer.name}</h1>
                  {lawyer.verificationStatus === 'gold_verified' && (
                    <Badge variant="warning" className="gap-1"><ShieldCheck className="h-3 w-3" /> Gold Verified</Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-400">
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {lawyer.locations.join(', ')}</span>
                  <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Bar ID: {lawyer.barCouncilId}</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs>
              <TabsList>
                <TabsTrigger isActive={activeTab === 'about'} onClick={() => setActiveTab('about')}>About</TabsTrigger>
                <TabsTrigger isActive={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')}>Reviews ({lawyer.reviewCount})</TabsTrigger>
              </TabsList>

              <TabsContent isActive={activeTab === 'about'}>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-50 mb-3">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {lawyer.specialties.map(spec => (
                        <span key={spec} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-50 mb-3">Biography</h3>
                    <p className="text-zinc-400 leading-relaxed">{lawyer.bio}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent isActive={activeTab === 'reviews'}>
                <div className="text-zinc-400 text-sm">Reviews will be loaded here...</div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column: Sticky Booking Widget */}
          <div className="w-full lg:w-80 lg:shrink-0 lg:-mt-16">
            <div className="sticky top-24">
              <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-md">
                <CardContent className="p-6">
                  
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-zinc-400 font-medium">Consultation Fee</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-zinc-50">Tk. {lawyer.hourlyRateBdt}</div>
                      <div className="text-xs text-zinc-500">per session (45 mins)</div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3 text-sm text-zinc-300">
                      <Video className="h-5 w-5 text-blue-500" />
                      <span>Video Consultation (Google Meet)</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-zinc-300">
                      <Clock className="h-5 w-5 text-emerald-500" />
                      <span>Usually available within 24hrs</span>
                    </div>
                  </div>

                  <Link to={`/consultation/book/${id}`} className="block w-full">
                    <Button size="lg" className="w-full gap-2 text-base">
                      <CalendarIcon className="h-5 w-5" /> Book Consultation
                    </Button>
                  </Link>

                  <p className="text-xs text-center text-zinc-500 mt-4">
                    You won't be charged until the lawyer accepts.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
