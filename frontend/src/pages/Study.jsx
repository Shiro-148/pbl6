import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/pages/Study.css';

const dummyCards = [
  { term: 'run', def: 'chạy', audio: true },
  { term: 'eat', def: 'ăn', audio: true },
  { term: 'sleep', def: 'ngủ', audio: true },
];

const Study = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const setName = query.get('set') || 'Flashcard Set';
  const [cardIdx, setCardIdx] = useState(0);
  const [showDef, setShowDef] = useState(false);
  const [autoSpeech, setAutoSpeech] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [randomOrder, setRandomOrder] = useState(false);
  const navigate = useNavigate();
  const cards = dummyCards;
  const card = cards[cardIdx];
  const percent = Math.round(((cardIdx + 1) / cards.length) * 100);

  const handleNext = () => {
    setShowDef(false);
    setCardIdx((idx) => (idx + 1 < cards.length ? idx + 1 : idx));
  };
  const handlePrev = () => {
    setShowDef(false);
    setCardIdx((idx) => (idx > 0 ? idx - 1 : 0));
  };
  const handleReset = () => {
    setCardIdx(0);
    setShowDef(false);
  };

  return (
    <div className="study-root">
      <div className="study-container">
        <button
          className="study-back"
          onClick={() => {
            // Quay lại SetList nếu có setName, mặc định về /library
            if (setName) {
              navigate(`/library?folder=${encodeURIComponent(setName)}`);
            } else {
              navigate('/library');
            }
          }}
        >
          <i className="bx bx-arrow-back"></i> Quay lại
        </button>
        <div className="study-header">
          <div className="study-title">{setName}</div>
          <div className="study-toolbar">
            <button
              className={`study-toolbar-btn${randomOrder ? ' active' : ''}`}
              onClick={() => setRandomOrder((v) => !v)}
            >
              <i className="bx bx-shuffle"></i> Random Order
            </button>
            <button
              className={`study-toolbar-btn${autoSpeech ? ' active' : ''}`}
              onClick={() => setAutoSpeech((v) => !v)}
            >
              <i className="bx bx-volume"></i> Auto Speech
            </button>
            <button className={`study-toolbar-btn${autoPlay ? ' active' : ''}`} onClick={() => setAutoPlay((v) => !v)}>
              <i className="bx bx-play"></i> Start Auto Play
            </button>
            <button className="study-toolbar-btn reset" onClick={handleReset}>
              <i className="bx bx-refresh"></i> Reset
            </button>
          </div>
          <div className="study-progress-row">
            <span>
              Card {cardIdx + 1} of {cards.length}
            </span>
            <div className="study-progress-bar-bg">
              <div className="study-progress-bar" style={{ width: percent + '%' }}></div>
            </div>
            <span className="study-progress-label">{percent}% Complete</span>
          </div>
        </div>

        <div className="study-settings">
          <div className="study-settings-header">
            <span style={{ flex: 1 }}>Auto Play Settings</span>
            <i className="bx bx-chevron-down"></i>
          </div>
          {/* Có thể thêm cài đặt ở đây */}
        </div>

        <div className="study-card">
          <div className="study-term-label">TERM</div>
          <div className="study-term">
            {card.term}
            {card.audio && (
              <span className="study-term-audio">
                <i className="bx bx-volume"></i>
              </span>
            )}
          </div>
          {!showDef ? (
            <div className="study-def-reveal" onClick={() => setShowDef(true)}>
              Click to reveal definition
            </div>
          ) : (
            <div className="study-def">{card.def}</div>
          )}
        </div>

        <div className="study-nav-row">
          <button className="study-nav-btn" onClick={handlePrev} disabled={cardIdx === 0}>
            <i className="bx bx-chevron-left"></i>
          </button>
          <button className="study-nav-btn show-def" onClick={() => setShowDef((v) => !v)}>
            {showDef ? 'Hide Definition' : 'Show Definition'}
          </button>
          <button className="study-nav-btn" onClick={handleNext} disabled={cardIdx === cards.length - 1}>
            <i className="bx bx-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Study;
