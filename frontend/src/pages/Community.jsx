import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../services/auth';
import '../styles/pages/Community.css';

export default function Community() {
  const navigate = useNavigate();
  const [sets, setSets] = useState([]);
  const [page, setPage] = useState(0);
  const [size] = useState(9);
  const [totalPages, setTotalPages] = useState(0);
  // totalElements removed to satisfy eslint no-unused-vars
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const API = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(page), size: String(size), sortBy: 'id', order: 'desc' });
        // Public endpoint: no auth required
        const res = await fetch(`${API}/api/sets/public?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          const content = Array.isArray(json) ? json : (json?.content || []);
          const normalized = (content || []).map((s) => ({
            id: s?.id,
            title: s?.name || s?.title || 'Không có tiêu đề',
            description: s?.description || s?.communityTrend || 'Không có mô tả',
            authorName:
              s?.ownerDisplayName ||
              s?.ownerUsername ||
              s?.owner?.profile?.displayName ||
              s?.owner?.username ||
              'Cộng đồng',
            coverUrl: s?.coverUrl || '/assets/images/flashcard.png',
            cardCount: typeof s?.cardCount === 'number' ? s.cardCount : (Array.isArray(s?.cards) ? s.cards.length : undefined),
          }));
          setSets(normalized);
          setTotalPages(Number(json?.totalPages || 0));
        } else {
          setSets([]);
          setError(`HTTP ${res.status}`);
        }
      } catch (err) {
        console.error('Failed to load public sets', err);
        setSets([]);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [page, size]);
  return (
    <div className="community-page">
      <div className="community-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            className=""
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: '#7C66EC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 28 }}>
              style
            </span>
          </div>
          <div>
            <h2>Flashcard</h2>
            <div style={{ color: '#607d8b' }}>Tổng hợp những flashcard được chia sẻ từ cộng đồng</div>
          </div>
        </div>
        <button className="community-view-all" onClick={() => navigate('/community')}>
          Xem chi tiết
        </button>
      </div>

      <div className="community-grid">
        {loading && <div style={{ color: '#607d8b' }}>Đang tải...</div>}
        {!loading && sets.length === 0 && (
          <div style={{ color: '#607d8b' }}>Không có bộ thẻ nào.</div>
        )}
        {!loading && sets.map((set) => {
           const authorName = set?.authorName || 'Cộng đồng';
          const avatarChar = (authorName?.trim?.()[0] || 'C').toUpperCase();

          return (
          <div key={set.id} className="community-card" onClick={() => navigate(`/community-set/${set.id}`)}>
            <div className="community-title-row">
              <div className="community-title">
                 <div className="community-title-row">{set.title}</div>
                 <div className="community-trend">{set.description || 'Không có mô tả'}</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span style={{ fontSize: 12, background: '#f1f5f9', padding: '6px 8px', borderRadius: 8 }}>US</span>
              </div>
            </div>

             <div className="community-terms-row">{typeof set.cardCount === 'number' ? set.cardCount : 0} từ</div>

            <div className="community-author-row">
              <div className="community-avatar community-avatar-fallback">{avatarChar}</div>
              <div className="community-author">{authorName}</div>

              <button
                className="community-preview"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/community-set/${set.id}`);
                }}
              >
                Xem
              </button>
            </div>
          </div>
          );
        })}
      </div>

      <div style={{ padding: '12px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          <button
            className=""
            style={{ padding: 8, borderRadius: 8, background: '#fff' }}
            onClick={() => page > 0 && setPage((p) => p - 1)}
            disabled={page <= 0}
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <span>Quay về</span>
          {/* Page buttons: first, current-1..current+1, last */}
          {(() => {
            const buttons = [];
            const tp = totalPages || 1;
            const list = [];
            list.push(0);
            const start = Math.max(1, page - 1);
            const end = Math.min(tp - 2, page + 1);
            for (let i = start; i <= end; i++) list.push(i);
            if (tp > 1) list.push(tp - 1);
            for (let i = 0; i < list.length; i++) {
              const p = list[i];
              const prev = list[i - 1];
              const showEllipsis = typeof prev === 'number' && p - prev > 1;
              buttons.push(
                <span key={`k-${p}-${i}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {showEllipsis && <span>...</span>}
                  <button
                    className=""
                    style={{ padding: 8, borderRadius: 8, background: p === page ? '#e6eefc' : '#fff' }}
                    onClick={() => setPage(p)}
                    disabled={p === page}
                  >
                    {p + 1}
                  </button>
                </span>
              );
            }
            return buttons;
          })()}
          <span>Tiến tới</span>
          <button
            className=""
            style={{ padding: 8, borderRadius: 8, background: '#fff' }}
            onClick={() => page + 1 < (totalPages || 1) && setPage((p) => p + 1)}
            disabled={page + 1 >= (totalPages || 1)}
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
        <div style={{ marginTop: 8, color: '#90a4ae' }}>Trang {Math.min(page + 1, totalPages || 1)} / {totalPages || 1}</div>
        {error && <div style={{ marginTop: 8, color: '#e53935' }}>Lỗi: {error}</div>}
      </div>
    </div>
  );
};

