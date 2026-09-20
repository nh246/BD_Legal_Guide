import React from 'react';
import { Flag, ShieldCheck } from 'lucide-react';
import Card, { CardContent } from '../../components/ui/Card';

export default function AdminModeration() {
  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
      <div className="max-w-6xl mx-auto w-full space-y-6 flex-1 flex flex-col">
        
        {/* Header Card */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                <Flag className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-50">Content Moderation</h1>
                <p className="text-sm text-zinc-400 mt-1">Moderate public reviews and community Q&A.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg shrink-0">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">CONTENT_MODERATION</span>
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        <div className="flex-1 min-h-[400px] border-2 border-dashed border-zinc-800 rounded-2xl flex items-center justify-center p-8 bg-zinc-950/50">
          <div className="text-center max-w-md animate-in zoom-in-95 duration-500">
            <div className="h-20 w-20 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-zinc-800">
              <Flag className="h-10 w-10 text-zinc-500" />
            </div>
            <h3 className="text-xl font-bold text-zinc-50 mb-2">Module UI in active development</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Your access credentials have been successfully verified. The data grid and management tools for this module will be available in the next release cycle.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
