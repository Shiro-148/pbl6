import { authFetch } from './auth';

const API = import.meta.env.VITE_API_BASE || '';

export async function listSets() {
  const res = await authFetch(`${API}/api/sets`);
  if (!res.ok) throw new Error(`Failed to list sets: ${res.status}`);
  return res.json();
}

export async function createSet(title, description) {
  const res = await authFetch(`${API}/api/sets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${txt}`);
  }
  return res.json();
}

export async function listCards(setId) {
  const res = await authFetch(`${API}/api/sets/${setId}/cards`);
  if (!res.ok) throw new Error(`Failed to list cards: ${res.status}`);
  return res.json();
}

export async function createCard(setId, front, back) {
  const res = await authFetch(`${API}/api/sets/${setId}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ front, back }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${txt}`);
  }
  return res.json();
}

export async function enrichWords(textOrWords) {
  const body = typeof textOrWords === 'string' ? { text: textOrWords } : { words: textOrWords };
  const res = await authFetch(`${API}/api/flashcards/enrich`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${txt}`);
  }
  return res.json();
}

export default { listSets, createSet, listCards, createCard, enrichWords };