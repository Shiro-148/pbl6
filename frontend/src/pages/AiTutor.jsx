import React, { useState, useEffect, useRef } from 'react';
import '../styles/pages/AiTutor.css';

const AiTutor = () => {
  const sanitizeText = (text) => {
    if (!text || typeof text !== 'string') return text;
    return text
      .replace(/\*\*([\s\S]*?)\*\*/g, '$1')
      .replace(/\*([\s\S]*?)\*/g, '$1');
  };

  const [messages, setMessages] = useState([
    { role: 'ai', text: sanitizeText('Xin chào! Mình là trợ lý học từ vựng. Gõ một từ hoặc câu hỏi để bắt đầu.') },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    const text = (input || '').trim();
    if (!text) return;
    const userMsg = { role: 'user', text };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setSending(true);
    try {
      const MODEL_BASE = import.meta.env.VITE_MODEL_SERVICE_BASE || (import.meta.env.DEV ? 'http://localhost:5000' : 'https://shiro1148-pbl6.hf.space');
      const res = await fetch(`${MODEL_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
  const data = await res.json();
  const rawReply = (data && data.reply) ? data.reply : 'Xin lỗi, không có phản hồi.';
  const reply = sanitizeText(rawReply);
  setMessages((m) => [...m, { role: 'ai', text: reply }]);
    } catch (err) {
      console.error('chat error', err);
      setMessages((m) => [...m, { role: 'ai', text: 'Lỗi: không thể kết nối tới dịch vụ AI.' }]);
    } finally {
      setSending(false);
    }
  };

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
