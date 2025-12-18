// services/communitySetService.js
import { listFolders, createFolder } from './folders';
import { createSet, createCard } from './flashcards';
import { getToken } from './auth';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export const fetchSetDetails = async (id) => {
  if (!id) return { title: 'Không có tiêu đề', author: 'Cộng đồng', terms: [] };

  const res = await fetch(`${API}/api/sets/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();

  const title = json?.name || json?.title || 'Không có tiêu đề';
  const author = json?.ownerDisplayName || json?.owner?.profile?.displayName || json?.owner?.username || 'Cộng đồng';
  const cards = Array.isArray(json?.cards) ? json.cards : [];
  
  const mappedTerms = cards.map((c) => ({
    id: c?.id,
    term: c?.word || c?.term || '',
    def: c?.definition || c?.back || '',
    img: c?.imageUrl || '',
    favorite: !!c?.favorite,
  }));

  return { title, author, terms: mappedTerms };
};

export const fetchSetStars = async (id) => {
  if (!id) return [];
  try {
    const token = getToken();
    const res = await fetch(`${API}/api/sets/${id}/stars`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return Array.isArray(json?.cardIds) ? json.cardIds : [];
  } catch {
    return [];
  }
};

export const toggleStarApi = async (setId, cardId, isStarred) => {
  const token = getToken();
  const url = `${API}/api/sets/${setId}/cards/${cardId}/star`;
  const res = await fetch(url, {
    method: isStarred ? 'DELETE' : 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error('Star toggle failed');
  return true;
};

export const clearAllStarsApi = async (setId, starredIds) => {
  const token = getToken();
  await Promise.all(starredIds.map((cid) => fetch(`${API}/api/sets/${setId}/cards/${cid}/star`, {
    method: 'DELETE',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  })));
  return true;
};

// Logic phức tạp: Sao chép bộ flashcard về tài khoản
export const copySetToAccount = async ({ 
  targetFolderId, 
  newFolderName, 
  setData, 
  terms, 
  NEW_FOLDER_VALUE 
}) => {
  const token = getToken();
  if (!token) throw new Error('Vui lòng đăng nhập để thêm vào Thư viện.');

  const title = setData?.title || 'Không có tiêu đề';
  const description = `Nguồn tác giả: ${setData?.author || 'Cộng đồng'}`;

  if (!targetFolderId) throw new Error('Hãy chọn thư mục hoặc tạo mới.');

  let folderId = targetFolderId;

  // 1. Tạo thư mục mới nếu cần
  if (targetFolderId === NEW_FOLDER_VALUE) {
    const name = newFolderName.trim();
    if (!name) throw new Error('Nhập tên thư mục mới.');
    const createdFolder = await createFolder(name);
    folderId = createdFolder?.id;
  }

  // 2. Tạo Set mới
  const createdSet = await createSet(title, description, folderId);
  const newSetId = createdSet?.id;

  // 3. Copy từng thẻ
  let copiedCount = 0;
  if (newSetId && Array.isArray(terms) && terms.length > 0) {
    for (const t of terms) {
      try {
        await createCard(newSetId, { word: t.term || '', definition: t.def || '' });
        copiedCount++;
      } catch (cardErr) {
        console.warn('copy card failed', cardErr);
      }
    }
  }

  return { 
    createdSet, 
    copiedCount, 
    isNewFolder: targetFolderId === NEW_FOLDER_VALUE 
  };
};

export const fetchUserFolders = async () => {
  const token = getToken();
  if (!token) return [];
  try {
    const fs = await listFolders();
    return fs || [];
  } catch {
    return [];
  }
};