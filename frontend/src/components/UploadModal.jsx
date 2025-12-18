import React, { useState } from 'react';
import flashcardsService from '../services/flashcards';
import { joinExamples } from '../utils/examples';

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
  const [examplePromptTargets, setExamplePromptTargets] = useState([]);
  const [showExamplePrompt, setShowExamplePrompt] = useState(false);
  const [examplesLoading, setExamplesLoading] = useState(false);
  const [examplesError, setExamplesError] = useState('');

  const pickVietnameseDefinition = (source) => {
    if (!source) return '';
    const direct = (source.definition_vi || source.definitionVi || '').trim();
    if (direct) return direct;

    const combined = (source.definition || '').trim();
    if (!combined) return '';

    if (combined.includes('•')) {
      const parts = combined
        .split('•')
        .map((part) => part.trim())
        .filter(Boolean);
      if (parts.length) {
        const last = parts[parts.length - 1];
        if (last) return last;
      }
    }

    return combined;
  };

  const normalizeExamples = (value) => joinExamples(value || '');

  const showExamplesPromptIfNeeded = (targets) => {
    if (targets.length) {
      setExamplePromptTargets(targets);
      setShowExamplePrompt(true);
    } else {
      setExamplePromptTargets([]);
      setShowExamplePrompt(false);
    }
  };

  const handleAutoExamples = async () => {
    if (!examplePromptTargets.length) {
      setShowExamplePrompt(false);
      return;
    }

    setExamplesLoading(true);
    setExamplesError('');
    const successUpdates = [];
    const failedWords = [];

    try {
      for (const target of examplePromptTargets) {
        const word = target?.word?.trim();
        if (!word) continue;
        try {
          const info = await flashcardsService.generateWordInfo(word);
          const exampleText = normalizeExamples(info?.examples || info?.example);
          if (exampleText) {
            successUpdates.push({ word, example: exampleText });
          } else {
            failedWords.push(word);
          }
        } catch (err) {
          console.error('Auto example failed for', word, err);
          failedWords.push(word);
        }
      }

      if (successUpdates.length) {
        setUploadEntries((prev) =>
          prev.map((entry) => {
            const entryWord = (entry.front || '').trim().toLowerCase();
            const match = successUpdates.find((item) => item.word.toLowerCase() === entryWord);
            if (match) {
              return { ...entry, example: match.example };
            }
            return entry;
          }),
        );
      }

      const successMsg = successUpdates.length
        ? `Đã thêm ví dụ cho ${successUpdates.length} từ.`
        : 'Không tìm được ví dụ phù hợp.';
      const failMsg = failedWords.length ? ` Không thể tạo ví dụ cho: ${failedWords.join(', ')}.` : '';

      setUploadResultTitle?.(
        successUpdates.length ? 'Đã bổ sung ví dụ' : 'Không thể bổ sung ví dụ',
      );
      setUploadResultMessage?.(successMsg + failMsg);
      setUploadResultIsError?.(successUpdates.length === 0);
      setShowUploadResult?.(true);
      setExamplesError(failedWords.length ? failMsg.trim() : '');
    } finally {
      setExamplesLoading(false);
      setShowExamplePrompt(false);
      setExamplePromptTargets([]);
    }
  };

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
          className="w-full max-w-7xl mx-auto max-h-[95vh] overflow-hidden flex flex-col bg-white rounded-xl shadow-2xl"
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

          <div className="flex-1 px-4 md:px-6 py-4 overflow-auto">
            <div className="flex flex-col gap-4">
              {uploadEntries && uploadEntries.length > 0 && (
                <div className="mt-4 border rounded p-3 bg-white">
                  <h4 className="font-medium mb-2">Từ được nhận dạng (chỉnh sửa trước khi lưu)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-[45vh] overflow-auto">
                    {uploadEntries.map((entry, idx) => (
                      <div key={idx} className="rounded-lg border p-3 bg-white flex flex-col gap-2">
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
                        <div>
                          <label className="text-sm text-gray-600 pb-1">Ví dụ (tùy chọn)</label>
                          <textarea
                            value={entry.example || ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              setUploadEntries((prev) => prev.map((it, i) => (i === idx ? { ...it, example: v } : it)));
                            }}
                            className="form-input rounded-lg p-2 border w-full min-h-[56px]"
                            placeholder="Thêm câu ví dụ..."
                          />
                          <div className="flex justify-end">
                            <button
                              className="text-sm text-red-600 mt-1"
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
                  const matchedWords = [];
                  const updatedEntries = uploadEntries.map((entry) => {
                    const entryWord = (entry.front || '').toLowerCase();
                    const found =
                      list &&
                      list.find(
                        (x) => ((x.word || x.term || '') || '').toLowerCase() === entryWord,
                      );
                    if (found) {
                      matchedWords.push(entry.front || found.word || found.term || '');
                      const vietnameseDefinition = pickVietnameseDefinition(found);
                      return {
                        ...entry,
                        back:
                          entry.back ||
                          vietnameseDefinition ||
                          found.definition ||
                          (found.examples && found.examples[0]) ||
                          '',
                      };
                    }
                    return entry;
                  });
                  setUploadEntries(updatedEntries);

                  const count = matchedWords.length;
                  if (count) {
                    setUploadResultTitle('Hoàn tất');
                    setUploadResultMessage(`Đã bổ sung định nghĩa cho ${count} từ.`);
                    setUploadResultIsError(false);
                    showExamplesPromptIfNeeded(
                      matchedWords.map((word) => ({ word })),
                    );
                  } else {
                    setUploadResultTitle('Không có định nghĩa');
                    setUploadResultMessage('Không tìm thấy định nghĩa cho các từ đã trích xuất.');
                    setUploadResultIsError(true);
                    showExamplesPromptIfNeeded([]);
                  }
                  setShowUploadResult(true);
                } catch (err) {
                  console.error('Enrich upload entries failed', err);
                  setUploadResultTitle('Lỗi');
                  setUploadResultMessage('Lỗi khi bổ sung định nghĩa: ' + (err.message || err));
                  setUploadResultIsError(true);
                  showExamplesPromptIfNeeded([]);
                  setShowUploadResult(true);
                } finally {
                  setEnrichingUpload(false);
                }
              }}
              disabled={enrichingUpload}
            >
              <span className="flex items-center gap-2">
                {enrichingUpload && <span className="enrich-spinner" aria-hidden="true" />}
                <span className="truncate">{enrichingUpload ? 'Đang bổ sung...' : 'Bổ sung định nghĩa tự động'}</span>
              </span>
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

      {showExamplePrompt && (
        <div className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Bổ sung ví dụ</p>
                <h3 className="text-2xl font-semibold text-slate-900">Định nghĩa đã được thêm</h3>
                <p className="text-slate-600 mt-1">
                  Bạn có muốn Gemini tự động tạo ví dụ cho {examplePromptTargets.length} từ vừa được bổ sung
                  định nghĩa?
                </p>
                {examplesError && (
                  <p className="text-sm text-red-600 mt-2">{examplesError}</p>
                )}
              </div>
              <button
                className="text-slate-400 hover:text-slate-600"
                onClick={() => {
                  if (!examplesLoading) {
                    setShowExamplePrompt(false);
                    setExamplePromptTargets([]);
                  }
                }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
                onClick={() => {
                  setShowExamplePrompt(false);
                  setExamplePromptTargets([]);
                }}
                disabled={examplesLoading}
              >
                Để sau
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold shadow hover:bg-violet-700 disabled:opacity-60"
                onClick={handleAutoExamples}
                disabled={examplesLoading}
              >
                {examplesLoading ? 'Đang tạo...' : 'Tự động thêm ví dụ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
