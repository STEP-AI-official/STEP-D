const BASE = import.meta.env.DEV
  ? '/api/admin'
  : `${import.meta.env.VITE_API_BASE_URL}/api/admin`;

const req = async (method, path, body) => {
  const r = await fetch(BASE + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    const msg = await r.text().catch(() => r.statusText);
    throw new Error(`${method} ${path} → ${r.status}: ${msg}`);
  }
  return r.json();
};

export const api = {
  get:    (path)        => req('GET',    path),
  post:   (path, body)  => req('POST',   path, body),
  put:    (path, body)  => req('PUT',    path, body),
  del:    (path)        => req('DELETE', path),
};
