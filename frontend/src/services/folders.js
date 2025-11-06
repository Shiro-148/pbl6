import { authFetch } from './auth';

// Use VITE_API_BASE if provided, otherwise default to localhost backend for dev
const API = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export async function listFolders() {
  const res = await authFetch(`${API}/api/folders`);
  if (!res.ok) throw new Error(`List folders failed: ${res.status}`);
  return res.json();
}

export async function createFolder(name) {
  const res = await authFetch(`${API}/api/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${text}`);
  }
  return res.json();
}

export async function deleteFolder(id) {
  const res = await authFetch(`${API}/api/folders/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${text}`);
  }
}

export default { listFolders, createFolder, deleteFolder };