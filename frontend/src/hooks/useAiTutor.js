// hooks/useAiTutor.js
import { useState } from 'react';
import { sendChat } from '../services/aiTutor';

function sanitizeText(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/\*\*([\s\S]*?)\*\*/g, '$1')
    .replace(/\*([\s\S]*?)\*/g, '$1');
}

export function useAiTutor() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: sanitizeText('Xin chào! Mình là trợ lý học từ vựng. Gõ một từ hoặc câu hỏi để bắt đầu.') },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const sendMessage = async () => {
    const text = (input || '').trim();
    if (!text) return;
    const userMsg = { role: 'user', text };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setSending(true);
    try {
      const data = await sendChat(text);
      const rawReply = data && data.reply ? data.reply : 'Xin lỗi, không có phản hồi.';
      const reply = sanitizeText(rawReply);
      setMessages((m) => [...m, { role: 'ai', text: reply }]);
    } catch (err) {
      console.error('chat error', err);
      setMessages((m) => [...m, { role: 'ai', text: 'Lỗi: không thể kết nối tới dịch vụ AI.' }]);
    } finally {
      setSending(false);
    }
  };

  return { messages, setMessages, input, setInput, sending, sendMessage };
}

export default useAiTutor;
