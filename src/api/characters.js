import { http } from './client';

/**
 * 프로젝트 캐릭터 목록 조회
 * @returns {{ characters: Character[] }}
 */
export const listCharacters = (pid) =>
  http.get(`/api/projects/${pid}/characters`);

/**
 * 캐릭터 생성 (새 캐릭터 추가)
 * @param {string} pid
 * @param {{ name_ko: string, role_ko: string, avatar_config?: object }} body
 * @returns {{ id, char_key, ... }}
 */
export const createCharacter = (pid, body) =>
  http.post(`/api/projects/${pid}/characters/generate`, body);

/**
 * 캐릭터 외모 정보 저장 (PATCH)
 * @param {string} pid
 * @param {string} charKey
 * @param {{
 *   name_ko?: string,
 *   role_ko?: string,
 *   appearance?: {
 *     age?, gender?, ethnicity?, hair?, face?,
 *     eyes?, outfit?, body_type?, expression?,
 *     style_ref?, extra?: string
 *   },
 *   avatar_config?: object
 * }} body
 */
export const updateCharacter = (pid, charKey, body) =>
  http.patch(`/api/projects/${pid}/characters/${charKey}`, body);

/**
 * 아바타 스타일 → 외모 설명 텍스트 생성 (LLM)
 * @param {string} pid
 * @param {string} charKey
 * @param {{ avatar_style: object, name_ko?: string, role_ko?: string, age_ko?: string }} body
 * @returns {{ appearance_ko?: string, appearance_en?: object }}
 */
export const describeCharacter = (pid, charKey, body) =>
  http.post(`/api/projects/${pid}/characters/${charKey}/describe`, body);

/**
 * 캐릭터 이미지 생성 (v1~v4 후보 4장)
 * @param {string} pid
 * @param {string} charKey
 * @param {{ model?: string, appearance_ko: string }} body
 */
export const generateCharacterImage = (pid, charKey, body) =>
  http.post(`/api/projects/${pid}/characters/${charKey}/generate-image`, {
    model: 'gpt-image-1',
    ...body,
  });

/**
 * 후보 v1~v4 URL 목록 조회
 * @returns {{ candidates: { version: number, url: string|null, exists: boolean }[] }}
 */
export const getCandidates = (pid, charKey) =>
  http.get(`/api/projects/${pid}/characters/${charKey}/candidates`);

/**
 * 후보 버전 선택 → DB 확정
 * @param {{ version: number }} body
 */
export const selectCandidate = (pid, charKey, version) =>
  http.post(`/api/projects/${pid}/characters/${charKey}/select-candidate`, { version });

/**
 * 후보 4장 재생성
 * @param {{ appearance_ko?: string, prompt_en?: string }} body
 */
export const regenerateCandidates = (pid, charKey, body = {}) =>
  http.post(`/api/projects/${pid}/characters/${charKey}/regenerate-candidates`, {
    model: 'gpt-image-1',
    ...body,
  });
