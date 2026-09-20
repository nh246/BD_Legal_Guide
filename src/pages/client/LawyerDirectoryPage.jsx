import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, MapPin, Star, ShieldCheck, BadgeCheck, FilterX } from 'lucide-react';
import { mockLawyers } from '../../data/mockLawyers';

const SPECIALTIES = ['Property', 'Family', 'Criminal', 'Labour', 'Corporate', 'Consumer'];
const LOCATIONS = ['Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna'];

export default function LawyerDirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSpecialty = searchParams.get('specialty');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty || '');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [goldOnly, setGoldOnly] = useState(false);

  const toggleSpecialty = (spec) => {
    const newVal = selectedSpecialty === spec ? '' : spec;
    setSelectedSpecialty(newVal);
    
    // Update URL param
    const newParams = new URLSearchParams(searchParams);
    if (newVal) {
      newParams.set('specialty', newVal);
    } else {
      newParams.delete('specialty');
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSpecialty('');
    setSelectedLocation('');
    setGoldOnly(false);
    setSearchParams({});
  };

  const filteredLawyers = useMemo(() => {
    return mockLawyers.filter(lawyer => {
      const matchesSearch = lawyer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            lawyer.bio.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSpecialty = selectedSpecialty ? lawyer.specialties.includes(selectedSpecialty) : true;
      const matchesLocation = selectedLocation ? lawyer.locations.includes(selectedLocation) : true;
      const matchesGold = goldOnly ? lawyer.tier === 'gold' : true;

      return matchesSearch && matchesSpecialty && matchesLocation && matchesGold;
    });
  }, [searchTerm, selectedSpecialty, selectedLocation, goldOnly]);

  const getInitials = (name) => {
    return name.replace('Adv. ', '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-50 mb-2">Find your lawyer</h1>
          <p className="text-zinc-500 font-medium">Showing {filteredLawyers.length} verified professionals</p>
        </div>

        {/* Filters */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-8 space-y-5">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search by name or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none"
              />
            </div>
            {/* Location */}
            <div className="sm:w-64">
              <select 
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none cursor-pointer"
              >
                <option value="">All Locations</option>
                {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>
            {/* Gold Toggle */}
            <label className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 cursor-pointer hover:bg-zinc-900 transition-colors">
              <div className="relative flex items-center justify-center shrink-0">
                <input type="checkbox" className="peer sr-only" 
                  checked={goldOnly} onChange={(e) => setGoldOnly(e.target.checked)}
                />
                <div className="w-9 h-5 bg-zinc-800 rounded-full peer-checked:bg-amber-500 transition-colors"></div>
                <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform peer-checked:translate-x-4"></div>
              </div>
              <span className="text-sm font-medium text-amber-500 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Gold verified only
              </span>
            </label>
          </div>

          {/* Specialty Chips */}
          <div>
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Practice Areas</div>
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES.map(spec => (
                <button 
                  key={spec}
                  onClick={() => toggleSpecialty(spec)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    selectedSpecialty === spec
                      ? 'bg-blue-600/10 text-blue-400 border-blue-500/40'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        {filteredLawyers.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
              <FilterX className="h-8 w-8 text-zinc-500" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-50 mb-2">No lawyers found</h3>
            <p className="text-zinc-400 mb-6 max-w-sm">Try adjusting your filters or clearing your search criteria to see more results.</p>
            <button onClick={clearFilters} className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLawyers.map(lawyer => (
              <div key={lawyer.id} className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden transition-all flex flex-col">
                <div className="p-5 flex-1">
                  
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`shrink-0 h-14 w-14 rounded-full flex items-center justify-center text-xl font-bold ${
                      lawyer.tier === 'gold' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-600/10 text-blue-500'
                    }`}>
                      {getInitials(lawyer.name)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-50 flex items-center gap-1.5">
                        {lawyer.name}
                        {lawyer.tier === 'gold' 
                          ? <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0" title="Gold Verified" />
                          : <BadgeCheck className="h-5 w-5 text-blue-500 shrink-0" title="Verified" />
                        }
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-zinc-400 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {lawyer.locations[0]}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> 
                          {lawyer.rating} <span className="text-zinc-500">({lawyer.reviewCount})</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-400 mb-4 line-clamp-2 leading-relaxed">
                    {lawyer.bio}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {lawyer.specialties.slice(0, 3).map(spec => (
                      <span key={spec} className="bg-zinc-800 text-zinc-300 text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded">
                        {spec}
                      </span>
                    ))}
                    {lawyer.specialties.length > 3 && (
                      <span className="bg-zinc-800 text-zinc-500 text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded">
                        +{lawyer.specialties.length - 3}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs text-zinc-500 font-medium">
                    {lawyer.experienceYrs} years experience
                  </div>
                </div>

                <div className="border-t border-zinc-800 p-4 bg-zinc-950/50 flex items-center justify-between mt-auto">
                  <div>
                    <span className="text-lg font-bold text-zinc-50">৳{lawyer.rateBdt.toLocaleString()}</span>
                    <span className="text-xs text-zinc-500">/hr</span>
                  </div>
                  <Link 
                    to={`/lawyers/${lawyer.id}`}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
