import { authFetch } from './auth';

const API = import.meta.env.VITE_API_BASE || '';

export async function listSets(folderId = null) {
  const url = folderId ? `${API}/api/sets?folderId=${folderId}` : `${API}/api/sets`;
  console.log('Fetching sets from URL:', url);
  const res = await authFetch(url);
  if (!res.ok) throw new Error(`Failed to list sets: ${res.status}`);
  const data = await res.json();
  console.log('Raw sets data from API:', data);
  return data;
}

export async function createSet(title, description, folderId = null) {
  const body = { title, description };
  if (folderId) {
    body.folderId = folderId;
  }
  const res = await authFetch(`${API}/api/sets`, {
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

export async function deleteSet(setId) {
  const res = await authFetch(`${API}/api/sets/${setId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${txt}`);
  }
}

export default { listSets, createSet, listCards, createCard, enrichWords, deleteSet };