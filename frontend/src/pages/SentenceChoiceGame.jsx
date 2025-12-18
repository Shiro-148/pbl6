import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import GameHeader from '../components/GameHeader';
import GameBackButton from '../components/GameBackButton';
import GameResult from '../components/GameResult';
import '../styles/pages/MatchGame.css';
import '../styles/pages/MultipleChoice.css';
import { useSentenceChoice } from '../hooks/useSentenceChoice';

const initialWords = ['run', 'eat', 'read'];

const SentenceChoiceGame = () => {
  const navigate = useNavigate();
  const { setId } = useParams();
  const {
    questions, current, score, selected, showResult,
    aiLoading, aiError, timer, formatTime, handleOptionClick, reload
  } = useSentenceChoice({ setId, initialWords });

  const handleNewGame = async () => reload();

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
