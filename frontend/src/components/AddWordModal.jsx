import React, { useState } from 'react';
import flashcardsService from '../services/flashcards';

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
            <button className="text-sm text-red-600" onClick={() => removeAt(idx)}>
              Xóa
            </button>
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        <button className="px-4 py-2 bg-gray-100 rounded" onClick={addBlank}>
          Thêm thẻ
        </button>
      </div>
    </div>
  );
};

export default function AddWordModal({ newCards, setNewCards, setShowAddWordModal, id, onCardsCreated }) {
  const [manualOpen, setManualOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [manualEntries, setManualEntries] = useState([{ front: '', back: '', example: '' }]);

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
            <h1 className="text-2xl font-bold text-gray-900" id="add-modal-title">
              Thêm từ vựng mới
            </h1>
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
                      const parts = aiInput
                        .split(/\n|\.|,|;/)
                        .map((s) => s.trim())
                        .filter(Boolean);
                      const created = parts.map((p) => ({ front: p, back: '' }));
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

                {manualOpen && <ManualCardsEditor entries={manualEntries} setEntries={setManualEntries} />}
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
                        <button
                          className="text-sm text-red-600"
                          onClick={() => setNewCards((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          Xóa
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 p-4 md:p-6 border-t border-gray-200 sticky bottom-0 bg-white z-10">
            <button className="px-4 py-2 bg-gray-100 rounded" onClick={() => setShowAddWordModal(false)}>
              Hủy
            </button>
            <button
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={async () => {
                try {
                  const filledManual = (manualEntries || [])
                    .map((e) => ({
                      front: (e.front || '').trim(),
                      back: (e.back || '').trim(),
                      example: (e.example || '').trim(),
                    }))
                    .filter((e) => e.front);
                  
                  const combined = [...newCards, ...filledManual];
                  
                  if (combined.length === 0) {
                    alert('Vui lòng thêm ít nhất một thẻ');
                    return;
                  }

                  // Lưu từng card vào database
                  console.log('Creating cards for set', id, combined);
                  
                  for (const card of combined) {
                    await flashcardsService.createCard(id, {
                      word: card.front,
                      definition: card.back,
                      example: card.example || ''
                    });
                  }

                  // Reset state
                  setNewCards([]);
                  setManualEntries([{ front: '', back: '', example: '' }]);
                  setShowAddWordModal(false);
                  
                  // Callback để reload cards
                  if (onCardsCreated) {
                    await onCardsCreated();
                  }
                  
                  alert(`Đã thêm ${combined.length} thẻ vào bộ flashcard!`);
                } catch (error) {
                  console.error('Error creating cards:', error);
                  alert('Lỗi khi tạo thẻ: ' + error.message);
                }
              }}
            >
              Lưu bộ thẻ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
