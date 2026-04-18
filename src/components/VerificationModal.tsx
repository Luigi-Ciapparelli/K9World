import { useState } from 'react';
import { X, Mail, Phone, BadgeCheck, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

type VerifyType = 'email' | 'phone';

interface Props {
  type: VerifyType;
  target: string;
  onClose: () => void;
  onVerified: () => void;
}

export function VerificationModal({ type, target, onClose, onVerified }: Props) {
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState<'send' | 'code'>('send');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [devCode, setDevCode] = useState('');

  const apiBase = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
  const authHeaders = async () => {
    const { data } = await supabase.auth.getSession();
    return {
      Authorization: `Bearer ${data.session?.access_token || ''}`,
      'Content-Type': 'application/json',
    };
  };

  const sendCode = async () => {
    setError('');
    setInfo('');
    setDevCode('');
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/send-verification-code`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ type, target }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to send');
      if (json.dev_code) {
        setDevCode(json.dev_code);
        setInfo(`Dev mode: provider not configured, your code is shown below.`);
      } else {
        setInfo(`Code sent to ${target}. Check your ${type === 'email' ? 'inbox' : 'messages'}.`);
      }
      setStep('code');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async () => {
    if (code.length !== 6) {
      setError('Enter the 6-digit code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/verify-code`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ type, code }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Verification failed');
      await refreshProfile();
      onVerified();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const Icon = type === 'email' ? Mail : Phone;
  const label = type === 'email' ? 'Email' : 'Phone';

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">Verify your {label.toLowerCase()}</h2>
              <p className="text-sm text-stone-600">{target}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'send' && (
          <div className="space-y-4">
            <p className="text-sm text-stone-600">
              We will send a 6-digit code to your {label.toLowerCase()}. Enter it here to confirm ownership.
            </p>
            {error && <ErrorNote text={error} />}
            <button
              onClick={sendCode}
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Send code
            </button>
          </div>
        )}

        {step === 'code' && (
          <div className="space-y-4">
            {info && (
              <div className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg p-3">
                {info}
              </div>
            )}
            {devCode && (
              <div className="text-center bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="text-xs uppercase tracking-wide text-amber-700 font-semibold mb-1">Your code</div>
                <div className="text-3xl font-bold tracking-[0.4em] text-amber-900">{devCode}</div>
              </div>
            )}
            <div>
              <label className="text-sm font-semibold text-stone-700">6-digit code</label>
              <input
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full mt-1 px-3 py-3 border border-stone-300 rounded-xl text-center text-2xl tracking-[0.4em] font-bold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            {error && <ErrorNote text={error} />}
            <div className="flex gap-3">
              <button
                onClick={sendCode}
                disabled={loading}
                className="flex-1 py-3 rounded-xl border border-stone-300 font-semibold text-stone-700 hover:bg-stone-50 transition disabled:opacity-50"
              >
                Resend
              </button>
              <button
                onClick={submitCode}
                disabled={loading}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
                Verify
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorNote({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 text-sm bg-rose-50 text-rose-700 border border-rose-100 rounded-lg p-3">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{text}</span>
    </div>
  );
}
