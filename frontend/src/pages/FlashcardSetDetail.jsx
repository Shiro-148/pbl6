import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authFetch } from '../services/auth';
import { listCards } from '../services/flashcards';
import '../styles/pages/FlashcardSetDetail.css';


export default function FlashcardSetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [setMeta, setSetMeta] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [showAddWordModal, setShowAddWordModal] = useState(false);
  const [newCards, setNewCards] = useState([]);

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
        setCards(Array.isArray(cs) ? cs : cs.cards || []);
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
    return () => { mounted = false; };
  }, [id]);

  const UploadModal = () => (
    <div>
      <div className="fixed inset-0 z-40 bg-gray-900/50" onClick={() => setShowUploadModal(false)} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          aria-labelledby="modal-title"
          aria-modal="true"
          className="w-full max-w-lg mx-auto flex flex-col bg-white rounded-xl shadow-2xl"
          role="dialog"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold leading-tight tracking-[-0.015em] text-gray-900" id="modal-title">
              Nhập từ vựng từ PDF
            </h1>
            <button
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setShowUploadModal(false)}
              aria-label="Close upload dialog"
            >
              <span className="material-symbols-outlined text-gray-600">close</span>
            </button>
          </div>

          <div className="flex-1 px-4 md:px-6 py-6">
            <div className="flex flex-col gap-6">
              <label className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-10 text-center cursor-pointer hover:border-primary hover:bg-primary/5">
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
                <span className="material-symbols-outlined text-4xl text-primary">upload_file</span>
                <span className="text-lg font-bold text-gray-800">Nhập từ PDF</span>
                <span className="text-sm text-gray-500">Kéo và thả hoặc nhấp để tải lên</span>
                {uploadFile && <span className="text-sm text-slate-600 mt-2">Chọn: {uploadFile.name}</span>}
              </label>

              <div className="flex flex-col gap-4">
                <label className="flex flex-col w-full">
                  <span className="sr-only">Từ vựng</span>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-800 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 bg-white h-12 placeholder:text-gray-500 px-4 text-base font-normal leading-normal"
                    placeholder="Từ vựng"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                  />
                </label>
                <label className="flex flex-col w-full">
                  <span className="sr-only">Định nghĩa</span>
                  <textarea
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-800 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 bg-white min-h-24 placeholder:text-gray-500 p-4 text-base font-normal leading-normal"
                    placeholder="Định nghĩa"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center gap-4 p-4 md:p-6 border-t border-gray-200">
            <button
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-100 text-gray-700 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-gray-200 transition-colors"
              onClick={() => setShowUploadModal(false)}
            >
              <span className="truncate">Hủy</span>
            </button>
            <button
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-white text-primary border border-primary text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/10 transition-colors whitespace-nowrap"
              onClick={() => {
                alert('Bổ sung định nghĩa tự động - chưa triển khai');
              }}
            >
              <span className="truncate">Bổ sung định nghĩa tự động</span>
            </button>
            <button
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors"
              onClick={() => {
                console.log('Upload PDF for set', id, { uploadFile, uploadTitle, uploadDescription });
                setShowUploadModal(false);
              }}
            >
              <span className="truncate">Tạo Flashcard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const AddWordModal = () => {
    const [manualOpen, setManualOpen] = useState(false);
    const [aiInput, setAiInput] = useState('');
    const [manualEntries, setManualEntries] = useState([{ front: '', back: '', example: '' }]);

    // ManualCardsEditor manages dynamic manual front/back inputs
    const ManualCardsEditor = ({ entries, setEntries }) => {
      const updateEntry = (idx, key, value) => {
        setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, [key]: value } : e)));
      };

      const addBlank = () => setEntries((prev) => [...prev, { front: '', back: '' }]);
      const removeAt = (idx) => setEntries((prev) => prev.filter((_, i) => i !== idx));

      return (
        <div className="mt-4 flex flex-col gap-4">
          {entries.map((e, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
              <div>
                <label className="text-sm text-gray-600 pb-1">Mặt trước</label>
                <input
                  value={e.front}
                  onChange={(ev) => updateEntry(idx, 'front', ev.target.value)}
                  className="form-input rounded-lg p-3 border w-full"
                  placeholder="Mặt trước"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 pb-1">Mặt sau</label>
                <input
                  value={e.back}
                  onChange={(ev) => updateEntry(idx, 'back', ev.target.value)}
                  className="form-input rounded-lg p-3 border w-full"
                  placeholder="Mặt sau"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm text-gray-600 pb-1">Ví dụ (tùy chọn)</label>
                <textarea
                  value={e.example}
                  onChange={(ev) => updateEntry(idx, 'example', ev.target.value)}
                  className="form-input rounded-lg p-3 border w-full min-h-[80px]"
                  placeholder="Thêm câu ví dụ..."
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <button className="text-sm text-red-600" onClick={() => removeAt(idx)}>Xóa</button>
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-100 rounded" onClick={addBlank}>Thêm thẻ</button>
          </div>
        </div>
      );
    };

    return (
      <div>
        <div className="fixed inset-0 z-40 bg-gray-900/50" onClick={() => setShowAddWordModal(false)} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            aria-labelledby="add-modal-title"
            aria-modal="true"
            className="w-full max-w-3xl mx-auto flex flex-col bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-hidden"
            role="dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h1 className="text-2xl font-bold text-gray-900" id="add-modal-title">Thêm từ vựng mới</h1>
              <button className="p-2 rounded-full hover:bg-gray-100" onClick={() => setShowAddWordModal(false)}>
                <span className="material-symbols-outlined text-gray-600">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5">
              <div className="flex flex-col gap-6">
                <p className="text-base text-gray-600">Bạn có thể nhập nhanh bằng AI hoặc thêm thủ công từng thẻ.</p>

                <div className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">title</span>
                    <h3 className="font-bold text-gray-800">Nhập từ bằng AI</h3>
                    <span className="text-xs font-medium text-white bg-red-500 px-2 py-0.5 rounded-full">Bắt buộc</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-800 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 bg-white h-12 placeholder:text-gray-500 px-4"
                      placeholder="Nhập từ hoặc câu bằng tiếng việt..."
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                    />
                    <button
                      className="flex w-full sm:w-auto items-center justify-center gap-2 py-2 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                      onClick={() => {
                        if (!aiInput) return alert('Vui lòng nhập dữ liệu để tạo bằng AI');
                        const parts = aiInput.split(/\n|\.|,|;/).map(s => s.trim()).filter(Boolean);
                        const created = parts.map(p => ({ front: p, back: '' }));
                        setNewCards((prev) => [...prev, ...created]);
                        setAiInput('');
                      }}
                    >
                      <span className="material-symbols-outlined">auto_awesome</span>
                      <span>Tạo bằng AI</span>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">Nhập thủ công</h3>
                    <button className="text-sm text-primary" onClick={() => setManualOpen(!manualOpen)}>
                      {manualOpen ? 'Ẩn' : 'Hiện'}
                    </button>
                  </div>

                  {manualOpen && (
                    <ManualCardsEditor entries={manualEntries} setEntries={setManualEntries} />
                  )}
                </div>

                {newCards.length > 0 && (
                  <div className="mt-2 border rounded p-3 bg-white">
                    <h4 className="font-medium">Danh sách thẻ (chưa lưu):</h4>
                    <ul className="mt-2 space-y-2 max-h-48 overflow-auto">
                      {newCards.map((c, idx) => (
                        <li key={idx} className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold">{c.front}</div>
                            <div className="text-sm text-slate-500">{c.back}</div>
                            {c.example && <div className="text-sm text-slate-400 italic mt-1">Ví dụ: {c.example}</div>}
                          </div>
                          <button className="text-sm text-red-600" onClick={() => setNewCards((prev) => prev.filter((_, i) => i !== idx))}>Xóa</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 md:p-6 border-t border-gray-200 sticky bottom-0 bg-white z-10">
              <button className="px-4 py-2 bg-gray-100 rounded" onClick={() => setShowAddWordModal(false)}>Hủy</button>
              <button
                className="px-4 py-2 bg-primary text-white rounded"
                onClick={() => {
                  const filledManual = (manualEntries || [])
                    .map(e => ({ front: (e.front || '').trim(), back: (e.back || '').trim(), example: (e.example || '').trim() }))
                    .filter(e => e.front);
                  if (filledManual.length) setNewCards((prev) => [...prev, ...filledManual]);
                  const combined = [...newCards, ...filledManual];
                  console.log('Create cards for set', id, combined);
                  setShowAddWordModal(false);
                }}
              >
                Lưu bộ thẻ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-6">Loading...</div>;

  // combined cards: existing + newly created in-modal
  const combinedCards = [...cards, ...newCards];

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
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                {setMeta?.title || 'Flashcard'}
              </h1>
              <p className="text-slate-500 mt-1">
                {setMeta?.description || 'Không có mô tả...'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 mt-3">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">person</span>
                <span>
                  Người chia sẻ:{' '}
                  <span className="font-medium text-slate-900">
                    {setMeta?.owner || 'Bạn'}
                  </span>
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
            onClick={() => setShowUploadModal(true)}
            className="w-full sm:w-auto flex-grow bg-white hover:bg-slate-50 text-slate-900 font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm border border-gray-200"
            title="Nhập từ PDF vào bộ này"
          >
            <span className="material-symbols-outlined">file_upload</span>
            Nhập từ PDF
          </button>

          <button className="w-full sm:w-auto flex-grow bg-slate-50 hover:bg-gray-200 text-slate-900 font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm border border-gray-300">
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
              <div key={idx} className="list-flashcard bg-white rounded-lg shadow-sm p-5 border border-slate-200 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold text-slate-900">{c.front}</h3>
                    </div>
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-slate-500">
                      {c.level && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">{c.level}</span>}
                    </div>
                  </div>
                  <button className="text-slate-500 hover:bg-slate-100 p-1.5 rounded-full">
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                </div>

                <div className="text-sm text-slate-600 flex-grow">
                  <p className="font-semibold mb-1">Định nghĩa:</p>
                  <p className="pl-2 text-slate-700">{c.back || '—'}</p>
                </div>

                <div className="border-t border-slate-200 pt-3 mt-3">
                  <button className="w-full flex justify-between items-center text-sm font-medium text-slate-500 hover:text-primary transition-colors">
                    <span>Ví dụ{c.example ? ' (1)' : ''}</span>
                    <span className="material-symbols-outlined">expand_more</span>
                  </button>
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

      {showUploadModal && <UploadModal />}
      {showAddWordModal && <AddWordModal />}
    </div>
  );
}
