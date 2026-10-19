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
  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState('0.2');
  const [maxTokens, setMaxTokens] = useState('2048');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setModel(data.model || 'gemini-1.5-pro');
      setTemperature(data.temperature?.toString() || '0.2');
      setMaxTokens(data.max_tokens?.toString() || '2048');
      setSystemPrompt(data.system_prompt || '');
    }
  }, [data]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/llm-config', {
        model,
        temperature: parseFloat(temperature),
        max_tokens: parseInt(maxTokens, 10),
        system_prompt: systemPrompt,
      });
      toast('LLM Configuration updated', 'success');
      reload();
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">LLM Configuration</h1>
          <p className="text-sm text-zinc-400 mt-1">Configure model provider, temperature, and default legal prompt guidelines.</p>
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
                  <Input
                    label="Model"
                    placeholder="e.g. gemini-1.5-pro"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  />
                  <Input
                    label="Temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    placeholder="0.2"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                  />
                </div>

                <Input
                  label="Max Tokens"
                  type="number"
                  placeholder="2048"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">
                    System Prompt / Guardrails
                  </label>
                  <textarea
                    rows={6}
                    className="w-full rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-50 placeholder-zinc-500 p-3 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                    placeholder="Define the behavior of the Bangladesh Legal AI assistant..."
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
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
