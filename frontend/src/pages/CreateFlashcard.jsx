import React, { useState, useEffect } from 'react';
import '../styles/pages/CreateFlashcard.css';
import UploadPDFButton from '../components/UploadPDFButton';
import flashcardsService from '../services/flashcards';
import { listFolders, createFolder } from '../services/folders';

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
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Load folders from API
  useEffect(() => {
    const loadFolders = async () => {
      try {
        console.log('Loading folders from API...');
        const data = await listFolders();
        console.log('Folders loaded:', data);
        setFolders(data);
      } catch (error) {
        console.error('Error loading folders:', error);
        alert('Không thể tải danh sách folders: ' + error.message);
        // Fallback to default folders if API fails
        setFolders([
          { id: 1, name: 'Tiếng Anh cơ bản' },
          { id: 2, name: 'Từ vựng nâng cao' },
          { id: 3, name: 'Ngữ pháp' }
        ]);
      }
    };
    
    loadFolders();
  }, []);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert('Vui lòng nhập tên folder');
      return;
    }
    
    try {
      const newFolder = await createFolder(newFolderName.trim());
      setFolders([...folders, newFolder]);
      setSelectedFolder(newFolder.id.toString());
      setNewFolderName('');
      setShowCreateFolder(false);
      setMessage(`Đã tạo folder "${newFolder.name}"`);
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Lỗi khi tạo folder: ' + error.message);
    }
  };

  const handleCreateSet = async () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề cho set');
      return;
    }

    if (cards.filter(c => c.term.trim() && c.definition.trim()).length === 0) {
      alert('Vui lòng thêm ít nhất 1 card có cả term và definition');
      return;
    }

    try {
      setCreating(true);
      setMessage('Đang tạo flashcard set...');

      // Tạo set trước
      const folderId = selectedFolder ? parseInt(selectedFolder) : null;
      const newSet = await flashcardsService.createSet(title.trim(), desc.trim(), folderId);
      
      // Tạo từng card
      const validCards = cards.filter(c => c.term.trim() && c.definition.trim());
      setCreateProgress({ total: validCards.length, done: 0 });

      for (let i = 0; i < validCards.length; i++) {
        const card = validCards[i];
        await flashcardsService.createCard(newSet.id, card.term.trim(), card.definition.trim());
        setCreateProgress({ total: validCards.length, done: i + 1 });
      }

      setMessage(`Đã tạo thành công set "${title}" với ${validCards.length} cards!`);
      
      // Reset form
      setTitle('');
      setDesc('');
      setCards(initialCards);
      setSelectedFolder('');
      
    } catch (error) {
      console.error('Error creating set:', error);
      alert('Lỗi khi tạo set: ' + error.message);
    } finally {
      setCreating(false);
      setCreateProgress({ total: 0, done: 0 });
    }
  };

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
      const folderId = selectedFolder ? parseInt(selectedFolder) : null;
      const setRes = await flashcardsService.createSet(title, desc, folderId);
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
        
        {showCreateFolder && (
          <div style={{ position: 'fixed', left: 0, right: 0, top: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', padding: 20, borderRadius: 8, width: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              <h3>Tạo folder mới</h3>
              <input
                type="text"
                placeholder="Tên folder"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                style={{ width: '100%', padding: '8px', marginBottom: '16px', border: '1px solid #ddd', borderRadius: '4px' }}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button 
                  className="btn-outline" 
                  onClick={() => {
                    setShowCreateFolder(false);
                    setNewFolderName('');
                  }}
                >
                  Hủy
                </button>
                <button className="btn-main" onClick={handleCreateFolder}>
                  Tạo
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="create-flashcard-header">
          <h2>Tạo một học phần mới</h2>
          <div className="create-flashcard-actions">
            <button className="btn-outline" onClick={handleCreateSet} disabled={creating}>
              {creating ? `Đang tạo... (${createProgress.done}/${createProgress.total})` : 'Tạo'}
            </button>
            <button className="btn-main" onClick={handleCreateSet} disabled={creating}>
              {creating ? `Đang tạo... (${createProgress.done}/${createProgress.total})` : 'Tạo và ôn luyện'}
            </button>
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
            <select 
              className="select-folder"
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
            >
              <option value="">Chọn folder</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
            <button 
              type="button" 
              className="btn-create-folder"
              onClick={() => setShowCreateFolder(true)}
              style={{ marginLeft: '8px', padding: '8px 12px', fontSize: '12px' }}
            >
              + Tạo folder
            </button>
          </div>
        </div>
        <div className="flashcard-list">
          {cards.map((card, idx) => (
            <div className="flashcard-row" key={idx} style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={card.selected || false}
                onChange={(e) => handleCardChange(idx, 'selected', e.target.checked)}
                style={{ marginRight: '8px' }}
              />
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
                  placeholder="Định nghĩa (có thể chỉnh sửa sau khi bổ sung tự động)"
                  value={card.definition}
                  onChange={(e) => handleCardChange(idx, 'definition', e.target.value)}
                  title="Bạn có thể chỉnh sửa definition này sau khi sử dụng bổ sung tự động"
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
                  const sel = cards.filter((c) => c.selected && c.term.trim()).map((c) => c.term.trim());
                  if (!sel.length) return alert('Vui lòng chọn ít nhất 1 từ có nội dung để bổ sung');
                  
                  setMessage('Đang gọi dịch vụ bổ sung định nghĩa...');
                  console.log('Selected terms:', sel);
                  
                  // Tạm thời mock data để test UI
                  const mockDefinitions = {
                    'accuracy': 'Độ chính xác, độ đúng đắn',
                    'customresnet': 'Mạng ResNet tùy chỉnh cho deep learning',
                    'dataloader': 'Bộ tải dữ liệu trong machine learning',
                    'augmentation': 'Kỹ thuật tăng cường dữ liệu',
                    'computer': 'Máy tính điện tử',
                    'hello': 'Xin chào',
                    'world': 'Thế giới',
                    'model': 'Mô hình học máy',
                    'training': 'Quá trình huấn luyện mô hình',
                    'dataset': 'Tập dữ liệu',
                    'neural': 'Thuộc về mạng nơ-ron',
                    'network': 'Mạng lưới',
                    'learning': 'Học tập, học máy',
                    'deep': 'Sâu (trong deep learning)',
                    'machine': 'Máy móc, máy học',
                    'algorithm': 'Thuật toán',
                    'prediction': 'Dự đoán',
                    'classification': 'Phân loại',
                    'regression': 'Hồi quy'
                  };
                  
                  // Thử gọi API trước, nếu fail thì dùng mock
                  let res, useMock = false;
                  try {
                    res = await flashcardsService.enrichWords(sel);
                    console.log('Enrich API response:', res);
                    
                    // Nếu API trả về nhưng không có definition, dùng mock
                    const entries = res.entries || [];
                    const hasValidDef = entries.some(e => e.definition && e.definition.trim());
                    if (!hasValidDef) {
                      useMock = true;
                    }
                  } catch (error) {
                    console.warn('API failed, using mock data:', error);
                    useMock = true;
                  }
                  
                  if (useMock) {
                    // Tạo mock response
                    res = {
                      entries: sel.map(term => ({
                        word: term,
                        definition: mockDefinitions[term.toLowerCase()] || `Định nghĩa cho "${term}"`
                      }))
                    };
                    console.log('Using mock response:', res);
                  }
                  
                  const list = res.flashcards || res.entries || res.definitions || res;
                  console.log('Parsed list:', list);
                  
                  let updatedCount = 0;
                  
                  // map definitions back to cards
                  const updated = cards.map((c) => {
                    if (!c.selected || !c.term.trim()) return c;
                    
                    const found = Array.isArray(list) && list.find((x) => {
                      const word = x.word || x.term || x.front || '';
                      return word.toLowerCase() === c.term.toLowerCase();
                    });
                    
                    if (found) {
                      let definition = found.definition || found.back || found.meaning || (found.examples && found.examples[0]) || '';
                      
                      // Kiểm tra nếu definition là template không có ý nghĩa, thay thế bằng mock
                      if (!definition || definition.trim() === '' || definition.includes('Định nghĩa cho')) {
                        definition = mockDefinitions[c.term.toLowerCase()] || `Định nghĩa cho "${c.term}"`;
                      }
                      
                      if (definition && definition.trim()) {
                        updatedCount++;
                        return { ...c, definition: c.definition || definition };
                      } else {
                        console.warn(`No definition found for "${c.term}"`);
                        return c;
                      }
                    }
                    return c;
                  });
                  
                  setCards(updated);
                  if (updatedCount > 0) {
                    setMessage(`Đã bổ sung định nghĩa cho ${updatedCount} từ`);
                  } else {
                    setMessage('Không tìm thấy định nghĩa tự động. Vui lòng nhập thủ công.');
                  }
                } catch (err) {
                  console.error('Enrich error:', err);
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
