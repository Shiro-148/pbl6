import { authFetch } from './auth';

// Use VITE_API_BASE if provided, otherwise default to localhost backend for dev
const API = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

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

export async function createCard(setId, cardData) {
  const body = {
    word: cardData.word || cardData.front || '',
    definition: cardData.definition || cardData.back || '',
    example: cardData.example || '',
    phonetic: cardData.phonetic || '',
    type: cardData.type || '',
    audio: cardData.audio || ''
  };
  
  const res = await authFetch(`${API}/api/sets/${setId}/cards`, {
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