import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { authFetch } from '../services/auth';
import { listCards, deleteCard as deleteCardApi, updateCard as updateCardApi } from '../services/flashcards';
import UploadPDFButton from '../components/UploadPDFButton';
import UploadModal from '../components/UploadModal';
import AddWordModal from '../components/AddWordModal';
import '../styles/pages/FlashcardSetDetail.css';

export default function FlashcardSetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [setMeta, setSetMeta] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [showAddWordModal, setShowAddWordModal] = useState(false);
  const [newCards, setNewCards] = useState([]);
  const [uploadEntries, setUploadEntries] = useState([]);
  const [enrichingUpload, setEnrichingUpload] = useState(false);
  const [showUploadResult, setShowUploadResult] = useState(false);
  const [uploadResultTitle, setUploadResultTitle] = useState('');
  const [uploadResultMessage, setUploadResultMessage] = useState('');
  const [uploadResultIsError, setUploadResultIsError] = useState(false);
  const [showLevelDialog, setShowLevelDialog] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [classifyResults, setClassifyResults] = useState(null);
  const [openExampleIds, setOpenExampleIds] = useState([]);
  const [actionCardIndex, setActionCardIndex] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [editModalInfo, setEditModalInfo] = useState(null);
  const [editForm, setEditForm] = useState({ front: '', back: '', example: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [showPracticeDialog, setShowPracticeDialog] = useState(false);
  const uploadRef = useRef(null);

  const handleUploadResult = async (data) => {
    if (!data) return;

    // Normalize classify array
    let classify = null;
    if (data.classify) {
      if (Array.isArray(data.classify)) classify = data.classify;
      else if (Array.isArray(data.classify.words)) classify = data.classify.words;
      else if (Array.isArray(data.classify.words?.words)) classify = data.classify.words.words;
    }

    const flash = data.flashcards && data.flashcards.entries ? data.flashcards.entries : data.flashcards || null;

    if (classify && classify.length) {
      // Nếu có kết quả phân loại, mở dialog chọn cấp độ
      setClassifyResults({ classify, flash });
      setSelectedLevels([]);
      setShowLevelDialog(true);
      return;
    }

    if (flash && flash.length) {
      const imported = flash.map((f) => ({ front: f.word || f.term || '', back: f.definition || '', example: '' }));
      if (imported.length) {
        setUploadEntries(imported);
        setShowUploadModal(true);
      }
      return;
    }

    if (data.rawText) {
      const text = String(data.rawText || '');

      // Try to fetch classification from model service so the level dialog can open
      try {
        const MODEL_BASE = import.meta.env.VITE_MODEL_SERVICE_BASE || 'http://localhost:5000';
        const resp = await fetch(`${MODEL_BASE}/classify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (resp.ok) {
          const json = await resp.json();

          // normalize classify array from response
          let classifyResp = null;
          if (json.classify) {
            if (Array.isArray(json.classify)) classifyResp = json.classify;
            else if (Array.isArray(json.classify.words)) classifyResp = json.classify.words;
            else if (Array.isArray(json.classify.words?.words)) classifyResp = json.classify.words.words;
          } else if (Array.isArray(json.words)) classifyResp = json.words;
          else if (Array.isArray(json)) classifyResp = json;

          const flashResp = json.flashcards && json.flashcards.entries ? json.flashcards.entries : json.flashcards || null;

          if (classifyResp && classifyResp.length) {
            setClassifyResults({ classify: classifyResp, flash: flashResp });
            setSelectedLevels([]);
            setShowLevelDialog(true);
            return;
          }

          if (flashResp && flashResp.length) {
            const imported = flashResp.map((f) => ({ front: f.word || f.term || '', back: f.definition || '', example: '' }));
            if (imported.length) {
              setUploadEntries(imported);
              setShowUploadModal(true);
              return;
            }
          }
        }
      } catch (err) {
        // classification failed, fallback to client tokenization
        console.warn('Classification request failed:', err);
      }

      // Fallback: tokenize raw text and open upload modal with words
      const tokens = text
        .replace(/[^A-Za-zÀ-ỹ0-9\s]/g, ' ')
        .split(/\s+/)
        .map((t) => t.trim())
        .filter(Boolean);
      const uniq = Array.from(new Set(tokens.map((t) => t)));
      const words = uniq.slice(0, 200).map((w) => ({ front: w, back: '', example: '' }));
      if (words.length) {
        setUploadEntries(words);
        setShowUploadModal(true);
      }
      return;
    }

    // no useful data
    setShowUploadModal(false);
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const API = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
      setLoading(true);
      try {
        // Lấy thông tin bộ flashcard
        const res = await authFetch(`${API}/api/sets/${id}`);
        let meta = null;
        if (res.ok) meta = await res.json();

        // Lấy danh sách thẻ
        const cs = await listCards(id);

        if (!mounted) return;
        setSetMeta(meta || { id, title: meta?.title || 'Flashcard' });
        
        // Map dữ liệu từ database sang format hiển thị
        const mappedCards = (Array.isArray(cs) ? cs : cs.cards || []).map(card => ({
          ...card,
          front: card.word || card.front || '',
          back: card.definition || card.back || '',
          example: card.example || ''
        }));
        
        setCards(mappedCards);
      } catch (err) {
        console.error('Failed to load set detail:', err);
        if (mounted) {
          setSetMeta({ id, title: 'Flashcard: ' + (id || '') });
          setCards([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Function to reload cards
  const reloadCards = async () => {
    try {
      const cs = await listCards(id);
      const mappedCards = (Array.isArray(cs) ? cs : cs.cards || []).map(card => ({
        ...card,
        front: card.word || card.front || '',
        back: card.definition || card.back || '',
        example: card.example || ''
      }));
      setCards(mappedCards);
    } catch (err) {
      console.error('Failed to reload cards:', err);
    }
  };

  // Moved UploadModal and AddWordModal into standalone components

  // Level chooser logic (copied/adapted from CreateFlashcard)
  const allLevels = ['easy', 'medium', 'hard'];

  const normalizeLevel = (lvl) => {
    if (!lvl && lvl !== 0) return '';
    const s = String(lvl).trim();
    if (!s) return '';
    const up = s.toUpperCase();
    if (up === 'A1' || up === 'A2') return 'easy';
    if (up === 'B1' || up === 'B2') return 'medium';
    if (up === 'C1' || up === 'C2') return 'hard';
    if (s === '0' || s === '1' || s === '2') return s === '0' ? 'easy' : s === '1' ? 'medium' : 'hard';
    if (['easy', 'medium', 'hard'].includes(s.toLowerCase())) return s.toLowerCase();
    return '';
  };

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
    const chosen = selectedLevels.includes('All') || selectedLevels.length === 0 ? allLevels : selectedLevels;
    const c = classifyResults.classify;
    const f = classifyResults.flash || [];

    let filtered = [];
    if (Array.isArray(c)) {
      if (selectedLevels.includes('All') || selectedLevels.length === 0) {
        filtered = c.slice();
      } else {
        filtered = c.filter((w) =>
          chosen.includes(normalizeLevel(w.level || w.difficulty || w.token || w.text || w.word || '')),
        );
      }
    }

    const imported = filtered
      .map((wObj) => {
        const word = wObj.word || wObj.text || wObj.token || '';
        const level = wObj.level || wObj.difficulty || '';
        let definition = '';
        if (f && f.length) {
          const found = f.find((x) => (x.word || x.term || '').toLowerCase() === (word || '').toLowerCase());
          if (found) definition = found.definition || (found.defs && found.defs[0]) || '';
        }
        return { front: word, back: definition || '', example: '', level };
      })
      .filter((c) => c.front);

    if (imported.length) {
      // đặt các thẻ vào uploadEntries để hiển thị trong modal và cho phép chỉnh sửa
      setUploadEntries(imported);
      setShowLevelDialog(false);
      setClassifyResults(null);
      // mở UploadModal để hiển thị các ô từ
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

  const normalizeExamples = (value) => {
    if (!value && value !== 0) return [];
    if (Array.isArray(value)) {
      return value.map((v) => String(v).trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((v) => String(v).trim()).filter(Boolean);
        }
      } catch {
        // not JSON, continue fallback
      }
      return trimmed
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
    }
    return [];
  };

  if (loading) return <div className="p-6">Loading...</div>;

  // combined cards: existing + newly created in-modal
  const combinedCards = [...cards, ...newCards];

  const openEditModal = (index) => {
    const isPersisted = index < cards.length && !!cards[index]?.id;
    const card = isPersisted ? cards[index] : newCards[index - cards.length];
    if (!card) return;
    const baseFront = card.word || card.front || '';
    const baseBack = card.definition || card.back || '';
    setEditModalInfo({
      index,
      isPersisted,
      cardId: card.id || null,
      extras: {
        phonetic: card.phonetic || '',
        type: card.type || '',
        level: card.level || '',
      },
    });
    setEditForm({
      front: baseFront,
      back: baseBack,
      example: card.example || '',
    });
    setEditError('');
    setEditLoading(false);
    setActionCardIndex(null);
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const closeEditModal = () => {
    if (editLoading) return;
    setEditModalInfo(null);
    setEditError('');
  };

  const submitEdit = async () => {
    if (!editModalInfo) return;
    setEditLoading(true);
    setEditError('');
    try {
      const extras = editModalInfo.extras || { phonetic: '', type: '', level: '' };

      if (editModalInfo.isPersisted && editModalInfo.cardId) {
        await updateCardApi(editModalInfo.cardId, {
          word: editForm.front,
          definition: editForm.back,
          example: editForm.example,
          phonetic: extras.phonetic || '',
          type: extras.type || '',
          level: extras.level || '',
        });
        await reloadCards();
      } else {
        const localIndex = editModalInfo.index - cards.length;
        if (localIndex >= 0) {
          setNewCards((prev) =>
            prev.map((card, idx) =>
              idx === localIndex
                ? {
                    ...card,
                    front: editForm.front,
                    back: editForm.back,
                    example: editForm.example,
                  }
                : card,
            ),
          );
        }
      }

      setUploadResultTitle?.('Đã cập nhật thẻ');
      setUploadResultMessage?.(`Đã cập nhật "${editForm.front || 'thẻ'}" thành công.`);
      setUploadResultIsError?.(false);
      setShowUploadResult?.(true);
      closeEditModal();
    } catch (err) {
      console.error('Cập nhật thẻ thất bại:', err);
      setEditError(err?.message || 'Không thể cập nhật thẻ');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = (index) => {
    const isPersisted = index < cards.length && !!cards[index]?.id;
    const card = index < cards.length ? cards[index] : newCards[index - cards.length];
    setPendingDelete({ index, isPersisted, card });
    setActionCardIndex(null);
    setDeleteError('');
  };

  const cancelDelete = () => {
    if (deleteLoading) return;
    setPendingDelete(null);
    setDeleteError('');
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleteLoading(true);
    setDeleteError('');
    const label = pendingDelete.card?.word || pendingDelete.card?.front || 'thẻ';
    try {
      if (pendingDelete.isPersisted && pendingDelete.card?.id) {
        await deleteCardApi(pendingDelete.card.id);
        await reloadCards();
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
      console.error('Xoá thẻ thất bại:', err);
      setDeleteError(err?.message || 'Không thể xoá thẻ hiện tại');
    } finally {
      setDeleteLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex-shrink-0">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors border border-gray-200"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Quay lại
            </button>
            <div className="mt-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">{setMeta?.title || 'Flashcard'}</h1>
              <p className="text-slate-500 mt-1">{setMeta?.description || 'Không có mô tả...'}</p>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 mt-3">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">person</span>
                <span>
                  Người chia sẻ: <span className="font-medium text-slate-900">{setMeta?.owner || 'Bạn'}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-start md:justify-end gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white hover:bg-slate-50 rounded-lg transition-colors border border-gray-200">
              <span className="material-symbols-outlined text-lg">edit</span> Chỉnh sửa
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white hover:bg-slate-50 rounded-lg transition-colors border border-gray-200">
              <span className="material-symbols-outlined text-lg">grid_on</span> Thêm nhiều
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-200">
              <span className="material-symbols-outlined text-lg">delete</span> Xóa
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Tất cả thẻ', count: cards.length, color: 'slate', icon: 'style' },
            { label: 'Đã nhớ', count: 0, color: 'green', icon: 'auto_stories' },
            { label: 'Đang ghi nhớ', count: 0, color: 'blue', icon: 'psychology' },
            { label: 'Cần ôn tập', count: 0, color: 'orange', icon: 'history' },
          ].map((item) => {
            const colorTextClass = item.color === 'slate' ? 'text-slate-500' : 'text-' + item.color + '-600';
            const colorNumClass = item.color === 'slate' ? '' : 'text-' + item.color + '-600';
            const bgClass = 'p-3 bg-' + item.color + '-100 rounded-lg';
            const iconColor = 'text-' + item.color + '-600';
            return (
              <div
                key={item.label}
                className="bg-white p-4 rounded-xl flex justify-between items-center border border-gray-200 shadow-sm"
              >
                <div>
                  <p className={`text-sm font-medium ${colorTextClass}`}>{item.label}</p>
                  <p className={`text-3xl font-bold ${colorNumClass}`}>{item.count}</p>
                </div>
                <div className={bgClass}>
                  <span className={`material-symbols-outlined text-2xl ${iconColor}`}>{item.icon}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="bg-white p-3 rounded-xl flex flex-col sm:flex-row items-center gap-3 mb-8 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="p-3 bg-slate-50 rounded-lg hover:bg-gray-200 transition-colors">
              <span className="material-symbols-outlined">grid_view</span>
            </button>
            <button className="p-3 bg-slate-50 rounded-lg hover:bg-gray-200 transition-colors">
              <span className="material-symbols-outlined">reorder</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddWordModal(true)}
            className="w-full sm:w-auto flex-grow bg-primary hover:bg-violet-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm shadow-sm"
          >
            <span className="material-symbols-outlined">add</span>
            THÊM TỪ VỰNG
          </button>

          <button
            onClick={() => {
              // Mở file chooser trực tiếp
              if (uploadRef && uploadRef.current && typeof uploadRef.current.open === 'function') {
                uploadRef.current.open();
                return;
              }
              setUploadEntries([]);
              setShowUploadModal(true);
            }}
            className="w-full sm:w-auto flex-grow bg-white hover:bg-slate-50 text-slate-900 font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm border border-gray-200"
            title="Nhập từ PDF vào bộ này"
          >
            <span className="material-symbols-outlined">file_upload</span>
            Nhập từ PDF
          </button>

          <button
            className="w-full sm:w-auto flex-grow bg-slate-50 hover:bg-gray-200 text-slate-900 font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm border border-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={() => setShowPracticeDialog(true)}
            disabled={!combinedCards.length}
          >
            <span className="material-symbols-outlined">model_training</span>
            LUYỆN TẬP
          </button>
        </div>

        {/* Cards grid or empty summary */}
        {combinedCards.length === 0 ? (
          <div className="text-center py-24 px-6 bg-slate-50 rounded-xl">
            <span className="material-symbols-outlined text-6xl text-slate-400 mb-4">inbox</span>
            <h2 className="text-xl font-semibold text-slate-900">Không có từ vựng nào trong flashcard này</h2>
            <p className="text-slate-500 mt-2">Bạn hãy bấm vào nút thêm từ vựng để học nhé.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {combinedCards.map((c, idx) => (
              <div
                key={idx}
                className="list-flashcard bg-white rounded-lg shadow-sm p-5 border border-slate-200 flex flex-col self-start"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold text-slate-900">{c.front}</h3>
                    </div>
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-slate-500">
                      {c.level && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                          {c.level}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="text-slate-500 hover:bg-slate-100 p-1.5 rounded-full"
                    onClick={() => setActionCardIndex(idx)}
                  >
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                </div>

                <div className="text-sm text-slate-600">
                  <p className="font-semibold mb-1">Định nghĩa:</p>
                  <p className="pl-2 text-slate-700">{c.back || '—'}</p>
                </div>

                <div className="border-t border-slate-200 pt-3 mt-3">
                  {(() => {
                    const cardKey = c.id ? `server-${c.id}` : `local-${idx}`;
                    const examples = normalizeExamples(c.example || c.examples);
                    const hasExamples = examples.length > 0;
                    const isOpen = openExampleIds.includes(cardKey);
                    const toggleExamples = () => {
                      if (!hasExamples) return;
                      setOpenExampleIds((prev) =>
                        prev.includes(cardKey) ? prev.filter((key) => key !== cardKey) : [...prev, cardKey],
                      );
                    };
                    return (
                      <>
                        <button
                          className="flashcard-example-toggle w-full text-sm font-medium text-slate-500 hover:text-primary transition-colors"
                          onClick={toggleExamples}
                          disabled={!hasExamples}
                        >
                          <span>
                            Ví dụ{hasExamples ? ` (${examples.length})` : ''}
                            {!hasExamples && ' — chưa có dữ liệu'}
                          </span>
                          <span className="material-symbols-outlined">{isOpen ? 'expand_less' : 'expand_more'}</span>
                        </button>
                        {hasExamples && isOpen && (
                          <div className="flashcard-example-content rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm text-slate-700 space-y-2">
                            {examples.map((ex, exIdx) => (
                              <p key={exIdx} className="leading-relaxed">
                                {ex}
                              </p>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                <div className="border-t border-slate-200 pt-3 mt-3">
                  <button className="w-full flex justify-between items-center text-sm font-medium text-slate-500 hover:text-primary transition-colors">
                    <span>Ghi chú:</span>
                    <span className="material-symbols-outlined">expand_more</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUploadModal && (
        <UploadModal
          uploadEntries={uploadEntries}
          setUploadEntries={setUploadEntries}
          setShowUploadModal={setShowUploadModal}
          enrichingUpload={enrichingUpload}
          setEnrichingUpload={setEnrichingUpload}
          setUploadResultTitle={setUploadResultTitle}
          setUploadResultMessage={setUploadResultMessage}
          setUploadResultIsError={setUploadResultIsError}
          setShowUploadResult={setShowUploadResult}
          id={id}
          onCardsCreated={reloadCards}
        />
      )}
      {showAddWordModal && (
        <AddWordModal 
          newCards={newCards} 
          setNewCards={setNewCards} 
          setShowAddWordModal={setShowAddWordModal} 
          id={id}
          onCardsCreated={reloadCards}
          setUploadResultTitle={setUploadResultTitle}
          setUploadResultMessage={setUploadResultMessage}
          setUploadResultIsError={setUploadResultIsError}
          setShowUploadResult={setShowUploadResult}
        />
      )}
      {actionCardIndex !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" onClick={() => setActionCardIndex(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Tùy chọn cho thẻ</p>
                <h3 className="text-xl font-semibold text-slate-900">
                  {combinedCards[actionCardIndex]?.front || '—'}
                </h3>
              </div>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setActionCardIndex(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-left"
                onClick={() => openEditModal(actionCardIndex)}
              >
                <span className="material-symbols-outlined text-slate-600">edit</span>
                <div>
                  <p className="font-semibold text-slate-900">Sửa thẻ</p>
                  <p className="text-sm text-slate-500">Chỉnh sửa nội dung và ví dụ</p>
                </div>
              </button>

              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 hover:bg-red-50 text-left"
                onClick={() => handleDeleteClick(actionCardIndex)}
              >
                <span className="material-symbols-outlined text-red-600">delete</span>
                <div>
                  <p className="font-semibold text-red-600">Xóa thẻ</p>
                  <p className="text-sm text-red-500">Thao tác này không thể hoàn tác</p>
                </div>
              </button>
            </div>

            <button
              className="w-full mt-2 py-2 rounded-xl bg-slate-100 text-slate-600 font-medium hover:bg-slate-200"
              onClick={() => setActionCardIndex(null)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
      {editModalInfo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={closeEditModal}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Chỉnh sửa thẻ</p>
                <h3 className="text-2xl font-semibold text-slate-900">{editForm.front || 'Thẻ'}</h3>
              </div>
              <button className="text-slate-400 hover:text-slate-600" onClick={closeEditModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Mặt trước</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-primary/40"
                  value={editForm.front}
                  onChange={(e) => handleEditChange('front', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Định nghĩa / Mặt sau</label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 min-h-[100px] focus:ring-2 focus:ring-primary/40"
                  value={editForm.back}
                  onChange={(e) => handleEditChange('back', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Ví dụ</label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 min-h-[80px] focus:ring-2 focus:ring-primary/40"
                  value={editForm.example}
                  onChange={(e) => handleEditChange('example', e.target.value)}
                />
              </div>
            </div>

            {editError && <p className="text-sm text-red-600">{editError}</p>}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
                onClick={closeEditModal}
                disabled={editLoading}
              >
                Hủy
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold shadow hover:bg-violet-700 disabled:opacity-60"
                onClick={submitEdit}
                disabled={editLoading}
              >
                {editLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
      {pendingDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={cancelDelete}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Xác nhận xoá</p>
                <h3 className="text-xl font-semibold text-slate-900">
                  {pendingDelete.card?.word || pendingDelete.card?.front || 'Thẻ'}
                </h3>
                <p className="text-slate-500 mt-1">Bạn có chắc muốn xoá thẻ này? Thao tác không thể hoàn tác.</p>
              </div>
              <button className="text-slate-400 hover:text-slate-600" onClick={cancelDelete}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
                onClick={cancelDelete}
                disabled={deleteLoading}
              >
                Hủy
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold shadow hover:bg-red-700 disabled:opacity-60"
                onClick={confirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Đang xoá...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showUploadResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg max-w-md w-[90%]">
            <h3 className={`text-lg font-semibold ${uploadResultIsError ? 'text-red-600' : 'text-slate-900'}`}>{uploadResultTitle}</h3>
            <p className="mt-2">{uploadResultMessage}</p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowUploadResult(false)}
                className="px-4 py-2 rounded bg-primary text-white"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Hidden Upload button instance used to trigger file dialog programmatically */}
      <div style={{ display: 'none' }}>
        <UploadPDFButton ref={uploadRef} onResult={handleUploadResult} />
      </div>
      {showPracticeDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={() => setShowPracticeDialog(false)}>
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Luyện tập với bộ</p>
                <h3 className="text-2xl font-semibold text-slate-900">{setMeta?.title || 'Flashcard'}</h3>
                <p className="text-slate-500 mt-1">Chọn chế độ bạn muốn bắt đầu.</p>
              </div>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setShowPracticeDialog(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-left"
                onClick={startStudyMode}
              >
                <span className="material-symbols-outlined text-primary">style</span>
                <div>
                  <p className="text-lg font-semibold text-slate-900">Lật thẻ</p>
                  <p className="text-sm text-slate-500">Ôn tập flashcard theo cách truyền thống</p>
                </div>
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-indigo-200 hover:bg-indigo-50 text-left"
                onClick={startGameMode}
              >
                <span className="material-symbols-outlined text-indigo-600">stadia_controller</span>
                <div>
                  <p className="text-lg font-semibold text-slate-900">Chơi game</p>
                  <p className="text-sm text-slate-500">Chọn mini game để luyện tập hứng thú hơn</p>
                </div>
              </button>
            </div>

            <button
              className="w-full py-2 rounded-xl bg-slate-100 text-slate-600 font-medium hover:bg-slate-200"
              onClick={() => setShowPracticeDialog(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
      {showLevelDialog &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="modal-overlay">
            <div className="modal-box">
              <h3>Chọn cấp độ để hiển thị từ</h3>
              {classifyResults &&
                Array.isArray(classifyResults.classify) &&
                (() => {
                  const arr = classifyResults.classify;
                  const total = arr.length;
                  const counts = { easy: 0, medium: 0, hard: 0 };
                  arr.forEach((it) => {
                    const lv = normalizeLevel(it.level || it.difficulty || it.token || it.text || it.word || '');
                    if (lv) counts[lv] = (counts[lv] || 0) + 1;
                  });
                  return (
                    <div className="modal-summary">
                      <div>
                        Tổng từ: {total} — Phân bố: Easy: {counts.easy}, Medium: {counts.medium}, Hard: {counts.hard}
                      </div>
                    </div>
                  );
                })()}

              <div className="modal-levels-row">
                <label className="modal-label">
                  <input type="checkbox" checked={selectedLevels.includes('All')} onChange={() => toggleLevel('All')} />{' '}
                  All
                </label>
                {allLevels.map((lvl) => (
                  <label key={lvl} className="modal-label">
                    <input type="checkbox" checked={selectedLevels.includes(lvl)} onChange={() => toggleLevel(lvl)} />{' '}
                    {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                  </label>
                ))}
              </div>

              <div className="modal-actions-row">
                <button className="btn-outline" onClick={cancelLevels}>
                  Hủy
                </button>
                <button className="btn-main" onClick={confirmLevels}>
                  Xác nhận
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
} 