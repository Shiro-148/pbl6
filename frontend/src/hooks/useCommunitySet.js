// hooks/useCommunitySet.js
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  fetchSetDetails, 
  fetchSetStars, 
  fetchUserFolders, 
  toggleStarApi, 
  clearAllStarsApi, 
  copySetToAccount 
} from '../services/communitySetService';

const NEW_FOLDER_VALUE = '__create_new__';

export const useCommunitySet = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const cardRef = useRef(null);

  // Data State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [setData, setSetData] = useState(null);
  const [terms, setTerms] = useState([]);
  const [folders, setFolders] = useState([]);
  const [starredForSet, setStarredForSet] = useState([]);

  // UI State - Main
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFront, setShowFront] = useState(true);
  const [frontFace, setFrontFace] = useState('term'); // 'term' | 'def'
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // UI State - Modals & Filters
  const [showSettings, setShowSettings] = useState(false);
  const [showAddToLibrary, setShowAddToLibrary] = useState(false);
  const [showOnlyStarred, setShowOnlyStarred] = useState(false);

  // Logic "Save to Library" State
  const [targetFolderId, setTargetFolderId] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [copyLoading, setCopyLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // Result notification (modal) state
  const [showResult, setShowResult] = useState(false);
  const [resultTitle, setResultTitle] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const [resultIsError, setResultIsError] = useState(false);

  // --- Effects ---

  // 1. Load Set Data
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSetDetails(id);
        setSetData({ title: data.title, author: data.author });
        setTerms(data.terms);
      } catch (e) {
        setError(e.message);
        setSetData({ title: 'Không có tiêu đề', author: 'Cộng đồng' });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // 2. Load Stars
  useEffect(() => {
    (async () => {
      const stars = await fetchSetStars(id);
      setStarredForSet(stars);
    })();
  }, [id]);

  // 3. Load Folders
  useEffect(() => {
    (async () => {
      const fs = await fetchUserFolders();
      setFolders(fs);
    })();
  }, []);

  // 4. Fullscreen Listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // --- Derived State ---
  const visibleTerms = showOnlyStarred
    ? terms.filter((t) => t.id && starredForSet.includes(t.id))
    : terms;
  const hasTerms = visibleTerms && visibleTerms.length > 0;
  const currentTerm = hasTerms ? visibleTerms[currentIndex] : null;
  const isCurrentStarred = !!(currentTerm && currentTerm.id && starredForSet.includes(currentTerm.id));

  // --- Handlers ---

  const flipCard = () => setShowFront((v) => !v);

  const nextCard = () => {
    if (!hasTerms) return;
    setCurrentIndex((i) => (i + 1) % visibleTerms.length);
    setShowFront(true);
  };

  const prevCard = () => {
    if (!hasTerms) return;
    setCurrentIndex((i) => (i - 1 + visibleTerms.length) % visibleTerms.length);
    setShowFront(true);
  };

  const shuffleCards = () => {
    if (!hasTerms) return;
    const target = showOnlyStarred ? visibleTerms : terms;
    const shuffled = [...target]
      .map((t) => ({ t, r: Math.random() }))
      .sort((a, b) => a.r - b.r)
      .map(({ t }) => t);
    
    if (showOnlyStarred) {
      setCurrentIndex(0);
    } else {
      setTerms(shuffled);
      setCurrentIndex(0);
    }
    setShowFront(true);
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (cardRef.current) await cardRef.current.requestFullscreen();
    } catch {
        // ignore
    }
  };

  const handleToggleStar = async (termId) => {
    if (!termId || !id) return;
    const isStarred = starredForSet.includes(termId);
    try {
      await toggleStarApi(id, termId, isStarred);
      const next = isStarred
        ? starredForSet.filter((cid) => cid !== termId)
        : [...starredForSet, termId];
      setStarredForSet(next);
    } catch (err) {
      console.warn('toggle star failed', err);
    }
  };

  const clearStarred = async () => {
    try {
      await clearAllStarsApi(id, starredForSet);
      setStarredForSet([]);
      setShowOnlyStarred(false);
      setCurrentIndex(0);
    } catch (err) {
      console.warn('clear starred failed', err);
    }
  };

  // Save to Library Handlers
  const closeAddToLibrary = () => {
    setShowAddToLibrary(false);
    setTargetFolderId('');
    setNewFolderName('');
    setAddError('');
  };

  const handleCopySet = async () => {
    setCopyLoading(true);
    setAddError('');
    try {
      const result = await copySetToAccount({
        targetFolderId,
        newFolderName,
        setData,
        terms,
        NEW_FOLDER_VALUE
      });

      if (result.isNewFolder) {
        // Refresh folders if a new one was created
        const fs = await fetchUserFolders();
        setFolders(fs);
      }

      // Show success via in-app result modal
      setResultTitle('Đã sao chép bộ');
      setResultMessage(`Đã sao chép "${result.createdSet?.title || setData.title}"${result.copiedCount ? ` cùng ${result.copiedCount} thẻ` : ''}.`);
      setResultIsError(false);
      setShowResult(true);
      closeAddToLibrary();
    } catch (err) {
      setAddError(err?.message || 'Không thể sao chép bộ hiện tại.');
      // Also surface failure via result modal for consistency
      setResultTitle('Sao chép thất bại');
      setResultMessage(err?.message || 'Không thể sao chép bộ hiện tại.');
      setResultIsError(true);
      setShowResult(true);
    } finally {
      setCopyLoading(false);
    }
  };

  // Navigation handlers
  const navigateToGame = (type) => {
    if (type === 'match') {
      const title = (setData?.title || 'Flashcard');
      const params = new URLSearchParams({ set: title, setId: String(id || '') });
      navigate(`/games/match?${params.toString()}`);
    } else if (type === 'multiple') {
      navigate(`/games/multiple/${id}`);
    } else if (type === 'sentence') {
      navigate(`/games/Sentence/${id}`);
    }
  };

  return {
    // Data
    id,
    setData,
    terms,
    folders,
    loading,
    error,
    
    // UI Values
    currentIndex,
    setCurrentIndex,
    showFront,
    setShowFront,
    frontFace,
    setFrontFace,
    isFullscreen,
    showSettings,
    setShowSettings,
    showAddToLibrary,
    setShowAddToLibrary,
    showOnlyStarred,
    setShowOnlyStarred,
    starredForSet,
    visibleTerms,
    hasTerms,
    currentTerm,
    isCurrentStarred,
    
    // Save Modal State
    targetFolderId,
    setTargetFolderId,
    newFolderName,
    setNewFolderName,
    copyLoading,
    addError,
    NEW_FOLDER_VALUE,

    // Result modal state
    showResult,
    resultTitle,
    resultMessage,
    resultIsError,
    setShowResult,

    // Refs
    cardRef,

    // Actions
    flipCard,
    nextCard,
    prevCard,
    shuffleCards,
    toggleFullscreen,
    handleToggleStar,
    clearStarred,
    closeAddToLibrary,
    handleCopySet,
    navigateToGame
  };
};