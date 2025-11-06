import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameHeader from '../components/GameHeader';
import GameBackButton from '../components/GameBackButton';
import GameResult from '../components/GameResult';
import '../styles/pages/MatchGame.css';
import '../styles/pages/MultipleChoice.css';

const initialQuestions = [
  {
    term: 'run',
    correct: 'to move fast',
    options: [
      'to look at and comprehend the meaning of written or printed matter',
      'to move fast',
      'to consume food',
      'to read aloud',
    ],
  },
  {
    term: 'eat',
    correct: 'to consume food',
    options: [
      'to move fast',
      'to consume food',
      'to look at and comprehend the meaning of written or printed matter',
      'to sleep',
    ],
  },
  {
    term: 'read',
    correct: 'to look at and comprehend the meaning of written or printed matter',
    options: [
      'to consume food',
      'to look at and comprehend the meaning of written or printed matter',
      'to move fast',
      'to write',
    ],
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

const MultipleChoice = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState(() => shuffle(initialQuestions));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [timer, setTimer] = useState(0);

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
    setQuestions(shuffle(initialQuestions));
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setShowResult(false);
    setStartTime(null);
    setTimer(0);
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

  const q = questions[current];
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
