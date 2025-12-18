// services/flashcardSetService.js
import { authFetch } from './auth';
import { listCards, deleteCard, updateCard, deleteSet, updateSet } from './flashcards';
import { listFolders } from './folders';
const MODEL_BASE = import.meta.env.VITE_MODEL_SERVICE_BASE || (import.meta.env.DEV ? 'http://localhost:5000' : 'https://shiro1148-pbl6.hf.space');

// --- Helper: Chuẩn hóa Level ---
export const normalizeLevel = (lvl) => {
  if (!lvl && lvl !== 0) return '';
  const s = String(lvl).trim();
  if (!s) return '';
  const up = s.toUpperCase();
  if (up === 'A1' || up === 'A2') return 'easy';
  if (up === 'B1' || up === 'B2') return 'medium';
  if (up === 'C1' || up === 'C2') return 'hard';
  if (s === '0' || s === '1' || s === '2') return s === '0' ? 'easy' : s === '1' ? 'medium' : 'hard';
  if (['easy', 'medium', 'hard'].includes(s.toLowerCase())) return s.toLowerCase();
  return '';
};

// --- API Calls ---

export const fetchSetData = async (id) => {
  // 1. Fetch Meta
  const res = await authFetch(`/api/sets/${id}`);
  let meta = null;
  if (res.ok) meta = await res.json();

  // 2. Fetch Cards
  const cs = await listCards(id);
  const rawCards = Array.isArray(cs) ? cs : cs.cards || [];
  
  const mappedCards = rawCards.map(card => ({
    ...card,
    front: card.word || card.front || '',
    back: card.definition || card.back || '',
    example: card.example || ''
  }));

  return {
    meta: meta || { id, title: meta?.title || 'Flashcard' },
    cards: mappedCards
  };
};

export const fetchFolders = async () => {
  try {
    const fs = await listFolders();
    return fs || [];
  } catch (e) {
    console.warn('Load folders failed', e);
    return [];
  }
};

// Gọi Model AI để phân loại văn bản (khi upload PDF/Text)
export const classifyTextService = async (text) => {
  try {
    const resp = await fetch(`${MODEL_BASE}/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    
    if (!resp.ok) return null;
    const json = await resp.json();

    let classifyResp = null;
    if (json.classify) {
      if (Array.isArray(json.classify)) classifyResp = json.classify;
      else if (Array.isArray(json.classify.words)) classifyResp = json.classify.words;
      else if (Array.isArray(json.classify.words?.words)) classifyResp = json.classify.words.words;
    } else if (Array.isArray(json.words)) classifyResp = json.words;
    else if (Array.isArray(json)) classifyResp = json;

    const flashResp = json.flashcards && json.flashcards.entries ? json.flashcards.entries : json.flashcards || null;

    return { classify: classifyResp, flash: flashResp };
  } catch (err) {
    console.warn('Classification request failed:', err);
    return null;
  }
};

// Logic lọc thẻ theo level sau khi phân loại
export const filterCardsByLevel = (classifyArr, flashArr, selectedLevels, allLevels) => {
  const chosen = selectedLevels.includes('All') || selectedLevels.length === 0 ? allLevels : selectedLevels;
  
  let filtered = [];
  if (Array.isArray(classifyArr)) {
    if (selectedLevels.includes('All') || selectedLevels.length === 0) {
      filtered = classifyArr.slice();
    } else {
      filtered = classifyArr.filter((w) =>
        chosen.includes(normalizeLevel(w.level || w.difficulty || w.token || w.text || w.word || '')),
      );
    }
  }

  const imported = filtered
    .map((wObj) => {
      const word = wObj.word || wObj.text || wObj.token || '';
      const level = wObj.level || wObj.difficulty || '';
      let definition = '';
      if (flashArr && flashArr.length) {
        const found = flashArr.find((x) => (x.word || x.term || '').toLowerCase() === (word || '').toLowerCase());
        if (found) definition = found.definition || (found.defs && found.defs[0]) || '';
      }
      return { front: word, back: definition || '', example: '', level };
    })
    .filter((c) => c.front);
    
  return imported;
};

// CRUD Wrappers
export const updateCardService = async (cardId, payload) => {
  return await updateCard(cardId, payload);
};

export const deleteCardService = async (cardId) => {
  return await deleteCard(cardId);
};

export const deleteSetService = async (setId) => {
  return await deleteSet(setId);
};

export const updateSetService = async (setId, payload) => {
  return await updateSet(setId, payload);
};