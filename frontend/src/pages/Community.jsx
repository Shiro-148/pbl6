import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/pages/Community.css';
import { listPublicSets } from '../services/community';

export default function Community() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sets, setSets] = useState([]);
  const [page, setPage] = useState(0);
  const [size] = useState(9);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const searchParam = new URLSearchParams(location.search).get('search') || '';

  useEffect(() => {
    if (isSearching) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const json = await listPublicSets({ page, size, sortBy: 'id', order: 'desc' });
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
      } catch (err) {
        console.error('Failed to load public sets', err);
        setSets([]);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [page, size, isSearching]);

  const runSearch = async (term) => {
    const normalizedTerm = term.trim().toLowerCase();
    if (!normalizedTerm) {
      setIsSearching(false);
      setPage(0);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const json = await listPublicSets({ page: 0, size: 50, sortBy: 'id', order: 'desc' });
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

      const filtered = normalized.filter((s) =>
        (s.title || '').toLowerCase().includes(normalizedTerm) || (s.description || '').toLowerCase().includes(normalizedTerm)
      );
      setSets(filtered);
      setTotalPages(1);
      setPage(0);
      setIsSearching(true);
    } catch (err) {
      console.error('Failed to search public sets', err);
      setSets([]);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const paramTerm = searchParam || '';
    if (!paramTerm) {
      setIsSearching(false);
      return;
    }
    runSearch(paramTerm);
  }, [searchParam]);
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
            style={{ padding: 8,paddingTop: 13, borderRadius: 8, background: '#fff' }}
            onClick={() => page > 0 && setPage((p) => p - 1)}
            disabled={page <= 0}
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          {(() => {
            const canPrev = page > 0;
            const handlePrev = () => { if (canPrev) setPage((p) => p - 1); };
            return (
              <span
                role="button"
                tabIndex={0}
                onClick={handlePrev}
                onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && canPrev) handlePrev(); }}
                style={{ cursor: canPrev ? 'pointer' : 'default', color: canPrev ? '#1f2937' : '#90a4ae' }}
                aria-disabled={!canPrev}
                title={canPrev ? 'Quay về trang trước' : 'Không thể quay về'}
              >
                Quay về
              </span>
            );
          })()}
          {}
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
          {(() => {
            const canNext = page + 1 < (totalPages || 1);
            const handleNext = () => { if (canNext) setPage((p) => p + 1); };
            return (
              <span
                role="button"
                tabIndex={0}
                onClick={handleNext}
                onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && canNext) handleNext(); }}
                style={{ cursor: canNext ? 'pointer' : 'default', color: canNext ? '#1f2937' : '#90a4ae' }}
                aria-disabled={!canNext}
                title={canNext ? 'Tiến tới trang sau' : 'Không thể tiến tới'}
              >
                Tiến tới
              </span>
            );
          })()}
          <button
            className=""
            style={{ padding: 8,paddingTop: 13, borderRadius: 8, background: '#fff' }}
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

