import { authFetch } from './auth';
import { joinExamples } from '../utils/examples';

export async function listSets(folderId = null) {
  const url = folderId ? `/api/sets?folderId=${folderId}` : `/api/sets`;
  const res = await authFetch(url);
  if (!res.ok) throw new Error(`Failed to list sets: ${res.status}`);
  const data = await res.json();
  return data;
}

export async function createSet(title, description, folderId = null) {
  const body = { title, description };
  if (folderId) {
    body.folderId = folderId;
  }
  const res = await authFetch(`/api/sets`, {
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
  const res = await authFetch(`/api/sets/${setId}/cards`);
  if (!res.ok) throw new Error(`Failed to list cards: ${res.status}`);
  return res.json();
}

export async function createCard(setId, cardData) {
  const body = {
    word: cardData.word || cardData.front || '',
    definition: cardData.definition || cardData.back || '',
    example: joinExamples(cardData.example || ''),
    phonetic: cardData.phonetic || '',
    type: cardData.type || '',
    audio: cardData.audio || '',
    level: cardData.level || cardData.difficulty || ''
  };
  
  const res = await authFetch(`/api/sets/${setId}/cards`, {
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
  const backendUrl = `/api/flashcards/enrich`;

  try {
    const res = await authFetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) return res.json();

    const txt = await res.text().catch(() => res.statusText);
    const status = res.status;
    if (status === 401 || status === 403) {
       throw new Error(`${status} ${txt}`);
    }
    console.warn(`enrichWords: Backend Render lỗi ${status}, thử fallback...`);
  } catch (err) {
    console.warn('enrichWords: Backend Render thất bại, thử fallback model local', err);
  }

  const MODEL_BASE = import.meta.env.VITE_MODEL_SERVICE_BASE || (import.meta.env.DEV ? 'http://localhost:5000' : 'https://shiro1148-pbl6.hf.space');
  const modelUrl = `${MODEL_BASE}/flashcards`;
  
  const fallbackPayload = (() => {
    if (body.text) return { text: body.text };
    if (Array.isArray(body.words)) return { text: body.words.filter(Boolean).join(' ') };
    return { text: '' };
  })();

  const resp = await fetch(modelUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fallbackPayload),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => resp.statusText);
    throw new Error(`Model service failed (${resp.status} ${txt})`);
  }
  return resp.json();
}

export async function deleteSet(setId) {
  const res = await authFetch(`/api/sets/${setId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${txt}`);
  }
}

export async function updateSet(setId, { title, description, folderId, access }) {
  if (!setId) throw new Error('Thiếu setId khi cập nhật');
  const body = {};
  if (typeof title === 'string') body.title = title;
  if (typeof description === 'string') body.description = description;
  if (folderId) body.folderId = folderId;
  if (access) body.access = access;
  const res = await authFetch(`/api/sets/${setId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${txt}`);
  }
  return res.json();
}

export async function deleteCard(cardId) {
  if (!cardId) throw new Error('Thiếu cardId khi xoá');
  const res = await authFetch(`/api/cards/${cardId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${txt}`);
  }
}

export async function updateCard(cardId, payload) {
  if (!cardId) throw new Error('Thiếu cardId khi cập nhật');
  const body = {
    word: payload.word || payload.front || '',
    definition: payload.definition || payload.back || '',
    example: joinExamples(payload.example || ''),
    phonetic: payload.phonetic || '',
    type: payload.type || '',
    audio: payload.audio || '',
    level: payload.level || payload.difficulty || '',
  };
  const res = await authFetch(`/api/cards/${cardId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${txt}`);
  }
  return res.json();
}

export async function generateWordInfo(word) {
  const trimmed = (word || '').trim();
  if (!trimmed) {
    throw new Error('Thiếu từ để tra AI');
  }

  const backendUrl = `/api/flashcards/ai-word`;
  const payload = { word: trimmed };

  try {
    const res = await authFetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return res.json();
    }

    const txt = await res.text().catch(() => res.statusText);
    const { status } = res;
    if (status === 401 || status === 403) {
      throw new Error(txt || `Backend trả về ${status}`);
    }
    console.warn('generateWordInfo: Backend Render lỗi, thử fallback...');
  } catch (err) {
    console.warn('generateWordInfo: Backend call failed, fallback model_service', err);
  }

  const MODEL_BASE = import.meta.env.VITE_MODEL_SERVICE_BASE || (import.meta.env.DEV ? 'http://localhost:5000' : 'https://shiro1148-pbl6.hf.space');
  const resp = await fetch(`${MODEL_BASE}/word-info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => resp.statusText);
    throw new Error(`Model service thất bại (${resp.status} ${txt})`);
  }
  return resp.json();
}

export default { listSets, createSet, listCards, createCard, enrichWords, deleteSet, deleteCard, updateCard, generateWordInfo };