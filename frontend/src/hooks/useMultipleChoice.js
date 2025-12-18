// hooks/useMultipleChoice.js
import { useEffect, useState } from 'react';
import { fetchMultipleChoice } from '../services/games';

function stripPosLabel(s) {
  if (!s || typeof s !== 'string') return s;
  let t = s.trim();
  t = t.replace(/^\s*(?:[([]\s*)?(?:noun|verb|adjective|adverb|pronoun|preposition|conjunction|interjection|n\.|v\.|adj\.|adv\.)\s*(?:[)\]]\s*)?(?::|[-–—])?\s*/i, '');
  t = t.replace(/^\s*(?:danh từ|động từ|tính từ|trạng từ)\s*[:\-–—]?\s*/i, '');
  if (t.includes('•')) {
    const parts = t.split('•');
    t = parts[parts.length - 1];
  }
  t = t.replace(/^[\s"'“”•\-–—*]+/, '');
  return t.trim();
}

function sanitizeQuestion(q) {
  const correct = stripPosLabel(q.correct || '');
  const opts = Array.isArray(q.options) ? q.options.map((o) => stripPosLabel(o || '')) : [];
  const set = new Set(opts.map((o) => o));
  if (correct && !set.has(correct)) {
    set.add(correct);
  }
  return { ...q, correct, options: Array.from(set) };
}

function shuffle(arr = []) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useMultipleChoice(setId) {
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
    async function load() {
      setAiLoading(true);
      setAiError(null);
      if (!setId) { setAiLoading(false); return; }
      try {
        const data = await fetchMultipleChoice({ setId, optionsCount: 4, signal: controller.signal });
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
        setAiError(String(e.message || e));
      } finally {
        if (mounted) setAiLoading(false);
      }
    }
    load();
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
    if (!startTime) setStartTime(Date.now());
    if (option === (questions[current]?.correct)) {
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

  const reload = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const data = await fetchMultipleChoice({ setId, optionsCount: 4 });
      const qs = data?.questions || [];
      const sanitized = Array.isArray(qs) ? qs.map(sanitizeQuestion) : [];
      setQuestions(sanitized.map(q => ({ ...q, options: shuffle(q.options) })));
    } catch (e) {
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

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return {
    questions, current, score, selected, showResult, aiLoading, aiError, timer,
    formatTime, handleOptionClick, reload
  };
}

export default useMultipleChoice;
