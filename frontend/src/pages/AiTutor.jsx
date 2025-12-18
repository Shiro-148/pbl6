import React, { useEffect, useRef } from 'react';
import '../styles/pages/AiTutor.css';
import { useAiTutor } from '../hooks/useAiTutor';

const AiTutor = () => {
  const { messages, input, setInput, sending, sendMessage } = useAiTutor();
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="ai-tutor-wrapper">
      <h2>AI Tutor</h2>
      <p>Trò chuyện với AI để hiểu nghĩa, ví dụ câu, hoặc luyện tập dùng từ.</p>

      <div ref={listRef} className="chat-list">
        {messages.map((m, i) => (
          <div key={i} className={`chat-message ${m.role === 'user' ? 'user' : 'ai'}`}>
            <div className="chat-meta">{m.role === 'user' ? 'Bạn' : 'AI'}</div>
            <div className="chat-bubble">{m.text}</div>
          </div>
        ))}
      </div>

      <div className="chat-controls">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Nhập từ hoặc câu hỏi... (Enter để gửi)"
          className="chat-input"
        />
        <button
          className="btn-main send-button"
          onClick={sendMessage}
          disabled={sending}
          aria-label="Gửi tin nhắn"
        >
          {sending ? (
            <span className="spinner" aria-hidden="true" />
          ) : (
            <i className="bx bx-paper-plane" aria-hidden="true"></i>
          )}
        </button>
      </div>
      <div className="chat-hint">
        <small>Gợi ý: thử "explain 'destination'", hoặc "give me example sentences for 'apple'".</small>
      </div>
    </div>
  );
};

export default AiTutor;
