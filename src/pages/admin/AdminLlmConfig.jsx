import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu,
  Sparkles,
  Save,
  RotateCcw,
  Play,
  Key,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  AlertTriangle,
  Info,
  Terminal,
  ExternalLink,
  Sliders,
  FileCode,
  Layers,
  Trash2,
  Eye,
  EyeOff,
  Globe,
  Database,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { LoadingState, ErrorState } from '../../components/ui/PageStates';
import useApi from '../../lib/useApi';
import api, { getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';

const PROVIDER_OPTIONS = [
  { value: 'gemini', label: 'Google Gemini', desc: 'Default production AI for BD legal query analysis' },
  { value: 'openai', label: 'OpenAI GPT-4o / GPT-4.1', desc: 'High intelligence reasoning and drafting' },
  { value: 'anthropic', label: 'Anthropic Claude 3.5 / 4.5', desc: 'Superior legal synthesis & nuance' },
  { value: 'mock', label: 'Mock Engine (Deterministic)', desc: 'Instant local simulation, offline safe, no API key needed' },
];

const MODEL_SUGGESTIONS = {
  gemini: ['gemini-2.5-flash', 'gemini-2.5-pro'],
  openai: ['gpt-4o-mini', 'gpt-4.1-mini'],
  anthropic: ['claude-3-5-haiku-latest', 'claude-sonnet-4-5'],
  mock: ['mock-model'],
};

export default function AdminLLMConfig() {
  const { data, loading, error, reload } = useApi('/admin/llm-config');

  const [form, setForm] = useState({
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    max_tokens: 2048,
    system_prompt: '',
    disclaimer: '',
  });

  const [saving, setSaving] = useState(false);

  // Credentials State
  const [credentials, setCredentials] = useState([]);
  const [loadingCreds, setLoadingCreds] = useState(true);
  const [credInputs, setCredInputs] = useState({});
  const [showKeys, setShowKeys] = useState({});
  const [savingCred, setSavingCred] = useState({});
  const [clearingCred, setClearingCred] = useState({});

  // Test Prompt Modal State
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testPrompt, setTestPrompt] = useState(
    'A tenant was evicted without a 15-day notice under Dhaka tenancy norms. What are their immediate legal remedies?'
  );
  const [testResponse, setTestResponse] = useState('');
  const [testingPrompt, setTestingPrompt] = useState(false);
  const [copiedTest, setCopiedTest] = useState(false);

  // Reset Confirmation Modal State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Load provider credentials from DB / API
  const fetchCredentials = useCallback(async () => {
    try {
      setLoadingCreds(true);
      const res = await api.get('/admin/credentials');
      const list = res.data?.credentials || [];
      setCredentials(list);

      // Pre-fill base_url into credInputs if not already edited
      setCredInputs((prev) => {
        const next = { ...prev };
        list.forEach((item) => {
          if (!next[item.provider]) {
            next[item.provider] = {
              api_key: '',
              base_url: item.base_url || '',
            };
          } else if (next[item.provider].base_url === undefined && item.base_url) {
            next[item.provider].base_url = item.base_url;
          }
        });
        return next;
      });
    } catch (err) {
      console.error('Failed to load credentials:', err);
    } finally {
      setLoadingCreds(false);
    }
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  // Sync loaded config data to form state
  useEffect(() => {
    if (data) {
      setForm({
        provider: data.provider || 'gemini',
        model: data.model_name || data.model || 'gemini-2.5-flash',
        temperature: typeof data.temperature === 'number' ? data.temperature : 0.7,
        max_tokens: data.max_tokens || 2048,
        system_prompt: data.system_prompt || '',
        disclaimer: data.disclaimer || '',
      });
    }
  }, [data]);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProviderChange = (e) => {
    const newProvider = e.target.value;
    let suggestedModel = form.model;
    if (newProvider === 'gemini') suggestedModel = 'gemini-2.5-flash';
    else if (newProvider === 'openai') suggestedModel = 'gpt-4o-mini';
    else if (newProvider === 'anthropic') suggestedModel = 'claude-3-5-haiku-latest';
    else if (newProvider === 'mock') suggestedModel = 'mock-model';

    setForm((prev) => ({
      ...prev,
      provider: newProvider,
      model: suggestedModel,
    }));
  };

  // Helper to find credential details for a provider
  const getCredInfo = (provider) => {
    return credentials.find((c) => c.provider === provider) || {
      provider,
      has_key: false,
      source: 'none',
      masked_key: null,
      base_url: null,
    };
  };

  // Render Status Chip (DB-first: Green "Configured (DB)", Amber "Configured (env)", Red "Missing")
  const renderStatusChip = (provider, idPrefix = 'cred') => {
    const cred = getCredInfo(provider);
    if (cred.source === 'db') {
      return (
        <span
          id={`${idPrefix}-status-chip-${provider}`}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
        >
          <Database className="w-3.5 h-3.5" />
          Configured (DB)
        </span>
      );
    }
    if (cred.source === 'env') {
      return (
        <span
          id={`${idPrefix}-status-chip-${provider}`}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30"
        >
          <Info className="w-3.5 h-3.5" />
          Configured (env)
        </span>
      );
    }
    return (
      <span
        id={`${idPrefix}-status-chip-${provider}`}
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30"
      >
        <XCircle className="w-3.5 h-3.5" />
        Missing
      </span>
    );
  };

  // Handle credential inputs
  const handleCredInputChange = (provider, field, val) => {
    setCredInputs((prev) => ({
      ...prev,
      [provider]: {
        ...(prev[provider] || {}),
        [field]: val,
      },
    }));
  };

  const toggleShowKey = (provider) => {
    setShowKeys((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }));
  };

  // Save credential to DB
  const handleSaveCredential = async (provider) => {
    const input = credInputs[provider] || {};
    setSavingCred((prev) => ({ ...prev, [provider]: true }));
    try {
      const payload = {
        provider,
        api_key: input.api_key !== undefined ? input.api_key : null,
        base_url: input.base_url !== undefined ? input.base_url : null,
      };
      await api.post('/admin/credentials', payload);
      toast.success(`Credentials for ${provider.toUpperCase()} saved to DB`);
      // Clear typed password input so placeholder displays new masked key
      setCredInputs((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          api_key: '',
        },
      }));
      await fetchCredentials();
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, `Failed to save ${provider} credentials`));
    } finally {
      setSavingCred((prev) => ({ ...prev, [provider]: false }));
    }
  };

  // Clear credential from DB (falls back to env)
  const handleClearCredential = async (provider) => {
    setClearingCred((prev) => ({ ...prev, [provider]: true }));
    try {
      const payload = {
        provider,
        api_key: '', // clears to null in DB
      };
      await api.post('/admin/credentials', payload);
      toast.success(`DB key cleared for ${provider.toUpperCase()}. Falling back to environment variables.`);
      setCredInputs((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          api_key: '',
        },
      }));
      await fetchCredentials();
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, `Failed to clear ${provider} key`));
    } finally {
      setClearingCred((prev) => ({ ...prev, [provider]: false }));
    }
  };

  // Save LLM Config changes
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        provider: form.provider,
        model_name: form.model.trim(),
        model: form.model.trim(),
        temperature: parseFloat(form.temperature),
        max_tokens: parseInt(form.max_tokens, 10),
        system_prompt: form.system_prompt.trim(),
        disclaimer: form.disclaimer.trim(),
        is_active: true,
      };

      await api.post('/admin/llm-config', payload);
      toast.success('LLM Configuration updated successfully');
      reload();
      fetchCredentials();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update LLM configuration'));
    } finally {
      setSaving(false);
    }
  };

  // Test prompt execution
  const handleExecuteTest = async () => {
    if (!testPrompt.trim()) {
      toast.error('Please enter a test prompt');
      return;
    }
    setTestingPrompt(true);
    try {
      setTestResponse('');
      const res = await api.post(
        '/admin/llm-config/test',
        { prompt: testPrompt.trim() },
        { timeout: 60000 }
      );
      const output = res.data?.response || res.data?.reply || 'No response returned from provider.';
      setTestResponse(output);
      toast.success('Test prompt executed successfully');
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to execute test prompt');
      setTestResponse(`[Error: ${msg}]`);
      toast.error(msg);
    } finally {
      setTestingPrompt(false);
    }
  };

  const handleCopyResponse = () => {
    if (!testResponse) return;
    navigator.clipboard.writeText(testResponse);
    setCopiedTest(true);
    setTimeout(() => setCopiedTest(false), 2000);
    toast.success('Response copied to clipboard');
  };

  // Reset to defaults
  const handleResetToDefaults = async () => {
    setResetting(true);
    try {
      const res = await api.post('/admin/llm-config/reset');
      if (res.data) {
        setForm({
          provider: res.data.provider || 'gemini',
          model: res.data.model_name || res.data.model || 'gemini-2.5-flash',
          temperature: typeof res.data.temperature === 'number' ? res.data.temperature : 0.7,
          max_tokens: res.data.max_tokens || 2048,
          system_prompt: res.data.system_prompt || '',
          disclaimer: res.data.disclaimer || '',
        });
      }
      toast.success('LLM Configuration reset to defaults');
      setResetModalOpen(false);
      reload();
      fetchCredentials();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to reset LLM configuration'));
    } finally {
      setResetting(false);
    }
  };

  if (loading && !data) {
    return <LoadingState message="Loading LLM runtime configuration..." />;
  }

  if (error && !data) {
    return <ErrorState message={getErrorMessage(error, 'Could not load LLM config')} onRetry={reload} />;
  }

  const activeProviderCred = getCredInfo(form.provider);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                LLM Engine & Model Config
                <Badge variant="warning" size="xs">Admin Only</Badge>
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Configure runtime legal reasoning providers, models, hyper-parameters, and credentials.
              </p>
            </div>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            className="border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white"
            onClick={() => setTestModalOpen(true)}
            id="open-test-modal-btn"
          >
            <Play className="w-4 h-4 text-emerald-400 mr-2" />
            Send Test Prompt
          </Button>

          <Button
            type="button"
            variant="danger"
            className="bg-red-950/40 border border-red-500/30 text-red-300 hover:bg-red-900/60 hover:text-white"
            onClick={() => setResetModalOpen(true)}
            id="open-reset-modal-btn"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>
      </div>

      {/* TASK 3: Provider Credentials Section */}
      <Card className="p-6 bg-zinc-900/80 border-zinc-800 space-y-5" id="provider-credentials-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2">
            <Key className="w-4.5 h-4.5 text-amber-400" />
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-200">
                Provider Credentials
              </h2>
              <p className="text-[11px] text-zinc-400">
                Store API keys and endpoint base URLs in the database. Changes take effect immediately without restarting the server.
              </p>
            </div>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">
            DB credentials take priority over .env
          </span>
        </div>

        {/* List of Provider Credentials */}
        <div className="space-y-4">
          {['gemini', 'openai', 'anthropic', 'mock'].map((prov) => {
            const cred = getCredInfo(prov);
            const input = credInputs[prov] || { api_key: '', base_url: '' };
            const isSaving = savingCred[prov];
            const isClearing = clearingCred[prov];
            const showKey = showKeys[prov];

            return (
              <div
                key={prov}
                id={`cred-row-${prov}`}
                className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/90 hover:border-zinc-700/80 transition-all space-y-3"
              >
                {/* Provider Title & Status Chip */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-sm text-zinc-100 capitalize">
                      {prov === 'gemini' && 'Google Gemini'}
                      {prov === 'openai' && 'OpenAI'}
                      {prov === 'anthropic' && 'Anthropic'}
                      {prov === 'mock' && 'Mock Engine'}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">({prov})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {renderStatusChip(prov, 'cred')}
                  </div>
                </div>

                {/* Inputs & Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
                  {/* API Key Input */}
                  <div className="lg:col-span-6 space-y-1">
                    <label
                      htmlFor={`cred-key-input-${prov}`}
                      className="block text-[11px] font-medium text-zinc-400"
                    >
                      API Key
                    </label>
                    <div className="relative">
                      <input
                        id={`cred-key-input-${prov}`}
                        type={showKey ? 'text' : 'password'}
                        value={input.api_key}
                        onChange={(e) => handleCredInputChange(prov, 'api_key', e.target.value)}
                        placeholder={
                          cred.masked_key
                            ? `Configured (${cred.masked_key})`
                            : prov === 'mock'
                            ? 'No key required for mock'
                            : 'Enter API Key (leaves blank to keep current)'
                        }
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-3 pr-9 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500/40 focus:border-amber-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey(prov)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                        title={showKey ? 'Hide key' : 'Show key'}
                      >
                        {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Base URL Input */}
                  <div className="lg:col-span-3 space-y-1">
                    <label
                      htmlFor={`cred-base-url-input-${prov}`}
                      className="block text-[11px] font-medium text-zinc-400"
                    >
                      Base URL (Optional Override)
                    </label>
                    <div className="relative">
                      <Globe className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        id={`cred-base-url-input-${prov}`}
                        type="text"
                        value={input.base_url !== undefined ? input.base_url : (cred.base_url || '')}
                        onChange={(e) => handleCredInputChange(prov, 'base_url', e.target.value)}
                        placeholder="e.g. https://api.openai.com/v1"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500/40 focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="lg:col-span-3 flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      id={`cred-save-btn-${prov}`}
                      disabled={isSaving || isClearing}
                      onClick={() => handleSaveCredential(prov)}
                      className="flex-1 py-2 text-xs font-medium"
                    >
                      {isSaving ? (
                        <span className="flex items-center justify-center gap-1">
                          <span className="w-3 h-3 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1">
                          <Save className="w-3.5 h-3.5" />
                          Save
                        </span>
                      )}
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      id={`cred-clear-btn-${prov}`}
                      disabled={isSaving || isClearing || (cred.source !== 'db' && !cred.base_url)}
                      onClick={() => handleClearCredential(prov)}
                      className="py-2 text-xs border-zinc-800 text-zinc-400 hover:text-red-300 hover:border-red-500/30 hover:bg-red-950/20 disabled:opacity-40"
                      title="Clear DB credentials and fall back to environment variable"
                    >
                      {isClearing ? (
                        <span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" />
                          Clear Key
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <Card className="p-6 bg-zinc-900/70 border-zinc-800 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-200">
                Active Provider & Generation Controls
              </h2>
            </div>
            {renderStatusChip(form.provider, 'active-provider')}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Provider Dropdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="llm-provider" className="text-xs font-medium text-zinc-300">
                  AI Provider Engine
                </label>
                <span id="provider-status-chip">
                  {renderStatusChip(form.provider, 'chip')}
                </span>
              </div>
              <select
                id="llm-provider"
                value={form.provider}
                onChange={handleProviderChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors"
              >
                {PROVIDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.value})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-zinc-500">
                {PROVIDER_OPTIONS.find((o) => o.value === form.provider)?.desc}
              </p>
            </div>

            {/* Model Name & Suggestions */}
            <div className="space-y-2">
              <label htmlFor="llm-model" className="text-xs font-medium text-zinc-300">
                Model Identifier
              </label>
              <input
                id="llm-model"
                type="text"
                value={form.model}
                onChange={(e) => handleChange('model', e.target.value)}
                placeholder="e.g. gemini-2.5-flash, gpt-4o-mini, claude-3-5-haiku-latest"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors"
                required
              />

              {/* Model Suggestions per Provider (TASK 2) */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-zinc-500">Suggestions:</span>
                {MODEL_SUGGESTIONS[form.provider]?.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    id={`model-suggestion-${sug}`}
                    onClick={() => handleChange('model', sug)}
                    className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors ${
                      form.model === sug
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                        : 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60 hover:bg-zinc-850 hover:text-white'
                    }`}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Temperature Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="llm-temperature" className="text-xs font-medium text-zinc-300">
                  Temperature (Creativity / Precision)
                </label>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-amber-400 font-semibold border border-zinc-700">
                  {parseFloat(form.temperature).toFixed(2)}
                </span>
              </div>
              <input
                id="llm-temperature"
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={form.temperature}
                onChange={(e) => handleChange('temperature', e.target.value)}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>0.0 (Strict / Deterministic)</span>
                <span>0.7 (Default)</span>
                <span>2.0 (High Variance)</span>
              </div>
            </div>

            {/* Max Tokens */}
            <div className="space-y-2">
              <label htmlFor="llm-max-tokens" className="text-xs font-medium text-zinc-300">
                Max Output Tokens
              </label>
              <input
                id="llm-max-tokens"
                type="number"
                min="256"
                max="32768"
                step="128"
                value={form.max_tokens}
                onChange={(e) => handleChange('max_tokens', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors"
                required
              />
              <p className="text-[11px] text-zinc-500">
                Hard limit on generated response length (Default: 2048 tokens).
              </p>
            </div>
          </div>
        </Card>

        {/* Prompt & Legal Disclaimers */}
        <Card className="p-6 bg-zinc-900/70 border-zinc-800 space-y-6">
          <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-4">
            <FileCode className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-200">
              System Instruction & Legal Guardrails
            </h2>
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="llm-system-prompt" className="text-xs font-medium text-zinc-300">
                System Prompt (Persona & Bangladesh Law Guidelines)
              </label>
              <span className="text-[11px] text-zinc-500 font-mono">
                {form.system_prompt.length} chars
              </span>
            </div>
            <textarea
              id="llm-system-prompt"
              rows={4}
              value={form.system_prompt}
              onChange={(e) => handleChange('system_prompt', e.target.value)}
              placeholder="e.g. You are an AI legal assistant specialized in the laws of Bangladesh..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 text-sm text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors"
            />
            <p className="text-[11px] text-zinc-500">
              Injected at the root of every LLM conversation to preserve Bangladesh legal context and safety directives.
            </p>
          </div>

          {/* Disclaimer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="llm-disclaimer" className="text-xs font-medium text-zinc-300">
                Legal Disclaimer (Appended to Consultation Output)
              </label>
              <span className="text-[11px] text-zinc-500 font-mono">
                {form.disclaimer.length} chars
              </span>
            </div>
            <textarea
              id="llm-disclaimer"
              rows={3}
              value={form.disclaimer}
              onChange={(e) => handleChange('disclaimer', e.target.value)}
              placeholder="e.g. This information is for educational purposes and not a substitute for professional legal advice."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 text-sm text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors"
            />
            <p className="text-[11px] text-zinc-500">
              Standard statutory disclaimer returned to public clients to limit liability under Bar Council regulations.
            </p>
          </div>
        </Card>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
            className="px-6 py-2.5 font-medium shadow-lg shadow-amber-500/10"
            id="save-llm-config-btn"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                Saving Config...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save LLM Configuration
              </span>
            )}
          </Button>
        </div>
      </form>

      {/* Test Prompt Modal */}
      <Modal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        title="Test Configured LLM Engine"
        description={`Send a real-time prompt to ${form.provider.toUpperCase()} (${form.model}) to verify connectivity, latency, and response tone.`}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="test-prompt-input" className="block text-xs font-medium text-zinc-300 mb-1.5">
              Legal Test Prompt
            </label>
            <textarea
              id="test-prompt-input"
              rows={3}
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="Enter a legal inquiry..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-mono"
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[11px] text-zinc-400">
              Engine: <span className="font-semibold text-amber-400">{form.provider}</span> | Model: <span className="font-mono text-zinc-300">{form.model}</span>
            </span>

            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={testingPrompt}
              onClick={handleExecuteTest}
              id="execute-test-prompt-btn"
            >
              {testingPrompt ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  Generating...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5" />
                  Execute Prompt
                </span>
              )}
            </Button>
          </div>

          {/* Monospace Output Box */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                <span className="font-medium">Provider Response Output</span>
              </div>
              {testResponse && (
                <button
                  type="button"
                  onClick={handleCopyResponse}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors"
                >
                  {copiedTest ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedTest ? 'Copied' : 'Copy Response'}
                </button>
              )}
            </div>

            <div
              id="test-response-box"
              className="w-full max-h-72 overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap select-text selection:bg-amber-500/30"
            >
              {testResponse ? (
                testResponse
              ) : (
                <span className="text-zinc-600 italic">
                  Run a prompt above to see raw output from the configured LLM engine.
                </span>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset LLM Configuration?"
        description="Are you sure you want to revert all LLM engine parameters to system defaults?"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-200">Reverting to Default Presets</p>
              <p className="text-red-300/90 mt-0.5">
                This will reset provider to <span className="font-mono font-semibold">gemini</span>, model to <span className="font-mono font-semibold">gemini-2.5-flash</span>, temperature to 0.7, max tokens to 2048, and restore default Bangladesh legal guidelines.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setResetModalOpen(false)}
              disabled={resetting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleResetToDefaults}
              disabled={resetting}
              id="confirm-reset-btn"
            >
              {resetting ? 'Resetting...' : 'Yes, Reset to Defaults'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
