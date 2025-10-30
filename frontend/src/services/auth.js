const API = import.meta.env.VITE_API_BASE || '';

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
  localStorage.setItem('jwt', token);
}

export function getToken() {
  return localStorage.getItem('jwt');
}

export function authFetch(url, opts = {}) {
  const token = getToken();
  const headers = opts.headers || {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...opts, headers });
}

export default { login, register, saveToken, getToken, authFetch };
