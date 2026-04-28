/** 기본 HTTP 클라이언트 — Vite proxy: /api → http://localhost:8766 */
const BASE = '/api';
const norm = (path) => BASE + path.replace(/^\/api/, '');

const authHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const http = {
  async get(path) {
    const r = await fetch(norm(path), { headers: authHeaders() });
    if (!r.ok) throw new Error(`GET ${path} → ${r.status}`);
    return r.json();
  },
  async post(path, body) {
    const r = await fetch(norm(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!r.ok) throw new Error(`POST ${path} → ${r.status}`);
    return r.json();
  },
  async patch(path, body) {
    const r = await fetch(norm(path), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`PATCH ${path} → ${r.status}`);
    return r.json();
  },
  async put(path, body) {
    const r = await fetch(norm(path), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`PUT ${path} → ${r.status}`);
    return r.json();
  },
  async del(path) {
    const r = await fetch(norm(path), { method: 'DELETE', headers: authHeaders() });
    if (!r.ok) throw new Error(`DELETE ${path} → ${r.status}`);
    return r.json();
  },
  /**
   * SSE 연결
   * @param {string} path
   * @param {(obj: object) => void} onEvent
   * @param {(e: Event) => void} [onError]
   * @returns {EventSource}
   */
  sse(path, onEvent, onError) {
    const token = localStorage.getItem('auth_token');
    const url = token ? `${norm(path)}${path.includes('?') ? '&' : '?'}token=${token}` : norm(path);
    const es = new EventSource(url);
    es.onmessage = (e) => {
      try { onEvent(JSON.parse(e.data)); }
      catch { onEvent({ type: 'message', message: e.data }); }
    };
    es.onerror = (e) => { if (onError) onError(e); es.close(); };
    return es;
  },
  /** 미디어 자산 URL 생성 */
  mediaUrl(projectId, filePath) {
    return `${BASE}/media/${projectId}/${filePath}`;
  },
};
