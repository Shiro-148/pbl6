// components/ErrorModal.jsx
// A lightweight custom error modal (no browser alert/confirm)
import React from 'react';

export default function ErrorModal({ open, title = 'Lỗi', message, details, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-lg shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30">
          <h3 className="text-lg font-bold text-red-700 dark:text-red-400">{title}</h3>
        </div>
        <div className="px-5 py-4">
          {message && (
            <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
          )}
          {details && (
            <pre className="mt-3 p-3 rounded bg-slate-100 dark:bg-slate-800 text-xs overflow-auto">{details}</pre>
          )}
        </div>
        <div className="px-5 py-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            className="px-4 py-2 rounded bg-red-600 text-white font-bold"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
