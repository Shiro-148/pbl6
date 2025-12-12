import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../services/auth';
import '../styles/pages/Community.css';

const Community = () => {
  const navigate = useNavigate();
  const [sets, setSets] = useState([]);

  useEffect(() => {
    const API = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
    (async () => {
      try {
        const res = await authFetch(`${API}/api/sets/public`);
        if (res.ok) {
          const data = await res.json();
          // sort newest first by createdAt if available or id desc
          const sorted = (data || []).slice().sort((a, b) => {
            const timeA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
            if (timeA !== timeB) return timeB - timeA;
            const idA = typeof a?.id === 'number' ? a.id : 0;
            const idB = typeof b?.id === 'number' ? b.id : 0;
            return idB - idA;
          });
          setSets(sorted);
        } else {
          setSets([]);
        }
      } catch (err) {
        console.error('Failed to load public sets', err);
        setSets([]);
      }
    })();
  }, []);
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
        {sets.map((set) => (
          <div key={set.id} className="community-card" onClick={() => navigate('/community-set')}>
            <div className="community-title-row">
              <div className="community-title">
                <div className="community-title-row">{set.title}</div>
                <div className="community-trend">{set.description ? set.description : 'Không có mô tả'}</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span style={{ fontSize: 12, background: '#f1f5f9', padding: '6px 8px', borderRadius: 8 }}>US</span>
              </div>
            </div>

            <div className="community-terms-row">{typeof set.cardCount === 'number' ? set.cardCount : (set.cards?.length || 0)} từ</div>

            <div className="community-author-row">
              <div className="community-avatar community-avatar-fallback">F</div>
              <div className="community-author">Cộng đồng</div>

              <button
                className="community-preview"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/community-set');
                }}
              >
                Xem
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '12px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          <button className="" style={{ padding: 8, borderRadius: 8, background: '#fff' }}>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <span>Quay về</span>
          <button className="" style={{ padding: 8, borderRadius: 8, background: '#e6eefc' }}>
            1
          </button>
          <button className="" style={{ padding: 8, borderRadius: 8, background: '#fff' }}>
            2
          </button>
          <button className="" style={{ padding: 8, borderRadius: 8, background: '#fff' }}>
            3
          </button>
          <span>...</span>
          <button className="" style={{ padding: 8, borderRadius: 8, background: '#fff' }}>
            46
          </button>
          <span>Tiến tới</span>
          <button className="" style={{ padding: 8, borderRadius: 8, background: '#fff' }}>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
        <div style={{ marginTop: 8, color: '#90a4ae' }}>Trang 1 / 46</div>
      </div>
    </div>
  );
};

export default Community;
