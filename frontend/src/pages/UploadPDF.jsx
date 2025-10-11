import React, { useRef } from 'react';
const UploadPDF = () => {
  const fileRef = useRef();
  return (
    <div className="page-container">
      <h2>Upload PDF & Tạo Flashcard AI</h2>
      <form className="form-upload">
        <input type="file" accept="application/pdf" ref={fileRef} />
        <button type="button" onClick={() => fileRef.current && fileRef.current.click()}>
          Chọn file PDF
        </button>
      </form>
      {/* Kết quả xử lý sẽ hiển thị ở đây */}
      <div className="ai-result">(Kết quả AI sẽ hiển thị ở đây)</div>
    </div>
  );
};
export default UploadPDF;
