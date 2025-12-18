// hooks/useSentenceChoice.js
import { useEffect, useState } from 'react';
import { generateSentenceChoices } from '../services/games';

export function useSentenceChoice({ setId, initialWords = ['run', 'eat', 'read'] } = {}) {
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
      try {
        const data = await generateSentenceChoices({ setId, words: initialWords, optionsCount: 4, signal: controller.signal });
        if (!mounted) return;
        const qs = data && Array.isArray(data.questions) ? data.questions : [];
        if (qs.length) {
          setQuestions(qs);
        } else {
          setAiError('No questions returned');
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
    const id = setInterval(() => setTimer(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startTime, showResult]);

  const handleOptionClick = (index) => {
    if (selected !== null) return;
    setSelected(index);
    if (!startTime) setStartTime(Date.now());
    const q = questions[current];
    const correctIndex = q && typeof q.correct_index === 'number' ? q.correct_index : 0;
    if (index === correctIndex) setScore((s) => s + 1);
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
      const data = await generateSentenceChoices({ setId, words: initialWords, optionsCount: 4 });
      const qs = data && Array.isArray(data.questions) ? data.questions : [];
      if (qs.length) setQuestions(qs);
      else { setAiError('No questions returned'); setQuestions([]); }
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

export default useSentenceChoice;
