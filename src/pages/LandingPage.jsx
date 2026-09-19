import React from 'react';
import { ArrowRight, Scale, Shield, FileText, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-bg-primary text-text-primary">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-500/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 blur-[120px] pointer-events-none" />

      {/* Navbar (Placeholder for now) */}
      <nav className="glass-panel sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-2">
          <Scale className="text-brand-400 w-6 h-6" />
          <span className="font-bold text-xl tracking-tight">BD Legal Guide AI</span>
        </div>
        <div className="flex gap-4">
          <Link to="/login" className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors">
            Sign In
          </Link>
          <Link to="/chat" className="px-4 py-2 rounded-lg text-sm font-medium gradient-bg text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all">
            Try For Free
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-32 text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-sm font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
          </span>
          Phase 1: Hybrid RAG System Now Live
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] mb-6">
          Navigate Bangladesh Law with <span className="gradient-text">Absolute Precision.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-text-secondary max-w-2xl mb-10 leading-relaxed">
          The first bilingual AI legal assistant grounded in 35,633 sections across 1,484 Bangladesh legal acts. 
          Stop guessing, start verifying.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link to="/chat" className="px-8 py-4 rounded-xl text-base font-bold gradient-bg text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all flex items-center justify-center gap-2 group">
            Start Asking Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/pricing" className="px-8 py-4 rounded-xl text-base font-bold glass-panel hover:bg-white/5 transition-all flex items-center justify-center">
            View Enterprise Solutions
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mt-24 w-full">
          {[
            { icon: Shield, title: "Hallucination-Proof", desc: "Every answer cites the exact Act and Section directly from the official corpus." },
            { icon: Bot, title: "Bilingual Agent", desc: "Ask in Bangla or English, get responses in your preferred language seamlessly." },
            { icon: FileText, title: "Document Analysis", desc: "Upload your legal documents for instant AI-powered summarization and insights." }
          ].map((feature, i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl flex flex-col items-start text-left border border-white/5 hover:border-brand-500/30 transition-colors">
              <div className="p-3 rounded-lg bg-brand-500/20 text-brand-400 mb-4">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
