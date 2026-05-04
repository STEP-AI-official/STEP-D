import { http } from './client';

/**
 * 씬의 컷 목록 조회
 * @param {string} sceneKey
 * @returns {{ cuts: Cut[] }}
 */
export const listCuts = (pid, shortId, sceneKey) =>
  http.get(`/api/projects/${pid}/shorts/${shortId}/cuts?scene_key=${encodeURIComponent(sceneKey)}`);

/**
 * 컷 생성
 * @param {{
 *   scene_key: string,
 *   cut_order: number,
 *   subject?: string,
 *   action?: string,
 *   char_keys?: string[],
 *   composition_id?: number | null,
 *   duration_sec?: number
 * }} body
 * @returns {Cut}
 */
export const createCut = (pid, shortId, body) =>
  http.post(`/api/projects/${pid}/shorts/${shortId}/cuts`, body);

/**
 * 컷 단건 조회
 * @returns {Cut}
 */
export const getCut = (pid, shortId, cutKey) =>
  http.get(`/api/projects/${pid}/shorts/${shortId}/cuts/${cutKey}`);

/**
 * 컷 수정
 * @param {{
 *   subject?: string,
 *   action?: string,
 *   char_keys?: string[],
 *   composition_id?: number | null,
 *   duration_sec?: number,
 *   shot_size?: string,
 *   angle?: string,
 *   camera_movement?: string,
 *   camera_speed?: string,
 * }} patch
 */
export const updateCut = (pid, shortId, cutKey, patch) =>
  http.patch(`/api/projects/${pid}/shorts/${shortId}/cuts/${cutKey}`, patch);

/**
 * 카메라 구도 옵션 카탈로그 조회 (드롭다운용).
 * 각 항목은 { value, label_ko, label_en }. value=""는 자동(AI 추천).
 * @returns {{
 *   shot_size:        Array<{value:string,label_ko:string,label_en:string}>,
 *   angle:            Array<{value:string,label_ko:string,label_en:string}>,
 *   camera_movement:  Array<{value:string,label_ko:string,label_en:string}>,
 *   speed:            Array<{value:string,label_ko:string,label_en:string}>,
 *   structured_camera_keys: string[],
 * }}
 */
export const getCameraOptions = () => http.get('/api/camera/options');

/** 컷 삭제 */
export const deleteCut = (pid, shortId, cutKey) =>
  http.del(`/api/projects/${pid}/shorts/${shortId}/cuts/${cutKey}`);

/**
 * 컷 이미지 생성
 * @param {{
 *   char_image_paths?: string[],
 *   background_image_path?: string | null,
 *   composition_id?: number | null
 * }} body
 */
export const generateCutImage = (pid, shortId, cutKey, body) =>
  http.post(`/api/projects/${pid}/shorts/${shortId}/cuts/${cutKey}/generate`, body);
