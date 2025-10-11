import React, { useState } from 'react';
import '../styles/pages/CommunitySet.css';

const sampleSet = {
  title: 'Kanji',
  author: 'robinn149',
  terms: [
    { term: 'học', def: '学・まなぶ・ガク', img: '', favorite: false },
    {
      term: 'hoa anh đào',
      def: '桜・さくら・オウカ',
      img: 'https://images.unsplash.com/photo-1464983953574-0892a716854b',
      favorite: true,
    },
    { term: 'đỏ', def: '赤・あか', img: '', color: '#ff0000', favorite: false },
    { term: 'tình yêu', def: 'tình cảm, lẫn lộn, lẫn lộn ...', img: '', favorite: true },
  ],
};

const CommunitySet = () => {
  const [showSettings, setShowSettings] = useState(false);
  return (
    <div className="community-set-page">
      <div className="community-set-header">
        <h1>{sampleSet.title}</h1>
        <div className="community-set-author">
          <span className="community-set-avatar">z</span>
          <span>{sampleSet.author}</span>
        </div>
      </div>
      <div className="community-set-actions-grid">
        <button className="btn-match-game">
          <i className="bx bx-link-alt"></i> Match Game
        </button>
        <button className='btn-multiple-choice'>
          <i className="bx bx-grid-alt"></i> Multiple Choice
        </button>
        <button className="btn-type-answer">
          <i className="bx bx-rocket"></i> Type the Answer
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
        <div className="community-set-flashcard-content-modern">swine</div>
      </div>
      <div className="community-set-flashcard-nav-modern">
        <span className="community-set-flashcard-progress-label">
          Theo dõi tiến độ <input type="checkbox" checked readOnly className="community-set-flashcard-switch" />
        </span>
        <button className="community-set-flashcard-nav-btn" disabled>
          <i className="bx bx-left-arrow-alt"></i>
        </button>
        <span className="community-set-flashcard-progress">1 / 64</span>
        <button className="community-set-flashcard-nav-btn">
          <i className="bx bx-right-arrow-alt"></i>
        </button>
        <button className="community-set-flashcard-nav-btn">
          <i className="bx bx-play"></i>
        </button>
        <button className="community-set-flashcard-nav-btn">
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
                <span className="community-set-modal-label">Theo dõi tiến độ</span>
                <input type="checkbox" className="community-set-modal-switch" />
              </div>
              <div className="community-set-modal-desc">
                Sắp xếp các thẻ ghi nhớ của bạn để theo dõi những gì bạn đã biết và những gì đang học. Tắt tính năng
                theo dõi tiến độ nếu bạn muốn nhanh chóng ôn lại các thẻ ghi nhớ.
              </div>
            </div>
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
      <div className="community-set-terms">
        <div className="community-set-terms-header">Thuật ngữ trong học phần này (220)</div>
        <div className="community-set-terms-list">
          {sampleSet.terms.map((item, idx) => (
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
