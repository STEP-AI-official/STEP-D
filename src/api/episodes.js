import { http } from './client';

/**
 * 에피소드 목록 조회 (씬 포함)
 * @returns {{ episodes: Episode[] }}
 */
export const getEpisodes = (pid, shortId) =>
  http.get(`/api/projects/${pid}/shorts/${shortId}/episodes`);

/**
 * 에피소드 단건 수정
 * @param {{ title?: string, theme?: string }} patch
 */
export const updateEpisode = (pid, shortId, episodeKey, patch) =>
  http.patch(`/api/projects/${pid}/shorts/${shortId}/episodes/${episodeKey}`, patch);

/**
 * 에피소드 추가
 * @param {{ episode_key?: string, title?: string, theme?: string }} body
 */
export const createEpisode = (pid, shortId, body = {}) =>
  http.post(`/api/projects/${pid}/shorts/${shortId}/episodes`, body);

/**
 * 에피소드 삭제
 */
export const deleteEpisode = (pid, shortId, episodeKey) =>
  http.del(`/api/projects/${pid}/shorts/${shortId}/episodes/${episodeKey}`);
