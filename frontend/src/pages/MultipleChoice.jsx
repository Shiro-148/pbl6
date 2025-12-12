import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameHeader from '../components/GameHeader';
import GameBackButton from '../components/GameBackButton';
import GameResult from '../components/GameResult';
import '../styles/pages/MatchGame.css';
import '../styles/pages/MultipleChoice.css';

const MODEL_SERVICE = import.meta.env.VITE_MODEL_SERVICE || 'http://localhost:5000';

const initialPairs = [
  { term: 'run', definition: 'Chạy' },
  { term: 'eat', definition: 'Ăn' },
  {
    term: 'read',
    definition: 'Đọc',
  },
];

const MultipleChoice = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [timer, setTimer] = useState(0);

  // initialize: ask model_service to generate questions
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const generate = async () => {
      setAiLoading(true);
      setAiError(null);
      try {
        const res = await fetch(`${MODEL_SERVICE}/generate-distractors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pairs: initialPairs, options_count: 4 }),
          signal: controller.signal,
        });
        if (!mounted) return;
        if (!res.ok) {
          const t = await res.text().catch(() => res.statusText || 'Error');
          throw new Error(`${res.status} ${t}`);
        }
        const data = await res.json();
        if (!mounted) return;
        if (data && data.questions && Array.isArray(data.questions) && data.questions.length) {
          setQuestions(data.questions);
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
  }, []);

  // Chạy timer khi có startTime và chưa kết thúc game
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

    // Bắt đầu thời gian ở lần chọn đầu tiên
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
        setShowResult(true); // Kết thúc => timer dừng
      }
    }, 700);
  };

  const handleNewGame = () => {
    // request new questions from model service
    (async () => {
      setAiLoading(true);
      setAiError(null);
      try {
        const res = await fetch(`${MODEL_SERVICE}/generate-distractors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pairs: initialPairs, options_count: 4 }),
        });
        if (!res.ok) {
          const t = await res.text().catch(() => res.statusText || 'Error');
          throw new Error(`${res.status} ${t}`);
        }
        const data = await res.json();
        if (data && data.questions && Array.isArray(data.questions) && data.questions.length) {
          setQuestions(data.questions);
        } else {
          setAiError('No questions returned from model service');
          setQuestions([]);
        }
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
  // if loading, show loading UI
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

  // if error and no questions, show error UI
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
