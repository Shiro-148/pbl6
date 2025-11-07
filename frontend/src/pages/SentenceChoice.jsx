import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameHeader from '../components/GameHeader';
import GameBackButton from '../components/GameBackButton';
import GameResult from '../components/GameResult';
import '../styles/pages/MatchGame.css';
import '../styles/pages/TypeAnswer.css';

const initialQuestions = [
  {
    term: 'eat',
    correct: 'to consume food',
  },
  {
    term: 'run',
    correct: 'to move fast',
  },
  {
    term: 'read',
    correct: 'to look at and comprehend the meaning of written or printed matter',
  },
];

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const TypeAnswer = () => {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState(() => shuffle(initialQuestions));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState('idle');
  const [showResult, setShowResult] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [timer, setTimer] = useState(0);
  const [showCorrect, setShowCorrect] = useState(false);

  useEffect(() => {
    if (!startTime || showResult) return;
    const id = setInterval(() => setTimer(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startTime, showResult]);

  const q = questions[current];
  const total = questions.length;

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const goNext = () => {
    if (current + 1 < total) {
      setCurrent((c) => c + 1);
      setValue('');
      setFeedback('idle');
      setShowCorrect(false);
    } else {
      setShowResult(true);
    }
  };

  const handleCheck = () => {
    if (!startTime) setStartTime(Date.now());
    const user = value.trim().toLowerCase();
    const correct = q.correct.trim().toLowerCase();
    if (user && user === correct) {
      setFeedback('correct');
      setScore((s) => s + 1);
      setTimeout(goNext, 800);
    } else {
      setFeedback('wrong');
      setShowCorrect(true);
      setTimeout(goNext, 1200);
    }
  };

  const handleSkip = () => {
    if (!startTime) setStartTime(Date.now());
    setFeedback('wrong');
    setShowCorrect(true);
    setTimeout(goNext, 800);
  };

  const handleNewGame = () => {
    setQuestions(shuffle(initialQuestions));
    setCurrent(0);
    setScore(0);
    setValue('');
    setFeedback('idle');
    setShowResult(false);
    setStartTime(null);
    setTimer(0);
    setShowCorrect(false);
  };

  if (showResult) {
    const percent = Math.round((score / total) * 100);
    const wrongCount = total - score;
    return (
      <GameResult
        percent={percent}
        score={score}
        total={total}
        timer={formatTime(timer)}
        onPlayAgain={handleNewGame}
        onReview={() => {}}
        onRetry={() => {}}
        wrongCount={wrongCount}
      />
    );
  }

  return (
    <div className="match-game-page type-answer-page">
      <GameBackButton onClick={() => navigate(-1)}>Back to Games</GameBackButton>
      <GameHeader
        left={<div className="match-game-title">Type the Answer</div>}
        center={
          <>
            <div className="match-game-desc">
              Question {current + 1} of {total}
            </div>
            <div className="match-game-status">
              Score: {score}/{total}
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

      <div className="type-board">
        <div className="type-question-title">Type the definition for:</div>
        <div className="type-term">
          {q.term}
          <span className="type-audio">
            <i className="bx bx-volume" />
          </span>
        </div>

        <div
          className={['type-input', feedback === 'correct' ? 'correct' : '', feedback === 'wrong' ? 'wrong' : '']
            .join(' ')
            .trim()}
        >
          <textarea
            rows={5}
            placeholder="Type your answer here..."
            value={value}
            onChange={(e) => {
              if (!startTime) setStartTime(Date.now());
              setValue(e.target.value);
            }}
          />
        </div>
        {showCorrect && (
          <div className="type-correct-answer">
            Correct answer: <strong>{q.correct}</strong>
          </div>
        )}

        <div className="type-actions">
          <button className="type-btn primary" onClick={handleCheck} disabled={!value.trim()}>
            Check Answer
          </button>
          <button className="type-btn skip" onClick={handleSkip}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};

export default TypeAnswer;
