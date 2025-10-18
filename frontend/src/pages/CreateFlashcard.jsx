import React, { useState } from 'react';
import '../styles/pages/CreateFlashcard.css';
import UploadPDFButton from '../components/UploadPDFButton';
import flashcardsService from '../services/flashcards';

const initialCards = [
  { term: '', definition: '', image: '', selected: true },
  { term: '', definition: '', image: '', selected: true },
];

const CreateFlashcard = () => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [cards, setCards] = useState(initialCards);
  const [creating, setCreating] = useState(false);
  const [createProgress, setCreateProgress] = useState({ total: 0, done: 0 });
  const [message, setMessage] = useState('');
  const [showLevelDialog, setShowLevelDialog] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [classifyResults, setClassifyResults] = useState(null);

  const handleCardChange = (idx, field, value) => {
    const updated = cards.map((c, i) => (i === idx ? { ...c, [field]: value } : c));
    setCards(updated);
  };

  const handleAddCard = () => {
    setCards([...cards, { term: '', definition: '', image: '' }]);
  };

  const handleRemoveCard = (idx) => {
    setCards(cards.filter((_, i) => i !== idx));
  };

  const parseWordsFromText = (text, limit = 200) => {
    if (!text) return [];
    const tokens = text
      .replace(/[^A-Za-zÀ-ỹ0-9\s]/g, ' ')
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2);
    const uniq = Array.from(new Set(tokens.map((t) => t)));
    return uniq.slice(0, limit);
  };

  const allLevels = ['easy', 'medium', 'hard'];

  // normalizeLevel used in multiple places (CEFR/numeric/simple -> easy/medium/hard)
  const normalizeLevel = (lvl) => {
    if (!lvl && lvl !== 0) return '';
    const s = String(lvl).trim();
    if (!s) return '';
    const up = s.toUpperCase();
    if (up === 'A1' || up === 'A2') return 'easy';
    if (up === 'B1' || up === 'B2') return 'medium';
    if (up === 'C1' || up === 'C2') return 'hard';
    if (s === '0' || s === '1' || s === '2') {
      return s === '0' ? 'easy' : s === '1' ? 'medium' : 'hard';
    }
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
    // normalize level values (CEFR, numeric, or already simple) to 'easy'|'medium'|'hard'
    const normalizeLevel = (lvl) => {
      if (!lvl && lvl !== 0) return '';
      const s = String(lvl).trim();
      if (!s) return '';
      const up = s.toUpperCase();
      if (up === 'A1' || up === 'A2') return 'easy';
      if (up === 'B1' || up === 'B2') return 'medium';
      if (up === 'C1' || up === 'C2') return 'hard';
      if (s === '0' || s === '1' || s === '2') {
        return s === '0' ? 'easy' : s === '1' ? 'medium' : 'hard';
      }
      if (['easy', 'medium', 'hard'].includes(s.toLowerCase())) return s.toLowerCase();
      return '';
    };

    let filtered = [];
    if (Array.isArray(c)) {
      if (selectedLevels.includes('All') || selectedLevels.length === 0) {
        // user selected All -> import all tokens
        filtered = c.slice();
      } else {
        filtered = c.filter((w) => chosen.includes(normalizeLevel(w.level || w.difficulty || w.token || w.text || w.word || '')));
      }
    }
    console.debug('confirmLevels: chosen=', chosen, 'filtered count=', filtered.length);
    const imported = filtered.map((wObj) => {
      const word = wObj.word || wObj.text || wObj.token || '';
      const level = wObj.level || wObj.difficulty || '';
      let definition = '';
      if (f && f.length) {
        const found = f.find((x) => (x.word || x.term || '').toLowerCase() === word.toLowerCase());
        if (found) definition = found.definition || (found.defs && found.defs[0]) || '';
      }
      return { term: word, definition, image: '', selected: true, level };
    });
    setCards(imported);
    // setMessage(`Hiển thị ${imported.length} từ phù hợp với cấp độ`);
    setShowLevelDialog(false);
    setClassifyResults(null);
  };

  const cancelLevels = () => {
    setShowLevelDialog(false);
    setClassifyResults(null);
  };

  const handleCreateFromCards = async () => {
    if (!title) {
      alert('Vui lòng nhập tiêu đề cho bộ flashcard');
      return;
    }
    const toCreate = cards.filter((c) => c.selected && c.term && c.term.trim());
    if (toCreate.length === 0) {
      alert('Không có thẻ nào được chọn để tạo');
      return;
    }

    try {
      setCreating(true);
      setMessage('Đang tạo bộ...');
      const setRes = await flashcardsService.createSet(title, desc);
      const setId = setRes.id || setRes['id'];
      setCreateProgress({ total: toCreate.length, done: 0 });

      // create cards in parallel
      await Promise.all(
        toCreate.map(async (c) => {
          await flashcardsService.createCard(setId, c.term, c.definition || '');
          setCreateProgress((p) => ({ ...p, done: p.done + 1 }));
        })
      );

      setMessage('Tạo thành công ' + toCreate.length + ' thẻ.');
    } catch (err) {
      console.error(err);
      setMessage('Lỗi khi tạo flashcards: ' + (err.message || err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="create-flashcard-root-fix">
      <div className="create-flashcard-container">
        {showLevelDialog && (
          <div style={{ position: 'fixed', left: 0, right: 0, top: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', padding: 20, borderRadius: 8, width: 480, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              <h3>Chọn cấp độ để hiển thị từ</h3>
              {/* Small summary: total tokens and breakdown by easy/medium/hard */}
              {classifyResults && Array.isArray(classifyResults.classify) && (() => {
                const arr = classifyResults.classify;
                const total = arr.length;
                const counts = { easy: 0, medium: 0, hard: 0 };
                arr.forEach((it) => {
                  const lv = normalizeLevel(it.level || it.difficulty || it.token || it.text || it.word || '');
                  if (lv) counts[lv] = (counts[lv] || 0) + 1;
                });
                return (
                  <div style={{ fontSize: 13, color: '#444', marginBottom: 8 }}>
                    <div>Tổng từ: {total} — Phân bố: Easy: {counts.easy}, Medium: {counts.medium}, Hard: {counts.hard}</div>
                  </div>
                );
              })()}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                <label style={{ marginRight: 8 }}>
                  <input type="checkbox" checked={selectedLevels.includes('All')} onChange={() => toggleLevel('All')} /> All
                </label>
                {allLevels.map((lvl) => (
                  <label key={lvl} style={{ marginRight: 8 }}>
                    <input type="checkbox" checked={selectedLevels.includes(lvl)} onChange={() => toggleLevel(lvl)} /> {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                  </label>
                ))}
              </div>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn-outline" onClick={cancelLevels}>Hủy</button>
                <button className="btn-main" onClick={confirmLevels}>Xác nhận</button>
              </div>
            </div>
          </div>
        )}
        <div className="create-flashcard-header">
          <h2>Tạo một học phần mới</h2>
          <div className="create-flashcard-actions">
            <button className="btn-outline">Tạo</button>
            <button className="btn-main">Tạo và ôn luyện</button>
          </div>
        </div>
        <input
          className="input-title"
          type="text"
          placeholder="Tiêu đề"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="input-desc"
          placeholder="Thêm mô tả..."
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <div className="row-actions-import-folder">
          <UploadPDFButton
            onResult={(data) => {
              console.debug('UploadPDF onResult data:', data);
              if (!data) return;

              // Normalize/classify detection: backend might return { classify: { words: [...] } }
              // or sometimes { classify: [...] } depending on proxying. Handle both.
              let classify = null;
              if (data.classify) {
                if (Array.isArray(data.classify)) {
                  classify = data.classify;
                } else if (Array.isArray(data.classify.words)) {
                  classify = data.classify.words;
                } else if (Array.isArray(data.classify.words?.words)) {
                  // defensive: nested shape
                  classify = data.classify.words.words;
                }
              }

              const flash = data.flashcards && data.flashcards.entries ? data.flashcards.entries : (data.flashcards || null);

              if (classify && classify.length) {
                console.debug('Detected classify words from PDF upload:', classify.length);
                // store classify results and require user to choose level(s) first
                setClassifyResults({ classify, flash });
                // reset previous selection
                setSelectedLevels([]);
                setShowLevelDialog(true);
                return;
              } else {
                console.debug('No classify words found in upload result');
              }

              // fallback: if flashcards entries present, use them
              if (flash && flash.length) {
                const imported = flash.map((f) => ({ term: f.word || f.term || '', definition: f.definition || '', image: '', selected: true }));
                setCards(imported);
                setMessage(`Đã nhập ${imported.length} từ từ PDF (enriched)`);
                return;
              }

              // final fallback: parse raw text into tokens
              if (data.rawText) {
                const words = parseWordsFromText(data.rawText, 200);
                if (words.length) {
                  const imported = words.map((w) => ({ term: w, definition: '', image: '', selected: true }));
                  setCards(imported);
                  setMessage(`Đã nhập ${imported.length} từ từ PDF`);
                } else {
                  setDesc(data.rawText);
                }
              }
            }}
          />
          <div className="select-folder-wrapper">
            <select className="select-folder">
              <option value="">Chọn folder</option>
              <option value="Toán">Toán</option>
              <option value="Vật lý">Vật lý</option>
              <option value="Tiếng Anh">Tiếng Anh</option>
            </select>
          </div>
        </div>
        <div className="flashcard-list">
          {cards.map((card, idx) => (
            <div className="flashcard-row" key={idx} style={{ display: 'flex', alignItems: 'center' }}>
              <div className="flashcard-index">{idx + 1}</div>
              <div className="flashcard-inputs">
                <input
                  className="input-term"
                  type="text"
                  placeholder="Thuật ngữ"
                  value={card.term}
                  onChange={(e) => handleCardChange(idx, 'term', e.target.value)}
                />
                <input
                  className="input-def"
                  type="text"
                  placeholder="Định nghĩa"
                  value={card.definition}
                  onChange={(e) => handleCardChange(idx, 'definition', e.target.value)}
                />
              </div>
              <div className="flashcard-image-box">
                <div className="image-placeholder">
                  <i className="bx bx-image"></i>
                  <span>Hình ảnh</span>
                </div>
              </div>
              <div className="flashcard-row-actions">
                <button type="button" className="btn-row-move">
                  <i className="bx bx-menu"></i>
                </button>
                <button type="button" className="btn-row-delete" onClick={() => handleRemoveCard(idx)}>
                  <i className="bx bx-trash"></i>
                </button>
              </div>
            </div>
          ))}
          <div className="flashcard-add-row">
            <button className="btn-add-card" type="button" onClick={handleAddCard}>
              + Thêm thẻ
            </button>
          </div>

          <div style={{ marginTop: 16, alignItems: 'center', display: 'flex', justifyContent: 'center',width: '100%' }}>
            <button className="btn-main" type="button" onClick={handleCreateFromCards} disabled={creating}>
              {creating ? `Đang tạo... (${createProgress.done}/${createProgress.total})` : 'Tạo từ danh sách'}
            </button>
            <button
              className="btn-outline"
              type="button"
              onClick={async () => {
                try {
                  const sel = cards.filter((c) => c.selected).map((c) => c.term);
                  if (!sel.length) return alert('Vui lòng chọn ít nhất 1 từ để bổ sung');
                  setMessage('Đang gọi dịch vụ bổ sung định nghĩa...');
                  const res = await flashcardsService.enrichWords(sel);
                  const list = res.flashcards || res.entries || res;
                  // map definitions back to cards
                  const updated = cards.map((c) => {
                    const found = list && list.find((x) => (x.word || x.term || '').toLowerCase() === (c.term || '').toLowerCase());
                    if (found) return { ...c, definition: c.definition || found.definition || (found.examples && found.examples[0]) || '' };
                    return c;
                  });
                  setCards(updated);
                  setMessage('Đã bổ sung định nghĩa');
                } catch (err) {
                  console.error(err);
                  alert('Lỗi khi bổ sung định nghĩa: ' + (err.message || err));
                }
              }}
            >
              Bổ sung định nghĩa tự động
            </button>
            {message && <div style={{ marginTop: 8 }}>{message}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateFlashcard;
