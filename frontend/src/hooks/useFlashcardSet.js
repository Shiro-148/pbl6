// hooks/useFlashcardSet.js
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  fetchSetData, 
  fetchFolders, 
  classifyTextService, 
  filterCardsByLevel, 
  updateCardService, 
  deleteCardService, 
  deleteSetService 
} from '../services/flashcardSetService';
// import { splitExamples } from '../utils/examples'; // Giả sử file này vẫn ở utils

export const useFlashcardSet = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- Core State ---
  const [setMeta, setSetMeta] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState([]);

  // --- Upload / Import State ---
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddWordModal, setShowAddWordModal] = useState(false);
  const [newCards, setNewCards] = useState([]); // Cards thêm mới nhưng chưa lưu API
  const [uploadEntries, setUploadEntries] = useState([]);
  const [enrichingUpload, setEnrichingUpload] = useState(false);
  
  // --- Result Modal State ---
  const [showUploadResult, setShowUploadResult] = useState(false);
  const [uploadResultTitle, setUploadResultTitle] = useState('');
  const [uploadResultMessage, setUploadResultMessage] = useState('');
  const [uploadResultIsError, setUploadResultIsError] = useState(false);

  // --- Classification / Level State ---
  const [showLevelDialog, setShowLevelDialog] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [classifyResults, setClassifyResults] = useState(null);
  const allLevels = ['easy', 'medium', 'hard'];

  // --- UI Interactions ---
  const [openExampleIds, setOpenExampleIds] = useState([]);
  const [actionCardIndex, setActionCardIndex] = useState(null);
  
  // --- Delete Card State ---
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // --- Edit Card State ---
  const [editModalInfo, setEditModalInfo] = useState(null);
  const [editForm, setEditForm] = useState({ front: '', back: '', example: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // --- Set Operations State ---
  const [showPracticeDialog, setShowPracticeDialog] = useState(false);
  const [showDeleteSetDialog, setShowDeleteSetDialog] = useState(false);
  const [deleteSetLoading, setDeleteSetLoading] = useState(false);
  const [deleteSetError, setDeleteSetError] = useState('');
  const [showEditSetDialog, setShowEditSetDialog] = useState(false);

  // --- Effects ---

  const loadData = async () => {
    setLoading(true);
    try {
      const { meta, cards: loadedCards } = await fetchSetData(id);
      setSetMeta(meta);
      setCards(loadedCards);
    } catch (err) {
      console.error('Failed to load set detail:', err);
      setSetMeta({ id, title: 'Flashcard: ' + (id || '') });
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    (async () => {
      const fs = await fetchFolders();
      setFolders(fs);
    })();
  }, [id]);

  // --- Handlers: Upload & Classification ---

  const handleUploadResult = async (data) => {
    if (!data) return;

    // 1. Kiểm tra nếu có kết quả phân loại sẵn
    let classify = null;
    if (data.classify) {
      if (Array.isArray(data.classify)) classify = data.classify;
      else if (Array.isArray(data.classify.words)) classify = data.classify.words;
      else if (Array.isArray(data.classify.words?.words)) classify = data.classify.words.words;
    }

    const flash = data.flashcards && data.flashcards.entries ? data.flashcards.entries : data.flashcards || null;

    if (classify && classify.length) {
      setClassifyResults({ classify, flash });
      setSelectedLevels([]);
      setShowLevelDialog(true);
      return;
    }

    // 2. Nếu là flashcards thường
    if (flash && flash.length) {
      const imported = flash.map((f) => ({ front: f.word || f.term || '', back: f.definition || '', example: '' }));
      if (imported.length) {
        setUploadEntries(imported);
        setShowUploadModal(true);
      }
      return;
    }

    // 3. Nếu là raw text -> Gọi Model Service để phân loại
    if (data.rawText) {
      const text = String(data.rawText || '');
      const result = await classifyTextService(text);

      if (result && result.classify && result.classify.length) {
        setClassifyResults({ classify: result.classify, flash: result.flash });
        setSelectedLevels([]);
        setShowLevelDialog(true);
        return;
      }

      if (result && result.flash && result.flash.length) {
        const imported = result.flash.map((f) => ({ front: f.word || f.term || '', back: f.definition || '', example: '' }));
        if (imported.length) {
          setUploadEntries(imported);
          setShowUploadModal(true);
          return;
        }
      }

      // Fallback: Tách từ cơ bản
      const tokens = text.replace(/[^A-Za-zÀ-ỹ0-9\s]/g, ' ').split(/\s+/).map((t) => t.trim()).filter(Boolean);
      const uniq = Array.from(new Set(tokens)).slice(0, 200).map((w) => ({ front: w, back: '', example: '' }));
      if (uniq.length) {
        setUploadEntries(uniq);
        setShowUploadModal(true);
      }
      return;
    }
    setShowUploadModal(false);
  };

  // --- Handlers: Levels ---
  const toggleLevel = (lvl) => {
    if (lvl === 'All') {
      setSelectedLevels(['All']);
      return;
    }
    setSelectedLevels((prev) => {
      const set = new Set(prev.filter((p) => p !== 'All'));
      if (set.has(lvl)) set.delete(lvl);
      else set.add(lvl);
      return Array.from(set);
    });
  };

  const confirmLevels = () => {
    if (!classifyResults) return setShowLevelDialog(false);
    const imported = filterCardsByLevel(classifyResults.classify, classifyResults.flash, selectedLevels, allLevels);

    if (imported.length) {
      setUploadEntries(imported);
      setShowLevelDialog(false);
      setClassifyResults(null);
      setShowUploadModal(true);
    } else {
      setShowLevelDialog(false);
      setClassifyResults(null);
    }
  };

  const cancelLevels = () => {
    setShowLevelDialog(false);
    setClassifyResults(null);
  };

  // --- Handlers: Edit Card ---
  const openEditModal = (index) => {
    const isPersisted = index < cards.length && !!cards[index]?.id;
    const card = isPersisted ? cards[index] : newCards[index - cards.length];
    if (!card) return;
    
    setEditModalInfo({
      index,
      isPersisted,
      cardId: card.id || null,
      extras: { phonetic: card.phonetic || '', type: card.type || '', level: card.level || '' },
    });
    setEditForm({ front: card.word || card.front || '', back: card.definition || card.back || '', example: card.example || '' });
    setEditError('');
    setEditLoading(false);
    setActionCardIndex(null);
  };

  const submitEdit = async () => {
    if (!editModalInfo) return;
    setEditLoading(true);
    setEditError('');
    try {
      const extras = editModalInfo.extras || {};

      if (editModalInfo.isPersisted && editModalInfo.cardId) {
        await updateCardService(editModalInfo.cardId, {
          word: editForm.front,
          definition: editForm.back,
          example: editForm.example,
          phonetic: extras.phonetic || '',
          type: extras.type || '',
          level: extras.level || '',
        });
        await loadData();
      } else {
        const localIndex = editModalInfo.index - cards.length;
        if (localIndex >= 0) {
          setNewCards((prev) => prev.map((c, idx) => idx === localIndex ? { ...c, front: editForm.front, back: editForm.back, example: editForm.example } : c));
        }
      }

      setUploadResultTitle('Đã cập nhật thẻ');
      setUploadResultMessage(`Đã cập nhật "${editForm.front || 'thẻ'}" thành công.`);
      setUploadResultIsError(false);
      setShowUploadResult(true);
      setEditModalInfo(null);
    } catch (err) {
      setEditError(err?.message || 'Không thể cập nhật thẻ');
    } finally {
      setEditLoading(false);
    }
  };

  // --- Handlers: Delete Card ---
  const handleDeleteClick = (index) => {
    const isPersisted = index < cards.length && !!cards[index]?.id;
    const card = index < cards.length ? cards[index] : newCards[index - cards.length];
    setPendingDelete({ index, isPersisted, card });
    setActionCardIndex(null);
    setDeleteError('');
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleteLoading(true);
    setDeleteError('');
    const label = pendingDelete.card?.word || pendingDelete.card?.front || 'thẻ';
    try {
      if (pendingDelete.isPersisted && pendingDelete.card?.id) {
        await deleteCardService(pendingDelete.card.id);
        await loadData();
      } else {
        const removeIdx = pendingDelete.index - cards.length;
        if (removeIdx >= 0) {
          setNewCards((prev) => prev.filter((_, idx) => idx !== removeIdx));
        }
      }
      setPendingDelete(null);
      setUploadResultTitle('Đã xoá thẻ');
      setUploadResultMessage(`Đã xoá "${label}" khỏi bộ.`);
      setUploadResultIsError(false);
      setShowUploadResult(true);
    } catch (err) {
      setDeleteError(err?.message || 'Không thể xoá thẻ');
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- Handlers: Set Operations ---
  const confirmDeleteSet = async () => {
    if (!id) return;
    setDeleteSetLoading(true);
    setDeleteSetError('');
    try {
      await deleteSetService(id);
      setShowDeleteSetDialog(false);
      setUploadResultTitle('Đã xoá bộ');
      setUploadResultMessage(`Bộ "${setMeta?.title || ''}" đã được xoá.`);
      setUploadResultIsError(false);
      setShowUploadResult(true);
      setTimeout(() => navigate(-1), 200);
    } catch (err) {
      setDeleteSetError(err?.message || 'Không thể xoá bộ');
    } finally {
      setDeleteSetLoading(false);
    }
  };

  // --- Navigation ---
  const startStudyMode = () => {
    if (!id) return;
    const title = setMeta?.title || 'Flashcard';
    const params = new URLSearchParams({ setId: id, title });
    setShowPracticeDialog(false);
    navigate(`/study?${params.toString()}`);
  };

  const startGameMode = () => {
    if (!id) return;
    const title = setMeta?.title || 'Flashcard';
    const params = new URLSearchParams({ set: title, setId: id });
    setShowPracticeDialog(false);
    navigate(`/games?${params.toString()}`);
  };

  // --- Helpers ---
  const toggleExamples = (cardKey) => {
    setOpenExampleIds((prev) =>
      prev.includes(cardKey) ? prev.filter((key) => key !== cardKey) : [...prev, cardKey],
    );
  };

  const combinedCards = [...cards, ...newCards];

  return {
    id, navigate,
    // Data
    setMeta, setSetMeta,
    cards, setCards, combinedCards,
    folders, loading,
    reloadCards: loadData,
    
    // Upload & Import
    showUploadModal, setShowUploadModal,
    showAddWordModal, setShowAddWordModal,
    newCards, setNewCards,
    uploadEntries, setUploadEntries,
    enrichingUpload, setEnrichingUpload,
    handleUploadResult,

    // Result Modal
    showUploadResult, setShowUploadResult,
    uploadResultTitle, setUploadResultTitle,
    uploadResultMessage, setUploadResultMessage,
    uploadResultIsError, setUploadResultIsError,

    // Classification
    showLevelDialog, setShowLevelDialog,
    selectedLevels, setSelectedLevels,
    classifyResults, allLevels,
    toggleLevel, confirmLevels, cancelLevels,

    // UI
    openExampleIds, toggleExamples,
    actionCardIndex, setActionCardIndex,

    // Delete Card
    pendingDelete, setPendingDelete,
    deleteLoading, deleteError, setDeleteError,
    handleDeleteClick, confirmDelete,

    // Edit Card
    editModalInfo, setEditModalInfo,
    editForm, setEditForm,
    editLoading, editError, setEditError,
    openEditModal, submitEdit,

    // Set Operations
    showPracticeDialog, setShowPracticeDialog,
    showDeleteSetDialog, setShowDeleteSetDialog,
    deleteSetLoading, deleteSetError, setDeleteSetError,
    showEditSetDialog, setShowEditSetDialog,
    confirmDeleteSet,

    // Nav
    startStudyMode, startGameMode
  };
};