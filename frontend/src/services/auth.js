// Use VITE_API_BASE if provided, otherwise default to localhost backend for dev
const API = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export async function login(username, password) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    let text = 'Login failed';
    try {
      text = await res.text();
      if (!text) text = res.statusText || text;
    } catch {
      // ignore
    }
    console.error('Login error:', res.status, text);
    throw new Error(`${res.status} ${text}`);
  }
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function register(username, password, email, displayName) {
  const body = { username, password };
  if (email) body.email = email;
  if (displayName) body.displayName = displayName;
  const res = await fetch(`${API}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    // try to read response body for a useful error message
    let text = 'Registration failed';
    try {
      text = await res.text();
      if (!text) text = res.statusText || text;
    } catch {
      // ignore
    }
    // include HTTP status for debugging
    const message = `${res.status} ${text}`;
    // log to console for dev
    console.error('Registration error:', res.status, text);
    throw new Error(message);
  }
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export function saveToken(token) {
  const t = token == null ? null : String(token).trim();
  if (!t || t === 'null' || t === 'undefined') {
    localStorage.removeItem('jwt');
  } else {
    localStorage.setItem('jwt', t);
  }
  try {
    window.dispatchEvent(new Event('auth-token-change'));
  } catch {
    // ignore dispatch errors in non-browser contexts
  }
}

export function getToken() {
  const t = localStorage.getItem('jwt');
  if (!t || t === 'null' || t === 'undefined') return null;
  return t;
}

function parseJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  } catch {
    return null;
  }
}

export function isTokenExpired() {
  const token = getToken();
  if (!token) return true;
  const payload = parseJwt(token);
  if (!payload || typeof payload.exp !== 'number') return false; // không có exp thì tạm coi là chưa hết hạn
  const nowSec = Math.floor(Date.now() / 1000);
  return payload.exp <= nowSec;
}

export function logout() {
  localStorage.removeItem('jwt');
  try {
    window.dispatchEvent(new Event('auth-token-change'));
  } catch {}
}

export function authFetch(url, opts = {}) {
  // Nếu token hết hạn, đăng xuất trước khi gọi
  if (isTokenExpired()) {
    logout();
  }
  const token = getToken();
  const headers = opts.headers || {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...opts, headers }).then(async (res) => {
    if (res.status === 401 || res.status === 403) {
      // Nếu server báo không hợp lệ/quyền hạn, đăng xuất để buộc phiên mới
      logout();
    }
    return res;
  });
}

export default { login, register, saveToken, getToken, authFetch, isTokenExpired, logout };

try {
  window.dispatchEvent(new Event('auth-token-change'));
} catch {
  // ignore
}
