import { useEffect, useRef, useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import { requestExplanation, type ExplanationInput, type ExplanationResult } from './explanation';
import { makeMockAdapter } from './mockExplanation';

const simulation = new URLSearchParams(window.location.search).get('explain');
const explanationAdapter = makeMockAdapter(simulation);

export function ExplanationPanel({ input }: { input: ExplanationInput }) {
  const active = useRef<AbortController>();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ExplanationResult | null>(null);

  useEffect(() => () => active.current?.abort(), []);

  async function explain() {
    if (pending) return;
    const request = new AbortController();
    active.current = request;
    setPending(true);
    setResult(null);

    const response = await requestExplanation(input, explanationAdapter, request.signal);
    if (request.signal.aborted) return;
    setResult(response);
    setPending(false);
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={explain}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:cursor-wait disabled:opacity-60"
      >
        <MessageSquareText aria-hidden="true" className="h-4 w-4" />
        Explain availability
      </button>

      <div role="status" aria-label="Availability explanation">
        {pending && <p className="text-sm text-slate-600">Preparing explanation…</p>}
        {result && (
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-slate-800">
            <p className="font-semibold text-sky-900">
              {result.source === 'mock' ? 'Explanation · Mock AI' : 'Explanation · Rules fallback'}
            </p>
            <p className="mt-1">{result.explanation}</p>
            {result.source === 'fallback' && (
              <p className="mt-1 text-xs text-slate-600">
                The mock provider didn’t return a usable explanation.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
