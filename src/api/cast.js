import { http } from './client';

/**
 * 등장인물·배경 추출 (시나리오 → DB 저장만, 이미지 생성 X)
 * @param {string} pid
 * @param {{ short_id: string, save?: boolean }} body
 */
export const extractCast = (pid, body) =>
  http.post(`/api/projects/${pid}/cast/extract`, { save: true, ...body });

/**
 * 추출 + 이미지 일괄 생성 (한 번에)
 * @param {string} pid
 * @param {{ short_id: string, model?: string }} body
 */
export const extractAndGenerate = (pid, body) =>
  http.post(`/api/projects/${pid}/cast/extract-and-generate`, {
    model: 'gpt-image-1',
    ...body,
  });

/**
 * 이미 추출된 캐릭터·배경 이미지 일괄 생성
 * @param {string} pid
 * @param {{ model?: string }} [body]
 */
export const generateAll = (pid, body = {}) =>
  http.post(`/api/projects/${pid}/cast/generate-all`, {
    model: 'gpt-image-1',
    ...body,
  });

/**
 * 캐스트 생성 진행 SSE
 * 이벤트:
 *   { type: 'character'|'location', key: string, name: string, url: string }
 *   { done: true }
 *
 * @param {string} pid
 * @param {Function} onEvent
 * @param {Function} [onError]
 */
export const castStreamSSE = (pid, onEvent, onError) =>
  http.sse(`/api/projects/${pid}/cast/stream`, onEvent, onError);

/**
 * 숏츠 캐스트 승인 → 영상 생성 단계로 이동
 * @param {string} pid
 * @param {string} shortId
 * @param {{ video_model?: string }} [body]
 */
export const approveCast = (pid, shortId, body = {}) =>
  http.post(`/api/projects/${pid}/shorts/${shortId}/cast/approve`, {
    video_model: 'fal-ai/kling-video/v2.1/standard/image-to-video',
    ...body,
  });

/**
 * 숏츠에 연결된 캐스트 목록 조회
 * @param {string} pid
 * @param {string} shortId
 * @returns {{ characters: Character[], locations?: Location[] }}
 */
export const getShortCast = (pid, shortId) =>
  http.get(`/api/projects/${pid}/shorts/${shortId}/cast`);
