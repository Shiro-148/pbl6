import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authFetch } from '../services/auth';
import { listCards } from '../services/flashcards';

export default function FlashcardSetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [setMeta, setSetMeta] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="p-6">Loading...</div>;

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
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white p-4 rounded-xl flex justify-between items-center border border-gray-200 shadow-sm"
            >
              <div>
                <p
                  className={`text-sm font-medium ${
                    item.color === 'slate' ? 'text-slate-500' : `text-${item.color}-600`
                  }`}
                >
                  {item.label}
                </p>
                <p
                  className={`text-3xl font-bold ${
                    item.color === 'slate' ? '' : `text-${item.color}-600`
                  }`}
                >
                  {item.count}
                </p>
              </div>
              <div
                className={`p-3 bg-${item.color}-100 rounded-lg`}
              >
                <span
                  className={`material-symbols-outlined text-2xl text-${item.color}-600`}
                >
                  {item.icon}
                </span>
              </div>
            </div>
          ))}
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
            onClick={() => navigate(`/create-flashcard?setId=${id}`)}
            className="w-full sm:w-auto flex-grow bg-primary hover:bg-violet-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm shadow-sm"
          >
            <span className="material-symbols-outlined">add</span>
            THÊM TỪ VỰNG
          </button>

          <button className="w-full sm:w-auto flex-grow bg-slate-50 hover:bg-gray-200 text-slate-900 font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm border border-gray-300">
            <span className="material-symbols-outlined">model_training</span>
            LUYỆN TẬP
          </button>
        </div>

        {/* Empty / summary */}
        <div className="text-center py-24 px-6 bg-slate-50 rounded-xl">
          <span className="material-symbols-outlined text-6xl text-slate-400 mb-4">inbox</span>
          <h2 className="text-xl font-semibold text-slate-900">
            {cards.length
              ? `Có ${cards.length} từ trong flashcard này`
              : 'Không có từ vựng nào trong flashcard này'}
          </h2>
          <p className="text-slate-500 mt-2">
            {cards.length
              ? 'Bắt đầu ôn tập để cải thiện kết quả.'
              : 'Bạn hãy bấm vào nút thêm từ vựng để học nhé.'}
          </p>
        </div>
      </div>
    </div>
  );
}
