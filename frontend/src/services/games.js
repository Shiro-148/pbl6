// services/games.js
import { authFetch } from './auth';

const MODEL_BASE = import.meta.env.VITE_MODEL_SERVICE_BASE || (
  import.meta.env.DEV ? 'http://localhost:5000' : 'https://shiro1148-pbl6.hf.space'
);

export async function fetchMultipleChoice({ setId, optionsCount = 4, signal } = {}) {
  if (!setId) throw new Error('setId is required');
  const params = new URLSearchParams({ setId: String(setId), optionsCount: String(optionsCount) });
  const res = await authFetch(`/api/games/multiple-choice?${params.toString()}`, { signal });
  if (!res.ok) {
    const t = await res.text().catch(() => res.statusText || 'Error');
    throw new Error(`${res.status} ${t}`);
  }
  return res.json();
}

export async function generateSentenceChoices({ setId, words = [], optionsCount = 4, signal } = {}) {
  if (setId) {
    const params = new URLSearchParams({ setId: String(setId), optionsCount: String(optionsCount) });
    const res = await authFetch(`/api/games/sentence-choice?${params.toString()}`, { signal });
    if (!res.ok) {
      const t = await res.text().catch(() => res.statusText || 'Error');
      throw new Error(`${res.status} ${t}`);
    }
    return res.json();
  }
  const res = await fetch(`${MODEL_BASE}/generate-sentences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words, options_count: optionsCount }),
    signal,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => res.statusText || 'Error');
    throw new Error(`${res.status} ${t}`);
  }
  return res.json();
}

export default { fetchMultipleChoice, generateSentenceChoices };
