import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Scale, ShieldCheck, Zap, FileText, Users, ArrowRight } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

export default function LandingPage() {
  const features = [
    { icon: Bot, title: "Standard Gemini AI", desc: "Free, general legal guidance powered by Gemini." },
    { icon: Zap, title: "Pro RAG Mode", desc: "Verified answers directly from the BD Penal Code." },
    { icon: ShieldCheck, title: "Verified Lawyers", desc: "Only Bar Council verified professionals." },
    { icon: FileText, title: "Document Analysis", desc: "Upload legal documents for AI-assisted review (Pro)." },
    { icon: Scale, title: "Smart Triage", desc: "AI detects when you need human counsel and connects you." },
    { icon: Users, title: "Firm Management", desc: "Law firms can manage their entire team's bookings." }
  ];

  const steps = [
    { num: "01", title: "Ask the AI", desc: "Describe your legal issue to our AI assistant." },
    { num: "02", title: "Get Guidance", desc: "Receive instant, citation-backed legal information." },
    { num: "03", title: "Connect with a Lawyer", desc: "Book a consultation with a verified expert if needed." }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-zinc-950 to-zinc-950"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <Badge variant="pro" className="mb-6 inline-flex px-3 py-1 text-sm">
            BD Legal Guide AI 2.0 is Live
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold text-zinc-50 tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
            Navigate Bangladesh Law with <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">AI & Verified Lawyers</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            The first 3-sided legal marketplace powered by dual-mode AI. Get instant answers from the BD Penal Code or book consultations with Bar Council verified experts.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/chat">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                Start Chatting <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/lawyers">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto gap-2">
                Find a Lawyer <Scale className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-10 border-y border-zinc-800/50 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-medium text-zinc-500 mb-4 uppercase tracking-wider">Trusted by Professionals</p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-70">
            <div className="flex items-center gap-2 text-zinc-300 font-semibold text-lg">
              <ShieldCheck className="h-6 w-6 text-emerald-500" />
              Bar Council Verified
            </div>
            {/* Add more trust badges here if needed */}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-zinc-50 mb-4">How it Works</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">A seamless workflow from AI guidance to professional human representation.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="relative flex flex-col items-center text-center p-6">
                <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl font-bold text-blue-500 mb-6 shadow-lg shadow-blue-900/20">
                  {step.num}
                </div>
                <h3 className="text-xl font-semibold text-zinc-50 mb-3">{step.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{step.desc}</p>
                {idx !== steps.length - 1 && (
                  <div className="hidden md:block absolute top-14 left-2/3 w-full h-0.5 bg-gradient-to-r from-zinc-800 to-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-zinc-50 mb-4">Everything You Need</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">Built for clients seeking justice and lawyers seeking to provide it.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className="hover:border-zinc-700 transition-colors group">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-zinc-800 flex items-center justify-center mb-4 group-hover:bg-blue-600/20 group-hover:text-blue-500 transition-colors text-zinc-400">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-zinc-400 text-sm leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
