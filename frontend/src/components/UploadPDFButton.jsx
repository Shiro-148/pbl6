import React, { useImperativeHandle, useRef } from 'react';

// Simple UploadPDFButton replacement: exposes `open()` via ref and
// reads plain text files, calling `onResult({ rawText })`.
// For non-text files (e.g. PDF) it returns `{ fileName, fileType }` so
// callers can handle server-side processing if needed.
const UploadPDFButton = React.forwardRef(function UploadPDFButton({ onResult }, ref) {
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    open: () => {
      if (inputRef.current) inputRef.current.click();
    },
  }));

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return onResult && onResult(null);
    const file = files[0];
    const type = file.type || '';
    const name = file.name || 'file';

    if (type.startsWith('text') || /\.(txt|md|csv)$/i.test(name)) {
      const reader = new FileReader();
      reader.onload = () => {
        const rawText = String(reader.result || '');
        onResult && onResult({ rawText, fileName: name, fileType: type });
      };
      reader.onerror = () => onResult && onResult(null);
      reader.readAsText(file);
      return;
    }

    // Try extracting text from PDF client-side using pdfjs-dist
    if (type === 'application/pdf' || /\.pdf$/i.test(name)) {
      try {
        const arrayBuf = await file.arrayBuffer();
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf');
        // Set workerSrc for pdfjs (vite will handle bundling)
        try {
          pdfjs.GlobalWorkerOptions.workerSrc = await import('pdfjs-dist/build/pdf.worker.entry');
        } catch (e) {
          // ignore if worker import fails; pdfjs may still work
        }
        const loadingTask = pdfjs.getDocument({ data: arrayBuf });
        const pdf = await loadingTask.promise;
        let rawText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map((it) => it.str).join(' ');
          rawText += '\n' + pageText;
        }
        onResult && onResult({ rawText: rawText.trim(), fileName: name, fileType: type });
        return;
      } catch (err) {
        console.error('PDF text extraction failed:', err);
        // fallback to returning basic info
        onResult && onResult({ fileName: name, fileType: type });
        return;
      }
    }

    // For other unknown types, return basic info
    onResult && onResult({ fileName: name, fileType: type });
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,text/plain,.txt,.md,.csv"
        style={{ display: 'none' }}
        onChange={(e) => {
          handleFiles(e.target.files);
          // reset so same file can be selected again
          e.target.value = '';
        }}
      />
      <button
        type="button"
        className="btn-outline"
        onClick={() => {
          if (inputRef.current) inputRef.current.click();
        }}
      >
        Upload PDF / Text
      </button>
    </>
  );
});

export default UploadPDFButton;
