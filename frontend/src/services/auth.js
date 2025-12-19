const API = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? '/api' : 'https://pbl6-k1wm.onrender.com');
const AUTH_TOKENS_KEY = 'auth_tokens';
// Store active account per tab using sessionStorage (Gmail-style)
const CURRENT_USER_KEY = 'current_user_id';

export async function login(username, password) {
  const res = await authFetch(`/api/auth/login`, {
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
  const res = await authFetch(`/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let text = 'Registration failed';
    try {
      text = await res.text();
      if (!text) text = res.statusText || text;
    } catch {
      // ignore
    }
    const message = `${res.status} ${text}`;
    console.error('Registration error:', res.status, text);
    throw new Error(message);
  }
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function getAuthTokens() {
  try {
    const raw = localStorage.getItem(AUTH_TOKENS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setAuthTokens(obj) {
  try {
    localStorage.setItem(AUTH_TOKENS_KEY, JSON.stringify(obj || {}));
  } catch {
    // ignore
  }
}

export function setCurrentUser(userId) {
  const id = userId == null ? null : String(userId).trim();
  if (!id) {
    sessionStorage.removeItem(CURRENT_USER_KEY);
  } else {
    sessionStorage.setItem(CURRENT_USER_KEY, id);
  }
  try {
    window.dispatchEvent(new Event('auth-token-change'));
  } catch {
    // ignore
  }
}

export function getCurrentUserId() {
  const id = sessionStorage.getItem(CURRENT_USER_KEY);
  if (id && id !== 'undefined' && id !== 'null') return id;
  const legacy = localStorage.getItem(CURRENT_USER_KEY);
  return legacy && legacy !== 'undefined' && legacy !== 'null' ? legacy : null;
}

export function listAccounts() {
  const tokens = getAuthTokens();
  return Object.keys(tokens);
}

export function saveToken(token, userId) {
  const t = token == null ? null : String(token).trim();
  const id = userId == null ? null : String(userId).trim();
  if (t && id) {
    const tokens = getAuthTokens();
    tokens[id] = t;
    setAuthTokens(tokens);
    setCurrentUser(id); 
    localStorage.removeItem('jwt');
  } else {
    if (!t || t === 'null' || t === 'undefined') {
      localStorage.removeItem('jwt');
    } else {
      localStorage.setItem('jwt', t);
    }
  }
  try {
    window.dispatchEvent(new Event('auth-token-change'));
  } catch {
    // ignore
  }
}

export function getToken() {
  const current = getCurrentUserId();
  if (current) {
    const tokens = getAuthTokens();
    const t = tokens[current];
    if (t) return t;
  }
  const t = localStorage.getItem('jwt');
  return t && t !== 'null' && t !== 'undefined' ? t : null;
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
  if (!payload || typeof payload.exp !== 'number') return false;
  const nowSec = Math.floor(Date.now() / 1000);
  return payload.exp <= nowSec;
}

export function logout() {
  const current = getCurrentUserId();
  if (current) {
    const tokens = getAuthTokens();
    if (tokens[current]) {
      delete tokens[current];
      setAuthTokens(tokens);
    }
    sessionStorage.removeItem(CURRENT_USER_KEY);
    if (!Object.keys(tokens).length) {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }
  localStorage.removeItem('jwt');
  try {
    window.dispatchEvent(new Event('auth-token-change'));
  } catch {
    // ignore
  }
}

export function authFetch(url, opts = {}) {
  if (isTokenExpired()) {
    logout();
  }
  const token = getToken();
  const headers = opts.headers || {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let fullUrl;
  if (url.startsWith('http')) {
    fullUrl = url;
  } else if (API === '/api') {
    fullUrl = url.startsWith('/api') ? url : `/api${url.startsWith('/') ? '' : '/'}${url}`;
  } else {
    fullUrl = `${API}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  return fetch(fullUrl, { ...opts, headers }).then(async (res) => {
    if (res.status === 401 || res.status === 403) {
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
