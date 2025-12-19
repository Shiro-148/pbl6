import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/pages/GameSelect.css';
import { listCards } from '../services/flashcards';

const gameSentences = [
  {
    key: 'match',
    title: 'Match Game',
    desc: 'Match terms with their definitions',
    color: 'game-card-match',
    icon: <span className="game-icon">🎯</span>,
  },
  {
    key: 'multiple',
    title: 'Multiple Choices',
    desc: 'Choose the correct definition from multiple options',
    color: 'game-card-multi',
    icon: <span className="game-icon">⚡</span>,
  },
  {
    key: 'Sentence',
    title: 'Sentence Choices',
    desc: 'Sentence the definition for each term',
    color: 'game-card-Sentence',
    icon: <span className="game-icon">T</span>,
  },
];

const instructions = [
  {
    key: 'match',
    title: 'Match Game',
    color: 'match',
    desc: 'Click on cards to select them. Match terms with their corresponding definitions. Complete all pairs to win!',
  },
  {
    key: 'multiple',
    title: 'Multiple Choice',
    color: 'multi',
    desc: 'Read the term and choose the correct definition from four options. Get as many right as possible!',
  },
  {
    key: 'Sentence',
    title: 'Sentence Choice',
    color: 'Sentence',
    desc: 'Sentence the exact definition for each term. This tests your precise knowledge of the material.',
  },
];

const GameSelect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const setName = params.get('set') || 'Flashcard Set';
  const setId = params.get('setId') || '';
  const [cardCount, setCardCount] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!setId) { setCardCount(null); return; }
      try {
        const data = await listCards(setId);
        const arr = Array.isArray(data) ? data : data?.cards || [];
        if (mounted) setCardCount(arr.length);
      } catch {
        if (mounted) setCardCount(null);
      }
    })();
    return () => { mounted = false; };
  }, [setId]);

  return (
    <div className="game-select-page">
      <button className="game-back-btn" onClick={() => navigate(-1)}>
        <i className="bx bx-arrow-back"></i> Back to Flashcard Set
      </button>
      <h1 className="game-title">Choose a Game</h1>
      <div className="game-set-info">
        Playing: <span className="game-set-name">{setName}</span>
        {typeof cardCount === 'number' && (
          <>
            <br />
            <span className="game-card-count">{cardCount} cards available</span>
          </>
        )}
      </div>
      <div className="game-card-list">
        {gameSentences.map((g) => (
          <div
            key={g.key}
            className={['game-card', g.color].join(' ')}
            onClick={() => {
              if (g.key === 'match') {
                const qs = new URLSearchParams({ set: setName });
                if (setId) qs.set('setId', setId);
                navigate(`/games/match?${qs.toString()}`);
              } else if (g.key === 'multiple') {
                if (setId) {
                  navigate(`/games/multiple/${setId}`);
                } else {
                  const qs = new URLSearchParams({ set: setName });
                  navigate(`/games/multiple?${qs.toString()}`);
                }
              } else if (g.key === 'Sentence') {
                if (setId) {
                  navigate(`/games/Sentence/${setId}`);
                } else {
                  const qs = new URLSearchParams({ set: setName });
                  navigate(`/games/Sentence?${qs.toString()}`);
                }
              }
            }}
            style={{ cursor: g.key === 'match' || g.key === 'multiple' || g.key === 'Sentence' ? 'pointer' : undefined }}
          >
            {g.icon}
            <div className="game-card-content">
              <div className="game-card-title">{g.title}</div>
              <div className="game-card-desc">{g.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="game-instructions">
        <div className="game-instructions-title">Game Instructions</div>
        <div className="game-instructions-list">
          {instructions.map((ins) => (
            <div key={ins.key} className="game-instruction-item">
              <span className={['game-instruction-label', ins.color].join(' ')}>{ins.title}</span>
              <span className="game-instruction-desc">{ins.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameSelect;
