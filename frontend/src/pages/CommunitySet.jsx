import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/pages/CommunitySet.css';
import { listFolders } from '../services/folders';
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
  const [copyResult, setCopyResult] = useState({ open: false, title: '', message: '', isError: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [setData, setSetData] = useState(null);
  const [terms, setTerms] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFront, setShowFront] = useState(true);

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
      } catch (e) {
        setFolders([]);
      }
    })();
  }, []);

  const hasTerms = terms && terms.length > 0;
  const currentTerm = hasTerms ? terms[currentIndex] : null;

  const flipCard = () => {
    setShowFront((v) => !v);
  };

  const nextCard = () => {
    if (!hasTerms) return;
    setCurrentIndex((i) => (i + 1) % terms.length);
    setShowFront(true);
  };

  const prevCard = () => {
    if (!hasTerms) return;
    setCurrentIndex((i) => (i - 1 + terms.length) % terms.length);
    setShowFront(true);
  };

  const shuffleCards = () => {
    if (!hasTerms) return;
    const shuffled = [...terms]
      .map((t) => ({ t, r: Math.random() }))
      .sort((a, b) => a.r - b.r)
      .map(({ t }) => t);
    setTerms(shuffled);
    setCurrentIndex(0);
    setShowFront(true);
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
        <button className="add-to-library-btn" onClick={() => setShowAddToLibrary(true)}>
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
      <div className="community-set-flashcard-modern">
        <div className="community-set-flashcard-top">
          <span className="community-set-flashcard-hint">
            <i className="bx bx-bulb"></i> Hiển thị gợi ý
          </span>
          <button className="community-set-flashcard-fav">
            <i className="bx bxs-star"></i>
          </button>
        </div>
        <div className="community-set-flashcard-content-modern" onClick={flipCard} title="Nhấp để lật thẻ">
          {hasTerms ? (showFront ? (currentTerm.term || '') : (currentTerm.def || '')) : '...'}
        </div>
      </div>
      <div className="community-set-flashcard-nav-modern">
        <button className="community-set-flashcard-nav-btn" disabled={!hasTerms} onClick={prevCard}>
          <i className="bx bx-left-arrow-alt"></i>
        </button>
        <span className="community-set-flashcard-progress">
          {hasTerms ? currentIndex + 1 : 0} / {hasTerms ? terms.length : 0}
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
        <button className="community-set-flashcard-nav-btn">
          <i className="bx bx-fullscreen"></i>
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
              <div className="community-set-modal-label-row">
                <span className="community-set-modal-label">Chỉ học thuật ngữ có gắn sao</span>
                <input type="checkbox" className="community-set-modal-switch" />
              </div>
            </div>
            <div className="community-set-modal-section">
              <div className="community-set-modal-label-row">
                <span className="community-set-modal-label">Mặt trước</span>
                <button className="community-set-modal-dropdown">
                  Thuật ngữ <i className="bx bx-chevron-down"></i>
                </button>
              </div>
            </div>
            <div className="community-set-modal-section">
              <button className="community-set-modal-reset">Khởi động lại Thẻ ghi nhớ</button>
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
        <div className="community-set-modal-overlay" onClick={() => setShowAddToLibrary(false)}>
          <div className="community-set-modal" onClick={(e) => e.stopPropagation()}>
            <button className="community-set-modal-close" onClick={() => setShowAddToLibrary(false)}>
              <i className="bx bx-x"></i>
            </button>
            <div className="community-set-modal-title">Thêm vào Thư viện</div>
            <div className="community-set-modal-section">
              <div className="community-set-modal-label-row">
                <span className="community-set-modal-label">Chọn thư mục lưu</span>
                <select
                  className="community-set-modal-dropdown"
                  value={targetFolderId}
                  onChange={(e) => setTargetFolderId(e.target.value)}
                >
                  <option value="">(Không chọn)</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
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
                    setCopyResult({ open: true, title: 'Không thể sao chép', message: 'Vui lòng đăng nhập để thêm vào Thư viện.', isError: true });
                    return;
                  }
                  setCopyLoading(true);
                  try {
                    const title = setData?.title || 'Không có tiêu đề';
                    const description = `Nguồn tác giả: ${setData?.author || 'Cộng đồng'}`;
                    const folderId = targetFolderId || null;
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
                    setCopyResult({ open: true, title: 'Đã thêm vào Thư viện', message: `Bộ "${created?.title || title}" đã được sao chép${copied ? ` cùng ${copied} thẻ` : ''}.`, isError: false });
                    setShowAddToLibrary(false);
                  } catch (err) {
                    setCopyResult({ open: true, title: 'Sao chép thất bại', message: err?.message || 'Không thể sao chép bộ hiện tại.', isError: true });
                  } finally {
                    setCopyLoading(false);
                  }
                }}
              >
                {copyLoading ? 'Đang sao chép...' : 'Xác nhận'}
              </button>
              <button className="community-set-modal-close" onClick={() => setShowAddToLibrary(false)}></button>
            </div>
          </div>
        </div>
      )}
      <div className="community-set-terms">
        <div className="community-set-terms-header">Thuật ngữ trong học phần này ({terms.length})</div>
        {loading && <div style={{ padding: 12, color: '#607d8b' }}>Đang tải...</div>}
        {error && <div style={{ padding: 12, color: '#e53935' }}>Lỗi: {error}</div>}
        <div className="community-set-terms-list">
          {terms.map((item, idx) => (
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
              <button className={`community-set-term-fav${item.favorite ? ' active' : ''}`}>
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
