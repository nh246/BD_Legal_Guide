import React from 'react';
import { Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from './Button';

export function CitationChips({ citations }) {
  if (!citations || citations.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {citations.map((citation, idx) => (
        <span 
          key={idx} 
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400"
        >
          <Scale className="h-3 w-3" />
          {citation.act} §{citation.section}
        </span>
      ))}
    </div>
  );
}

export function TriageCard({ suggestion }) {
  if (!suggestion) return null;

  return (
    <div className="mt-4 p-4 bg-zinc-900 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="flex h-2 w-2 rounded-full bg-amber-500"></span>
          <h4 className="text-sm font-semibold text-zinc-50">Professional Help Recommended</h4>
        </div>
        <p className="text-xs text-zinc-400">
          This query involves complex nuances in <span className="text-zinc-300 font-medium">{suggestion.specialty}</span> law. We strongly recommend consulting a verified lawyer.
        </p>
      </div>
      <Link to={`/lawyers?specialty=${suggestion.specialty}`} className="shrink-0">
        <Button variant="secondary" size="sm" className="w-full sm:w-auto border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-400 transition-colors">
          Find {suggestion.specialty} Lawyers
        </Button>
      </Link>
    </div>
  );
}
