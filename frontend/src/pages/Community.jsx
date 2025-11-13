import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/Community.css';

const communitySets = [
  {
    id: 1,
    title: 'Kanji N5',
    terms: 528,
    today: 75,
    rating: 4.8,
    ratingCount: 33,
    author: 'abdef...',
    description: 'Tiếng Anh ôn thi',
    avatar: '',
  },
  {
    id: 2,
    title: 'Kanji',
    terms: 220,
    today: 0,
    rating: null,
    ratingCount: 0,
    author: 'abdef',
    description: 'Tiếng Anh ôn thi',
    avatar: '',
  },
  {
    id: 3,
    title: 'Kanji N4',
    terms: 282,
    today: 26,
    rating: 4.3,
    ratingCount: 3,
    author: 'abdef...',
    description: 'Tiếng Anh ôn thi',
    avatar: '',
  },
  {
    id: 4,
    title: 'Kanji N5',
    terms: 255,
    today: 11,
    rating: 5,
    ratingCount: 1,
    author: 'abdef...',
    description: 'Tiếng Anh ôn thi',
    avatar: '',
  },
  {
    id: 5,
    title: 'KANJI N5',
    terms: 131,
    today: 10,
    rating: 4.5,
    ratingCount: 2,
    author: 'abdef',
    description: 'Tiếng Anh ôn thi',
    avatar: '',
  },
  {
    id: 6,
    title: 'Kanji N4',
    terms: 282,
    today: 10,
    rating: 5,
    ratingCount: 1,
    author: 'abdefssssssssssssssssss',
    description: 'Tiếng Anh ôn thi',
    avatar: '',
  },
];

const Community = () => {
  const navigate = useNavigate();
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
        {communitySets.map((set) => (
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

            <div className="community-terms-row">{set.terms} từ</div>

            <div className="community-author-row">
              {set.avatar ? (
                <img className="community-avatar" src={set.avatar} alt={set.author} />
              ) : (
                <div className="community-avatar community-avatar-fallback">{set.author[0]}</div>
              )}
              <div className="community-author">{set.author}</div>

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
