import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { getToken } from '../services/auth';

const UploadPDFButton = forwardRef(({ onResult, className, style, buttonLabel }, ref) => {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleClick = () => inputRef.current && inputRef.current.click();

  useImperativeHandle(ref, () => ({
    open: () => handleClick(),
  }));

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);

      // Use explicit API base (VITE_API_BASE) to avoid relying on dev-server proxy
      const API = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
      const token = getToken();
      if (!token) {
        // immediate user-friendly message instead of letting the request fail with 403
        throw new Error('Bạn cần đăng nhập trước khi upload PDF. Vui lòng đăng nhập rồi thử lại.');
      }

      const headers = { Authorization: `Bearer ${token}` };

      const res = await fetch(`${API}/api/pdf/upload`, {
        method: 'POST',
        body: form,
        headers,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText || '');
        const message = txt || `Upload failed (${res.status})`;
        // surface 403 specifically to help debugging authentication issues
        if (res.status === 403 || res.status === 401) {
          throw new Error('Upload bị từ chối: ' + message + '. Hãy kiểm tra quyền hoặc token.');
        }
        throw new Error(message || 'Upload failed');
      }

      const data = await res.json();
      // data expected { rawText, wordCountEstimate }
      onResult && onResult(data);
    } catch (err) {
      console.error('Upload error', err);
      alert('Không thể upload file PDF: ' + err.message);
    } finally {
      setLoading(false);
      e.target.value = null; // reset input
    }
  };

  return (
    <>
      <button className={className || 'btn-import'} type="button" onClick={handleClick} disabled={loading} style={style}>
        <i className="bx bxs-file-pdf" style={{ fontSize: '1.2em', marginRight: '8px' }}></i>
        {loading ? (buttonLabel || 'Đang tải...') : (buttonLabel || 'Nhập từ PDF')}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </>
  );
});

export default UploadPDFButton;
