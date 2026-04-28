import { http } from './client';

/**
 * 렌더링된 클립 목록 조회
 * @returns {{ clips: Clip[], progress?: string }}
 */
export const listClips = (pid, shortId) =>
  http.get(`/api/projects/${pid}/shorts/${shortId}/clips`);

/**
 * 클립 재생성
 * @param {string} [key]  특정 클립 키 (없으면 전체 재생성)
 */
export const regenerateClips = (pid, shortId, key) =>
  http.post(`/api/projects/${pid}/shorts/${shortId}/clips/regenerate`, key ? { key } : undefined);
