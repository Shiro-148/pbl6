import React, { useState, useEffect } from 'react';

export default function CreateSetDialog({ open, onClose, folders = [], onCreate, initial = null, submitLabel, titleLabel }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [folder, setFolder] = useState('');
  const [access, setAccess] = useState('public');

  useEffect(() => {
    if (open) {
      // initialize when opening
      setName((initial && (initial.name || initial.title)) || '');
      setDescription((initial && initial.description) || '');
      setFolder((initial && initial.folderId) || '');
      setAccess((initial && initial.access) || 'public');
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { name, description, folder, access };
    if (onCreate) onCreate(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative bg-background-light dark:bg-background-dark rounded-xl shadow-2xl w-full max-w-lg "
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg">
              <span className="material-symbols-outlined text-indigo-500 dark:text-indigo-400" style={{ fontSize: 24 }}>
                add
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{titleLabel || 'Tạo bộ flashcard mới'}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full p-1.5"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
              close
            </span>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
          <div>
            <label
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              htmlFor="flashcard-name"
            >
              Tên bộ flashcard <span className="text-red-500">*</span>
            </label>
            <input
              id="flashcard-name"
              name="flashcard-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:ring-primary focus:border-primary dark:focus:ring-indigo-500 dark:focus:border-indigo-500 text-slate-900 dark:text-slate-50 px-3 py-2"
              placeholder="Ví dụ: Từ vựng TOEIC cơ bản"
              type="text"
              required
            />
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Đặt tên mô tả rõ ràng để dễ tìm kiếm sau này
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="description">
                Mô tả
              </label>
              <span className="text-xs text-slate-400 dark:text-slate-500">{description.length}/200</span>
            </div>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              className="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:ring-primary focus:border-primary dark:focus:ring-indigo-500 dark:focus:border-indigo-500 resize-none text-slate-900 dark:text-slate-50 px-3 py-2"
              rows={3}
              placeholder="Mô tả ngắn gọn về nội dung bộ flashcard này..."
            />
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Mô tả giúp người khác hiểu rõ hơn về nội dung
            </p>
          </div>

          <div>
            <label
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              htmlFor="folder-select"
            >
              Thêm vào thư mục (tùy chọn)
            </label>
            <div className="relative">
              <select
                id="folder-select"
                name="folder"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-lg focus:ring-primary focus:border-primary dark:focus:ring-indigo-500 dark:focus:border-indigo-500 text-slate-900 dark:text-slate-50 appearance-none pl-4 pr-10 py-2.5"
              >
                <option value="">Chọn một thư mục</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
                <option value="new">Tạo thư mục mới...</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 dark:text-slate-400">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  unfold_more
                </span>
              </div>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Sắp xếp các bộ flashcard vào các thư mục để dễ quản lý.
            </p>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Quyền truy cập</label>
            <div>
              <label
                className={`flex items-start gap-4 p-4 rounded-lg cursor-pointer ${
                  access === 'public'
                    ? 'border-2 border-primary bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-primary'
                    : 'border-2 border-slate-300 dark:border-slate-600'
                }`}
                onClick={() => setAccess('public')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setAccess('public');
                }}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="access"
                  value="public"
                  checked={access === 'public'}
                  onChange={() => setAccess('public')}
                />
                <div
                  className={`mt-1 w-5 h-5 flex items-center justify-center rounded-full ${
                    access === 'public' ? 'border-2 border-primary' : 'border-2 border-slate-400'
                  }`}
                >
                  <div
                    className={`${
                      access === 'public' ? 'w-2.5 h-2.5 bg-primary' : 'w-2.5 h-2.5 bg-transparent'
                    } rounded-full`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-medium">
                    <span
                      className="material-symbols-outlined text-green-600 dark:text-green-400"
                      style={{ fontSize: 20 }}
                    >
                      public
                    </span>
                    <span>Công khai</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Mọi người có thể tìm thấy và sử dụng bộ flashcard này
                  </p>
                </div>
              </label>
            </div>
            <div>
              <label
                className={`flex items-start gap-4 p-4 rounded-lg cursor-pointer ${
                  access === 'private'
                    ? 'border-2 border-primary bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-primary'
                    : 'border-2 border-slate-300 dark:border-slate-600'
                }`}
                onClick={() => setAccess('private')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setAccess('private');
                }}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="access"
                  value="private"
                  checked={access === 'private'}
                  onChange={() => setAccess('private')}
                />
                <div
                  className={`mt-1 w-5 h-5 flex items-center justify-center rounded-full ${
                    access === 'private' ? 'border-2 border-primary' : 'border-2 border-slate-400'
                  }`}
                >
                  <div
                    className={`${
                      access === 'private' ? 'w-2.5 h-2.5 bg-primary' : 'w-2.5 h-2.5 bg-transparent'
                    } rounded-full`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-medium">
                    <span
                      className="material-symbols-outlined text-orange-600 dark:text-orange-400"
                      style={{ fontSize: 20 }}
                    >
                      lock
                    </span>
                    <span>Riêng tư</span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center gap-3 p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-indigo-500 transition-colors"
          >
            {submitLabel || 'Tạo flashcard'}
          </button>
        </div>
      </form>
    </div>
  );
}
