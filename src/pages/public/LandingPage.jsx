import React from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  Bot,
  MessageSquare,
  Briefcase,
  Video,
  CreditCard,
  ShieldCheck,
  Shield,
  Award,
  Star,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  Check,
  MapPin,
  Calendar,
  Eye,
  FileText,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 selection:bg-blue-500/30">
      
      {/* ====================================================================
          SECTION 1 — HERO
          ==================================================================== */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden border-b border-zinc-800/60">
        {/* Ambient background glows */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/25 via-zinc-950/80 to-zinc-950 pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-8 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Next-Gen Legal Assistance for Bangladesh</span>
          </div>

          {/* Big H1 + Tagline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-4 text-white">
            Legal Bridge
          </h1>
          <p className="text-2xl sm:text-3xl font-semibold bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent mb-6">
            Your bridge to justice.
          </p>

          {/* Sub-copy */}
          <p className="text-base sm:text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Get instant AI legal guidance, connect with Bar Council verified lawyers, and book consultations — all in one place.
          </p>

          {/* Dual CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-14">
            <Link to="/client/chat" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto px-8 gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 font-semibold">
                Start Chatting <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/client/lawyers" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto px-8 gap-2 border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 font-semibold">
                Find a Lawyer <Scale className="h-4 w-4 text-blue-400" />
              </Button>
            </Link>
          </div>

          {/* Live Stats Strip */}
          <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-6 px-6 py-3 rounded-2xl bg-zinc-900/70 border border-zinc-800 text-xs sm:text-sm text-zinc-300 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <strong className="text-white font-semibold">250+</strong> Verified Lawyers
            </div>
            <span className="text-zinc-600 hidden sm:inline">·</span>
            <div className="flex items-center gap-2">
              <strong className="text-white font-semibold">10,000+</strong> Consultations
            </div>
            <span className="text-zinc-600 hidden sm:inline">·</span>
            <div className="flex items-center gap-2">
              <strong className="text-white font-semibold">24/7</strong> AI Assistant
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 2 — TRUST BAR
          ==================================================================== */}
      <section className="py-6 border-b border-zinc-800/70 bg-zinc-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm font-medium text-zinc-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Bar Council Verified</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm font-medium text-zinc-300">
              <CreditCard className="h-4 w-4 text-blue-400 shrink-0" />
              <span>SSLCommerz Secure Payments</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm font-medium text-zinc-300">
              <Shield className="h-4 w-4 text-violet-400 shrink-0" />
              <span>Audited Privacy</span>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 3 — HOW IT WORKS (3 steps)
          ==================================================================== */}
      <section className="py-20 md:py-28 bg-zinc-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-400 mb-2 block">
              Simple 3-Step Journey
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              How Legal Bridge Works
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base mt-3">
              A seamless, transparent bridge from immediate legal insights to dedicated human counsel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="relative p-6 sm:p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col items-center text-center group">
              <div className="h-14 w-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold text-xl mb-6 group-hover:scale-105 transition-transform">
                01
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Ask the AI</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Get instant legal guidance on Bangladesh law, complete with citations from the Penal Code, CrPC, and civil statutes.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative p-6 sm:p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col items-center text-center group">
              <div className="h-14 w-14 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center font-mono font-bold text-xl mb-6 group-hover:scale-105 transition-transform">
                02
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Match with a Lawyer</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Browse verified advocates OR post your case on our Case Board and let qualified lawyers compete to represent you.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative p-6 sm:p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col items-center text-center group">
              <div className="h-14 w-14 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-xl mb-6 group-hover:scale-105 transition-transform">
                03
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Consult & Resolve</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Book encrypted video consultations, pay securely via SSLCommerz, and leave reviews to empower the community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 4 — FEATURES GRID (6 cards)
          ==================================================================== */}
      <section className="py-20 md:py-28 bg-zinc-900/20 border-y border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-400 mb-2 block">
              Platform Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Everything You Need for Legal Clarity
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base mt-3">
              Purpose-built tools empowering citizens, corporate clients, and practicing advocates.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: AI Legal Assistant */}
            <Card className="bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 transition-all group">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">AI Legal Assistant</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Trained on Bangladesh legislation. Instant responses with relevant section citations from penal, civil, family, and company laws.
                </p>
              </CardContent>
            </Card>

            {/* Card 2: Case Board Marketplace */}
            <Card className="bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 transition-all group">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Briefcase className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Case Board Marketplace</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Post cases, receive bids. Verified lawyers review your summary and compete with transparent fees and representation strategies.
                </p>
              </CardContent>
            </Card>

            {/* Card 3: Video Consultations */}
            <Card className="bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 transition-all group">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Video className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Video Consultations</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Seamless Google Meet video appointments. Speak privately with verified advocates without the hassle of traveling to court chambers.
                </p>
              </CardContent>
            </Card>

            {/* Card 4: Secure Payments */}
            <Card className="bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 transition-all group">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <CreditCard className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Secure Payments</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Full SSLCommerz integration supporting bKash, Nagad, Rocket, and cards. Transparent billing with automated invoice generation.
                </p>
              </CardContent>
            </Card>

            {/* Card 5: Verified Lawyers */}
            <Card className="bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 transition-all group">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Verified Lawyers</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Strict credential verification. Every advocate submits their Bar Council certificate, NID, and practicing license before taking clients.
                </p>
              </CardContent>
            </Card>

            {/* Card 6: Smart Reviews */}
            <Card className="bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 transition-all group">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Star className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Smart Reviews</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Unbiased feedback from verified clients. Make informed choices based on real consultation ratings, courtroom experience, and communication.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 5 — CASE BOARD SPOTLIGHT
          ==================================================================== */}
      <section className="py-20 md:py-28 bg-zinc-950 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left: Text & Pitch */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <Briefcase className="h-3.5 w-3.5" />
                <span>Client Case Board</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Post your case. <br />
                <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                  Let lawyers compete.
                </span>
              </h2>
              <p className="text-zinc-300 text-base sm:text-lg leading-relaxed">
                Describe your legal issue once. Verified lawyers from across Bangladesh submit bids with their fees and approach. You choose the best fit — and discuss directly with them before accepting.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm text-zinc-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>100% free to post your case details</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Interactive pre-acceptance chat with bidding advocates</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Encrypted evidence document sharing</span>
                </div>
              </div>

              <div className="pt-4">
                <Link to="/client/cases">
                  <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold">
                    Post a Case <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Interactive Mockup */}
            <div className="lg:col-span-6">
              <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800 shadow-2xl relative">
                {/* Mock case card */}
                <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/90 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block mb-1">
                        Land & Property Law
                      </span>
                      <h4 className="text-base font-bold text-white">
                        Partition & Mutation Deed Dispute
                      </h4>
                      <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-1">
                        <MapPin className="h-3 w-3 text-zinc-500" /> Dhaka District Court · Posted 3 hours ago
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      3 Bids Received
                    </span>
                  </div>

                  {/* Mock Bids preview */}
                  <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                    <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs border border-amber-500/30">
                          NJ
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-zinc-200">Adv. Nusrat Jahan</span>
                            <Sparkles className="h-3 w-3 text-amber-400 fill-amber-400/30" />
                          </div>
                          <span className="text-[11px] text-zinc-400">12 yrs exp · Dhaka Bar</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-white">৳2,500</span>
                        <span className="text-[10px] text-zinc-500 block">Proposed Fee</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/70 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-xs border border-blue-500/30">
                          TH
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-zinc-200">Adv. Tanvir Hasan</span>
                          <span className="text-[11px] text-zinc-400 block">8 yrs exp · High Court Division</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-white">৳1,800</span>
                        <span className="text-[10px] text-zinc-500 block">Proposed Fee</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button size="sm" className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-500 text-white">
                      Discuss & Hire Advocate
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 6 — FOR LAWYERS BAND (dark background)
          ==================================================================== */}
      <section className="py-20 bg-zinc-900/60 border-y border-zinc-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs uppercase font-bold tracking-wider text-amber-400 mb-2 block">
            For Advocates & Barristers
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Grow your legal practice
          </h2>
          <p className="text-zinc-300 text-base max-w-2xl mx-auto mb-8">
            Connect directly with verified citizens seeking representation across all 64 districts in Bangladesh. Manage your bookings, client cases, and fees on your own terms.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs sm:text-sm font-medium text-zinc-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Reach clients nationwide</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs sm:text-sm font-medium text-zinc-200">
              <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Gold Verified Badge</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs sm:text-sm font-medium text-zinc-200">
              <Calendar className="h-4 w-4 text-blue-400 shrink-0" />
              <span>Full schedule control</span>
            </div>
          </div>

          <Link to="/register?role=lawyer">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm px-8 gap-2 shadow-lg shadow-amber-500/10">
              Join as a Lawyer <ArrowRight className="h-4 w-4 text-zinc-950" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ====================================================================
          SECTION 7 — PRICING TEASER
          ==================================================================== */}
      <section className="py-20 md:py-28 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-400 mb-2 block">
              Transparent Membership
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Simple Plans for Every Citizen
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base mt-3">
              Start with free legal assistance or unlock unlimited intelligence with Pro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-10">
            {/* Free Mini-Card */}
            <Card className="bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between">
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Free Plan</h3>
                  <p className="text-zinc-400 text-xs sm:text-sm mt-1">
                    Essential legal AI guidance and lawyer search for everyday citizens.
                  </p>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-white">৳0</span>
                    <span className="text-xs text-zinc-500 ml-2">free forever</span>
                  </div>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-zinc-300">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Daily AI legal queries with BD act citations</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Browse Bar Council verified lawyer directory</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Post cases on the open Case Board</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Standard consultation booking via Google Meet</span>
                  </li>
                </ul>

                <Link to="/register" className="block pt-2">
                  <Button variant="secondary" className="w-full text-xs font-semibold">
                    Get Started Free
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro Mini-Card */}
            <Card className="bg-gradient-to-b from-blue-950/20 via-zinc-900/60 to-zinc-900/40 border-blue-500/30 hover:border-blue-500/50 transition-all flex flex-col justify-between relative shadow-xl shadow-blue-900/10">
              <div className="absolute -top-3 right-6">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white shadow-md">
                  Recommended
                </span>
              </div>
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>Pro Citizen</span>
                    <Sparkles className="h-4 w-4 text-blue-400" />
                  </h3>
                  <p className="text-zinc-400 text-xs sm:text-sm mt-1">
                    Extended memory context, document analysis, and direct lawyer messaging.
                  </p>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-white">৳499</span>
                    <span className="text-xs text-zinc-500 ml-2">/ month (or ৳4,990/yr)</span>
                  </div>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-zinc-200">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-blue-400 shrink-0" />
                    <span className="font-medium">Extended 20-turn conversational AI context</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>Direct chat messaging with bidding lawyers</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>Priority case board placement & rapid bids</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>Interactive legal document analysis</span>
                  </li>
                </ul>

                <Link to="/pricing" className="block pt-2">
                  <Button className="w-full text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md">
                    Upgrade to Pro
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Link to="/pricing" className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              View Full Pricing & Advocate Tier Comparison <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 8 — TESTIMONIALS
          ==================================================================== */}
      <section className="py-20 md:py-28 bg-zinc-900/20 border-y border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-400 mb-2 block">
              Real Experiences
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Trusted by Citizens & Advocates
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base mt-3">
              Hear how Legal Bridge makes navigating the legal system transparent and accessible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <Card className="bg-zinc-900/50 border-zinc-800 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-zinc-200 text-sm leading-relaxed italic mb-6">
                  &ldquo;Got my property dispute resolved in 2 weeks. The bidding model gave me options I never knew existed in Dhaka.&rdquo;
                </p>
              </div>
              <div className="pt-4 border-t border-zinc-800/80 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                  RA
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Rahim A.</h4>
                  <p className="text-[11px] text-zinc-400">Citizen Client · Dhaka</p>
                </div>
              </div>
            </Card>

            {/* Testimonial 2 */}
            <Card className="bg-zinc-900/50 border-zinc-800 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-zinc-200 text-sm leading-relaxed italic mb-6">
                  &ldquo;The AI helped me understand my rights before I hired a lawyer. When I had the consultation, I was prepared and knew the exact sections.&rdquo;
                </p>
              </div>
              <div className="pt-4 border-t border-zinc-800/80 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-xs">
                  FS
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Fatima S.</h4>
                  <p className="text-[11px] text-zinc-400">Citizen Client · Chittagong</p>
                </div>
              </div>
            </Card>

            {/* Testimonial 3 */}
            <Card className="bg-zinc-900/50 border-zinc-800 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-zinc-200 text-sm leading-relaxed italic mb-6">
                  &ldquo;As a lawyer, this platform doubled my caseload. Verified badges give clients immediate trust and the scheduling is effortless.&rdquo;
                </p>
              </div>
              <div className="pt-4 border-t border-zinc-800/80 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                  NJ
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Adv. Nusrat</h4>
                  <p className="text-[11px] text-zinc-400">Advocate · Sylhet Bar</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 9 — FINAL CTA BAND
          ==================================================================== */}
      <section className="py-20 md:py-24 bg-gradient-to-b from-zinc-950 via-blue-950/20 to-zinc-950 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready to get started?
          </h2>
          <p className="text-zinc-300 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Experience the modern legal platform built for Bangladesh. Ask our AI or connect with a Bar Council verified advocate in minutes.
          </p>
          <div className="pt-2">
            <Link to="/register">
              <Button size="lg" className="px-10 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30">
                Sign Up Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 10 — FOOTER
          ==================================================================== */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 pt-16 pb-12 text-zinc-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-zinc-800/80">
            {/* Col 1: Brand & Disclaimer */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2">
                <Scale className="h-6 w-6 text-blue-500" />
                <span className="font-bold text-lg text-white tracking-tight">
                  Legal <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Bridge</span>
                </span>
              </div>
              <p className="text-sm font-semibold text-zinc-300">
                Your bridge to justice.
              </p>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
                This platform is for educational and informational purposes. Content does not constitute legal advice. Users should consult verified counsel for formal legal representation.
              </p>
            </div>

            {/* Col 2: Product */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">Product</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/client/chat" className="hover:text-blue-400 transition-colors">
                    AI Legal Chat
                  </Link>
                </li>
                <li>
                  <Link to="/client/lawyers" className="hover:text-blue-400 transition-colors">
                    Find Lawyers
                  </Link>
                </li>
                <li>
                  <Link to="/client/cases" className="hover:text-blue-400 transition-colors">
                    Case Board
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-blue-400 transition-colors">
                    Pricing Plans
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: For Lawyers */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">For Lawyers</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/register?role=lawyer" className="hover:text-amber-400 transition-colors">
                    Join as Lawyer
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-amber-400 transition-colors">
                    Gold Verified Badge
                  </Link>
                </li>
                <li>
                  <Link to="/lawyer/availability" className="hover:text-amber-400 transition-colors">
                    Availability Schedule
                  </Link>
                </li>
                <li>
                  <Link to="/lawyer" className="hover:text-amber-400 transition-colors">
                    Lawyer Portal
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Legal & Contact */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">Legal & Support</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <span className="hover:text-zinc-200 transition-colors cursor-pointer">
                    Terms of Service
                  </span>
                </li>
                <li>
                  <span className="hover:text-zinc-200 transition-colors cursor-pointer">
                    Privacy Policy
                  </span>
                </li>
                <li>
                  <span className="hover:text-zinc-200 transition-colors cursor-pointer">
                    Legal Disclaimer
                  </span>
                </li>
                <li>
                  <a href="mailto:support@legalbridge.ai" className="hover:text-blue-400 transition-colors">
                    support@legalbridge.ai
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
            <p>© 2026 Legal Bridge. Made in Bangladesh 🇧🇩</p>
            <p className="flex items-center gap-2">
              <span>Bar Council Verified Advocates</span>
              <span>·</span>
              <span>SSLCommerz Secured</span>
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
