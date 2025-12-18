import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameHeader from '../components/GameHeader';
import GameBackButton from '../components/GameBackButton';
import GameResult from '../components/GameResult';
import '../styles/pages/MatchGame.css';
import '../styles/pages/MultipleChoice.css';
import { useParams } from 'react-router-dom';
import { listSets } from '../services/flashcards';
import { useMultipleChoice } from '../hooks/useMultipleChoice';

// Use relative '/api' paths so dev proxy works locally; authFetch prefixes appropriately.

const MultipleChoice = () => {
  const navigate = useNavigate();
  const { setId } = useParams();
  const {
    questions, current, score, selected, showResult,
    aiLoading, aiError, timer, formatTime, handleOptionClick, reload
  } = useMultipleChoice(setId);
  const [setsList, setSetsList] = useState([]);
  const [setsLoading, setSetsLoading] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState('');
  const [setsError, setSetsError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    (async () => {
      if (setId) return;
      setSetsLoading(true);
      setSetsError(null);
      try {
        const sets = await listSets();
        if (!mounted) return;
        setSetsList(Array.isArray(sets) ? sets : []);
      } catch (e) {
        if (!mounted) return;
        setSetsError(e?.message || String(e));
        setSetsList([]);
      } finally {
        if (mounted) setSetsLoading(false);
      }
    })();
    return () => { mounted = false; controller.abort(); };
  }, [setId]);

  const handleNewGame = () => {
    if (!setId) return;
    reload();
  };
  if (!setId) {
    return (
      <div className="match-game-page multiple-choice-page">
        <GameBackButton onClick={() => navigate(-1)} />
        <GameHeader
          left={<div className="match-game-title">Multiple Choice</div>}
          center={<div className="match-game-desc">Chọn học phần để chơi</div>}
        />
        <div style={{ padding: '2rem', maxWidth: 640, margin: '0 auto' }}>
          {setsLoading && <div style={{ color: '#607d8b' }}>Đang tải danh sách học phần...</div>}
          {setsError && <div style={{ color: '#e53935' }}>Lỗi: {setsError}</div>}
          {!setsLoading && (
            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ color: '#37474f' }}>Học phần</label>
              <select
                className="match-game-new-btn"
                style={{ padding: 12, borderRadius: 8, background: '#fff', color: '#263238' }}
                value={selectedSetId}
                onChange={(e) => setSelectedSetId(e.target.value)}
              >
                <option value="">(Chọn học phần)</option>
                {setsList.map((s) => (
                  <option key={s.id} value={s.id}>{s.title || s.name || `Set ${s.id}`}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="match-game-new-btn" onClick={() => navigate(-1)}>Đóng</button>
                <button
                  className="match-game-new-btn"
                  disabled={!selectedSetId}
                  onClick={() => navigate(`/games/multiple/${selectedSetId}`)}
                >
                  Bắt đầu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // helpers moved into hook

  if (showResult) {
    const percent = Math.round((score / questions.length) * 100);
    const wrongCount = questions.length - score;
    return (
      <GameResult
        percent={percent}
        score={score}
        total={questions.length}
        timer={formatTime(timer)}
        onPlayAgain={handleNewGame}
        onReview={() => {}}
        onRetry={() => {}}
        wrongCount={wrongCount}
      />
    );
  }
  if (aiLoading) {
    return (
      <div className="match-game-page multiple-choice-page">
        <GameBackButton onClick={() => navigate(-1)} />
        <GameHeader
          left={<div className="match-game-title">Multiple Choice</div>}
          center={<div className="match-game-desc">Đang sinh đáp án bằng AI — vui lòng đợi...</div>}
        />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div className="loader" aria-hidden></div>
          <div style={{ marginTop: '1rem' }}>Đang gọi model service để sinh đáp án...</div>
        </div>
      </div>
    );
  }

  if (aiError && (!questions || questions.length === 0)) {
    return (
      <div className="match-game-page multiple-choice-page">
        <GameBackButton onClick={() => navigate(-1)} />
        <GameHeader
          left={<div className="match-game-title">Multiple Choice</div>}
          center={<div className="match-game-desc">Lỗi khi sinh đáp án bằng AI</div>}
        />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>{aiError}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="match-game-new-btn" onClick={() => navigate(-1)}>Đóng</button>
            <button className="match-game-new-btn" onClick={() => handleNewGame()}>Thử lại</button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[current] || { term: '', correct: '', options: [] };
  return (
    <div className="match-game-page multiple-choice-page">
      <GameBackButton onClick={() => navigate(-1)} />
      <GameHeader
        left={<div className="match-game-title">Multiple Choice</div>}
        center={
          <>
            <div className="match-game-desc">
              Question {current + 1} of {questions.length}
            </div>
            <div className="match-game-status">
              <span className="multiple-choice-score">
                Score: {score}/{questions.length}
              </span>
            </div>
          </>
        }
        right={
          <>
            <span className="match-game-timer">
              <i className="bx bx-time"></i> {formatTime(timer)}
            </span>
            <button className="match-game-new-btn" onClick={handleNewGame}>
              <i className="bx bx-refresh"></i> New Game
            </button>
          </>
        }
      />
      <div className="match-game-board multiple-choice-board">
        <div className="multiple-choice-question">
          <div className="multiple-choice-question-title">What is the definition of:</div>
          <div className="multiple-choice-term">
            {q.term}
            <span className="multiple-choice-audio">
              <i className="bx bx-volume"></i>
            </span>
          </div>
        </div>
        <div className="multiple-choice-options">
          {q.options.map((opt) => {
            let optionClass = 'match-card multiple-choice-option';
            if (selected !== null) {
              if (opt === q.correct) optionClass += ' correct';
              else if (selected === opt) optionClass += ' wrong';
            }
            return (
              <button
                key={opt}
                className={optionClass}
                onClick={() => handleOptionClick(opt)}
                disabled={selected !== null}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MultipleChoice;
