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
    teacher: true,
    preview: true,
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
    teacher: false,
    preview: true,
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
    teacher: true,
    preview: true,
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
    teacher: true,
    preview: true,
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
    teacher: false,
    preview: true,
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
    teacher: true,
    preview: true,
    avatar: '',
  },
];

const Community = () => {
  const navigate = useNavigate();
  return (
    <div className="community-page">
      <div className="community-header-row">
        <h2>Học phần</h2>
        <a href="#" className="community-view-all">
          Xem tất cả
        </a>
      </div>
      <div className="community-grid">
        {communitySets.map((set) => (
          <div
            className="community-card"
            key={set.id}
            onClick={() => navigate('/community-set')}
            style={{ cursor: 'pointer' }}
          >
            {/* bỏ số người học hôm nay */}
            <div className="community-title-row">
              <span className="community-title">
                {set.title} <i className="bx bx-image-alt"></i>
              </span>
            </div>
            <div className="community-terms-row">
              <span className="community-terms">{set.terms} thuật ngữ</span>
            </div>
            {/* bỏ đánh giá */}
            <div className="community-author-row">
              {set.avatar ? (
                <img className="community-avatar" src={set.avatar} alt={set.author} />
              ) : (
                <span className="community-avatar community-avatar-fallback">{set.author[0]}</span>
              )}
              <span className="community-author">{set.author}</span>
              {/* bỏ tag giáo viên */}
              <button
                className="community-preview"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/community-set');
                }}
              >
                Xem trước
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Community;
