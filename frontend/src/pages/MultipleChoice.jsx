import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameHeader from '../components/GameHeader';
import GameBackButton from '../components/GameBackButton';
import GameResult from '../components/GameResult';
import '../styles/pages/MatchGame.css';
import '../styles/pages/MultipleChoice.css';
import { useParams } from 'react-router-dom';
import { listSets } from '../services/flashcards';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

const MultipleChoice = () => {
  const navigate = useNavigate();
  const { setId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [timer, setTimer] = useState(0);
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

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const generate = async () => {
      setAiLoading(true);
      setAiError(null);
      if (!setId) { setAiLoading(false); return; }
      try {
        const params = new URLSearchParams({ setId: String(setId || ''), optionsCount: '4' });
        const res = await fetch(`${API}/api/games/multiple-choice?${params.toString()}`, { signal: controller.signal });
        if (!mounted) return;
        if (!res.ok) {
          const t = await res.text().catch(() => res.statusText || 'Error');
          throw new Error(`${res.status} ${t}`);
        }
        const data = await res.json();
        if (!mounted) return;
        const qs = data?.questions || [];
        if (Array.isArray(qs) && qs.length) {
          const sanitized = qs.map(sanitizeQuestion);
          setQuestions(sanitized);
        } else {
          setAiError('No questions returned from model service');
        }
      } catch (e) {
        if (!mounted) return;
        console.error('generate-distractors error', e);
        setAiError(String(e.message || e));
      } finally {
        if (mounted) setAiLoading(false);
      }
    };
    generate();
    return () => { mounted = false; controller.abort(); };
  }, [setId]);

  useEffect(() => {
    if (!startTime || showResult) return;
    const interval = setInterval(() => {
      setTimer(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, showResult]);

  const handleOptionClick = (option) => {
    if (selected !== null) return;
    setSelected(option);

    if (!startTime) {
      setStartTime(Date.now());
    }

    if (option === questions[current].correct) {
      setScore((s) => s + 1);
    }

    setTimeout(() => {
      if (current + 1 < questions.length) {
        setCurrent((c) => c + 1);
        setSelected(null);
      } else {
        setShowResult(true); 
      }
    }, 700);
  };

  const handleNewGame = () => {
    (async () => {
      setAiLoading(true);
      setAiError(null);
      if (!setId) { setAiLoading(false); return; }
      try {
        const params = new URLSearchParams({ setId: String(setId || ''), optionsCount: '4' });
        const res = await fetch(`${API}/api/games/multiple-choice?${params.toString()}`);
        if (!res.ok) {
          const t = await res.text().catch(() => res.statusText || 'Error');
          throw new Error(`${res.status} ${t}`);
        }
        const data = await res.json();
        const qs = data?.questions || [];
        const sanitized = Array.isArray(qs) ? qs.map(sanitizeQuestion) : [];
        setQuestions(sanitized.map(q => ({ ...q, options: shuffle(q.options) })));
      } catch (e) {
        console.error('generate-distractors error', e);
        setAiError(String(e.message || e));
        setQuestions([]);
      } finally {
        setAiLoading(false);
        setCurrent(0);
        setScore(0);
        setSelected(null);
        setShowResult(false);
        setStartTime(null);
        setTimer(0);
      }
    })();
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

  const shuffle = (arr = []) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const stripPosLabel = (s) => {
    if (!s || typeof s !== 'string') return s;
    let t = s.trim();
    t = t.replace(
      /^\s*(?:[([]\s*)?(?:noun|verb|adjective|adverb|pronoun|preposition|conjunction|interjection|n\.|v\.|adj\.|adv\.)\s*(?:[)\]]\s*)?(?::|[-–—])?\s*/i,
      ''
    );
    t = t.replace(/^\s*(?:danh từ|động từ|tính từ|trạng từ)\s*[:\-–—]?\s*/i, '');
    if (t.includes('•')) {
      const parts = t.split('•');
      t = parts[parts.length - 1];
    }
    t = t.replace(/^[\s"'“”•\-–—*]+/, '');
    return t.trim();
  };

  const sanitizeQuestion = (q) => {
    const correct = stripPosLabel(q.correct || '');
    const opts = Array.isArray(q.options) ? q.options.map((o) => stripPosLabel(o || '')) : [];
    const set = new Set(opts.map((o) => o));
    if (correct && !set.has(correct)) {
      set.add(correct);
    }
    return { ...q, correct, options: Array.from(set) };
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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
