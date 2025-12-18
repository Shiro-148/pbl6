import { authFetch } from './auth';

export async function listFolders() {
  const res = await authFetch(`/api/folders`);
  if (!res.ok) throw new Error(`List folders failed: ${res.status}`);
  return res.json();
}

export async function createFolder(name) {
  const res = await authFetch(`/api/folders`, {
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
  const res = await authFetch(`/api/folders/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${text}`);
  }
}

export default { listFolders, createFolder, deleteFolder };