import { http } from './client';

/**
 * 사전제작 채팅 SSE
 * 이벤트:
 *   { type: 'message', text: string }
 *   { type: 'suggestions', items: string[] }
 *   { type: 'doc_ready', doc: PreProductionDoc }
 *
 * @param {string} pid
 * @param {{ message: string, urls?: string[] }} body
 * @param {Function} onEvent
 * @param {Function} [onError]
 */
export const chatSSE = (pid, body, onEvent, onError) =>
  http.sse(`/api/projects/${pid}/preproduction/chat?${new URLSearchParams({ message: body.message, urls: (body.urls || []).join(',') })}`, onEvent, onError);

/**
 * URL 분석 SSE
 * 이벤트: { type: 'analysis'|'error', text?, message? }
 *
 * @param {string} pid
 * @param {string} url  분석할 URL
 * @param {Function} onEvent
 * @param {Function} [onError]
 */
export const analyzeUrlSSE = (pid, url, onEvent, onError) =>
  http.sse(`/api/projects/${pid}/preproduction/analyze-url/stream?url=${encodeURIComponent(url)}`, onEvent, onError);
