import { http } from './client';

/** 프로젝트 목록 조회 */
export const listProjects = () =>
  http.get('/api/projects');

/**
 * 프로젝트 생성
 * @param {{ title: string }} body
 */
export const createProject = (body) =>
  http.post('/api/projects', body);

/** 프로젝트 단건 조회 */
export const getProject = (pid) =>
  http.get(`/api/projects/${pid}`);
