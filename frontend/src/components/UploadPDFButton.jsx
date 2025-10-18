import React, { useRef, useState } from 'react';

const UploadPDFButton = ({ onResult }) => {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleClick = () => inputRef.current && inputRef.current.click();

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);

      const res = await fetch('/api/pdf/upload', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Upload failed');
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
      <button className="btn-import" type="button" onClick={handleClick} disabled={loading}>
        <i className="bx bxs-file-pdf" style={{ fontSize: '1.2em', marginRight: '8px' }}></i>
        {loading ? 'Đang tải...' : 'Nhập từ PDF'}
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
};

export default UploadPDFButton;
