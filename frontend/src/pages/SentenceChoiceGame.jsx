import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import GameHeader from '../components/GameHeader';
import GameBackButton from '../components/GameBackButton';
import GameResult from '../components/GameResult';
import '../styles/pages/MatchGame.css';
import '../styles/pages/MultipleChoice.css';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

const initialWords = ['run', 'eat', 'read'];

const SentenceChoiceGame = () => {
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

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const generate = async () => {
      setAiLoading(true);
      setAiError(null);
      try {
        let data;
        if (setId) {
          const params = new URLSearchParams({ setId: String(setId), optionsCount: '4' });
          const res = await fetch(`${API}/api/games/sentence-choice?${params.toString()}`, { signal: controller.signal });
          if (!mounted) return;
          if (!res.ok) {
            const t = await res.text().catch(() => res.statusText || 'Error');
            throw new Error(`${res.status} ${t}`);
          }
          data = await res.json();
        } else {
          const MODEL_SERVICE = import.meta.env.VITE_MODEL_SERVICE_BASE || 'http://localhost:5000';
          const res = await fetch(`${MODEL_SERVICE}/generate-sentences`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ words: initialWords, options_count: 4 }),
            signal: controller.signal,
          });
          if (!mounted) return;
          if (!res.ok) {
            const t = await res.text().catch(() => res.statusText || 'Error');
            throw new Error(`${res.status} ${t}`);
          }
          data = await res.json();
        }
        if (!mounted) return;
        const qs = data && Array.isArray(data.questions) ? data.questions : [];
        if (qs.length) {
          setQuestions(qs);
        } else {
          setAiError('No questions returned');
        }
      } catch (e) {
        if (!mounted) return;
        console.error('generate-sentences error', e);
        setAiError(String(e.message || e));
      } finally {
        if (mounted) setAiLoading(false);
      }
    };

    generate();
    return () => { mounted = false; controller.abort(); };
  }, []);

  useEffect(() => {
    if (!startTime || showResult) return;
    const id = setInterval(() => setTimer(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startTime, showResult]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleOptionClick = (index) => {
    if (selected !== null) return;
    setSelected(index);
    if (!startTime) setStartTime(Date.now());

    const q = questions[current];
    const correctIndex = q && typeof q.correct_index === 'number' ? q.correct_index : 0;
    if (index === correctIndex) {
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

  const handleNewGame = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      let data;
      if (setId) {
        const params = new URLSearchParams({ setId: String(setId), optionsCount: '4' });
        const res = await fetch(`${API}/api/games/sentence-choice?${params.toString()}`);
        if (!res.ok) {
          const t = await res.text().catch(() => res.statusText || 'Error');
          throw new Error(`${res.status} ${t}`);
        }
        data = await res.json();
      } else {
        const MODEL_SERVICE = import.meta.env.VITE_MODEL_SERVICE_BASE || 'http://localhost:5000';
        const res = await fetch(`${MODEL_SERVICE}/generate-sentences`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ words: initialWords, options_count: 4 }),
        });
        if (!res.ok) {
          const t = await res.text().catch(() => res.statusText || 'Error');
          throw new Error(`${res.status} ${t}`);
        }
        data = await res.json();
      }
      const qs = data && Array.isArray(data.questions) ? data.questions : [];
      if (qs.length) {
        setQuestions(qs);
      } else {
        setAiError('No questions returned');
        setQuestions([]);
      }
    } catch (e) {
      console.error('generate-sentences error', e);
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
  };

  if (aiLoading) {
    return (
      <div className="match-game-page multiple-choice-page">
        <GameBackButton onClick={() => navigate(-1)} />
        <GameHeader left={<div className="match-game-title">Sentence Choice</div>} center={<div className="match-game-desc">Generating sentence options — please wait...</div>} />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div className="loader" aria-hidden></div>
          <div style={{ marginTop: '1rem' }}>Calling model service to create sentence options...</div>
        </div>
      </div>
    );
  }

  if (aiError && (!questions || questions.length === 0)) {
    return (
      <div className="match-game-page multiple-choice-page">
        <GameBackButton onClick={() => navigate(-1)} />
        <GameHeader left={<div className="match-game-title">Sentence Choice</div>} center={<div className="match-game-desc">Error generating sentence options</div>} />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>{aiError}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="match-game-new-btn" onClick={() => navigate(-1)}>Close</button>
            <button className="match-game-new-btn" onClick={() => handleNewGame()}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

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

  const q = questions[current] || { word: '', sentences: [], correct_index: 0 };

  return (
    <div className="match-game-page multiple-choice-page">
      <GameBackButton onClick={() => navigate(-1)} />
      <GameHeader
        left={<div className="match-game-title">Sentence Choice</div>}
        center={
          <>
            <div className="match-game-desc">Question {current + 1} of {questions.length}</div>
            <div className="match-game-status"><span className="multiple-choice-score">Score: {score}/{questions.length}</span></div>
          </>
        }
        right={
          <>
            <span className="match-game-timer"><i className="bx bx-time"></i> {formatTime(timer)}</span>
            <button className="match-game-new-btn" onClick={handleNewGame}><i className="bx bx-refresh"></i> New Game</button>
          </>
        }
      />

      <div className="match-game-board multiple-choice-board">
        <div className="multiple-choice-question">
          <div className="multiple-choice-question-title">Which sentence correctly uses:</div>
          <div className="multiple-choice-term">{q.word}</div>
        </div>

        <div className="multiple-choice-options">
          {q.sentences.map((s, idx) => {
            let cls = 'match-card multiple-choice-option';
            if (selected !== null) {
              if (idx === q.correct_index) cls += ' correct';
              else if (selected === idx) cls += ' wrong';
            }
            return (
              <button key={idx} className={cls} onClick={() => handleOptionClick(idx)} disabled={selected !== null}>
                {s}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SentenceChoiceGame;
