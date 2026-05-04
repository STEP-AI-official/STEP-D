import React from 'react';
import { api } from '../api';

/* ── 운영자 영상 품질 시험 Lab ─────────────────────────────────────────────
 *
 * 목적:
 *   - 운영자가 시나리오를 직접 입력해 캐릭터/씬/컷/이미지/영상 생성 파이프라인을 시험.
 *   - 일반 사용자 화면에는 노출되지 않는 격리 프로젝트(`projects.is_lab=true`).
 *
 * 흐름:
 *   1) 프로젝트 리스트 → "신규 Lab 프로젝트" 생성 (빈 short 1개 자동 생성됨)
 *   2) 프로젝트 선택 → 시나리오(씬 카드) 직접 입력 → 저장
 *   3) 저장 시 각 씬에 빈 컷 1개 자동 생성 (백엔드)
 *   4) 캐릭터/씬 이미지/씬 영상 생성은 본 앱(STEP-D)으로 이동해서 작업.
 *      운영자(role=admin)는 본 앱 dashboard에서 lab 프로젝트도 볼 수 있음.
 */

const labApi = {
  list:       ()             => api.get('/lab/projects'),
  create:     (title)        => api.post('/lab/projects', { title }),
  detail:     (pid)          => api.get(`/lab/projects/${pid}`),
  remove:     (pid)          => api.del(`/lab/projects/${pid}`),
  saveScenes: (pid, scenes)  => api.put(`/lab/projects/${pid}/scenes`, { scenes }),
};


export const Lab = () => {
  const [projects, setProjects]       = React.useState([]);
  const [loading, setLoading]         = React.useState(true);
  const [selectedPid, setSelectedPid] = React.useState(null);
  const [creating, setCreating]       = React.useState(false);
  const [newTitle, setNewTitle]       = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await labApi.list();
      setProjects(r.projects || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!newTitle.trim()) return;
    try {
      const p = await labApi.create(newTitle.trim());
      setNewTitle('');
      setCreating(false);
      await load();
      setSelectedPid(p.id);
    } catch (e) {
      alert(`생성 실패: ${e.message}`);
    }
  };

  const remove = async (pid, title) => {
    if (!window.confirm(`"${title}" 프로젝트를 삭제하시겠습니까?\n캐릭터/씬/컷/영상 모두 함께 삭제됩니다.`)) return;
    try {
      await labApi.remove(pid);
      await load();
    } catch (e) {
      alert(`삭제 실패: ${e.message}`);
    }
  };

  if (selectedPid) {
    return <LabProjectDetail pid={selectedPid} onBack={() => { setSelectedPid(null); load(); }} />;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>🧪 영상 품질 Lab</h1>
          <p className="muted" style={{ fontSize: 12 }}>
            운영자 전용 격리 프로젝트. 시나리오를 직접 입력해 캐릭터·씬·영상 생성 파이프라인을 시험합니다.
          </p>
        </div>
        {!creating ? (
          <button className="btn btn-primary" onClick={() => setCreating(true)}>+ 신규 Lab 프로젝트</button>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && create()}
              placeholder="프로젝트 제목" autoFocus
              className="input" style={{ width: 260 }} />
            <button className="btn btn-primary" onClick={create}>생성</button>
            <button className="btn btn-ghost" onClick={() => { setCreating(false); setNewTitle(''); }}>취소</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--text3)' }}>불러오는 중...</div>
      ) : projects.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>
          <div style={{ fontSize: 14, marginBottom: 6 }}>Lab 프로젝트가 없습니다</div>
          <div style={{ fontSize: 12 }}>위 [+ 신규 Lab 프로젝트] 버튼으로 시작하세요.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {projects.map(p => (
            <div key={p.id} className="card" style={{ padding: 14, cursor: 'pointer' }}
              onClick={() => setSelectedPid(p.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.title}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'monospace' }}>{p.id}</div>
                </div>
                <button className="btn btn-ghost btn-sm"
                  onClick={e => { e.stopPropagation(); remove(p.id, p.title); }}
                  title="삭제">삭제</button>
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 11, color: 'var(--text3)', fontFamily: 'monospace' }}>
                <span>{p.characters_count} 인물</span>
                <span>short {p.shorts_count}</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 6, fontFamily: 'monospace' }}>
                {new Date(p.created_at).toLocaleString('ko')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


/* ══ Lab 프로젝트 상세 — 시나리오 입력 ═══════════════════════════════════ */

const LabProjectDetail = ({ pid, onBack }) => {
  const [project, setProject] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [scenes, setScenes]   = React.useState([]);
  const [saving, setSaving]   = React.useState(false);
  const [savedAt, setSavedAt] = React.useState(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const p = await labApi.detail(pid);
      setProject(p);
      const existing = (p.scenes || []).map(s => ({
        scene_key:     s.scene_key,
        title_ko:      s.title_ko || '',
        scene_heading: s.scene_heading || '',
        action_ko:     s.action_ko || '',
        narration:     s.narration || '',
        mood_ko:       s.mood_ko || '',
        location_key:  s.location_key || '',
        char_keys:     s.char_keys || [],
        duration_sec:  s.duration_sec || 5,
        time_of_day:   s.time_of_day || '',
        weather:       s.weather || '',
        dialogue_ko:   s.dialogue_json || s.dialogue_ko || [],
      }));
      setScenes(existing.length > 0 ? existing : [emptyScene(1)]);
    } catch (e) {
      alert(`프로젝트 로드 실패: ${e.message}`);
      onBack();
    } finally {
      setLoading(false);
    }
  }, [pid, onBack]);

  React.useEffect(() => { load(); }, [load]);

  const updateScene = (idx, patch) =>
    setScenes(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));

  const addScene = () => setScenes(prev => [...prev, emptyScene(prev.length + 1)]);

  const removeScene = (idx) => {
    if (scenes.length <= 1) return;
    setScenes(prev => prev.filter((_, i) => i !== idx));
  };

  const save = async () => {
    setSaving(true);
    try {
      await labApi.saveScenes(pid, scenes);
      setSavedAt(new Date());
      await load();
    } catch (e) {
      alert(`저장 실패: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // 본 앱 URL — admin SPA와 별개로 운영자가 새 탭으로 이동.
  // 운영자(role=admin)는 본 앱 dashboard에서 lab 프로젝트도 보임.
  const mainAppBase = (import.meta.env.VITE_MAIN_APP_URL || window.location.origin.replace('/admin', '')) + '/';

  if (loading || !project) {
    return <div className="page"><div className="card" style={{ padding: 30, textAlign: 'center' }}>불러오는 중...</div></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={onBack}>← Lab 목록</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ marginBottom: 2 }}>{project.title}</h1>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'monospace' }}>
              {project.id} · short: {project.short_id}
            </div>
          </div>
        </div>
      </div>

      {/* 본 앱 작업 안내 */}
      <div className="card" style={{ padding: 14, marginBottom: 16, background: 'var(--bg2)', borderLeft: '3px solid var(--mint)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>📌 캐릭터·이미지·영상 생성</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
          시나리오를 저장한 뒤, 캐릭터·씬 이미지·씬 영상 생성은 본 앱(STEP-D)에서 진행합니다.
          운영자(role=admin)는 본 앱 dashboard에서 이 Lab 프로젝트도 볼 수 있습니다.
          <br />
          <a href={mainAppBase} target="_blank" rel="noreferrer"
            style={{ color: 'var(--mint)', fontWeight: 600, fontFamily: 'monospace', fontSize: 11, marginTop: 6, display: 'inline-block' }}>
            → {mainAppBase}
          </a>
        </div>
      </div>

      {/* 시나리오 입력 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>시나리오 — 씬 카드 ({scenes.length}개)</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={addScene}>+ 씬 추가</button>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
            {saving ? '저장 중...' : '시나리오 저장 + 컷 자동 생성'}
          </button>
          {savedAt && (
            <span style={{ fontSize: 10, color: 'var(--mint)', fontFamily: 'monospace' }}>
              ✓ {savedAt.toLocaleTimeString('ko')}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {scenes.map((s, idx) => (
          <SceneCardEditor
            key={idx}
            scene={s}
            index={idx}
            onChange={patch => updateScene(idx, patch)}
            onRemove={() => removeScene(idx)}
            canRemove={scenes.length > 1}
          />
        ))}
      </div>
    </div>
  );
};


const SceneCardEditor = ({ scene, index, onChange, onRemove, canRemove }) => (
  <div className="card" style={{ padding: 12 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 10, color: 'var(--mint)', fontWeight: 700, fontFamily: 'monospace', minWidth: 70 }}>
        SCENE {index + 1}
      </span>
      <input className="input" value={scene.scene_key}
        onChange={e => onChange({ scene_key: e.target.value })}
        placeholder="scene_key (scene_01)"
        style={{ width: 160, fontFamily: 'monospace' }} />
      <input className="input" value={scene.title_ko}
        onChange={e => onChange({ title_ko: e.target.value })}
        placeholder="씬 제목"
        style={{ flex: 1 }} />
      <input className="input" type="number" min={1} max={60} value={scene.duration_sec}
        onChange={e => onChange({ duration_sec: parseInt(e.target.value) || 5 })}
        style={{ width: 60, textAlign: 'right' }} />
      <span style={{ fontSize: 11, color: 'var(--text3)' }}>초</span>
      {canRemove && <button className="btn btn-ghost btn-sm" onClick={onRemove}>삭제</button>}
    </div>

    <input className="input" value={scene.scene_heading}
      onChange={e => onChange({ scene_heading: e.target.value })}
      placeholder="씬 헤딩 (예: INT. 한옥 마당 - 새벽)"
      style={{ width: '100%', marginBottom: 6 }} />

    <textarea className="input" value={scene.action_ko}
      onChange={e => onChange({ action_ko: e.target.value })}
      placeholder="액션 / 행동 묘사 — 인물이 무엇을 하는지, 무엇이 보이는지"
      rows={3}
      style={{ width: '100%', resize: 'vertical', marginBottom: 6, fontFamily: 'inherit' }} />

    <textarea className="input" value={scene.narration}
      onChange={e => onChange({ narration: e.target.value })}
      placeholder="내레이션 (선택)"
      rows={2}
      style={{ width: '100%', resize: 'vertical', marginBottom: 6, fontFamily: 'inherit' }} />

    <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
      <input className="input" value={scene.mood_ko}
        onChange={e => onChange({ mood_ko: e.target.value })}
        placeholder="분위기 (긴장/슬픔/평온…)"
        style={{ flex: 1 }} />
      <input className="input" value={scene.time_of_day}
        onChange={e => onChange({ time_of_day: e.target.value })}
        placeholder="시간대 (새벽/낮/밤…)"
        style={{ flex: 1 }} />
      <input className="input" value={scene.weather}
        onChange={e => onChange({ weather: e.target.value })}
        placeholder="날씨 (맑음/비/눈…)"
        style={{ flex: 1 }} />
      <input className="input" value={scene.location_key}
        onChange={e => onChange({ location_key: e.target.value })}
        placeholder="배경 키"
        style={{ flex: 1, fontFamily: 'monospace' }} />
    </div>

    <input className="input" value={(scene.char_keys || []).join(', ')}
      onChange={e => onChange({ char_keys: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
      placeholder="등장 캐릭터 키 (쉼표 구분, 예: kim_jisoo, park_minho)"
      style={{ width: '100%', fontFamily: 'monospace' }} />
  </div>
);


const emptyScene = (index) => ({
  scene_key:     `scene_${String(index).padStart(2, '0')}`,
  title_ko:      '',
  scene_heading: '',
  action_ko:     '',
  narration:     '',
  mood_ko:       '',
  location_key:  '',
  char_keys:     [],
  duration_sec:  5,
  time_of_day:   '',
  weather:       '',
  dialogue_ko:   [],
});
