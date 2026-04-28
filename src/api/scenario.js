import { http } from './client';

/**
 * 시나리오 조회
 * @returns {{ screenplay, scenes: Scene[], episodes: Episode[] }}
 */
export const getScenario = (pid, shortId) =>
  http.get(`/api/projects/${pid}/shorts/${shortId}/scenario`);

/**
 * 씬/에피소드 부분 저장
 * @param {{ scenes?: Scene[], episodes?: Episode[], screenplay?: object }} body
 */
export const saveScenario = (pid, shortId, body) =>
  http.patch(`/api/projects/${pid}/shorts/${shortId}/scenario`, body);

/**
 * 에피소드 단건 저장
 * @param {{ title?: string, theme?: string, duration_sec?: number }} patch
 */
export const saveEpisode = (pid, shortId, episodeKey, patch) =>
  http.patch(`/api/projects/${pid}/shorts/${shortId}/scenario/episodes/${episodeKey}`, patch);

/**
 * 씬 단건 저장
 * @param {object} patch
 */
export const saveScene = (pid, shortId, sceneKey, patch) =>
  http.patch(`/api/projects/${pid}/shorts/${shortId}/scenario/scenes/${sceneKey}`, patch);

/**
 * 시나리오 재생성 (AI 재작성)
 * @param {{ notes?: string, current_scenes?: Scene[] }} [body]
 */
export const regenerateScenario = (pid, shortId, body = {}) =>
  http.post(`/api/projects/${pid}/shorts/${shortId}/scenario/regenerate`, body);

/**
 * 시나리오 확정 → 다음 단계(cast)로 이동
 * @param {{ image_model?: string }} [body]
 */
export const approveScenario = (pid, shortId, body = {}) =>
  http.post(`/api/projects/${pid}/shorts/${shortId}/scenario/approve`, {
    image_model: 'gpt-image-1',
    ...body,
  });

/**
 * 시나리오 생성 진행 SSE
 * 이벤트:
 *   { type: 'progress'|'message', message?: string, text?: string }
 *   { type: 'done' } | { done: true }
 *   { type: 'error', message: string }
 */
export const scenarioStreamSSE = (pid, shortId, onEvent, onDone) =>
  http.sse(`/api/projects/${pid}/shorts/${shortId}/scenario/stream`, onEvent, onDone);
