import { http } from './client';

export const getEditorState  = (pid, sid)        => http.get(`/api/projects/${pid}/shorts/${sid}/editor`);
export const putEditorState  = (pid, sid, state) => http.put(`/api/projects/${pid}/shorts/${sid}/editor`, state);
export const transcribeClip  = (pid, sid, video_key) =>
  http.post(`/api/projects/${pid}/shorts/${sid}/editor/transcribe`, { video_key });
export const startRender     = (pid, sid, state) =>
  http.post(`/api/projects/${pid}/shorts/${sid}/editor/render`, { state });
export const getRenderStatus = (pid, sid, jobId) =>
  http.get(`/api/projects/${pid}/shorts/${sid}/editor/render/${jobId}`);

export const uploadClip = async (pid, sid, file) => {
  const token = localStorage.getItem('auth_token');
  const form  = new FormData();
  form.append('file', file);
  const base = import.meta.env.VITE_API_BASE_URL || '';
  const res  = await fetch(`${base}/api/projects/${pid}/shorts/${sid}/editor/upload`, {
    method:  'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body:    form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};
