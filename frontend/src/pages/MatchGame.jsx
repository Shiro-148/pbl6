import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/pages/MatchGame.css';
import { listCards } from '../services/flashcards';

const MAX_PAIRS = 12;

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
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const setName = params.get('set') || 'Match Game';
  const setId = params.get('setId') || '';

  const [pairs, setPairs] = useState([]);
  const [definitions, setDefinitions] = useState([]);
  const [terms, setTerms] = useState([]);

  const [selectedDefId, setSelectedDefId] = useState(null);
  const [selectedTermId, setSelectedTermId] = useState(null);
  const [matchedIds, setMatchedIds] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [startTime, setStartTime] = useState(null); 
  const [endTime, setEndTime] = useState(null);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (!startTime || endTime) return;
    const interval = setInterval(() => {
      setTimer(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, endTime]);

  const matched = matchedIds.length;

  const resetRound = useCallback((nextPairs) => {
    setPairs(nextPairs);
    setDefinitions(shuffle(nextPairs.map((p) => ({ id: p.id, text: p.definition }))));
    setTerms(shuffle(nextPairs.map((p) => ({ id: p.id, text: p.term }))));
    setMatchedIds([]);
    setSelectedDefId(null);
    setSelectedTermId(null);
    setStartTime(null);
    setEndTime(null);
    setTimer(0);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPairs = async () => {
      if (!setId) {
        setError('Không tìm thấy bộ thẻ. Hãy quay lại và chọn game từ bộ flashcard.');
        setPairs([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const data = await listCards(setId);
        const rawCards = Array.isArray(data) ? data : data?.cards || [];
        const normalized = rawCards
          .map((card, index) => {
            const term = (card.word || card.front || '').trim();
            const definition = (card.definition || card.back || '').trim();
            if (!term || !definition) return null;
            const id = String(card.id ?? `${term}-${index}`);
            return { id, term, definition };
          })
          .filter(Boolean);

        if (!normalized.length) {
          throw new Error('Bộ thẻ chưa có dữ liệu để chơi. Vui lòng thêm từ vựng rồi thử lại.');
        }

        const limited = shuffle(normalized).slice(0, Math.min(MAX_PAIRS, normalized.length));
        if (!cancelled) {
          resetRound(limited);
        }
      } catch (err) {
        console.error('Không thể tải dữ liệu game:', err);
        if (!cancelled) {
          setError(err?.message || 'Không thể tải dữ liệu game.');
          setPairs([]);
          setDefinitions([]);
          setTerms([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPairs();

    return () => {
      cancelled = true;
    };
  }, [setId, resetRound]);

  const handleDefClick = (defId) => {
    if (matchedIds.includes(defId)) return;
    if (!startTime) setStartTime(Date.now()); 
    setSelectedDefId(defId);
  };

  const handleTermClick = (termId) => {
    if (matchedIds.includes(termId)) return;
    if (!startTime) setStartTime(Date.now()); 
    setSelectedTermId(termId);
  };

  useEffect(() => {
    if (selectedDefId && selectedTermId) {
      const isCorrect = selectedDefId === selectedTermId;
      if (isCorrect) {
        setMatchedIds((prev) => {
          if (prev.includes(selectedDefId)) return prev;
          const updated = [...prev, selectedDefId];
          if (updated.length === pairs.length) {
            setEndTime(Date.now());
          }
          return updated;
        });
      }
      setTimeout(() => {
        setSelectedDefId(null);
        setSelectedTermId(null);
      }, 500);
    }
  }, [selectedDefId, selectedTermId, pairs.length]);

  const handleNewGame = () => {
    if (!pairs.length) return;
    setDefinitions(shuffle(pairs.map((p) => ({ id: p.id, text: p.definition }))));
    setTerms(shuffle(pairs.map((p) => ({ id: p.id, text: p.term }))));
    setMatchedIds([]);
    setSelectedDefId(null);
    setSelectedTermId(null);
    setStartTime(null); 
    setEndTime(null);
    setTimer(0);
  };

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
          <div className="match-game-desc">{setName}</div>
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
                {matched} / {pairs.length || 0} pairs matched
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

      {pairs.length > 0 && matched === pairs.length && (
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
        {loading && <div className="match-game-empty">Đang tải dữ liệu...</div>}
        {!loading && error && <div className="match-game-empty error">{error}</div>}
        {!loading && !error && pairs.length === 0 && (
          <div className="match-game-empty">Bộ thẻ chưa có dữ liệu để chơi.</div>
        )}

        {!loading && !error && pairs.length > 0 && (
          <>
            {}
            {definitions.map((def) => {
              const isMatched = matchedIds.includes(def.id);
              const isSelected = selectedDefId === def.id;
              return (
                <div
                  key={`def-${def.id}`}
                  className={`match-card definition${
                    isMatched ? ' matched' : isSelected ? ' selected' : ''
                  }`}
                  onClick={() => handleDefClick(def.id)}
                  style={{ cursor: isMatched ? 'default' : 'pointer' }}
                >
                  <div className="match-card-label">DEFINITION</div>
                  <div className="match-card-content">{def.text}</div>
                </div>
              );
            })}

            {}
            {terms.map((term) => {
              const isMatched = matchedIds.includes(term.id);
              const isSelected = selectedTermId === term.id;
              return (
                <div
                  key={`term-${term.id}`}
                  className={`match-card term${
                    isMatched ? ' matched' : isSelected ? ' selected' : ''
                  }`}
                  onClick={() => handleTermClick(term.id)}
                  style={{ cursor: isMatched ? 'default' : 'pointer' }}
                >
                  <div className="match-card-label">TERM</div>
                  <div className="match-card-content">{term.text}</div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default MatchGame;
