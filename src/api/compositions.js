import { http } from './client';

/**
 * 구도(배경+카메라) 목록 조회
 * @returns {{ compositions: Composition[] }}
 */
export const listCompositions = (pid) =>
  http.get(`/api/projects/${pid}/compositions`);

/**
 * 구도 생성
 * @param {{
 *   location_key: string,
 *   shot_size: string,
 *   angle: string,
 *   camera_movement?: string,
 *   lighting?: string,
 *   lens_style?: string,
 *   color_grade?: string,
 *   mood?: string,
 *   prompt_en?: string
 * }} body
 * @returns {Composition}
 */
export const createComposition = (pid, body) =>
  http.post(`/api/projects/${pid}/compositions`, body);

/**
 * 구도 수정 (전체 교체)
 * @param {number} compId
 * @param {object} body  createComposition와 동일한 필드
 */
export const updateComposition = (pid, compId, body) =>
  http.put(`/api/projects/${pid}/compositions/${compId}`, body);

/** 구도 삭제 */
export const deleteComposition = (pid, compId) =>
  http.del(`/api/projects/${pid}/compositions/${compId}`);
