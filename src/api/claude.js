const BASE = import.meta.env.DEV
  ? '/api'
  : `${import.meta.env.VITE_API_BASE_URL ?? ''}/api`;

const authHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Claude 채팅 SSE (POST + ReadableStream)
 * 이벤트:
 *   { type: 'message', text: string }
 *   { type: 'done' }
 *   { type: 'error', message: string }
 *
 * @param {{ message: string, history: {role:string, content:string}[], system?: string }} body
 * @param {(obj: object) => void} onChunk
 * @param {AbortSignal} [signal]
 */
export const chatSSE = async (body, onChunk, signal) => {
  const res = await fetch(`${BASE}/claude/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const parts = buf.split('\n\n');
    buf = parts.pop();
    for (const part of parts) {
      const line = part.replace(/^data:\s*/, '').trim();
      if (!line) continue;
      try { onChunk(JSON.parse(line)); } catch { /* 파싱 불가 라인은 무시 — 불완전한 청크 방어 */ }
    }
  }
};
