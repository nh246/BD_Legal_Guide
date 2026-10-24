import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, ShieldCheck, BadgeCheck, FilterX, Users, Calendar, Briefcase, SearchX, Sparkles } from 'lucide-react';
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
  const [sortBy, setSortBy] = useState('relevance');

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

  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const match = timeStr.trim().match(/(\d{1,2}):(\d{2})(?:\s*([AP]M))?/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3] ? match[3].toUpperCase() : null;
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const sortedLawyers = useMemo(() => {
    const list = [...filteredLawyers];
    if (sortBy === 'exp_desc') {
      list.sort((a, b) => {
        const expA = a.years_exp ?? 8;
        const expB = b.years_exp ?? 8;
        return expB - expA;
      });
    } else if (sortBy === 'fee_asc') {
      list.sort((a, b) => {
        const rateA = a.hourly_rate ?? (a.verification_paid ? 2500 : 1500);
        const rateB = b.hourly_rate ?? (b.verification_paid ? 2500 : 1500);
        return rateA - rateB;
      });
    } else if (sortBy === 'fee_desc') {
      list.sort((a, b) => {
        const rateA = a.hourly_rate ?? (a.verification_paid ? 2500 : 1500);
        const rateB = b.hourly_rate ?? (b.verification_paid ? 2500 : 1500);
        return rateB - rateA;
      });
    } else if (sortBy === 'availability') {
      list.sort((a, b) => {
        const availA = a.next_available;
        const availB = b.next_available;
        if (availA && !availB) return -1;
        if (!availA && availB) return 1;
        if (!availA && !availB) return 0;
        const dateA = availA.date || '';
        const dateB = availB.date || '';
        if (dateA !== dateB) {
          return dateA.localeCompare(dateB);
        }
        const timeA = parseTimeToMinutes(availA.start_time);
        const timeB = parseTimeToMinutes(availB.start_time);
        return timeA - timeB;
      });
    }
    return list;
  }, [filteredLawyers, sortBy]);

  const isFiltered =
    searchTerm.trim() !== '' ||
    selectedSpecialty !== 'All' ||
    selectedDistrict !== 'All' ||
    sortBy !== 'relevance';

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSpecialty('All');
    setSelectedDistrict('All');
    setSortBy('relevance');
  };

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

  const formatNextDate = (isoDateStr) => {
    if (!isoDateStr) return '';
    try {
      const d = new Date(isoDateStr.includes('T') ? isoDateStr : `${isoDateStr}T00:00:00`);
      return d.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      });
    } catch {
      return isoDateStr;
    }
  };

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-zinc-50 mb-2">Find a Bangladesh Advocate</h1>
          <p className="text-zinc-400 font-medium text-sm">
            {loading ? 'Searching advocate directory...' : `Showing ${sortedLawyers.length} verified legal practitioners`}
          </p>
          <div className="text-xs text-zinc-500 mt-2.5 flex items-center flex-wrap gap-2">
            <span>🛡️ Gold Verified = Premium credential check &amp; priority</span>
            <span className="text-zinc-700">|</span>
            <span>✅ Admin Approved = Standard Bar Council verification</span>
          </div>
        </div>

        {/* Pro Hint Banner */}
        <div className="bg-amber-900/20 border border-amber-700/50 text-amber-200 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>✨ Pro members enjoy priority booking and direct messaging with verified lawyers.</span>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row flex-wrap lg:flex-nowrap gap-3 items-stretch sm:items-center">
            {/* Search Input: Name, District, or Specialization */}
            <div className="relative flex-1 min-w-[240px]">
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
            <div className="sm:w-44 lg:w-48 shrink-0">
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

            {/* Sort Dropdown */}
            <div className="sm:w-56 shrink-0">
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none cursor-pointer"
              >
                <option value="relevance">Relevance</option>
                <option value="exp_desc">Experience (High to Low)</option>
                <option value="fee_asc">Fee (Low to High)</option>
                <option value="fee_desc">Fee (High to Low)</option>
                <option value="availability">Earliest Availability</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            <button
              type="button"
              id="clear-filters-btn"
              onClick={clearFilters}
              className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg border text-sm font-medium transition-colors shrink-0 ${
                isFiltered
                  ? 'border-zinc-700 bg-zinc-950 hover:bg-zinc-800 text-zinc-200 hover:text-white shadow-sm cursor-pointer'
                  : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
              title="Reset search, district, specialization, and sort"
            >
              <FilterX className="h-4 w-4" />
              <span>Clear Filters</span>
            </button>
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
        ) : sortedLawyers.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded-2xl p-12 sm:p-16 flex flex-col items-center justify-center text-center bg-zinc-900/30">
            <div className="h-16 w-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mb-4 text-zinc-500 shadow-sm">
              <SearchX className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="text-xl font-bold text-zinc-50 mb-2">No lawyers match your criteria.</h3>
            <p className="text-zinc-400 text-sm mb-6 max-w-md leading-relaxed">
              Try adjusting your search terms, changing the district, or clearing your filters.
            </p>
            <button
              type="button"
              id="empty-clear-filters-btn"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors shadow-lg shadow-blue-500/20"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedLawyers.map((lawyer) => {
              const district = lawyer.district || 'Dhaka';
              const isGold = lawyer.verification_paid;
              const yearsExp = lawyer.years_exp ?? 8;
              const hourlyRate = lawyer.hourly_rate ?? (isGold ? 2500 : 1500);
              const languages = Array.isArray(lawyer.languages)
                ? lawyer.languages.join(', ')
                : (lawyer.languages || 'Bangla, English');

              const specTags = (lawyer.specialization || 'General Legal Practice')
                .split(/[,&]/)
                .map((s) => s.trim())
                .filter(Boolean);

              const nextAvail = lawyer.next_available;
              const formattedDate = nextAvail?.date ? formatNextDate(nextAvail.date) : '';

              return (
                <div
                  key={lawyer.id}
                  className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-5 transition-all h-full flex flex-col shadow-sm"
                >
                  {/* Top: Avatar */}
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`shrink-0 h-16 w-16 rounded-full overflow-hidden flex items-center justify-center border-2 ${
                        isGold
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-blue-600/10 text-blue-400 border-blue-500/30'
                      }`}
                    >
                      {lawyer.avatar_asset_id ? (
                        <img
                          src={`/api/assets/${lawyer.avatar_asset_id}/file`}
                          alt={lawyer.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextSibling) {
                              e.currentTarget.nextSibling.style.display = 'block';
                            }
                          }}
                        />
                      ) : null}
                      <span
                        className="text-xl font-bold"
                        style={{ display: lawyer.avatar_asset_id ? 'none' : 'block' }}
                      >
                        {getInitials(lawyer.name)}
                      </span>
                    </div>

                    {/* Name Row: Lawyer name + Verification badge */}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-zinc-50 flex items-center gap-1.5 truncate">
                        <span className="truncate">{lawyer.name}</span>
                        {isGold ? (
                          <ShieldCheck
                            className="h-4 w-4 text-amber-400 shrink-0 cursor-help"
                            title="Gold Verified — Premium credential check & priority listing"
                          />
                        ) : (
                          <BadgeCheck
                            className="h-4 w-4 text-blue-400 shrink-0 cursor-help"
                            title="Admin Approved — Bar Council ID verified by platform staff"
                          />
                        )}
                      </h3>
                      {lawyer.bar_council_id && (
                        <p className="text-xs font-mono text-zinc-500 truncate mt-0.5">
                          ID: {lawyer.bar_council_id}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Meta Row: "{district} • {years_exp} yrs experience • {languages}" */}
                  <p className="text-sm text-zinc-400 mb-2">
                    {district} • {yearsExp} yrs experience • {languages}
                  </p>

                  {/* Fee Row: "৳{hourly_rate} / consultation" */}
                  <div className="text-lg font-bold text-white mb-3">
                    ৳{hourlyRate} / consultation
                  </div>

                  {/* Specializations: Split by '&' or ',' into small tag chips */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {specTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-zinc-800 text-zinc-300 text-xs px-2 py-0.5 rounded font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Footer (mt-auto pt-4 border-t border-zinc-800) */}
                  <div className="mt-auto pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                    {/* Left: Next Available chip */}
                    {nextAvail ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Next: {formattedDate}, {nextAvail.start_time}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                        No open slots
                      </span>
                    )}

                    {/* Right: Action buttons */}
                    <div className="flex items-center gap-2 ml-auto sm:ml-0">
                      <Link
                        to={`/client/lawyers/${lawyer.id}`}
                        className="border border-zinc-600 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white px-3 py-2 rounded-lg transition-colors"
                      >
                        View Profile
                      </Link>
                      <Link
                        to={`/client/book/${lawyer.id}`}
                        className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm shrink-0"
                      >
                        <Calendar className="h-3.5 w-3.5" /> Book Consultation
                      </Link>
                    </div>
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
