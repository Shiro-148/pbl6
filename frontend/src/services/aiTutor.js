const MODEL_BASE = import.meta.env.VITE_MODEL_SERVICE_BASE || (
  import.meta.env.DEV ? 'http://localhost:5000' : 'https://shiro1148-pbl6.hf.space'
);

export async function sendChat(message) {
  const res = await fetch(`${MODEL_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${text}`);
  }
  return res.json();
}

export default { sendChat };
