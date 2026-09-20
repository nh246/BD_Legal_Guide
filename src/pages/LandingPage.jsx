import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Shield, Zap, Search, Scale } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="glass-panel p-8 rounded-2xl hover:scale-105 transition-transform duration-300 group">
    <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
      <Icon className="w-7 h-7 text-blue-400" />
    </div>
    <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
    <p className="text-gray-400 leading-relaxed">{description}</p>
  </div>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow pt-24">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-8">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-sm font-medium text-blue-300">Trained on all 1,484 Bangladesh Acts</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight">
                Navigate Bangladesh Law with <span className="gradient-text">Superhuman AI</span>
              </h1>
              
              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                The most advanced legal research assistant for Bangladesh. Instantly search, analyze, and understand complex legal documents using state-of-the-art AI.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                <Link to="/roles" className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-lg transition-all shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] hover:shadow-[0_0_60px_-15px_rgba(59,130,246,0.6)] flex items-center justify-center">
                  Start Researching Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link to="/pricing" className="w-full sm:w-auto px-8 py-4 glass-panel hover:bg-white/5 text-white rounded-xl font-semibold text-lg transition-all flex items-center justify-center">
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-black/20 border-y border-white/5 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Powerful Features for Legal Professionals</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">Built to save you hours of research time while providing highly accurate, contextual legal information.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard 
                icon={Search} 
                title="Semantic Search" 
                description="Find exactly what you need even if you don't use the exact legal terminology. Our AI understands the context of your query." 
              />
              <FeatureCard 
                icon={Zap} 
                title="Instant Analysis" 
                description="Get comprehensive summaries and legal analysis of complex sections in seconds, complete with direct citations." 
              />
              <FeatureCard 
                icon={BookOpen} 
                title="Complete Database" 
                description="Access all 1,484 acts from the Bangladesh legal code, perfectly indexed and cross-referenced for AI retrieval." 
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="glass-panel p-12 rounded-[2rem] text-center relative overflow-hidden border border-blue-500/20">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
              <div className="relative z-10">
                <Scale className="w-16 h-16 text-blue-400 mx-auto mb-6" />
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to transform your legal research?</h2>
                <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">Join thousands of legal professionals who have already upgraded their workflow with BD Legal AI.</p>
                <Link to="/roles" className="inline-flex items-center px-8 py-4 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-semibold text-lg transition-colors">
                  Create your free account
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
