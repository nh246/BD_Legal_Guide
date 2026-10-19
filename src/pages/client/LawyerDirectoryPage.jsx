import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, ShieldCheck, BadgeCheck, FilterX, Users, Calendar, Briefcase } from 'lucide-react';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/PageStates';
import useApi from '../../lib/useApi';
import { asList } from '../../lib/api';

const SPECIALTIES = ['All', 'Corporate Law', 'Criminal Defense', 'Family Law', 'Property & Land', 'Constitutional Law', 'Labour Law'];

export default function LawyerDirectoryPage() {
  const { data, loading, error, reload } = useApi('/lawyers');
  const lawyers = asList(data, 'lawyers');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedDistrict, setSelectedDistrict] = useState('All');

  // Extract unique districts from live backend data
  const districts = useMemo(() => {
    const set = new Set();
    lawyers.forEach((l) => {
      if (l.district) set.add(l.district);
    });
    return ['All', ...Array.from(set)];
  }, [lawyers]);

  const filteredLawyers = useMemo(() => {
    return lawyers.filter((lawyer) => {
      const term = searchTerm.toLowerCase();
      const name = (lawyer.name || '').toLowerCase();
      const district = (lawyer.district || '').toLowerCase();
      const specialization = (lawyer.specialization || '').toLowerCase();

      // Filter by search term (name, district, or specialization)
      const matchesSearch =
        !term || name.includes(term) || district.includes(term) || specialization.includes(term);

      // Filter by selected specialty chip
      const matchesSpecialty =
        selectedSpecialty === 'All' ||
        specialization.includes(selectedSpecialty.toLowerCase());

      // Filter by selected district dropdown
      const matchesDistrict =
        selectedDistrict === 'All' ||
        district === selectedDistrict.toLowerCase();

      return matchesSearch && matchesSpecialty && matchesDistrict;
    });
  }, [lawyers, searchTerm, selectedSpecialty, selectedDistrict]);

  const getInitials = (name = '') => {
    return (
      name
        .replace('Adv. ', '')
        .replace('Advocate ', '')
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'AD'
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSpecialty('All');
    setSelectedDistrict('All');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-zinc-50 mb-2">Find a Bangladesh Advocate</h1>
          <p className="text-zinc-400 font-medium text-sm">
            {loading ? 'Searching advocate directory...' : `Showing ${filteredLawyers.length} verified legal practitioners`}
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input: Name, District, or Specialization */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                id="lawyer-directory-search"
                type="text"
                placeholder="Search by advocate name, district, or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-zinc-50 placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500/50 outline-none"
              />
            </div>

            {/* District Dropdown */}
            <div className="sm:w-56">
              <select
                id="district-filter-select"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none cursor-pointer"
              >
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d === 'All' ? 'All Districts' : d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Specialty Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mr-1">
              Practice Area:
            </span>
            {SPECIALTIES.map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedSpecialty(spec)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                  selectedSpecialty === spec
                    ? 'bg-blue-600/15 text-blue-400 border-blue-500/40 shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {/* Content State Handling */}
        {loading ? (
          <LoadingState label="Loading verified advocates directory..." />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : lawyers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No lawyers listed yet"
            description="Verified Bangladesh Bar Council advocates will appear here."
          />
        ) : filteredLawyers.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
            <div className="h-14 w-14 bg-zinc-900 rounded-full flex items-center justify-center mb-4 text-zinc-500">
              <FilterX className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-1">No matching lawyers found</h3>
            <p className="text-zinc-400 text-sm mb-5 max-w-sm">
              No verified lawyers matched your current filter or search criteria.
            </p>
            <button
              onClick={clearFilters}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLawyers.map((lawyer) => {
              const district = lawyer.district || 'Dhaka';
              const specialization = lawyer.specialization || 'General Legal Practice';
              const isGold = lawyer.verification_paid;

              return (
                <div
                  key={lawyer.id}
                  className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden transition-all flex flex-col shadow-sm"
                >
                  <div className="p-5 flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      {/* Avatar initials */}
                      <div
                        className={`shrink-0 h-14 w-14 rounded-full flex items-center justify-center text-lg font-bold ${
                          isGold ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {getInitials(lawyer.name)}
                      </div>

                      {/* Header Details */}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-zinc-50 flex items-center gap-1.5 truncate">
                          <span className="truncate">{lawyer.name}</span>
                          {isGold ? (
                            <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" title="Gold Verified Advocate" />
                          ) : (
                            <BadgeCheck className="h-4 w-4 text-blue-400 shrink-0" title="Bar Council Verified" />
                          )}
                        </h3>

                        <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-zinc-500" /> {district}
                          </span>
                          {lawyer.bar_council_id && (
                            <span className="font-mono text-zinc-500">ID: {lawyer.bar_council_id}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Specialization & Category */}
                    <div className="mb-4">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium mb-2">
                        <Briefcase className="h-3.5 w-3.5 text-blue-400" />
                        <span>Specialization:</span>
                      </div>
                      <span className="inline-block bg-zinc-950 text-blue-300 border border-zinc-800 text-xs px-2.5 py-1 rounded-md font-medium">
                        {specialization}
                      </span>
                    </div>

                    {lawyer.phone && (
                      <p className="text-xs text-zinc-500 font-mono">
                        Contact: {lawyer.phone}
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="border-t border-zinc-800 p-4 bg-zinc-950/50 flex items-center justify-between gap-3 mt-auto">
                    <Link
                      to={`/client/lawyers/${lawyer.id}`}
                      className="text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
                    >
                      View Profile
                    </Link>

                    <Link
                      to={`/client/book/${lawyer.id}`}
                      className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
                    >
                      <Calendar className="h-3.5 w-3.5" /> Book Consultation
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
