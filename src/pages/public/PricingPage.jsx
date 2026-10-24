import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Check,
  X,
  CreditCard,
  User,
  Briefcase,
  Zap,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Lock,
  Scale,
  Award,
  CheckCircle2,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useApi } from '../../lib/useApi';
import api, { asList, getErrorMessage } from '../../lib/api';
import useAuthStore from '../../store/useAuthStore';
import { toast } from '../../store/useToastStore';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/PageStates';

export default function PricingPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, token } = useAuthStore();

  // Role query param or user's active role determines the initial tab
  const queryRole = searchParams.get('role');
  const [activeTab, setActiveTab] = useState(() => {
    if (user?.role === 'lawyer') return 'lawyer';
    if (queryRole === 'lawyer') return 'lawyer';
    return 'user';
  });

  // State for Pro billing cycle: 'monthly' | '6m' | '1y'
  const [billingCycle, setBillingCycle] = useState('monthly');

  // Sync tab when query role or logged in user changes
  useEffect(() => {
    if (queryRole === 'lawyer' || queryRole === 'user') {
      setActiveTab(queryRole);
    } else if (user?.role === 'lawyer') {
      setActiveTab('lawyer');
    }
  }, [queryRole, user]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ role: tab });
  };

  // Fetch all plans from backend API
  const { data, loading, error, reload } = useApi('/plans');
  const allPlans = asList(data, 'plans');

  // Fetch current user subscription if logged in
  const { data: subData, reload: reloadSub } = useApi(token ? '/subscriptions/mine' : null);
  // Fetch current lawyer profile if logged in as lawyer
  const { data: lawyerData, reload: reloadLawyer } = useApi(token && user?.role === 'lawyer' ? '/lawyer/me' : null);

  const [checkoutLoading, setCheckoutLoading] = useState(null);

  const isUserPro = Boolean(
    (subData?.status === 'active' && (subData?.plan_code?.startsWith('user_pro') || subData?.plan_code === 'user_pro')) ||
    user?.plan?.startsWith('user_pro') ||
    user?.plan === 'user_pro' ||
    user?.plan === 'pro' ||
    user?.is_pro === true
  );

  const isLawyerVerified = Boolean(lawyerData?.verification_paid || lawyerData?.verification_status === 'approved');

  // Dynamic pricing config for client Pro card
  const proPricing = {
    monthly: {
      code: 'user_pro_monthly',
      name: 'Pro Monthly',
      price: '299',
      period: '/ month',
      subtext: null,
    },
    '6m': {
      code: 'user_pro_6m',
      name: 'Pro 6 Months',
      price: '1,499',
      period: '',
      subtext: 'Save 16%',
    },
    '1y': {
      code: 'user_pro_1y',
      name: 'Pro 1 Year',
      price: '2,499',
      period: '',
      subtext: 'Save 30%',
    },
  };

  const currentPro = proPricing[billingCycle] || proPricing.monthly;

  const freeBullets = [
    '15 AI messages per month',
    '3 saved chat sessions',
    '3-turn conversation memory',
    'Browse & book verified lawyers',
    'Standard support',
  ];

  const proBullets = [
    'Unlimited AI messages & sessions',
    '20-turn conversation memory',
    'Document & Image analysis (Vision)',
    'Direct messaging with any lawyer',
    'Priority booking queue',
    'AI Confidence Scores',
  ];

  // Client Free selection
  const handleSelectFree = () => {
    if (!token || !user) {
      navigate('/register?role=user&plan=user_free');
      return;
    }
    if (user.role !== 'user' && user.role !== 'admin') {
      toast('This plan is for client accounts. You are logged in as a Lawyer.', 'error');
      return;
    }
    if (isUserPro) {
      toast('You are currently on the Pro plan.', 'info');
      return;
    }
    toast('You already have access to the Free tier features.', 'info');
  };

  // Client Pro Upgrade / Purchase
  const handleSelectPro = async () => {
    const targetPlanCode = currentPro.code;

    if (!token || !user) {
      navigate(`/register?role=user&plan=${targetPlanCode}`);
      return;
    }

    if (user.role !== 'user' && user.role !== 'admin') {
      toast('This plan is for client accounts. You are logged in as a Lawyer.', 'error');
      return;
    }

    if (isUserPro) {
      toast('You currently have an active Pro subscription.', 'info');
      return;
    }

    setCheckoutLoading(targetPlanCode);
    try {
      await api.post('/subscriptions', { plan_code: targetPlanCode, provider: 'demo' });
      toast(`Successfully upgraded to ${currentPro.name}! Unlimited AI intelligence is now active.`, 'success');
      try {
        await useAuthStore.getState().fetchMe();
      } catch {
        // ignore
      }
      if (reloadSub) reloadSub();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to process subscription checkout'), 'error');
    } finally {
      setCheckoutLoading(null);
    }
  };

  // Filter plans for lawyer tab
  const lawyerPlans = allPlans.filter((plan) => {
    return (plan.target_role === 'lawyer') || (plan.code && plan.code.toLowerCase().includes('lawyer'));
  });

  const displayedLawyerPlans = lawyerPlans.length > 0 ? lawyerPlans : [
    {
      code: 'lawyer_basic',
      name: 'Lawyer Basic',
      price_monthly: 0,
      features: [
        'Directory Listing in Bangladesh Lawyer Registry',
        'Receive Client Consultation Inquiries',
        'Manual Schedule Management',
        'Standard Profile Page',
      ],
    },
    {
      code: 'lawyer_verified',
      name: 'Lawyer Verified Badge',
      price_monthly: 999,
      popular: true,
      features: [
        'Official Bar Council Verified Gold Badge',
        'Top Placement in Lawyer Search Directory',
        'Instant Video Consultation Link Generation',
        'Direct Client Messaging Channel',
        'Priority Payouts and Platform Support',
      ],
    },
  ];

  const handleSelectLawyerPlan = async (plan) => {
    if (!token || !user) {
      navigate(`/register?role=lawyer&plan=${plan.code}`);
      return;
    }

    if (user.role !== 'lawyer' && user.role !== 'admin') {
      toast('This plan is for verified lawyers only. You are currently logged in as a Client.', 'error');
      return;
    }

    if (plan.code === 'lawyer_verified' && isLawyerVerified) {
      toast('Your Bar Council Verified Badge is already active.', 'info');
      return;
    }

    if (plan.price === 0 || plan.price_monthly === 0) {
      toast('You already have access to the Free directory listing.', 'info');
      return;
    }

    setCheckoutLoading(plan.code);
    try {
      await api.post('/lawyer/verification-purchase', { provider: 'demo' });
      toast('Bar Council Verified Badge activated! Your profile now has priority ranking.', 'success');
      if (reloadLawyer) reloadLawyer();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to process verification purchase'), 'error');
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="py-20 bg-zinc-950 min-h-[calc(100vh-64px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <Badge variant="pro" className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            Simple & Transparent Pricing
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-50 tracking-tight mb-4">
            Transparent Pricing for Everyone
          </h1>
          <p className="text-lg text-zinc-400">
            Dedicated plans designed specifically for citizens seeking legal advice and legal professionals expanding their practice.
          </p>
        </div>

        {/* Role Toggle Switcher */}
        <div className="flex flex-col items-center justify-center mb-12">
          <div className="bg-zinc-900/90 border border-zinc-800 p-1.5 rounded-2xl flex items-center shadow-xl backdrop-blur-md">
            <button
              id="pricing-tab-user"
              type="button"
              onClick={() => handleTabChange('user')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === 'user'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <User className="h-4 w-4" />
              <span>For Clients & Citizens</span>
              {user?.role === 'user' && (
                <span className="hidden sm:inline-block text-[10px] bg-blue-500/30 text-blue-200 px-1.5 py-0.5 rounded-full font-medium ml-1">
                  Your Account
                </span>
              )}
            </button>

            <button
              id="pricing-tab-lawyer"
              type="button"
              onClick={() => handleTabChange('lawyer')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === 'lawyer'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>For Lawyers & Advocates</span>
              {user?.role === 'lawyer' && (
                <span className="hidden sm:inline-block text-[10px] bg-violet-500/30 text-violet-200 px-1.5 py-0.5 rounded-full font-medium ml-1">
                  Your Account
                </span>
              )}
            </button>
          </div>

          {/* Active Context Banner */}
          <div className="mt-4 text-center">
            {user ? (
              <p className="text-xs text-zinc-400">
                Signed in as <span className="font-semibold text-zinc-300">{user.full_name || user.email}</span> ({user.role === 'lawyer' ? 'Lawyer' : 'Client'})
                {((activeTab === 'user' && user.role === 'lawyer') || (activeTab === 'lawyer' && user.role === 'user')) && (
                  <span className="text-amber-400 block mt-1">
                    Note: You are currently viewing {activeTab === 'user' ? 'Client' : 'Lawyer'} plans with a {user.role === 'lawyer' ? 'Lawyer' : 'Client'} account.
                  </span>
                )}
              </p>
            ) : (
              <p className="text-xs text-zinc-500">
                {activeTab === 'user'
                  ? 'Viewing plans for individuals & citizens seeking legal guidance'
                  : 'Viewing professional plans for Bangladesh Bar Council registered advocates'}
              </p>
            )}
          </div>
        </div>

        {/* Plans Container */}
        {loading ? (
          <LoadingState message="Loading subscription plans..." />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : activeTab === 'user' ? (
          /* Client Plans: Free Card & Pro Card with Billing Cycle Toggle */
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* 1. Free Card */}
            <Card className="relative flex flex-col transition-all duration-300 bg-zinc-900/60 border-zinc-800 hover:border-zinc-700">
              <CardHeader className="text-center pt-8 pb-4">
                <h3 className="text-2xl font-bold text-zinc-50 mb-2">
                  Free Plan
                </h3>

                <div className="flex items-baseline justify-center gap-1 my-3">
                  <span className="text-2xl font-semibold text-zinc-400">Tk.</span>
                  <span className="text-5xl font-extrabold text-zinc-50 tracking-tight">0</span>
                  <span className="text-zinc-400 text-sm font-medium">/ month</span>
                </div>

                <p className="text-sm text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  Essential legal AI guidance and lawyer search for everyday citizens.
                </p>
              </CardHeader>

              <CardContent className="flex-1 px-6 sm:px-8 pt-4 pb-6">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
                  Included Features
                </div>

                <ul className="space-y-3.5">
                  {freeBullets.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="rounded-full p-0.5 shrink-0 mt-0.5 bg-zinc-800 text-zinc-400">
                        <Check className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-zinc-300 leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="px-6 sm:px-8 pb-8 pt-2">
                <Button
                  id="pricing-select-user_free"
                  className={`w-full py-2.5 text-sm font-semibold transition-all shadow-md ${
                    (!isUserPro && user && (user.role === 'user' || user.role === 'admin')) || isUserPro || (user && user.role !== 'user' && user.role !== 'admin')
                      ? 'opacity-60 cursor-not-allowed bg-zinc-800 text-zinc-400 border border-zinc-700/60 shadow-none hover:bg-zinc-800'
                      : ''
                  }`}
                  variant="secondary"
                  disabled={(!isUserPro && user && (user.role === 'user' || user.role === 'admin')) || isUserPro || (user && user.role !== 'user' && user.role !== 'admin')}
                  onClick={handleSelectFree}
                >
                  {!user ? (
                    'Get Started Free'
                  ) : isUserPro ? (
                    'Downgrade unavailable'
                  ) : user.role !== 'user' && user.role !== 'admin' ? (
                    'Client Account Required'
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-1.5 inline" />
                      Current Plan
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* 2. Pro Card with Segmented Toggle & Dynamic Pricing */}
            <Card className="relative flex flex-col transition-all duration-300 border-blue-500 shadow-2xl shadow-blue-950/40 bg-zinc-900/90 ring-1 ring-blue-500/30">
              {/* Badge top center */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="inline-flex items-center gap-1 text-white border-none px-4 py-1 text-xs font-bold rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-violet-600 shadow-blue-900/50">
                  <Zap className="h-3.5 w-3.5 text-amber-300" />
                  Most Popular for Clients
                </span>
              </div>

              <CardHeader className="text-center pt-8 pb-4">
                <h3 className="text-2xl font-bold text-zinc-50 mb-1 flex items-center justify-center gap-2">
                  Pro Plan
                </h3>

                {/* Segmented billingCycle toggle */}
                <div className="flex justify-center my-3">
                  <div className="inline-flex p-1 bg-zinc-950/90 border border-zinc-800 rounded-xl shadow-inner">
                    <button
                      id="billing-cycle-monthly"
                      type="button"
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                        billingCycle === 'monthly'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      id="billing-cycle-6m"
                      type="button"
                      onClick={() => setBillingCycle('6m')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                        billingCycle === '6m'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                      }`}
                    >
                      <span>6 Months</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold border border-emerald-500/30">
                        Save 16%
                      </span>
                    </button>
                    <button
                      id="billing-cycle-1y"
                      type="button"
                      onClick={() => setBillingCycle('1y')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                        billingCycle === '1y'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                      }`}
                    >
                      <span>1 Year</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold border border-emerald-500/30">
                        Save 30%
                      </span>
                    </button>
                  </div>
                </div>

                {/* Dynamic Price Display based on billingCycle */}
                <div className="flex flex-col items-center justify-center my-2">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-2xl font-semibold text-zinc-400">Tk.</span>
                    <span className="text-5xl font-extrabold text-zinc-50 tracking-tight">
                      {currentPro.price}
                    </span>
                    {billingCycle === 'monthly' && (
                      <span className="text-zinc-400 text-sm font-medium">/ month</span>
                    )}
                  </div>
                  {currentPro.subtext && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        <Sparkles className="h-3 w-3" />
                        {currentPro.subtext}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-zinc-400 max-w-xs mx-auto leading-relaxed mt-1">
                  Deep legal intelligence with 20-turn memory, document & image analysis and priority access.
                </p>
              </CardHeader>

              <CardContent className="flex-1 px-6 sm:px-8 pt-4 pb-6">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
                  Everything in Free, plus:
                </div>

                <ul className="space-y-3.5">
                  {proBullets.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="rounded-full p-0.5 shrink-0 mt-0.5 bg-emerald-500/20 text-emerald-400">
                        <Check className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-zinc-300 leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="px-6 sm:px-8 pb-8 pt-2">
                <Button
                  id="pricing-select-user_pro"
                  className={`w-full py-2.5 text-sm font-semibold transition-all shadow-md ${
                    isUserPro || (user && user.role !== 'user' && user.role !== 'admin')
                      ? 'opacity-60 cursor-not-allowed bg-zinc-800 text-zinc-400 border border-zinc-700/60 shadow-none hover:bg-zinc-800'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30'
                  }`}
                  variant={isUserPro ? 'secondary' : 'primary'}
                  disabled={isUserPro || (user && user.role !== 'user' && user.role !== 'admin') || checkoutLoading === currentPro.code}
                  isLoading={checkoutLoading === currentPro.code}
                  onClick={handleSelectPro}
                >
                  {isUserPro ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-1.5 inline" />
                      Current Plan
                    </>
                  ) : user && user.role !== 'user' && user.role !== 'admin' ? (
                    'Client Account Required'
                  ) : (
                    'Upgrade to Pro'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          /* Lawyer Plans: Basic & Verified Badge */
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {displayedLawyerPlans.map((plan, idx) => {
              const isPopular = plan.popular || plan.code === 'lawyer_verified';
              const isCurrent = plan.code === 'lawyer_verified' ? isLawyerVerified : !isLawyerVerified;

              return (
                <Card
                  key={plan.id || idx}
                  className={`relative flex flex-col transition-all duration-300 ${
                    isPopular
                      ? 'border-violet-500 shadow-2xl shadow-violet-950/40 bg-zinc-900/90 ring-1 ring-violet-500/30'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className="inline-flex items-center gap-1 text-white border-none px-4 py-1 text-xs font-bold rounded-full shadow-lg bg-gradient-to-r from-violet-600 to-indigo-600 shadow-violet-900/50">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                        Recommended for Advocates
                      </span>
                    </div>
                  )}

                  <CardHeader className="text-center pt-8 pb-4">
                    <h3 className="text-2xl font-bold text-zinc-50 mb-2 flex items-center justify-center gap-2">
                      {plan.name}
                      {plan.code === 'lawyer_verified' && (
                        <ShieldCheck className="h-5 w-5 text-emerald-400 inline" />
                      )}
                    </h3>

                    <div className="flex items-baseline justify-center gap-1 my-3">
                      <span className="text-2xl font-semibold text-zinc-400">Tk.</span>
                      <span className="text-5xl font-extrabold text-zinc-50 tracking-tight">
                        {plan.price ?? plan.price_monthly ?? 0}
                      </span>
                      {plan.price_monthly > 0 ? (
                        <span className="text-zinc-400 text-sm font-medium">/ month</span>
                      ) : (
                        <span className="text-zinc-400 text-sm font-medium">/ forever</span>
                      )}
                    </div>

                    <p className="text-sm text-zinc-400 max-w-xs mx-auto leading-relaxed">
                      {plan.code === 'lawyer_basic'
                        ? 'Standard directory presence and direct consultation inquiries from citizens.'
                        : 'Official Bar Council verification, top ranking, and integrated client consultation suite.'}
                    </p>
                  </CardHeader>

                  <CardContent className="flex-1 px-6 sm:px-8 pt-4 pb-6">
                    <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
                      {plan.price_monthly === 0 ? 'Included Features' : 'Everything in Basic, plus:'}
                    </div>

                    <ul className="space-y-3.5">
                      {(plan.features || []).map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className={`rounded-full p-0.5 shrink-0 mt-0.5 ${
                            isPopular ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            <Check className="h-4 w-4" />
                          </div>
                          <span className="text-sm text-zinc-300 leading-snug">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="px-6 sm:px-8 pb-8 pt-2">
                    <Button
                      id={`pricing-select-${plan.code}`}
                      className={`w-full py-2.5 text-sm font-semibold transition-all shadow-md ${
                        user && (user.role !== 'lawyer' && user.role !== 'admin')
                          ? 'opacity-60 cursor-not-allowed bg-zinc-800 text-zinc-400 border border-zinc-700/60 shadow-none hover:bg-zinc-800'
                          : isPopular
                          ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-900/30'
                          : ''
                      }`}
                      variant={isPopular && !isLawyerVerified ? 'primary' : 'secondary'}
                      disabled={
                        (user && (user.role !== 'lawyer' && user.role !== 'admin')) ||
                        (plan.code === 'lawyer_verified' && isLawyerVerified) ||
                        (plan.code === 'lawyer_basic' && user && user.role === 'lawyer') ||
                        checkoutLoading === plan.code
                      }
                      isLoading={checkoutLoading === plan.code}
                      onClick={() => handleSelectLawyerPlan(plan)}
                    >
                      {!user ? (
                        plan.code === 'lawyer_verified' ? 'Get Verified Badge' : 'Join Directory Free'
                      ) : user.role !== 'lawyer' && user.role !== 'admin' ? (
                        'Lawyer Account Required'
                      ) : plan.code === 'lawyer_verified' && isLawyerVerified ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1.5 inline" />
                          Verified Badge Active
                        </>
                      ) : plan.code === 'lawyer_basic' ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1.5 inline" />
                          Current Base Plan
                        </>
                      ) : (
                        'Get Verified Badge (Tk. 999)'
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* Feature Comparison Guarantee */}
        <div className="mt-20 max-w-4xl mx-auto border-t border-zinc-900 pt-12">
          <div className="grid sm:grid-cols-3 gap-8 text-center sm:text-left">
            <div className="flex flex-col items-center sm:items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-200">BD Legal Compliance</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Built specifically around Bangladesh penal laws, court acts, and legal procedures.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center sm:items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-200">Bar Council Verification</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Every advocate is verified with official credentials for client trust and authenticity.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center sm:items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-200">Instant Activation</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Seamless digital payments with bKash, Nagad, and instant sandbox demo checkout.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto text-center border-t border-zinc-900 pt-12">
          <h3 className="text-xl font-bold text-zinc-50 mb-3">Questions about pricing?</h3>
          <p className="text-sm text-zinc-400 mb-6">
            Clients get free AI legal guidance and can upgrade to Pro for unlimited queries, 20-turn memory, document and image analysis, and direct access to verified lawyers. Lawyers can join our directory for free and upgrade to Verified status anytime.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/client/chat">
              <Button variant="ghost" className="text-xs text-zinc-300">
                Try AI Chat →
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="ghost" className="text-xs text-blue-400">
                Create Account →
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

