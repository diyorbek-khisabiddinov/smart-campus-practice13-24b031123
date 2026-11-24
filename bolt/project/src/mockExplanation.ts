import { explainFromRules, type ExplanationAdapter } from './explanation';

export function makeMockAdapter(mode: string | null = null): ExplanationAdapter {
  return (input, _instruction, signal) => {
    if (mode === 'unavailable') return Promise.reject(new Error('Provider unavailable'));

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        signal.removeEventListener('abort', cancel);
        if (mode === 'error') {
          reject(new Error('Simulated provider error'));
          return;
        }
        resolve({ explanation: explainFromRules(input) });
      }, mode === 'timeout' ? 2000 : 180);

      function cancel() {
        clearTimeout(timeout);
        reject(signal.reason);
      }

      if (signal.aborted) cancel();
      else signal.addEventListener('abort', cancel, { once: true });
    });
  };
}
