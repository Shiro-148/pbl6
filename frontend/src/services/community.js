import { authFetch } from './auth';

export async function listPublicSets({ page = 0, size = 9, sortBy = 'id', order = 'desc' } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size), sortBy, order });
  const res = await authFetch(`/api/sets/public?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to list public sets: ${res.status}`);
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export default { listPublicSets };