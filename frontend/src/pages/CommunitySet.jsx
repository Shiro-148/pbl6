import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/pages/CommunitySet.css';
import { listFolders, createFolder } from '../services/folders';
import { createSet, createCard } from '../services/flashcards';
import { getToken } from '../services/auth';

// No local sample; rely on backend data only

const CommunitySet = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [folders, setFolders] = useState([]);
  const [showAddToLibrary, setShowAddToLibrary] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState('');
  const [copyLoading, setCopyLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [setData, setSetData] = useState(null);
  const [terms, setTerms] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFront, setShowFront] = useState(true);
  const [frontFace, setFrontFace] = useState('term'); // 'term' | 'def'
  const [showOnlyStarred, setShowOnlyStarred] = useState(false);
  const [starredForSet, setStarredForSet] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const cardRef = useRef(null);
  const [addError, setAddError] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const NEW_FOLDER_VALUE = '__create_new__';
  // removed unused setKey

  useEffect(() => {
    // fetch set details from backend by id
    const API = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
    if (!id) {
      setSetData({ title: 'Không có tiêu đề', author: 'Cộng đồng' });
      setTerms([]);
      return;
    }
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/api/sets/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const title = json?.name || json?.title || 'Không có tiêu đề';
        const author = json?.ownerDisplayName || json?.owner?.profile?.displayName || json?.owner?.username || 'Cộng đồng';
        setSetData({ title, author });
        const cards = Array.isArray(json?.cards) ? json.cards : [];
        const mapped = cards.map((c) => ({
          id: c?.id,
          term: c?.word || c?.term || '',
          def: c?.definition || c?.back || '',
          img: c?.imageUrl || '',
          favorite: !!c?.favorite,
        }));
        setTerms(mapped);
      } catch (e) {
        setError(e.message || String(e));
        // keep empty data on error
        setSetData((prev) => prev || { title: 'Không có tiêu đề', author: 'Cộng đồng' });
        setTerms([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);
  // Load starred card IDs from backend
  useEffect(() => {
    const API = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
    if (!id) { setStarredForSet([]); return; }
    (async () => {
      try {
        const token = getToken();
        const res = await fetch(`${API}/api/sets/${id}/stars`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const cardIds = Array.isArray(json?.cardIds) ? json.cardIds : [];
        setStarredForSet(cardIds);
      } catch {
        setStarredForSet([]);
      }
    })();
  }, [id]);
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setFolders([]);
      return;
    }
    (async () => {
      try {
        const fs = await listFolders();
        setFolders(fs || []);
      } catch {
        setFolders([]);
      }
    })();
  }, []);

  // keep fullscreen state in sync when user presses ESC or exits externally
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const visibleTerms = showOnlyStarred
    ? terms.filter((t) => t.id && starredForSet.includes(t.id))
    : terms;
  const hasTerms = visibleTerms && visibleTerms.length > 0;
  const currentTerm = hasTerms ? visibleTerms[currentIndex] : null;
  const isCurrentStarred = !!(currentTerm && currentTerm.id && starredForSet.includes(currentTerm.id));

  const closeAddToLibrary = () => {
    setShowAddToLibrary(false);
    setTargetFolderId('');
    setNewFolderName('');
    setAddError('');
  };

  const flipCard = () => {
    setShowFront((v) => !v);
  };

  const nextCard = () => {
    if (!hasTerms) return;
    setCurrentIndex((i) => (i + 1) % visibleTerms.length);
    setShowFront(true);
  };

  const prevCard = () => {
    if (!hasTerms) return;
    setCurrentIndex((i) => (i - 1 + visibleTerms.length) % visibleTerms.length);
    setShowFront(true);
  };

  const shuffleCards = () => {
    if (!hasTerms) return;
    const target = showOnlyStarred ? visibleTerms : terms;
    const shuffled = [...target]
      .map((t) => ({ t, r: Math.random() }))
      .sort((a, b) => a.r - b.r)
      .map(({ t }) => t);
    if (showOnlyStarred) {
      // keep full list; only reshuffle view ordering by resetting index
      setCurrentIndex(0);
    } else {
      setTerms(shuffled);
      setCurrentIndex(0);
    }
    setShowFront(true);
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (cardRef.current) {
        await cardRef.current.requestFullscreen();
      }
    } catch {
      // ignore fullscreen errors (blocked by browser/user gesture)
    }
  };

  const toggleStarCurrent = async () => {
    if (!currentTerm || !currentTerm.id) return;
    const API = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
    const isStarred = starredForSet.includes(currentTerm.id);
    try {
      const url = `${API}/api/sets/${id}/cards/${currentTerm.id}/star`;
      const token = getToken();
      const res = await fetch(url, {
        method: isStarred ? 'DELETE' : 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Star toggle failed');
      const next = isStarred
        ? starredForSet.filter((cid) => cid !== currentTerm.id)
        : [...starredForSet, currentTerm.id];
      setStarredForSet(next);
    } catch (err) {
      console.warn('toggle star current failed', err);
    }
  };

  const clearStarredForSet = async () => {
    const API = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
    try {
      const token = getToken();
      await Promise.all(starredForSet.map((cid) => fetch(`${API}/api/sets/${id}/cards/${cid}/star`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })));
    } catch (err) {
      console.warn('clear starred failed', err);
    }
    setStarredForSet([]);
    setShowOnlyStarred(false);
    setCurrentIndex(0);
  };
  return (
    <div className="community-set-page">
      <div className="community-set-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <h1>{setData?.title || 'Không có tiêu đề'}</h1>
          <div className="community-set-author">
            <span className="community-set-avatar">z</span>
            <span>{setData?.author || 'Cộng đồng'}</span>
          </div>
        </div>
        <button
          className="add-to-library-btn"
          onClick={() => {
            setAddError('');
            setNewFolderName('');
            setTargetFolderId('');
            setShowAddToLibrary(true);
          }}
        >
          <i className="bx bx-save"></i>Save
        </button>
      </div>
      <div className="community-set-actions-grid">
        <button
          className="btn-match-game"
          onClick={() => {
            const title = (setData?.title || 'Flashcard');
            const params = new URLSearchParams({ set: title, setId: String(id || '') });
            // Vào thẳng Match Game với setId hiện tại
            navigate(`/games/match?${params.toString()}`);
          }}
        >
          <i className="bx bx-link-alt"></i> Match Game
        </button>
        <button
          className='btn-multiple-choice'
          onClick={() => navigate(`/games/multiple/${id}`)}
        >
          <i className="bx bx-grid-alt"></i> Multiple Choice
        </button>
        <button
          className="btn-type-answer"
          onClick={() => navigate(`/games/Sentence/${id}`)}
        >
          <i className="bx bx-rocket"></i> Sentence Choice
        </button>
      </div>
      <div
        ref={cardRef}
        className={`community-set-flashcard-modern${isCurrentStarred ? ' starred' : ''}`}
        title="Nhấp cạnh để chuyển, giữa để lật"
      >
        <div className="community-set-flashcard-zone left" onClick={prevCard} title="Thẻ trước"></div>
        <div className="community-set-flashcard-zone center" onClick={flipCard} title="Lật thẻ"></div>
        <div className="community-set-flashcard-zone right" onClick={nextCard} title="Thẻ tiếp theo"></div>
        <div className="community-set-flashcard-top">
          <span className="community-set-flashcard-hint">
            <i className="bx bx-bulb"></i> Hiển thị gợi ý
          </span>
          <button className={`community-set-flashcard-fav${currentTerm && currentTerm.id && starredForSet.includes(currentTerm.id) ? ' active' : ''}`} onClick={toggleStarCurrent} title="Gắn sao thẻ hiện tại">
            <i className="bx bxs-star"></i>
          </button>
        </div>
        <div className="community-set-flashcard-content-modern" onClick={flipCard} title="Nhấp để lật">
          {hasTerms
            ? (showFront
                ? (frontFace === 'term' ? (currentTerm.term || '') : (currentTerm.def || ''))
                : (frontFace === 'term' ? (currentTerm.def || '') : (currentTerm.term || '')))
            : '...'}
        </div>
      </div>
      <div className="community-set-flashcard-nav-modern">
        <button className="community-set-flashcard-nav-btn" disabled={!hasTerms} onClick={prevCard}>
          <i className="bx bx-left-arrow-alt"></i>
        </button>
        <span
          className="community-set-flashcard-progress"
          onClick={flipCard}
          title="Nhấp để lật thẻ"
        >
          {hasTerms ? currentIndex + 1 : 0} / {hasTerms ? visibleTerms.length : 0}
        </span>
        <button className="community-set-flashcard-nav-btn" disabled={!hasTerms} onClick={nextCard}>
          <i className="bx bx-right-arrow-alt"></i>
        </button>
        <button className="community-set-flashcard-nav-btn" disabled={!hasTerms} onClick={flipCard}>
          <i className="bx bx-play"></i>
        </button>
        <button className="community-set-flashcard-nav-btn" disabled={!hasTerms} onClick={shuffleCards}>
          <i className="bx bx-shuffle"></i>
        </button>
        <button className="community-set-flashcard-nav-btn" onClick={() => setShowSettings(true)}>
          <i className="bx bx-cog"></i>
        </button>
        <button className="community-set-flashcard-nav-btn" onClick={toggleFullscreen} title="Toàn màn hình">
          <i className={`bx ${isFullscreen ? 'bx-exit-fullscreen' : 'bx-fullscreen'}`}></i>
        </button>
      </div>

      {showSettings && (
        <div className="community-set-modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="community-set-modal" onClick={(e) => e.stopPropagation()}>
            <button className="community-set-modal-close" onClick={() => setShowSettings(false)}>
              <i className="bx bx-x"></i>
            </button>
            <div className="community-set-modal-title">Tùy chọn</div>
            
            <div className="community-set-modal-section">
              <label className="community-set-modal-label-row" style={{ cursor: 'pointer' }}>
                <span className="community-set-modal-label">Chỉ học thuật ngữ có gắn sao</span>
                <span className="community-set-switch">
                  <input
                    type="checkbox"
                    checked={showOnlyStarred}
                    onChange={(e) => {
                      setShowOnlyStarred(e.target.checked);
                      setCurrentIndex(0);
                      setShowFront(true);
                    }}
                  />
                  <span className="community-set-switch-slider"></span>
                </span>
              </label>
            </div>
            <div className="community-set-modal-section">
              <div className="community-set-modal-label-row">
                <span className="community-set-modal-label">Mặt trước</span>
                <select
                  className="community-set-modal-dropdown"
                  value={frontFace}
                  onChange={(e) => {
                    const val = e.target.value === 'def' ? 'def' : 'term';
                    setFrontFace(val);
                    setShowFront(true);
                  }}
                >
                  <option value="term">Thuật ngữ</option>
                  <option value="def">Định nghĩa</option>
                </select>
              </div>
            </div>
            <div className="community-set-modal-section">
              <button
                className="community-set-modal-reset"
                onClick={() => {
                  setCurrentIndex(0);
                  setShowFront(true);
                }}
              >
                Khởi động lại Thẻ ghi nhớ
              </button>
            </div>
            <div className="community-set-modal-section" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                className="community-set-modal-reset"
                onClick={clearStarredForSet}
                title="Xóa tất cả mục gắn sao trong bộ này"
              >
                Xóa mục gắn sao
              </button>
              <div className="community-set-modal-desc">
                Đã gắn sao: {starredForSet.length}
              </div>
            </div>
            <div className="community-set-modal-section">
              <a href="#" className="community-set-modal-privacy">
                Chính sách quyền riêng tư
              </a>
            </div>
          </div>
        </div>
      )}
      {showAddToLibrary && (
        <div className="community-set-modal-overlay" onClick={closeAddToLibrary}>
          <div className="community-set-modal" onClick={(e) => e.stopPropagation()}>
            <button className="community-set-modal-close" onClick={closeAddToLibrary}>
              <i className="bx bx-x"></i>
            </button>
            <div className="community-set-modal-title">Thêm vào Thư viện</div>
            <div className="community-set-modal-section">
              <div className="community-set-modal-label-row">
                <span className="community-set-modal-label">Chọn thư mục lưu (bắt buộc)</span>
                <select
                  className="community-set-modal-dropdown"
                  value={targetFolderId}
                  onChange={(e) => {
                    setTargetFolderId(e.target.value);
                    setAddError('');
                  }}
                >
                  <option value="">(Chọn thư mục)</option>
                  <option value={NEW_FOLDER_VALUE}>+ Tạo thư mục mới</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              {targetFolderId === NEW_FOLDER_VALUE && (
                <div className="community-set-modal-section" style={{ marginTop: 8 }}>
                  <input
                    className="community-set-modal-dropdown"
                    style={{ width: '100%', background: '#fff' }}
                    placeholder="Tên thư mục mới"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                </div>
              )}
              {addError && (
                <div style={{ color: '#e53935', fontSize: '0.95rem', marginTop: 6 }}>{addError}</div>
              )}
            </div>
            <div className="community-set-modal-section">
              <div className="community-set-modal-desc">
                Bộ sẽ được sao chép về tài khoản của bạn. Nguồn tác giả sẽ được giữ trong mô tả.
              </div>
            </div>
            <div className="community-set-modal-section" style={{ display: 'flex', gap: 8 }}>
              <button
                className="community-set-modal-reset"
                disabled={copyLoading}
                onClick={async () => {
                  const token = getToken();
                  if (!token) {
                    alert('Vui lòng đăng nhập để thêm vào Thư viện.');
                    return;
                  }
                  setCopyLoading(true);
                  setAddError('');
                  try {
                    const title = setData?.title || 'Không có tiêu đề';
                    const description = `Nguồn tác giả: ${setData?.author || 'Cộng đồng'}`;
                    if (!targetFolderId) {
                      setAddError('Hãy chọn thư mục hoặc tạo mới.');
                      setCopyLoading(false);
                      return;
                    }

                    let folderId = targetFolderId;
                    if (targetFolderId === NEW_FOLDER_VALUE) {
                      const name = newFolderName.trim();
                      if (!name) {
                        setAddError('Nhập tên thư mục mới.');
                        setCopyLoading(false);
                        return;
                      }
                      const createdFolder = await createFolder(name);
                      folderId = createdFolder?.id;
                      // refresh folder list to include the new one
                      try {
                        const fs = await listFolders();
                        setFolders(fs || []);
                      } catch (err) {
                        console.warn('refresh folders failed', err);
                      }
                    }

                    const created = await createSet(title, description, folderId);
                    const newSetId = created?.id;
                    let copied = 0;
                    if (newSetId && Array.isArray(terms) && terms.length > 0) {
                      for (const t of terms) {
                        try {
                          await createCard(newSetId, { word: t.term || '', definition: t.def || '' });
                          copied++;
                        } catch (cardErr) {
                          // continue copying even if some cards fail
                          console.warn('copy card failed', cardErr);
                        }
                      }
                    }
                    alert(`Đã sao chép bộ: ${created?.title || title}${copied ? ` cùng ${copied} thẻ` : ''}.`);
                    closeAddToLibrary();
                  } catch (err) {
                    alert(err?.message || 'Không thể sao chép bộ hiện tại.');
                  } finally {
                    setCopyLoading(false);
                  }
                }}
              >
                {copyLoading ? 'Đang sao chép...' : 'Xác nhận'}
              </button>
              <button className="community-set-modal-close" onClick={closeAddToLibrary}></button>
            </div>
          </div>
        </div>
      )}
      <div className="community-set-terms">
        <div className="community-set-terms-header">Thuật ngữ trong học phần này ({terms.length})</div>
        {loading && <div style={{ padding: 12, color: '#607d8b' }}>Đang tải...</div>}
        {error && <div style={{ padding: 12, color: '#e53935' }}>Lỗi: {error}</div>}
        <div className="community-set-terms-list">
          {(showOnlyStarred ? visibleTerms : terms).map((item, idx) => (
            <div className="community-set-term-row" key={idx}>
              <div className="community-set-term-main">
                <div className="community-set-term-term">{item.term}</div>
                <div className="community-set-term-def">{item.def}</div>
              </div>
              {item.img ? (
                <img className="community-set-term-img" src={item.img} alt="img" />
              ) : item.color ? (
                <div className="community-set-term-color" style={{ background: item.color }}></div>
              ) : null}
              <button
                className={`community-set-term-fav${item.id && starredForSet.includes(item.id) ? ' active' : ''}`}
                onClick={async () => {
                  if (!item.id) return;
                  const API = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
                  const isStarred = starredForSet.includes(item.id);
                  try {
                    const url = `${API}/api/sets/${id}/cards/${item.id}/star`;
                    const token = getToken();
                    const res = await fetch(url, {
                      method: isStarred ? 'DELETE' : 'POST',
                      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                    });
                    if (!res.ok) throw new Error('Star toggle failed');
                    const next = isStarred
                      ? starredForSet.filter((cid) => cid !== item.id)
                      : [...starredForSet, item.id];
                    setStarredForSet(next);
                  } catch (err) {
                    console.warn('toggle star in list failed', err);
                  }
                }}
                title={item.id && starredForSet.includes(item.id) ? 'Bỏ sao' : 'Gắn sao'}
              >
                <i className="bx bxs-star"></i>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunitySet;
