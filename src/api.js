// 기존 컴포넌트 호환용 — 새 코드는 src/api/ 폴더의 도메인별 모듈을 직접 import하세요
export { http as api } from './api/client';
export * from './api/index';

// Short stage/status → UI status 변환
export const shortStageToUi = (short) => {
  if (!short) return 'draft';
  const { stage, status } = short;
  if (status === 'failed') return 'failed';
  if (stage === 'scenario' && status === 'generating') return 'scripting';
  if (stage === 'scenario' && status === 'choosing') return 'scripting';
  if (stage === 'cast' && status === 'generating') return 'generating';
  if (stage === 'cast' && status === 'choosing') return 'generating';
  if (stage === 'scene_video' && status === 'generating') return 'rendering';
  if (stage === 'done') return 'done';
  return 'draft';
};

// project → UI용 객체 변환
export const projectToUi = (project) => ({
  id: project.id,
  title: project.title || '제목 없음',
  shorts_count: project.shorts_count || 0,
  characters_count: project.characters_count || 0,
  locations_count: project.locations_count || 0,
  cover: ['rose', 'mint', 'violet', 'blue', 'orange'][parseInt(String(project.id).replace(/\D/g, '0').slice(-4), 10) % 5] || 'mint',
  createdAt: project.created_at ? new Date(project.created_at).toLocaleString('ko') : '방금',
  _raw: project,
});
