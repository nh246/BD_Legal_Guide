import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, MapPin, Star, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';

const mockLawyers = [
  {
    id: 'l1',
    name: 'Adv. Sarah Rahman',
    verificationStatus: 'gold_verified',
    specialties: ['Property', 'Family', 'Corporate'],
    locations: ['Dhaka', 'Chittagong'],
    hourlyRateBdt: 2000,
    rating: 4.9,
    reviewCount: 128,
    image: 'https://i.pravatar.cc/150?u=sarah'
  },
  {
    id: 'l2',
    name: 'Adv. Kazi Hassan',
    verificationStatus: 'ai_verified',
    specialties: ['Criminal', 'Litigation'],
    locations: ['Dhaka'],
    hourlyRateBdt: 1500,
    rating: 4.6,
    reviewCount: 84,
    image: 'https://i.pravatar.cc/150?u=kazi'
  },
  {
    id: 'l3',
    name: 'Adv. Nusrat Jahan',
    verificationStatus: 'gold_verified',
    specialties: ['Cyber Law', 'Corporate'],
    locations: ['Sylhet', 'Dhaka'],
    hourlyRateBdt: 2500,
    rating: 5.0,
    reviewCount: 42,
    image: 'https://i.pravatar.cc/150?u=nusrat'
  }
];

export default function LawyerDirectoryPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header & Search */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-50 mb-2">Find a Lawyer</h1>
          <p className="text-zinc-400 mb-6">Book consultations with Bar Council verified legal experts.</p>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input 
                iconLeft={Search}
                placeholder="Search by name, specialty, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="secondary" className="gap-2 shrink-0">
              <Filter className="h-4 w-4" /> Filters
            </Button>
          </div>
        </div>

        {/* Directory Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockLawyers.map(lawyer => (
            <Card key={lawyer.id} className="hover:border-blue-500/50 transition-colors flex flex-col">
              <CardContent className="p-5 flex-1 flex flex-col">
                
                <div className="flex items-start gap-4 mb-4">
                  <img src={lawyer.image} alt={lawyer.name} className="h-16 w-16 rounded-full object-cover border border-zinc-800" />
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-50 line-clamp-1">{lawyer.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      {lawyer.verificationStatus === 'gold_verified' ? (
                        <Badge variant="warning" className="gap-1 px-2 py-0.5"><ShieldCheck className="h-3 w-3" /> Gold Verified</Badge>
                      ) : (
                        <Badge variant="success" className="gap-1 px-2 py-0.5"><CheckCircle2 className="h-3 w-3" /> Verified</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 flex-1 mb-6">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                    <span className="text-zinc-300">{lawyer.locations.join(', ')}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {lawyer.specialties.map(spec => (
                      <span key={spec} className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50 mt-auto">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1 text-sm font-medium text-zinc-200">
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                      {lawyer.rating} <span className="text-zinc-500 font-normal">({lawyer.reviewCount})</span>
                    </div>
                    <span className="text-xs text-zinc-400 mt-0.5">Tk. {lawyer.hourlyRateBdt}/hr</span>
                  </div>
                  <Link to={`/lawyers/${lawyer.id}`}>
                    <Button size="sm">View Profile</Button>
                  </Link>
                </div>

              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
}
