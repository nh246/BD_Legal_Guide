import React, { useEffect, useState } from 'react';
import { Cpu, Save } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { LoadingState, ErrorState } from '../../components/ui/PageStates';
import useApi from '../../lib/useApi';
import api, { getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';

export default function AdminLlmConfig() {
  const { data, loading, error, reload } = useApi('/admin/llm-config');
  const [provider, setProvider] = useState('gemini');
  const [modelName, setModelName] = useState('gemini-1.5-flash');
  const [temperature, setTemperature] = useState('0.7');
  const [maxTokens, setMaxTokens] = useState('2048');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [disclaimer, setDisclaimer] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setProvider(data.provider || 'gemini');
      setModelName(data.model_name || data.model || 'gemini-1.5-flash');
      setTemperature(data.temperature?.toString() || '0.7');
      setMaxTokens(data.max_tokens?.toString() || '2048');
      setSystemPrompt(data.system_prompt || '');
      setDisclaimer(data.disclaimer || '');
    }
  }, [data]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = {
        provider,
        model_name: modelName,
        model: modelName,
        temperature: parseFloat(temperature),
        max_tokens: parseInt(maxTokens, 10),
        system_prompt: systemPrompt,
        disclaimer,
        is_active: true,
      };

      await api.put('/admin/llm-config', formData);
      toast('Model configuration updated', 'success');
      reload();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to update LLM configuration'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">LLM Configuration</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Configure active AI model provider, sampling parameters, system prompts, and legal disclaimers.
          </p>
        </div>

        {loading ? (
          <LoadingState label="Loading LLM settings..." />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-blue-500" />
                Model Parameters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Provider Select */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-zinc-300">
                      LLM Provider
                    </label>
                    <select
                      id="llm-provider-select"
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-50 p-2.5 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                    >
                      <option value="mock">Mock (Offline Testing)</option>
                      <option value="gemini">Google Gemini</option>
                      <option value="openai">OpenAI</option>
                      <option value="openrouter">OpenRouter</option>
                    </select>
                  </div>

                  {/* Model Name */}
                  <Input
                    label="Model Name"
                    placeholder="e.g. gemini-1.5-flash, mock-model"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Temperature */}
                  <Input
                    label="Temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    placeholder="0.7"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                  />

                  {/* Max Tokens */}
                  <Input
                    label="Max Tokens"
                    type="number"
                    placeholder="2048"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(e.target.value)}
                  />
                </div>

                {/* System Prompt */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">
                    System Prompt / Guardrails
                  </label>
                  <textarea
                    rows={5}
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-50 placeholder-zinc-500 p-3 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none resize-y"
                    placeholder="Define the behavior and legal guidelines of the assistant..."
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                  />
                </div>

                {/* Disclaimer */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">
                    Legal Disclaimer Text
                  </label>
                  <textarea
                    rows={3}
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-50 placeholder-zinc-500 p-3 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none resize-y"
                    placeholder="e.g. This advice is educational and does not constitute formal attorney-client privilege..."
                    value={disclaimer}
                    onChange={(e) => setDisclaimer(e.target.value)}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" isLoading={saving} className="gap-2">
                    <Save className="h-4 w-4" /> Save Configuration
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
