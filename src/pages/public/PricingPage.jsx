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
  Edit2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import CheckoutModal from '../../components/ui/CheckoutModal';
import { useApi } from '../../lib/useApi';
import api, { asList, getErrorMessage } from '../../lib/api';
import useAuthStore from '../../store/useAuthStore';
import { toast } from '../../store/useToastStore';
import { LoadingState, ErrorState } from '../../components/ui/PageStates';

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

  // Collapsible inactive plans section
  const [isInactiveCollapsed, setIsInactiveCollapsed] = useState(true);

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

  const isAdminMode = Boolean(
    user?.role === 'admin' ||
    (user?.role === 'moderator' && Array.isArray(user?.scopes) && user.scopes.includes('plans:edit'))
  );

  // Fetch all plans from backend API: admin endpoint if superuser/moderator with plans:edit, else public
  const plansEndpoint = isAdminMode ? '/admin/plans' : '/plans';
  const { data, loading, error, reload } = useApi(plansEndpoint);
  const allPlans = asList(data, 'plans');

  // Fetch current user subscription if logged in
  const { data: subData, reload: reloadSub } = useApi(token ? '/subscriptions/mine' : null);
  // Fetch current lawyer profile if logged in as lawyer
  const { data: lawyerData, reload: reloadLawyer } = useApi(token && user?.role === 'lawyer' ? '/lawyer/me' : null);

  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [checkoutModal, setCheckoutModal] = useState({
    isOpen: false,
    payment_id: null,
    amount: 0,
    product_name: '',
  });

  // Handle payment status query params on mount (TASK 2)
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      if (statusParam === 'success') {
        toast.success('Payment successful! Pro activated.');
        try {
          useAuthStore.getState().fetchMe();
        } catch {
          // ignore
        }
        if (reloadSub) reloadSub();
        if (reloadLawyer) reloadLawyer();
      } else if (statusParam === 'failed') {
        toast.error('Payment failed. Please try again.');
      } else if (statusParam === 'cancelled') {
        toast.warning('Payment cancelled.');
      }

      // Clear query params after showing toast (replaceState)
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('status');
      newParams.delete('reason');
      navigate({ search: newParams.toString() }, { replace: true });
    }
  }, [searchParams, navigate, reloadSub, reloadLawyer]);

  // Edit Plan Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    price_monthly: 0,
    duration_days: 30,
    is_active: true,
    description: '',
    features_text: '',
    is_popular: false,
    sort_order: 0,
  });
  const [editSaving, setEditSaving] = useState(false);

  // Add Plan Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    code: '',
    name: '',
    price_monthly: 0,
    duration_days: 30,
    role: 'user',
    is_active: true,
    description: '',
    features_text: '',
    is_popular: false,
    sort_order: 0,
  });
  const [addSaving, setAddSaving] = useState(false);

  // Delete Plan Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleOpenEdit = (plan) => {
    const live = allPlans.find((p) => p.code === plan.code) || plan;
    setEditingPlan(live);
    setEditForm({
      name: live.name || '',
      price_monthly: live.price_monthly ?? live.price ?? 0,
      duration_days: live.duration_days ?? 30,
      is_active: live.is_active !== false,
      description: live.description || '',
      features_text: Array.isArray(live.features) ? live.features.join('\n') : '',
      is_popular: Boolean(live.is_popular || live.popular),
      sort_order: live.sort_order ?? 0,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e?.preventDefault();
    if (!editingPlan) return;
    setEditSaving(true);
    try {
      const planId = editingPlan.id || editingPlan.code;
      const features = editForm.features_text
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      await api.post(`/admin/plans/${planId}/edit`, {
        name: editForm.name.trim(),
        price_monthly: parseFloat(editForm.price_monthly) || 0,
        duration_days: parseInt(editForm.duration_days, 10) || 30,
        is_active: Boolean(editForm.is_active),
        description: editForm.description.trim() || null,
        features: features,
        is_popular: Boolean(editForm.is_popular),
        sort_order: parseInt(editForm.sort_order, 10) || 0,
      });
      toast(`Plan "${editForm.name}" updated successfully!`, 'success');
      setIsEditModalOpen(false);
      reload();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to update plan'), 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const handleOpenAdd = (defaultRole = 'user') => {
    setAddForm({
      code: '',
      name: '',
      price_monthly: 0,
      duration_days: 30,
      role: defaultRole === 'lawyer' ? 'lawyer' : 'user',
      is_active: true,
      description: '',
      features_text: '',
      is_popular: false,
      sort_order: 0,
    });
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = async (e) => {
    e?.preventDefault();
    if (!addForm.code.trim()) {
      toast('Plan code is required', 'error');
      return;
    }
    if (!addForm.name.trim()) {
      toast('Plan name is required', 'error');
      return;
    }
    setAddSaving(true);
    try {
      const features = addForm.features_text
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      await api.post('/admin/plans', {
        code: addForm.code.trim().toLowerCase(),
        name: addForm.name.trim(),
        price_monthly: parseFloat(addForm.price_monthly) || 0,
        duration_days: parseInt(addForm.duration_days, 10) || 30,
        role: addForm.role,
        is_active: Boolean(addForm.is_active),
        description: addForm.description.trim() || null,
        features: features,
        is_popular: Boolean(addForm.is_popular),
        sort_order: parseInt(addForm.sort_order, 10) || 0,
      });
      toast(`Plan "${addForm.name}" created successfully!`, 'success');
      setIsAddModalOpen(false);
      reload();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to create plan'), 'error');
    } finally {
      setAddSaving(false);
    }
  };

  const handleOpenDelete = (plan) => {
    setDeletingPlan(plan);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPlan) return;
    setDeleteLoading(true);
    try {
      const planId = deletingPlan.id || deletingPlan.code;
      await api.post(`/admin/plans/${planId}/delete`);
      toast(`Plan "${deletingPlan.name}" deleted successfully!`, 'success');
      setIsDeleteModalOpen(false);
      setDeletingPlan(null);
      reload();
    } catch (err) {
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        getErrorMessage(err, 'Failed to delete plan');
      toast(serverMsg, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleActivate = async (plan) => {
    try {
      const planId = plan.id || plan.code;
      await api.post(`/admin/plans/${planId}/edit`, {
        is_active: true,
      });
      toast(`Plan "${plan.name}" activated successfully!`, 'success');
      reload();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to activate plan'), 'error');
    }
  };

  const isUserPro = Boolean(
    (subData?.status === 'active' && (subData?.plan_code?.startsWith('user_pro') || subData?.plan_code === 'user_pro')) ||
    user?.plan?.startsWith('user_pro') ||
    user?.plan === 'user_pro' ||
    user?.plan === 'pro' ||
    user?.is_pro === true
  );

  const isLawyerVerified = Boolean(lawyerData?.verification_paid || lawyerData?.verification_status === 'approved');

  const getLivePlan = (code, fallback = {}) => {
    const found = allPlans.find((p) => p.code === code);
    if (!found) return { code, ...fallback };
    return {
      ...fallback,
      ...found,
      price: found.price ?? found.price_monthly ?? fallback.price,
      price_monthly: found.price_monthly ?? fallback.price_monthly,
      name: found.name || fallback.name,
      duration_days: found.duration_days ?? fallback.duration_days,
      is_active: found.is_active !== false,
      target_role: found.target_role || fallback.target_role || 'user',
      description: found.description || fallback.description,
      features: Array.isArray(found.features) ? found.features : fallback.features || [],
      is_popular: Boolean(found.is_popular || found.popular),
      sort_order: found.sort_order ?? fallback.sort_order ?? 0,
    };
  };

  // User plans
  const userPlans = allPlans.filter(
    (p) => (p.target_role === 'user' || !p.code?.toLowerCase().includes('lawyer'))
  );
  const activeUserPlans = userPlans.filter((p) => p.is_active !== false);
  const inactiveUserPlans = userPlans.filter((p) => p.is_active === false);

  // Lawyer plans
  const lawyerPlans = allPlans.filter(
    (p) => (p.target_role === 'lawyer' || p.code?.toLowerCase().includes('lawyer'))
  );
  const activeLawyerPlans = lawyerPlans.filter((p) => p.is_active !== false);
  const inactiveLawyerPlans = lawyerPlans.filter((p) => p.is_active === false);

  // Dynamic pricing config for client Pro card
  const proPricing = {
    monthly: {
      code: 'user_pro_monthly',
      name: 'Pro Monthly',
      period: '/ month',
      subtext: null,
    },
    '6m': {
      code: 'user_pro_6m',
      name: 'Pro 6 Months',
      period: '/ 180 days',
      subtext: 'Save 16%',
    },
    '1y': {
      code: 'user_pro_1y',
      name: 'Pro 1 Year',
      period: '/ 365 days',
      subtext: 'Save 30%',
    },
  };

  const currentPro = proPricing[billingCycle] || proPricing.monthly;

  const freePlan = getLivePlan('user_free', {
    code: 'user_free',
    name: 'Free Plan',
    price_monthly: 0,
    duration_days: 30,
    is_active: true,
    target_role: 'user',
    description: 'Essential legal AI guidance and lawyer search for everyday citizens.',
    features: [],
    is_popular: false,
    sort_order: 0,
  });

  const proPlan = getLivePlan(currentPro.code, {
    code: currentPro.code,
    name: currentPro.name,
    price_monthly: billingCycle === '1y' ? 2499 : billingCycle === '6m' ? 1499 : 299,
    duration_days: billingCycle === '1y' ? 365 : billingCycle === '6m' ? 180 : 30,
    is_active: true,
    target_role: 'user',
    description: 'Deep legal intelligence with 20-turn memory, document & image analysis and priority access.',
    features: [],
    is_popular: billingCycle === 'monthly',
    sort_order: 1,
  });

  // Custom User Plans (excluding standard free, pro variants, and legacy user_pro)
  const customUserPlans = activeUserPlans.filter(
    (p) => !['user_free', 'user_pro_monthly', 'user_pro_6m', 'user_pro_1y', 'user_pro'].includes(p.code)
  );

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

  // Client Pro Upgrade / Purchase (TASK 2)
  const handleSelectPro = async () => {
    const targetPlanCode = currentPro.code;

    if (!token || !user) {
      navigate(`/register?role=user&plan=${targetPlanCode}`);
      return;
    }

    if (user.role !== 'user' && user.role !== 'admin') {
      toast.error('This plan is for client accounts. You are logged in as a Lawyer.');
      return;
    }

    if (isUserPro) {
      toast.info('You currently have an active Pro subscription.');
      return;
    }

    setCheckoutLoading(targetPlanCode);
    try {
      const res = await api.post('/subscriptions', {
        plan_code: targetPlanCode,
        plan_id: proPlan?.id,
      });
      const paymentId = res.data?.payment_id;
      if (paymentId) {
        setCheckoutModal({
          isOpen: true,
          payment_id: paymentId,
          amount: proPlan.price_monthly ?? proPlan.price ?? 299,
          product_name: currentPro.name || 'Pro Subscription',
        });
      } else {
        toast.error('Failed to initiate checkout.');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to process subscription checkout'));
    } finally {
      setCheckoutLoading(null);
    }
  };

  // Lawyer Verified Badge Purchase (TASK 3)
  const handleSelectLawyerPlan = async (plan) => {
    if (!token || !user) {
      navigate(`/register?role=lawyer&plan=${plan.code}`);
      return;
    }

    if (user.role !== 'lawyer' && user.role !== 'admin') {
      toast.error('This plan is for verified lawyers only. You are currently logged in as a Client.');
      return;
    }

    if (plan.code === 'lawyer_verified' && isLawyerVerified) {
      toast.info('Your Bar Council Verified Badge is already active.');
      return;
    }

    if (plan.price === 0 || plan.price_monthly === 0) {
      toast.info('You already have access to the Free directory listing.');
      return;
    }

    setCheckoutLoading(plan.code);
    try {
      const res = await api.post('/lawyer/verification-purchase');
      const paymentId = res.data?.payment_id;
      if (paymentId) {
        setCheckoutModal({
          isOpen: true,
          payment_id: paymentId,
          amount: plan.price_monthly ?? plan.price ?? 999,
          product_name: plan.name || 'Gold Verification Badge',
        });
      } else {
        toast.error('Failed to initiate checkout.');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to process verification purchase'));
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleSelectCustomPlan = async (plan) => {
    if (!token || !user) {
      navigate(`/register?role=user&plan=${plan.code}`);
      return;
    }
    setCheckoutLoading(plan.code);
    try {
      const res = await api.post('/subscriptions', {
        plan_code: plan.code,
        plan_id: plan.id,
      });
      const paymentId = res.data?.payment_id;
      if (paymentId) {
        setCheckoutModal({
          isOpen: true,
          payment_id: paymentId,
          amount: plan.price_monthly ?? plan.price ?? 0,
          product_name: plan.name,
        });
      } else {
        toast.error('Failed to initiate checkout.');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to process subscription checkout'));
    } finally {
      setCheckoutLoading(null);
    }
  };

  const currentInactivePlans = activeTab === 'lawyer' ? inactiveLawyerPlans : inactiveUserPlans;

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

        {/* Admin Mode Banner */}
        {isAdminMode && (
          <div className="mb-10 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md shadow-xl shadow-amber-950/20">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-200 text-base">Admin Mode: Live Plan Management</span>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40">
                    Active
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-1">
                  You have full superuser rights to edit live subscription pricing, durations, features, descriptions, popular badges, or delete plans.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
              <Button
                id="admin-add-plan-banner-btn"
                onClick={() => handleOpenAdd(activeTab)}
                variant="primary"
                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white text-xs px-4 py-2.5 flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 font-semibold cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add New Plan
              </Button>
            </div>
          </div>
        )}

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
            {(freePlan.is_active !== false || isAdminMode) && (
              <Card className="relative flex flex-col transition-all duration-300 bg-zinc-900/60 border-zinc-800 hover:border-zinc-700">
                {/* Admin controls top right */}
                {isAdminMode && (
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
                    <button
                      id={`admin-edit-plan-${freePlan.code}`}
                      type="button"
                      onClick={() => handleOpenEdit(freePlan)}
                      title="Edit Plan"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all shadow-sm cursor-pointer"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      id={`admin-delete-plan-${freePlan.code}`}
                      type="button"
                      onClick={() => handleOpenDelete(freePlan)}
                      title="Delete Plan"
                      className="inline-flex items-center justify-center p-1.5 text-xs font-semibold rounded-lg bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 transition-all shadow-sm cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {/* Popular Badge */}
                {(freePlan.is_popular || freePlan.popular) && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <span className="inline-flex items-center gap-1 text-white border-none px-4 py-1 text-xs font-bold rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-violet-600 shadow-blue-900/50">
                      <Zap className="h-3.5 w-3.5 text-amber-300" />
                      Most Popular
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pt-8 pb-4">
                  <h3 className="text-2xl font-bold text-zinc-50 mb-2">
                    {freePlan.name}
                  </h3>

                  <div className="flex items-baseline justify-center gap-1 my-3">
                    <span className="text-2xl font-semibold text-zinc-400">Tk.</span>
                    <span className="text-5xl font-extrabold text-zinc-50 tracking-tight">{freePlan.price_monthly}</span>
                    <span className="text-zinc-400 text-sm font-medium">/ month</span>
                  </div>

                  {freePlan.description && (
                    <p className="text-sm text-zinc-400 max-w-xs mx-auto leading-relaxed">
                      {freePlan.description}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="flex-1 px-6 sm:px-8 pt-4 pb-6">
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
                    Included Features
                  </div>

                  <ul className="space-y-3.5">
                    {(freePlan.features && freePlan.features.length > 0
                      ? freePlan.features
                      : ['15 AI messages per month', '3 saved chat sessions', 'Standard legal assistance']
                    ).map((feature, i) => (
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
            )}

            {/* 2. Pro Card with Segmented Toggle & Dynamic Pricing */}
            {(proPlan.is_active !== false || isAdminMode) && (
              <Card className="relative flex flex-col transition-all duration-300 border-blue-500 shadow-2xl shadow-blue-950/40 bg-zinc-900/90 ring-1 ring-blue-500/30">
                {/* Admin controls top right */}
                {isAdminMode && (
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
                    <button
                      id={`admin-edit-plan-${proPlan.code}`}
                      type="button"
                      onClick={() => handleOpenEdit(proPlan)}
                      title="Edit Plan"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all shadow-sm cursor-pointer"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      id={`admin-delete-plan-${proPlan.code}`}
                      type="button"
                      onClick={() => handleOpenDelete(proPlan)}
                      title="Delete Plan"
                      className="inline-flex items-center justify-center p-1.5 text-xs font-semibold rounded-lg bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 transition-all shadow-sm cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {/* Popular Badge - Driven by API is_popular */}
                {(proPlan.is_popular || proPlan.popular) && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <span className="inline-flex items-center gap-1 text-white border-none px-4 py-1 text-xs font-bold rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-violet-600 shadow-blue-900/50">
                      <Zap className="h-3.5 w-3.5 text-amber-300" />
                      Most Popular
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pt-8 pb-4">
                  <h3 className="text-2xl font-bold text-zinc-50 mb-1 flex items-center justify-center gap-2">
                    {proPlan.name}
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
                        {(proPlan.price_monthly ?? proPlan.price ?? 299).toLocaleString()}
                      </span>
                      {billingCycle === 'monthly' ? (
                        <span className="text-zinc-400 text-sm font-medium">/ month</span>
                      ) : (
                        <span className="text-zinc-400 text-sm font-medium">
                          {currentPro.period}
                        </span>
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

                  {proPlan.description && (
                    <p className="text-sm text-zinc-400 max-w-xs mx-auto leading-relaxed mt-1">
                      {proPlan.description}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="flex-1 px-6 sm:px-8 pt-4 pb-6">
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
                    Everything in Free, plus:
                  </div>

                  <ul className="space-y-3.5">
                    {(proPlan.features && proPlan.features.length > 0
                      ? proPlan.features
                      : [
                          'Unlimited AI messages & sessions',
                          '20-turn conversation memory',
                          'Document & Image analysis (Vision)',
                          'Direct messaging with verified lawyers',
                          'Priority booking queue',
                        ]
                    ).map((feature, i) => (
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
            )}

            {/* Custom User Plans added by Admin (Active only) */}
            {customUserPlans.map((plan) => (
              <Card
                key={plan.id || plan.code}
                className="relative flex flex-col transition-all duration-300 bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 md:col-span-2 lg:col-span-1"
              >
                {isAdminMode && (
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
                    <button
                      id={`admin-edit-plan-${plan.code}`}
                      type="button"
                      onClick={() => handleOpenEdit(plan)}
                      title="Edit Plan"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all shadow-sm cursor-pointer"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      id={`admin-delete-plan-${plan.code}`}
                      type="button"
                      onClick={() => handleOpenDelete(plan)}
                      title="Delete Plan"
                      className="inline-flex items-center justify-center p-1.5 text-xs font-semibold rounded-lg bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 transition-all shadow-sm cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {/* Popular Badge */}
                {(plan.is_popular || plan.popular) && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <span className="inline-flex items-center gap-1 text-white border-none px-4 py-1 text-xs font-bold rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-violet-600 shadow-blue-900/50">
                      <Zap className="h-3.5 w-3.5 text-amber-300" />
                      Most Popular
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pt-8 pb-4">
                  <h3 className="text-2xl font-bold text-zinc-50 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1 my-3">
                    <span className="text-2xl font-semibold text-zinc-400">Tk.</span>
                    <span className="text-5xl font-extrabold text-zinc-50 tracking-tight">
                      {plan.price_monthly ?? plan.price ?? 0}
                    </span>
                    <span className="text-zinc-400 text-sm font-medium">
                      {plan.duration_days ? `/ ${plan.duration_days} days` : '/ month'}
                    </span>
                  </div>
                  {plan.description && (
                    <p className="text-sm text-zinc-400 max-w-xs mx-auto leading-relaxed">
                      {plan.description}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="flex-1 px-6 sm:px-8 pt-4 pb-6">
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
                    Included Features
                  </div>
                  <ul className="space-y-3.5">
                    {(plan.features && plan.features.length > 0 ? plan.features : ['Full platform legal intelligence included']).map((feature, i) => (
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
                    id={`pricing-select-${plan.code}`}
                    className="w-full py-2.5 text-sm font-semibold"
                    variant="secondary"
                    onClick={() => {
                      if (!token || !user) navigate(`/register?role=user&plan=${plan.code}`);
                      else handleSelectCustomPlan(plan);
                    }}
                  >
                    Select {plan.name}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          /* Lawyer Plans: Basic & Verified Badge and Custom Lawyer Plans */
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {activeLawyerPlans.map((plan, idx) => {
              const isPopular = Boolean(plan.is_popular || plan.popular);

              return (
                <Card
                  key={plan.id || plan.code || idx}
                  className={`relative flex flex-col transition-all duration-300 ${
                    isPopular
                      ? 'border-violet-500 shadow-2xl shadow-violet-950/40 bg-zinc-900/90 ring-1 ring-violet-500/30'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {isAdminMode && (
                    <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
                      <button
                        id={`admin-edit-plan-${plan.code}`}
                        type="button"
                        onClick={() => handleOpenEdit(plan)}
                        title="Edit Plan"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all shadow-sm cursor-pointer"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        id={`admin-delete-plan-${plan.code}`}
                        type="button"
                        onClick={() => handleOpenDelete(plan)}
                        title="Delete Plan"
                        className="inline-flex items-center justify-center p-1.5 text-xs font-semibold rounded-lg bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 transition-all shadow-sm cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {isPopular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                      <span className="inline-flex items-center gap-1 text-white border-none px-4 py-1 text-xs font-bold rounded-full shadow-lg bg-gradient-to-r from-violet-600 to-indigo-600 shadow-violet-900/50">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                        Most Popular
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
                        <span className="text-zinc-400 text-sm font-medium">
                          {plan.duration_days ? `/ ${plan.duration_days} days` : '/ month'}
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-sm font-medium">/ forever</span>
                      )}
                    </div>

                    {plan.description && (
                      <p className="text-sm text-zinc-400 max-w-xs mx-auto leading-relaxed">
                        {plan.description}
                      </p>
                    )}
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
                        `Get Verified Badge (Tk. ${plan.price_monthly ?? plan.price ?? 999})`
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* Collapsed Inactive Plans Section (Admin Mode only) */}
        {isAdminMode && currentInactivePlans.length > 0 && (
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xl backdrop-blur-sm">
              <button
                id="toggle-inactive-plans-btn"
                type="button"
                onClick={() => setIsInactiveCollapsed(!isInactiveCollapsed)}
                className="w-full px-6 py-4 flex items-center justify-between bg-zinc-900/80 hover:bg-zinc-800/60 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-500"></span>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-200">
                      Inactive Plans ({currentInactivePlans.length})
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Archived or deactivated subscription plans. Hidden from citizens on public page.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
                  <span>{isInactiveCollapsed ? 'Show' : 'Hide'}</span>
                  {isInactiveCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </div>
              </button>

              {!isInactiveCollapsed && (
                <div className="p-4 sm:p-6 divide-y divide-zinc-800/80">
                  {currentInactivePlans.map((plan) => (
                    <div
                      key={plan.id || plan.code}
                      className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="h-2 w-2 rounded-full bg-red-400 shrink-0"></span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-zinc-200 truncate">
                              {plan.name}
                            </span>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                              {plan.code}
                            </span>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                              Inactive
                            </span>
                          </div>
                          <div className="text-xs text-zinc-400 mt-1 flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-zinc-300">
                              Tk. {plan.price_monthly ?? plan.price ?? 0}
                            </span>
                            <span>•</span>
                            <span>{plan.duration_days ? `${plan.duration_days} days` : '30 days'}</span>
                            {plan.description && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-sm text-zinc-500">{plan.description}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Button
                          id={`admin-activate-plan-${plan.code}`}
                          size="sm"
                          variant="outline"
                          onClick={() => handleActivate(plan)}
                          className="text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50 cursor-pointer"
                        >
                          Activate
                        </Button>
                        <Button
                          id={`admin-edit-inactive-${plan.code}`}
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(plan)}
                          className="text-xs text-amber-300 border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/50 cursor-pointer"
                        >
                          Edit
                        </Button>
                        <button
                          id={`admin-delete-inactive-${plan.code}`}
                          type="button"
                          onClick={() => handleOpenDelete(plan)}
                          title="Delete Plan"
                          className="p-2 text-xs rounded-lg bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

        {/* ===================== ADMIN EDIT PLAN MODAL ===================== */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Subscription Plan"
          description={`Modify live settings for plan "${editingPlan?.name || editingPlan?.code}".`}
          maxWidth="max-w-lg"
          footer={
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                disabled={editSaving}
              >
                Cancel
              </Button>
              <Button
                id="save-edit-plan-btn"
                variant="primary"
                type="button"
                isLoading={editSaving}
                onClick={handleSaveEdit}
                className="bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30 font-semibold cursor-pointer"
              >
                Save Changes
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Read-Only: Code & Role */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">
                  Plan Code (Read-Only)
                </label>
                <span className="text-xs font-mono font-bold text-zinc-300 bg-zinc-900 px-2 py-1 rounded border border-zinc-800 inline-block">
                  {editingPlan?.code}
                </span>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">
                  Role (Read-Only)
                </label>
                <span className="text-xs font-semibold capitalize text-zinc-300 bg-zinc-900 px-2 py-1 rounded border border-zinc-800 inline-block">
                  {editingPlan?.target_role || (editingPlan?.code?.includes('lawyer') ? 'Lawyer' : 'User')}
                </span>
              </div>
            </div>

            {/* Plan Name */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Plan Name <span className="text-red-400">*</span>
              </label>
              <input
                id="edit-plan-name"
                type="text"
                required
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Price Monthly */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Price (Tk.) <span className="text-red-400">*</span>
                </label>
                <input
                  id="edit-plan-price"
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={editForm.price_monthly}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, price_monthly: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Duration Days */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Duration (Days) <span className="text-red-400">*</span>
                </label>
                <input
                  id="edit-plan-duration"
                  type="number"
                  min="1"
                  required
                  value={editForm.duration_days}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, duration_days: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Description Textarea */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Description Text
              </label>
              <textarea
                id="edit-plan-description"
                rows={3}
                placeholder="Brief summary of what this plan provides..."
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
              />
            </div>

            {/* Features Editor (One bullet per line) */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Feature Bullets <span className="text-zinc-500 font-normal">(one per line)</span>
              </label>
              <textarea
                id="edit-plan-features"
                rows={5}
                placeholder="Unlimited AI messages&#10;20-turn memory&#10;Direct lawyer contact"
                value={editForm.features_text}
                onChange={(e) => setEditForm((prev) => ({ ...prev, features_text: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-blue-500 font-mono text-xs leading-relaxed"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Each line will render as an individual checkmark bullet on the card.
              </p>
            </div>

            {/* Most Popular Toggle */}
            <div className="pt-2 border-t border-zinc-900">
              <label className="block text-xs font-semibold text-zinc-300 mb-2">
                "Most Popular" Badge
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  id="edit-plan-is-popular"
                  type="checkbox"
                  checked={editForm.is_popular}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, is_popular: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 relative"></div>
                <span className="text-sm font-medium">
                  {editForm.is_popular ? (
                    <span className="text-blue-400 font-semibold">Featured with "Most Popular" badge</span>
                  ) : (
                    <span className="text-zinc-400">Standard card styling</span>
                  )}
                </span>
              </label>
            </div>

            {/* Active Toggle */}
            <div className="pt-2 border-t border-zinc-900">
              <label className="block text-xs font-semibold text-zinc-300 mb-2">
                Active Status
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  id="edit-plan-is-active"
                  type="checkbox"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 relative"></div>
                <span className="text-sm font-medium">
                  {editForm.is_active ? (
                    <span className="text-emerald-400 font-semibold">Active (Available on public page)</span>
                  ) : (
                    <span className="text-red-400 font-semibold">Inactive (Hidden from public)</span>
                  )}
                </span>
              </label>
            </div>
          </form>
        </Modal>

        {/* ===================== ADMIN ADD PLAN MODAL ===================== */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Create New Subscription Plan"
          description="Define a new pricing plan for clients or lawyers."
          maxWidth="max-w-lg"
          footer={
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                disabled={addSaving}
              >
                Cancel
              </Button>
              <Button
                id="save-add-plan-btn"
                variant="primary"
                type="button"
                isLoading={addSaving}
                onClick={handleSaveAdd}
                className="bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-950/30 font-semibold cursor-pointer"
              >
                Create Plan
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSaveAdd} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Plan Code */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Plan Code <span className="text-red-400">*</span>
              </label>
              <input
                id="add-plan-code"
                type="text"
                required
                placeholder="e.g. user_pro_3m or lawyer_premium"
                value={addForm.code}
                onChange={(e) => setAddForm((prev) => ({ ...prev, code: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500 font-mono"
              />
              <p className="text-[11px] text-zinc-500 mt-1">Unique alphanumeric identifier (e.g. user_pro_3m)</p>
            </div>

            {/* Plan Name */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Plan Name <span className="text-red-400">*</span>
              </label>
              <input
                id="add-plan-name"
                type="text"
                required
                placeholder="e.g. Pro 3 Months"
                value={addForm.name}
                onChange={(e) => setAddForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Role Target */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Target Role <span className="text-red-400">*</span>
              </label>
              <select
                id="add-plan-role"
                value={addForm.role}
                onChange={(e) => setAddForm((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="user">Client / Citizen ("user")</option>
                <option value="lawyer">Lawyer / Advocate ("lawyer")</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Price Monthly */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Price (Tk.) <span className="text-red-400">*</span>
                </label>
                <input
                  id="add-plan-price"
                  type="number"
                  min="0"
                  step="any"
                  required
                  placeholder="0"
                  value={addForm.price_monthly}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, price_monthly: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Duration Days */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Duration (Days) <span className="text-red-400">*</span>
                </label>
                <input
                  id="add-plan-duration"
                  type="number"
                  min="1"
                  required
                  placeholder="30"
                  value={addForm.duration_days}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, duration_days: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Description Textarea */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Description Text
              </label>
              <textarea
                id="add-plan-description"
                rows={3}
                placeholder="Brief summary of what this plan provides..."
                value={addForm.description}
                onChange={(e) => setAddForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
              />
            </div>

            {/* Features Editor (One bullet per line) */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Feature Bullets <span className="text-zinc-500 font-normal">(one per line)</span>
              </label>
              <textarea
                id="add-plan-features"
                rows={5}
                placeholder="Unlimited AI messages&#10;20-turn memory&#10;Direct lawyer contact"
                value={addForm.features_text}
                onChange={(e) => setAddForm((prev) => ({ ...prev, features_text: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500 font-mono text-xs leading-relaxed"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Each line will render as an individual checkmark bullet on the card.
              </p>
            </div>

            {/* Most Popular Toggle */}
            <div className="pt-2 border-t border-zinc-900">
              <label className="block text-xs font-semibold text-zinc-300 mb-2">
                "Most Popular" Badge
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  id="add-plan-is-popular"
                  type="checkbox"
                  checked={addForm.is_popular}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, is_popular: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600 relative"></div>
                <span className="text-sm font-medium">
                  {addForm.is_popular ? (
                    <span className="text-amber-400 font-semibold">Featured with "Most Popular" badge</span>
                  ) : (
                    <span className="text-zinc-400">Standard card styling</span>
                  )}
                </span>
              </label>
            </div>

            {/* Active Toggle */}
            <div className="pt-2 border-t border-zinc-900">
              <label className="block text-xs font-semibold text-zinc-300 mb-2">
                Active Status
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  id="add-plan-is-active"
                  type="checkbox"
                  checked={addForm.is_active}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 relative"></div>
                <span className="text-sm font-medium">
                  {addForm.is_active ? (
                    <span className="text-emerald-400 font-semibold">Active (Available immediately)</span>
                  ) : (
                    <span className="text-red-400 font-semibold">Inactive (Hidden from public)</span>
                  )}
                </span>
              </label>
            </div>
          </form>
        </Modal>

        {/* ===================== DELETE CONFIRMATION MODAL ===================== */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            if (!deleteLoading) {
              setIsDeleteModalOpen(false);
              setDeletingPlan(null);
            }
          }}
          title="Delete Subscription Plan"
          description={`Are you sure you want to permanently delete plan "${deletingPlan?.name}" (${deletingPlan?.code})?`}
          maxWidth="max-w-md"
          footer={
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingPlan(null);
                }}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                id="confirm-delete-plan-btn"
                variant="primary"
                type="button"
                isLoading={deleteLoading}
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950/30 font-semibold cursor-pointer"
              >
                Delete Plan
              </Button>
            </div>
          }
        >
          <div className="space-y-3 py-2 text-sm text-zinc-300">
            <p>
              This will permanently delete this plan record from the database.
            </p>
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200/90 leading-relaxed">
              <strong>Requirement:</strong> Plans with existing user subscriptions cannot be deleted. If subscriptions exist, deactivate the plan instead to keep historical records intact.
            </div>
          </div>
        </Modal>

        {/* Global Checkout Modal */}
        <CheckoutModal
          isOpen={checkoutModal.isOpen}
          onClose={() => setCheckoutModal((prev) => ({ ...prev, isOpen: false }))}
          payment_id={checkoutModal.payment_id}
          amount={checkoutModal.amount}
          product_name={checkoutModal.product_name}
          onSuccess={async () => {
            if (reloadSub) reloadSub();
            if (reloadLawyer) reloadLawyer();
            try {
              await useAuthStore.getState().fetchMe();
            } catch {
              // ignore
            }
          }}
        />

      </div>
    </div>
  );
}
