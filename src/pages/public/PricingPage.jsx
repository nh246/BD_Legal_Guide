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

  // Filter plans based on the selected role tab:
  // User tab -> only user plans ('user_free', 'user_pro')
  // Lawyer tab -> only lawyer plans ('lawyer_basic', 'lawyer_verified')
  const displayedPlans = allPlans.filter((plan) => {
    const isLawyerPlan = (plan.target_role === 'lawyer') || (plan.code && plan.code.toLowerCase().includes('lawyer'));
    return activeTab === 'lawyer' ? isLawyerPlan : !isLawyerPlan;
  });

  const isUserPro = Boolean(
    (subData?.status === 'active' && subData?.plan_code === 'user_pro') ||
    user?.plan === 'user_pro' ||
    user?.plan === 'pro' ||
    user?.is_pro === true
  );
  const activePlanCode = isUserPro ? 'user_pro' : (subData?.plan_code || (user?.role === 'user' ? 'user_free' : 'lawyer_basic'));
  const isLawyerVerified = Boolean(lawyerData?.verification_paid || lawyerData?.verification_status === 'approved');

  // Handle plan purchase / upgrade / registration redirect
  const handleSelectPlan = async (plan) => {
    // 1. If not logged in -> redirect to register with role and plan
    if (!token || !user) {
      navigate(`/register?role=${activeTab}&plan=${plan.code}`);
      return;
    }

    // 2. Role restriction checks
    if (activeTab === 'user' && user.role !== 'user' && user.role !== 'admin') {
      toast('This plan is for client accounts. You are logged in as a Lawyer.', 'error');
      return;
    }
    if (activeTab === 'lawyer' && user.role !== 'lawyer' && user.role !== 'admin') {
      toast('This plan is for verified lawyers only. You are currently logged in as a Client.', 'error');
      return;
    }

    // 3. Current plan checks
    if (plan.code === activePlanCode && plan.code !== 'lawyer_verified') {
      toast('You are currently on this plan.', 'info');
      return;
    }
    if (plan.code === 'lawyer_verified' && isLawyerVerified) {
      toast('Your Bar Council Verified Badge is already active.', 'info');
      return;
    }

    // 4. Free plan selection
    if (plan.price === 0 || plan.price_monthly === 0) {
      toast('You already have access to the Free tier features.', 'info');
      return;
    }

    // 5. Checkout execution via demo payment provider
    setCheckoutLoading(plan.code);
    try {
      if (plan.code === 'lawyer_verified') {
        await api.post('/lawyer/verification-purchase', { provider: 'demo' });
        toast('Bar Council Verified Badge activated! Your profile now has priority ranking.', 'success');
        if (reloadLawyer) reloadLawyer();
      } else {
        await api.post('/subscriptions', { plan_code: plan.code, provider: 'demo' });
        toast(`Successfully upgraded to ${plan.name}! Unlimited AI intelligence is now active.`, 'success');
        if (reloadSub) reloadSub();
      }
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to process subscription checkout'), 'error');
    } finally {
      setCheckoutLoading(null);
    }
  };

  // Helper to determine CTA button text and state
  const getButtonState = (plan) => {
    const isMatchingRole = user && (
      (activeTab === 'user' && (user.role === 'user' || user.role === 'admin')) ||
      (activeTab === 'lawyer' && (user.role === 'lawyer' || user.role === 'admin'))
    );

    if (!user) {
      if (plan.price === 0 || plan.price_monthly === 0) {
        return { label: activeTab === 'user' ? 'Get Started Free' : 'Join Directory Free', variant: 'secondary', disabled: false };
      }
      return { label: activeTab === 'user' ? 'Upgrade to Pro' : 'Get Verified Badge', variant: 'primary', disabled: false };
    }

    if (!isMatchingRole) {
      return {
        label: activeTab === 'user' ? 'Client Account Required' : 'Lawyer Account Required',
        variant: 'secondary',
        disabled: true,
      };
    }

    // User is on matching role
    if (activeTab === 'user') {
      if (isUserPro) {
        if (plan.code === 'user_pro') {
          return { label: 'Current Plan', variant: 'secondary', disabled: true, isCurrent: true };
        }
        if (plan.code === 'user_free') {
          return { label: 'Downgrade unavailable', variant: 'secondary', disabled: true };
        }
      } else {
        // Free user
        if (plan.code === 'user_free') {
          return { label: 'Current Plan', variant: 'secondary', disabled: true, isCurrent: true };
        }
        if (plan.code === 'user_pro') {
          return { label: 'Upgrade to Pro', variant: 'primary', disabled: false };
        }
      }
      return { label: 'Select Plan', variant: 'secondary', disabled: false };
    }

    if (activeTab === 'lawyer') {
      if (plan.code === 'lawyer_verified') {
        if (isLawyerVerified) {
          return { label: 'Verified Badge Active', variant: 'secondary', disabled: true, isCurrent: true };
        }
        return { label: 'Get Verified Badge (Tk. 999)', variant: 'primary', disabled: false };
      }
      return { label: 'Current Base Plan', variant: 'secondary', disabled: true, isCurrent: true };
    }

    return { label: 'Select Plan', variant: 'secondary', disabled: false };
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
        ) : displayedPlans.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title={`No ${activeTab === 'user' ? 'Client' : 'Lawyer'} plans available`}
            description="Pricing plans for this category are currently being updated."
            actionLabel="Refresh Plans"
            onAction={reload}
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {displayedPlans.map((plan, idx) => {
              const btnState = getButtonState(plan);
              const isPopular = plan.popular || plan.code === 'user_pro' || plan.code === 'lawyer_verified';

              return (
                <Card
                  key={plan.id || idx}
                  className={`relative flex flex-col transition-all duration-300 ${
                    isPopular
                      ? activeTab === 'lawyer'
                        ? 'border-violet-500 shadow-2xl shadow-violet-950/40 bg-zinc-900/90 ring-1 ring-violet-500/30'
                        : 'border-blue-500 shadow-2xl shadow-blue-950/40 bg-zinc-900/90 ring-1 ring-blue-500/30'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {/* Badge top center */}
                  {isPopular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className={`inline-flex items-center gap-1 text-white border-none px-4 py-1 text-xs font-bold rounded-full shadow-lg ${
                        activeTab === 'lawyer'
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 shadow-violet-900/50'
                          : 'bg-gradient-to-r from-blue-600 to-violet-600 shadow-blue-900/50'
                      }`}>
                        {activeTab === 'lawyer' ? (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                            Recommended for Advocates
                          </>
                        ) : (
                          <>
                            <Zap className="h-3.5 w-3.5 text-amber-300" />
                            Most Popular for Clients
                          </>
                        )}
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
                      <span className="text-zinc-400 text-sm font-medium">/month</span>
                    </div>

                    <p className="text-sm text-zinc-400 max-w-xs mx-auto leading-relaxed">
                      {plan.code === 'user_free'
                        ? 'Essential Gemini AI legal assistance and lawyer discovery for citizens.'
                        : plan.code === 'user_pro'
                        ? 'Deep legal intelligence with extended memory, document analysis and priority support.'
                        : plan.code === 'lawyer_basic'
                        ? 'Standard directory presence and direct consultation inquiries from citizens.'
                        : 'Official Bar Council verification, top ranking, and integrated client consultation suite.'}
                    </p>
                  </CardHeader>

                  <CardContent className="flex-1 px-6 sm:px-8 pt-4 pb-6">
                    <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
                      {plan.price === 0 ? 'Included Features' : 'Everything in Free, plus:'}
                    </div>

                    <ul className="space-y-3.5">
                      {(plan.code === 'user_free' ? [
                        "10 AI messages per day",
                        "3 saved chat sessions",
                        "5-turn AI memory",
                        "Browse verified lawyer directory and book consultations"
                      ] : plan.code === 'user_pro' ? [
                        "Unlimited AI chat queries and saved sessions",
                        "Extended AI memory (20-turn context vs 5)",
                        "Legal document and image upload with AI analysis (PDF/TXT/PNG/JPG)",
                        "AI confidence score on every answer",
                        "Direct messaging with verified lawyers",
                        "Priority handling of consultation requests"
                      ] : (plan.features || [])).map((feature, i) => (
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
                        btnState.disabled
                          ? 'opacity-60 cursor-not-allowed bg-zinc-800 text-zinc-400 border border-zinc-700/60 shadow-none hover:bg-zinc-800'
                          : isPopular
                          ? activeTab === 'lawyer'
                            ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-900/30'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30'
                          : ''
                      }`}
                      variant={btnState.variant}
                      disabled={btnState.disabled || checkoutLoading === plan.code}
                      isLoading={checkoutLoading === plan.code}
                      onClick={() => handleSelectPlan(plan)}
                    >
                      {btnState.isCurrent && <CheckCircle2 className="h-4 w-4 mr-1.5 inline" />}
                      {btnState.label}
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
            Clients get free AI legal guidance and can upgrade to Pro for unlimited queries, document and image analysis, and direct access to verified lawyers. Lawyers can join our directory for free and upgrade to Verified status anytime.
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
