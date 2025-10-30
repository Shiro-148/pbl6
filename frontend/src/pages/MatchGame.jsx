import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/MatchGame.css';

const initialPairs = [
  { term: 'eat', definition: 'to consume food' },
  { term: 'run', definition: 'to move fast' },
  { term: 'read', definition: 'to look at and comprehend the meaning of written or printed matter' },
];

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const MatchGame = () => {
  const navigate = useNavigate();

  const [pairs, setPairs] = useState(initialPairs);
  const [definitions, setDefinitions] = useState(() =>
    shuffle(initialPairs.map((p) => p.definition))
  );
  const [terms, setTerms] = useState(() =>
    shuffle(initialPairs.map((p) => p.term))
  );

  const [selectedDef, setSelectedDef] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState([]);

  const [startTime, setStartTime] = useState(null); // ban đầu null
  const [endTime, setEndTime] = useState(null);
  const [timer, setTimer] = useState(0);

  // Timer effect
  useEffect(() => {
    if (!startTime || endTime) return;
    const interval = setInterval(() => {
      setTimer(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, endTime]);

  const matched = matchedPairs.length;

  // Handle clicks
  const handleDefClick = (def) => {
    if (matchedPairs.find((mp) => mp.def === def)) return;
    if (!startTime) setStartTime(Date.now()); // chỉ set khi click đầu tiên
    setSelectedDef(def);
  };

  const handleTermClick = (term) => {
    if (matchedPairs.find((mp) => mp.term === term)) return;
    if (!startTime) setStartTime(Date.now()); // chỉ set khi click đầu tiên
    setSelectedTerm(term);
  };

  // Check match
  useEffect(() => {
    if (selectedDef && selectedTerm) {
      const correct = pairs.find(
        (p) => p.definition === selectedDef && p.term === selectedTerm
      );
      if (correct) {
        setMatchedPairs((prev) => {
          const newMatched = [...prev, { def: selectedDef, term: selectedTerm }];
          if (newMatched.length === pairs.length) {
            setEndTime(Date.now());
          }
          return newMatched;
        });
      }
      setTimeout(() => {
        setSelectedDef(null);
        setSelectedTerm(null);
      }, 500);
    }
  }, [selectedDef, selectedTerm, pairs]);

  // New game
  const handleNewGame = () => {
    setPairs(initialPairs);
    setDefinitions(shuffle(initialPairs.map((p) => p.definition)));
    setTerms(shuffle(initialPairs.map((p) => p.term)));
    setMatchedPairs([]);
    setSelectedDef(null);
    setSelectedTerm(null);
    setStartTime(null); // reset về null
    setEndTime(null);
    setTimer(0);
  };

  // Format time
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="match-game-page">
      <button className="game-back-btn" onClick={() => navigate(-1)}>
        <i className="bx bx-arrow-back"></i> Back to Games
      </button>

      <div className="match-game-header">
        <div className="match-game-header-left">
          <div className="match-game-title">Match Game</div>
        </div>
        <div className="match-game-header-center">
          <div className="match-game-desc">Match terms with their definitions</div>
          <div className="match-game-status">
            <span className="match-game-pairs">
              <span
                style={{
                  color: matched === 0 ? '#e67e22' : '#22c55e',
                  fontWeight: 600,
                }}
              >
                {matched} / {pairs.length} pairs matched
              </span>
            </span>
          </div>
        </div>
        <div className="match-game-header-right">
          <span className="match-game-timer">
            <i className="bx bx-time"></i>{' '}
            {endTime
              ? formatTime(Math.floor((endTime - startTime) / 1000))
              : formatTime(timer)}
          </span>
          <button className="match-game-new-btn" onClick={handleNewGame}>
            <i className="bx bx-refresh"></i> New Game
          </button>
        </div>
      </div>

      {matched === pairs.length && (
        <div className="match-game-congrats">
          <div className="match-game-congrats-icon">🏆</div>
          <div className="match-game-congrats-title">Congratulations!</div>
          <div className="match-game-congrats-desc">
            You completed the game in{' '}
            {formatTime(Math.floor((endTime - startTime) / 1000))}!
          </div>
        </div>
      )}

      <div className="match-game-board">
        {/* Definitions */}
        {definitions.map((def) => {
          const isMatched = matchedPairs.find((mp) => mp.def === def);
          const isSelected = selectedDef === def;
          return (
            <div
              key={def}
              className={`match-card definition${
                isMatched ? ' matched' : isSelected ? ' selected' : ''
              }`}
              onClick={() => handleDefClick(def)}
              style={{ cursor: isMatched ? 'default' : 'pointer' }}
            >
              <div className="match-card-label">DEFINITION</div>
              <div className="match-card-content">{def}</div>
            </div>
          );
        })}

        {/* Terms */}
        {terms.map((term) => {
          const isMatched = matchedPairs.find((mp) => mp.term === term);
          const isSelected = selectedTerm === term;
          return (
            <div
              key={term}
              className={`match-card term${
                isMatched ? ' matched' : isSelected ? ' selected' : ''
              }`}
              onClick={() => handleTermClick(term)}
              style={{ cursor: isMatched ? 'default' : 'pointer' }}
            >
              <div className="match-card-label">TERM</div>
              <div className="match-card-content">{term}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchGame;
