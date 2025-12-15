import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/pages/Study.css';
import { listCards } from '../services/flashcards';
import { splitExamples } from '../utils/examples';

const Study = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const setTitleParam = query.get('title') || query.get('set');
  const setIdParam = query.get('setId');
  const setId = setIdParam ? Number(setIdParam) : null;
  const [setName, setSetName] = useState(setTitleParam || 'Flashcard Set');
  const [cardIdx, setCardIdx] = useState(0);
  const [showDef, setShowDef] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [autoSpeech, setAutoSpeech] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [randomOrder, setRandomOrder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [baseCards, setBaseCards] = useState([]);
  const [cards, setCards] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!setId) {
      setError('Không tìm thấy bộ flashcard để học.');
      setLoading(false);
      return;
    }
    const fetchCards = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listCards(setId);
        const formatted = (data || []).map((item, index) => ({
          id: item.id ?? index,
          term: item.word || item.term || '',
          def: item.definition || item.def || '',
          example: item.example || '',
          audio: Boolean(item.audioUrl || item.audio),
          pronunciation: item.phonetic || item.pronunciation || '',
        }));
        setBaseCards(formatted);
        setCards(formatted);
        if (!setTitleParam && data?.length) {
          setSetName(data[0]?.setTitle || data[0]?.setName || setName);
        }
        setCardIdx(0);
        setShowDef(false);
        setIsFlipped(false);
      } catch (err) {
        console.error('Study: failed to load cards', err);
        setError(err?.message || 'Không thể tải flashcard. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, [setId, setTitleParam]);

  const card = cards[cardIdx] || null;
  const percent = cards.length ? Math.round(((cardIdx + 1) / cards.length) * 100) : 0;

  const handleNext = () => {
    setIsFlipped(false);
    setShowDef(false);
    setCardIdx((idx) => (idx + 1 < cards.length ? idx + 1 : idx));
  };
  const handlePrev = () => {
    setIsFlipped(false);
    setShowDef(false);
    setCardIdx((idx) => (idx > 0 ? idx - 1 : 0));
  };
  const handleReset = () => {
    setCardIdx(0);
    setShowDef(false);
    setIsFlipped(false);
  };

  const toggleFlip = () => {
    if (!cards.length) return;
    setIsFlipped((prev) => !prev);
    setShowDef((prev) => !prev);
  };

  const currentExamples = splitExamples(card?.example || card?.examples);

  return (
    <div className="study-root">
      <div className="study-container">
        <button
          className="study-back"
          onClick={() => {
            navigate(-1);
          }}
        >
          <i className="bx bx-arrow-back"></i> Quay lại
        </button>
        <div className="study-header">
          <div className="study-title">{setName}</div>
          <div className="study-toolbar">
            <button
              className={`study-toolbar-btn${randomOrder ? ' active' : ''}`}
              onClick={() => {
                setRandomOrder((prev) => {
                  const next = !prev;
                  setShowDef(false);
                  setIsFlipped(false);
                  setCardIdx(0);
                  if (next) {
                    const shuffled = [...baseCards].sort(() => Math.random() - 0.5);
                    setCards(shuffled);
                  } else {
                    setCards(baseCards);
                  }
                  return next;
                });
              }}
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
              Card {Math.min(cardIdx + 1, Math.max(cards.length, 1))} of {Math.max(cards.length, 1)}
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
          {}
        </div>

        {loading || error || !cards.length ? (
          <div className="study-card status-card">
            {loading && <div className="study-loading">Đang tải flashcard...</div>}
            {!loading && error && <div className="study-error">{error}</div>}
            {!loading && !error && !cards.length && (
              <div className="study-empty">Chưa có flashcard nào trong bộ này.</div>
            )}
          </div>
        ) : (
          <div className={['study-card', 'study-card-flip', isFlipped ? 'flipped' : ''].join(' ')} onClick={toggleFlip}>
            <div className="study-card-inner">
              <div className="study-card-face study-card-front">
                <div className="study-term-label">TERM</div>
                <div className="study-term">
                  {card?.term || '—'}
                  {card?.audio && (
                    <span className="study-term-audio">
                      <i className="bx bx-volume"></i>
                    </span>
                  )}
                </div>
                <div className="study-def-reveal">Click để lật thẻ</div>
              </div>
              <div className="study-card-face study-card-back">
                <div className="study-term-label">DEFINITION</div>
                <div className="study-def">
                  {card?.def || '—'}
                  {currentExamples.length > 0 && (
                    <div className="study-example-block">
                      <p className="study-example-label">Ví dụ:</p>
                      <ol className="study-example-list">
                        {currentExamples.map((ex, idx) => (
                          <li key={idx} className="study-example-item">
                            {ex}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="study-nav-row">
          <button className="study-nav-btn" onClick={handlePrev} disabled={cardIdx === 0}>
            <i className="bx bx-chevron-left"></i>
          </button>
          <button className="study-nav-btn show-def" onClick={toggleFlip} disabled={!cards.length}>
            {showDef ? 'Ẩn đáp án' : 'Hiện đáp án'}
          </button>
          <button
            className="study-nav-btn"
            onClick={handleNext}
            disabled={!cards.length || cardIdx === cards.length - 1}
          >
            <i className="bx bx-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Study;
