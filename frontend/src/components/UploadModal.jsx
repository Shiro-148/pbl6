import React, { useState } from 'react';
import flashcardsService from '../services/flashcards';

export default function UploadModal({
  uploadEntries,
  setUploadEntries,
  setShowUploadModal,
  enrichingUpload,
  setEnrichingUpload,
  setUploadResultTitle,
  setUploadResultMessage,
  setUploadResultIsError,
  setShowUploadResult,
  id,
  onCardsCreated,
}) {
  const [saving, setSaving] = useState(false);

  return (
    <div>
      <div
        className="fixed inset-0 z-40 bg-gray-900/50"
        onClick={() => {
          setShowUploadModal(false);
          setUploadEntries([]);
        }}
      />
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
              onClick={() => {
                setShowUploadModal(false);
                setUploadEntries([]);
              }}
              aria-label="Close upload dialog"
            >
              <span className="material-symbols-outlined text-gray-600">close</span>
            </button>
          </div>

          <div className="flex-1 px-4 md:px-6 py-6">
            <div className="flex flex-col gap-4">
              {uploadEntries && uploadEntries.length > 0 && (
                <div className="mt-4 border rounded p-3 bg-white">
                  <h4 className="font-medium mb-2">Từ được nhận dạng (chỉnh sửa trước khi lưu)</h4>
                  <div className="space-y-3 max-h-60 overflow-auto">
                    {uploadEntries.map((entry, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                        <div>
                          <label className="text-sm text-gray-600 pb-1">Mặt trước</label>
                          <input
                            value={entry.front}
                            onChange={(e) => {
                              const v = e.target.value;
                              setUploadEntries((prev) => prev.map((it, i) => (i === idx ? { ...it, front: v } : it)));
                            }}
                            className="form-input rounded-lg p-2 border w-full"
                            placeholder="Mặt trước"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600 pb-1">Mặt sau</label>
                          <input
                            value={entry.back}
                            onChange={(e) => {
                              const v = e.target.value;
                              setUploadEntries((prev) => prev.map((it, i) => (i === idx ? { ...it, back: v } : it)));
                            }}
                            className="form-input rounded-lg p-2 border w-full"
                            placeholder="Mặt sau"
                          />
                        </div>

                        <div className="col-span-1 sm:col-span-2">
                          <label className="text-sm text-gray-600 pb-1">Ví dụ (tùy chọn)</label>
                          <div className="flex items-start gap-2">
                            <textarea
                              value={entry.example || ''}
                              onChange={(e) => {
                                const v = e.target.value;
                                setUploadEntries((prev) => prev.map((it, i) => (i === idx ? { ...it, example: v } : it)));
                              }}
                              className="form-input rounded-lg p-2 border w-full min-h-[80px]"
                              placeholder="Thêm câu ví dụ..."
                            />
                          </div>
                          <div className="flex flex-col justify-start">
                            <button
                              className="text-sm text-red-600 mt-1 text-right"
                              onClick={() => setUploadEntries((prev) => prev.filter((_, i) => i !== idx))}
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <button
                      className="px-3 py-1 bg-gray-100 rounded"
                      onClick={() => setUploadEntries((prev) => [...prev, { front: '', back: '', example: '' }])}
                    >
                      Thêm thẻ
                    </button>
                  </div>
                </div>
              )}
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
              onClick={async () => {
                if (!uploadEntries || uploadEntries.length === 0) {
                  setUploadResultTitle('Không có từ');
                  setUploadResultMessage('Không có từ nào được trích xuất để bổ sung định nghĩa.');
                  setUploadResultIsError(true);
                  setShowUploadResult(true);
                  return;
                }
                try {
                  setEnrichingUpload(true);
                  const sel = uploadEntries.map((e) => e.front);
                  const res = await flashcardsService.enrichWords(sel);
                  const list = res.flashcards || res.entries || res;
                  setUploadEntries((prev) => prev.map((e) => {
                    const found = list && list.find((x) => ((x.word || x.term || '') || '').toLowerCase() === (e.front || '').toLowerCase());
                    if (found) return { ...e, back: e.back || found.definition || (found.examples && found.examples[0]) || '' };
                    return e;
                  }));
                  const count = list
                    ? uploadEntries.reduce((acc, ue) => acc + (list.find((x) => ((x.word || x.term || '') || '').toLowerCase() === (ue.front || '').toLowerCase()) ? 1 : 0), 0)
                    : 0;
                  if (count) {
                    setUploadResultTitle('Hoàn tất');
                    setUploadResultMessage(`Đã bổ sung định nghĩa cho ${count} từ.`);
                    setUploadResultIsError(false);
                  } else {
                    setUploadResultTitle('Không có định nghĩa');
                    setUploadResultMessage('Không tìm thấy định nghĩa cho các từ đã trích xuất.');
                    setUploadResultIsError(true);
                  }
                  setShowUploadResult(true);
                } catch (err) {
                  console.error('Enrich upload entries failed', err);
                  setUploadResultTitle('Lỗi');
                  setUploadResultMessage('Lỗi khi bổ sung định nghĩa: ' + (err.message || err));
                  setUploadResultIsError(true);
                  setShowUploadResult(true);
                } finally {
                  setEnrichingUpload(false);
                }
              }}
              disabled={enrichingUpload}
            >
              <span className="truncate">{enrichingUpload ? 'Đang bổ sung...' : 'Bổ sung định nghĩa tự động'}</span>
            </button>
            <button
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors"
              disabled={saving}
              onClick={async () => {
                if (!uploadEntries || uploadEntries.length === 0) {
                  setUploadResultTitle('Không có dữ liệu');
                  setUploadResultMessage('Chưa có từ nào để lưu. Hãy nhập hoặc trích xuất lại.');
                  setUploadResultIsError(true);
                  setShowUploadResult(true);
                  return;
                }

                const cleaned = uploadEntries
                  .map((e) => ({
                    front: (e.front || '').trim(),
                    back: (e.back || '').trim(),
                    example: (e.example || '').trim(),
                    level: e.level,
                  }))
                  .filter((e) => e.front);

                if (cleaned.length === 0) {
                  setUploadResultTitle('Thiếu dữ liệu');
                  setUploadResultMessage('Bạn cần ít nhất một thẻ có mặt trước hợp lệ.');
                  setUploadResultIsError(true);
                  setShowUploadResult(true);
                  return;
                }

                try {
                  setSaving(true);
                  for (const card of cleaned) {
                    await flashcardsService.createCard(id, {
                      word: card.front,
                      definition: card.back,
                      example: card.example || '',
                      level: card.level,
                    });
                  }

                  setUploadResultTitle('Đã lưu flashcard');
                  setUploadResultMessage(`Đã thêm ${cleaned.length} thẻ vào bộ.`);
                  setUploadResultIsError(false);
                  setUploadEntries([]);
                  setShowUploadModal(false);
                  if (typeof onCardsCreated === 'function') {
                    await onCardsCreated();
                  }
                } catch (err) {
                  console.error('UploadModal: failed to save cards', err);
                  setUploadResultTitle('Lưu thất bại');
                  setUploadResultMessage('Không thể lưu flashcard: ' + (err.message || err));
                  setUploadResultIsError(true);
                } finally {
                  setSaving(false);
                  setShowUploadResult(true);
                }
              }}
            >
              <span className="truncate">{saving ? 'Đang lưu...' : 'Tạo Flashcard'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
