import { http } from './client';

/**
 * 쇼츠를 유튜브에 업로드 요청.
 * 백엔드가 YouTube Data API v3로 업로드 후 job_id 반환.
 * @param {string} pid
 * @param {string} sid
 * @param {{
 *   title: string,
 *   description: string,
 *   tags: string[],
 *   privacy_status: 'public' | 'unlisted' | 'private',
 *   category_id?: string,        // YouTube 카테고리 ID (기본 '22' = People & Blogs)
 *   channel_id?: string | null,  // null이면 기본 채널
 *   made_for_kids?: boolean,
 *   notify_subscribers?: boolean,
 * }} meta
 * @returns {{ job_id: string }}
 */
export const publishToYouTube = (pid, sid, meta) =>
  http.post(`/api/projects/${pid}/shorts/${sid}/publish/youtube`, meta);

/**
 * 업로드 job 상태 조회.
 * @returns {{
 *   job_id: string,
 *   status: 'pending' | 'uploading' | 'processing' | 'done' | 'error',
 *   progress_pct?: number,     // 0-100
 *   youtube_video_id?: string, // done 시 채워짐
 *   youtube_url?: string,
 *   error?: string,
 * }}
 */
export const getPublishJob = (pid, sid, jobId) =>
  http.get(`/api/projects/${pid}/shorts/${sid}/publish/jobs/${jobId}`);

/**
 * 이 쇼츠의 업로드 이력 목록.
 * @returns {{ publishes: PublishRecord[] }}
 */
export const listPublishes = (pid, sid) =>
  http.get(`/api/projects/${pid}/shorts/${sid}/publish/history`);

/**
 * 연결된 YouTube 채널 목록 조회 (운영자가 OAuth 연결한 채널들).
 * @returns {{ channels: Array<{ id, title, thumbnail_url, custom_url }> }}
 */
export const listYouTubeChannels = () =>
  http.get('/api/youtube/channels');
