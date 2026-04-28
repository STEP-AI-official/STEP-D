/**
 * src/api/
 * ├── client.js          기본 HTTP 클라이언트 (http.get/post/patch/put/del/sse/mediaUrl)
 * ├── projects.js        프로젝트 CRUD
 * ├── shorts.js          숏츠 조회·생성·SSE
 * ├── preproduction.js   사전제작 채팅·URL 분석 SSE
 * ├── cast.js            캐스트 추출·생성·스트림·승인
 * ├── characters.js      캐릭터 CRUD·이미지 생성·설명 생성
 * ├── scenario.js        시나리오 조회·저장·재생성·승인·SSE
 * ├── episodes.js        에피소드 CRUD
 * └── render.js          클립 조회·재생성
 */

export { http } from './client';

export * as projectsApi from './projects';
export * as shortsApi from './shorts';
export * as preproductionApi from './preproduction';
export * as castApi from './cast';
export * as charactersApi from './characters';
export * as scenarioApi from './scenario';
export * as episodesApi from './episodes';
export * as renderApi from './render';
