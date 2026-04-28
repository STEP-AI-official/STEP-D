import { http } from './client';

/**
 * 숏츠 생성
 * @param {string} pid  프로젝트 ID
 * @param {{ title: string, preproduction_doc: object }} body
 */
export const createShort = (pid, body) =>
  http.post(`/api/projects/${pid}/shorts`, body);

/** 숏츠 단건 조회 */
export const getShort = (pid, shortId) =>
  http.get(`/api/projects/${pid}/shorts/${shortId}`);

/** 숏츠 진행 상태 SSE
 * 이벤트: { status, stage, ... }
 */
export const shortProgressSSE = (pid, shortId, onEvent, onError) =>
  http.sse(`/api/projects/${pid}/shorts/${shortId}/progress`, onEvent, onError);
