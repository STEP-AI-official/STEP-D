import React from 'react';
import { Icon } from './Icons';
import { api } from '../api';

/* ══════════════════════════════════════════════════════════════
   인라인 편집 필드
══════════════════════════════════════════════════════════════ */
const EditableField = ({ value, onChange, multiline = false, placeholder = '', style = {} }) => {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value || '');
  const ref = React.useRef(null);
  React.useEffect(() => { setDraft(value || ''); }, [value]);
  React.useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);
  const commit = () => { setEditing(false); if (draft !== value) onChange(draft); };
  if (!editing) return (
    <span onClick={() => setEditing(true)}
      style={{ cursor: 'text', borderRadius: 2, padding: '1px 2px', margin: '-1px -2px', ...style }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      {value || <span style={{ color: 'var(--text-4)', fontStyle: 'italic' }}>{placeholder}</span>}
    </span>
  );
  return multiline ? (
    <textarea ref={ref} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
      style={{ width: '100%', resize: 'vertical', minHeight: 72, padding: '6px 8px', fontSize: 'inherit', lineHeight: 'inherit', fontFamily: 'inherit', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4, outline: 'none', color: 'var(--text)', boxSizing: 'border-box', ...style }} />
  ) : (
    <input ref={ref} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEditing(false); setDraft(value || ''); } }}
      style={{ width: '100%', padding: '2px 6px', fontSize: 'inherit', fontFamily: 'inherit', fontWeight: 'inherit', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4, outline: 'none', color: 'var(--text)', boxSizing: 'border-box', ...style }} />
  );
};

/* ══════════════════════════════════════════════════════════════
   SHOT TREE — 씬 썸네일
══════════════════════════════════════════════════════════════ */
const SceneThumbnail = ({ imageUrl }) => (
  <div style={{
    width: 34, height: 22, borderRadius: 3, flexShrink: 0, overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.1)',
    background: imageUrl ? 'transparent' : 'rgba(255,255,255,0.04)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    {imageUrl
      ? <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      : <div style={{ width: '55%', height: '55%', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 1 }} />
    }
  </div>
);

/* ── 씬 트리 행 ── */
const SceneTreeItem = ({ scene, sceneIndex, epIndex, selected, onSelect, onDelete }) => {
  const isSel = selected === scene;
  const label = `S${String(epIndex + 1).padStart(2, '0')}${String(sceneIndex + 1).padStart(2, '0')}`;
  return (
    <div
      onClick={() => onSelect(scene)}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '6px 8px 6px 18px', cursor: 'pointer', borderRadius: 4,
        background: isSel ? 'rgba(0,255,180,0.07)' : 'transparent',
        borderLeft: `2px solid ${isSel ? 'var(--mint)' : 'transparent'}`,
        transition: 'all 0.1s',
      }}
      onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
    >
      <SceneThumbnail imageUrl={scene._imageUrl} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: isSel ? 'var(--mint)' : 'rgba(255,255,255,0.3)', minWidth: 34, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 11, color: isSel ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {scene.title_ko || '제목 없음'}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>{scene.duration_sec || 0}s</span>
      <button
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, opacity: 0, color: 'var(--rose)', lineHeight: 1, flexShrink: 0 }}
        className="del-btn"
        onClick={e => { e.stopPropagation(); onDelete(scene); }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
        <Icon name="x" size={8} />
      </button>
    </div>
  );
};

/* ── 에피소드 폴더 행 ── */
const EpisodeTreeItem = ({ episode, epIndex, scenes, selectedScene, selectedEpisodeKey, onSelectScene, onSelectEpisode, onDeleteScene, onAddScene }) => {
  const [open, setOpen] = React.useState(true);
  const epScenes = scenes.filter(s => (s.episode_key || 'ep_01') === episode.episode_key);
  const isSel = selectedEpisodeKey === episode.episode_key && !selectedScene;
  const totalSec = epScenes.reduce((a, s) => a + (s.duration_sec || 0), 0);

  return (
    <div style={{ marginBottom: 1 }}>
      <div
        onClick={() => { onSelectEpisode(episode.episode_key); onSelectScene(null); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '8px 8px', cursor: 'pointer', borderRadius: 5,
          background: isSel ? 'rgba(245,158,11,0.08)' : 'transparent',
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
        onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
      >
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px 0 0', color: 'rgba(255,255,255,0.3)', lineHeight: 1, flexShrink: 0, display: 'flex' }}
          onClick={e => { e.stopPropagation(); setOpen(o => !o); }}>
          <svg width="10" height="10" viewBox="0 0 10 10" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
            <polyline points="3,2 7,5 3,8" />
          </svg>
        </button>
        <svg width="13" height="13" viewBox="0 0 16 16" style={{ fill: 'rgba(245,158,11,0.6)', flexShrink: 0 }}>
          <path d="M1 3.5A1.5 1.5 0 012.5 2H6l1.5 2H14a1.5 1.5 0 011.5 1.5v7A1.5 1.5 0 0114 14H2.5A1.5 1.5 0 011 12.5v-9z" />
        </svg>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: 'rgba(245,158,11,0.7)', minWidth: 26, flexShrink: 0 }}>
          EP{String(epIndex + 1).padStart(2, '0')}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: isSel ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {episode.title_ko || episode.title || `에피소드 ${epIndex + 1}`}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
          {epScenes.length}S·{totalSec}s
        </span>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px 3px', color: 'rgba(255,255,255,0.25)', lineHeight: 1, flexShrink: 0 }}
          onClick={e => { e.stopPropagation(); onAddScene(episode.episode_key); }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--mint)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}>
          <Icon name="plus" size={10} />
        </button>
      </div>
      {open && (
        <div>
          {epScenes.length === 0 && (
            <div style={{ padding: '4px 18px 4px 42px', fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>씬 없음</div>
          )}
          {epScenes.map((sc, si) => (
            <SceneTreeItem key={sc.scene_key || si} scene={sc} sceneIndex={si} epIndex={epIndex}
              selected={selectedScene} onSelect={onSelectScene} onDelete={onDeleteScene} />
          ))}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   파이널 드래프트 씬 카드 (우측 메인 패널)
══════════════════════════════════════════════════════════════ */
const FinalDraftScene = ({ scene, sceneIndex, episodes, scenes, confirmed, onUpdateScene, onUpdateDialogue, onAddDialogue, onRemoveDialogue }) => {
  const [noteOpen, setNoteOpen] = React.useState(false);
  const [noteText, setNoteText] = React.useState('');

  const epOfSel = episodes.find(e => e.episode_key === (scene.episode_key || 'ep_01'));
  const scNum = String(sceneIndex + 1).padStart(2, '0');

  // TAKE = 씬 내 대사 수 기반으로 임시 넘버링
  const takeLabel = `TAKE ${String(sceneIndex + 1).padStart(2, '0')}`;
  const durLabel = `${scene.duration_sec || 0}s`;

  const loc = [scene.location_key, scene.time_of_day_ko, scene.weather_ko].filter(Boolean).join(' / ');
  const camera = [scene.shot_type_ko, scene.shot_type_en].filter(Boolean).join(' ');
  const mood = scene.mood_ko || '';

  return (
    <div style={{
      fontFamily: '"Courier New", Courier, monospace',
      maxWidth: 760, margin: '0 auto 56px',
    }}>

      {/* ── SCN 헤더 바 ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto',
        alignItems: 'center',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '6px 6px 0 0',
        padding: '8px 18px',
        marginBottom: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--mint)', letterSpacing: '0.08em' }}>SCN {scNum}</span>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>/</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em' }}>{takeLabel}</span>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>/</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{durLabel}</span>
        </div>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em' }}>SCRIPT REV 01</span>
      </div>

      {/* ── LOCATION / CAMERA / MOOD 3단 ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        border: '1px solid rgba(255,255,255,0.1)',
        borderTop: 'none',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '0 0 6px 6px',
        marginBottom: 28,
      }}>
        {[
          { label: 'LOCATION', field: 'location_key', value: loc || '' },
          { label: 'CAMERA',   field: 'shot_type_ko', value: camera || '' },
          { label: 'MOOD',     field: 'mood_ko',      value: mood || '' },
        ].map(({ label, field, value }, i) => (
          <div key={i} style={{
            padding: '10px 18px',
            borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
          }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', marginBottom: 5, fontWeight: 700 }}>{label}</div>
            {confirmed
              ? <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{value || '—'}</div>
              : <EditableField value={value} onChange={v => onUpdateScene(scene, field, v)}
                  placeholder={label.toLowerCase()} style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', display: 'block' }} />
            }
          </div>
        ))}
      </div>

      {/* ── 씬 번호 + 제목 ── */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginBottom: 26 }}>
        <span style={{
          fontFamily: '"Courier New", monospace',
          fontSize: 52, fontWeight: 900,
          color: 'rgba(245,158,11,0.85)',
          lineHeight: 1, flexShrink: 0,
          letterSpacing: '-0.03em',
        }}>{scNum}</span>
        {confirmed
          ? <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{scene.title_ko || '제목 없음'}</h2>
          : <EditableField value={scene.title_ko || ''} onChange={v => onUpdateScene(scene, 'title_ko', v)}
              placeholder="씬 제목 입력..." style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.9)', display: 'block' }} />
        }
      </div>

      {/* ── ACTION · 지문 ── */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 10 }}>
          ACTION <span style={{ fontWeight: 400, opacity: 0.6 }}>· 지문</span>
        </div>
        <div style={{
          borderLeft: '3px solid rgba(255,255,255,0.12)',
          paddingLeft: 16,
        }}>
          {confirmed
            ? <p style={{ fontSize: 14, lineHeight: 1.9, color: 'rgba(255,255,255,0.78)', margin: 0, whiteSpace: 'pre-wrap' }}>{scene.action_ko}</p>
            : <EditableField value={scene.action_ko || ''} onChange={v => onUpdateScene(scene, 'action_ko', v)}
                multiline placeholder="장면 묘사를 입력하세요..."
                style={{ fontSize: 14, lineHeight: 1.9, color: 'rgba(255,255,255,0.78)', display: 'block' }} />
          }
        </div>
      </div>

      {/* ── NARRATION ── */}
      {(scene.narration || !confirmed) && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 10 }}>
            NARRATION <span style={{ fontWeight: 400, opacity: 0.6 }}>· 내레이션</span>
          </div>
          <div style={{
            borderLeft: '3px solid rgba(147,51,234,0.5)',
            paddingLeft: 16,
            fontStyle: 'italic',
          }}>
            {confirmed
              ? <p style={{ fontSize: 14, lineHeight: 1.9, color: 'rgba(200,160,255,0.85)', margin: 0, whiteSpace: 'pre-wrap' }}>{scene.narration}</p>
              : <EditableField value={scene.narration || ''} onChange={v => onUpdateScene(scene, 'narration', v)}
                  multiline placeholder="내레이션 텍스트 입력..."
                  style={{ fontSize: 14, lineHeight: 1.9, color: 'rgba(200,160,255,0.85)', display: 'block', fontStyle: 'italic' }} />
            }
          </div>
        </div>
      )}

      {/* ── DIALOGUE · 대사 ── */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', fontWeight: 700 }}>
            DIALOGUE <span style={{ fontWeight: 400, opacity: 0.6 }}>· 대사</span>{' '}
            <span style={{ opacity: 0.5 }}>{String(scene.dialogue_ko?.length || 0).padStart(2, '0')} LINE</span>
          </div>
          {!confirmed && (
            <button
              style={{ marginLeft: 'auto', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, cursor: 'pointer', padding: '2px 10px', fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => onAddDialogue(scene)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--mint)'; e.currentTarget.style.color = 'var(--mint)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}>
              <Icon name="plus" size={9} />추가
            </button>
          )}
        </div>

        {!(scene.dialogue_ko?.length) ? (
          <div style={{ padding: '14px 18px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 6, color: 'rgba(255,255,255,0.2)', fontSize: 12, textAlign: 'center', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
            — NO DIALOGUE —
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {scene.dialogue_ko.map((d, i) => (
              <div key={i} style={{ paddingBottom: 18 }}>
                {/* 화자 이름 — 중앙 정렬, 파이널 드래프트 스타일 */}
                <div style={{ textAlign: 'center', marginBottom: 4, position: 'relative' }}>
                  {confirmed
                    ? <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--mint)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {d.speaker}{d.parenthetical ? ` (${d.parenthetical})` : ''}
                      </span>
                    : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <EditableField value={d.speaker || ''} onChange={v => onUpdateDialogue(scene, i, 'speaker', v)}
                          placeholder="화자 이름"
                          style={{ fontSize: 13, fontWeight: 700, color: 'var(--mint)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }} />
                        <button style={{ position: 'absolute', right: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: 2 }}
                          onClick={() => onRemoveDialogue(scene, i)}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--rose)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}>
                          <Icon name="x" size={9} />
                        </button>
                      </div>
                  }
                </div>
                {/* 대사 — 중앙 정렬, 들여쓰기 */}
                <div style={{ padding: '0 80px', textAlign: 'center' }}>
                  {confirmed
                    ? <div style={{ fontSize: 14, lineHeight: 1.75, color: 'rgba(255,255,255,0.82)' }}>"{d.line}"</div>
                    : <EditableField value={d.line || ''} onChange={v => onUpdateDialogue(scene, i, 'line', v)}
                        multiline placeholder="대사 내용..."
                        style={{ fontSize: 14, lineHeight: 1.75, color: 'rgba(255,255,255,0.82)', display: 'block', textAlign: 'center' }} />
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SCRIPT NOTE 박스 ── */}
      {!confirmed && (
        <div style={{
          marginTop: 18,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '9px 14px',
            background: 'rgba(255,255,255,0.03)',
            cursor: 'pointer',
          }} onClick={() => setNoteOpen(o => !o)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: 4, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="sparkles" size={11} style={{ color: 'rgba(255,255,255,0.5)' }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-mono)' }}>SCRIPT NOTE</span>
              {noteText && !noteOpen && (
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>{noteText.slice(0, 40)}{noteText.length > 40 ? '…' : ''}</span>
              )}
            </div>
          </div>
          {noteOpen && (
            <div style={{ padding: '10px 14px 12px', background: 'rgba(255,255,255,0.02)' }}>
              <input
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="예: 긴장감 높이기 · 대사 한 줄 추가 · 앵글 변경"
                style={{
                  width: '100%', padding: '8px 12px', fontSize: 12, boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 5, outline: 'none', color: 'rgba(255,255,255,0.75)',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   에피소드 상세 패널
══════════════════════════════════════════════════════════════ */
const EpisodePanel = ({ episode, epIndex, sceneCount, confirmed, onUpdate }) => (
  <div style={{ maxWidth: 760, margin: '0 auto', fontFamily: '"Courier New", monospace' }}>
    <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '12px 22px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="15" height="15" viewBox="0 0 16 16" style={{ fill: 'rgba(245,158,11,0.7)', flexShrink: 0 }}>
          <path d="M1 3.5A1.5 1.5 0 012.5 2H6l1.5 2H14a1.5 1.5 0 011.5 1.5v7A1.5 1.5 0 0114 14H2.5A1.5 1.5 0 011 12.5v-9z" />
        </svg>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(245,158,11,0.8)', fontWeight: 700, letterSpacing: '0.06em' }}>
          EP{String(epIndex + 1).padStart(2, '0')} · {episode.episode_key?.toUpperCase()}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' }}>
          {sceneCount}씬 · {episode.duration_sec || 0}s
        </span>
      </div>
      <div style={{ padding: '28px 28px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.12em', marginBottom: 8 }}>TITLE</div>
          {confirmed
            ? <div style={{ fontSize: 24, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{episode.title_ko || episode.title || '제목 없음'}</div>
            : <EditableField value={episode.title_ko || episode.title || ''} onChange={v => onUpdate('title_ko', v)} placeholder="에피소드 제목 입력..." style={{ fontSize: 24, fontWeight: 700, color: 'rgba(255,255,255,0.9)', display: 'block' }} />
          }
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 9, color: 'rgba(245,158,11,0.6)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.12em', marginBottom: 8 }}>TOPIC · 주제</div>
            {confirmed
              ? <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>{episode.topic || '—'}</div>
              : <EditableField value={episode.topic || ''} onChange={v => onUpdate('topic', v)} multiline placeholder="이 에피소드가 다루는 핵심 주제..." style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, display: 'block' }} />
            }
          </div>
          <div>
            <div style={{ fontSize: 9, color: 'rgba(0,255,180,0.5)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.12em', marginBottom: 8 }}>CORE MESSAGE · 핵심 메시지</div>
            {confirmed
              ? <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>{episode.core_message || '—'}</div>
              : <EditableField value={episode.core_message || ''} onChange={v => onUpdate('core_message', v)} multiline placeholder="시청자에게 전달할 메시지..." style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, display: 'block' }} />
            }
          </div>
        </div>
        {(episode.theme || !confirmed) && (
          <div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.12em', marginBottom: 8 }}>THEME</div>
            {confirmed
              ? <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{episode.theme || '—'}</div>
              : <EditableField value={episode.theme || ''} onChange={v => onUpdate('theme', v)} multiline placeholder="분위기 / 톤..." style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, display: 'block' }} />
            }
          </div>
        )}
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   빈 씬 템플릿
══════════════════════════════════════════════════════════════ */
const newSceneTemplate = (episode_key = 'ep_01') => ({
  scene_key: `user_${Date.now()}`,
  episode_key, title_ko: '', action_ko: '', narration: '',
  dialogue_ko: [], mood_ko: '', shot_type_ko: '',
  visual_prompt_en: '', duration_sec: 8,
  location_key: '', characters_in_scene: [], _isNew: true,
});

/* ══════════════════════════════════════════════════════════════
   ScriptView 메인
══════════════════════════════════════════════════════════════ */
export const ScriptView = ({ project, short, onShortUpdate, setView }) => {
  const [screenplay, setScreenplay] = React.useState(null);
  const [episodes, setEpisodes] = React.useState([]);
  const [scenes, setScenes] = React.useState([]);
  const [streaming, setStreaming] = React.useState(false);
  const [streamText, setStreamText] = React.useState('');
  const [selectedEpisodeKey, setSelectedEpisodeKey] = React.useState(null);
  const selectedEpisodeKeyRef = React.useRef(null);
  React.useEffect(() => { selectedEpisodeKeyRef.current = selectedEpisodeKey; }, [selectedEpisodeKey]);
  const [selectedScene, setSelectedScene] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [approving, setApproving] = React.useState(false);
  const [locked, setLocked] = React.useState(false);
  const [showMemoPanel, setShowMemoPanel] = React.useState(false);
  const [memo, setMemo] = React.useState('');
  const [polishing, setPolishing] = React.useState(false);
  /* 전체 스크롤 모드 vs 선택 모드 */
  const [scrollMode, setScrollMode] = React.useState(false);
  /* 스트리밍 타이머 */
  const [elapsed, setElapsed] = React.useState(0);
  const [charCount, setCharCount] = React.useState(0);
  const [lastProgress, setLastProgress] = React.useState('');

  // 스트리밍 타이머
  React.useEffect(() => {
    if (!streaming) { setElapsed(0); setCharCount(0); setLastProgress(''); return; }
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [streaming]);

  const pid = project?.id;
  const sid = short?.id;
  const shortStage = short?.stage;
  const shortStatus = short?.status;

  const loadScenario = React.useCallback(async () => {
    if (!pid || !sid) return;
    try {
      const data = await api.get(`/api/projects/${pid}/shorts/${sid}/scenario`);
      const sp = data.screenplay || data;
      setScreenplay(sp);
      const eps = data.episodes || sp?.episodes || [];
      const scs = data.scenes || sp?.scenes || [];
      // SSE로 이미 받은 에피소드와 병합 — DB 데이터 우선, SSE 수신분 보존
      setEpisodes(prev => {
        if (prev.length === 0) return eps;
        const map = Object.fromEntries(prev.map(e => [e.episode_key, e]));
        eps.forEach(e => { map[e.episode_key] = e; }); // DB가 더 최신이면 덮어씀
        return Object.values(map).sort((a, b) => (a.episode_order ?? 0) - (b.episode_order ?? 0));
      });
      setScenes(scs);
      if (eps.length > 0) setSelectedEpisodeKey(k => k || eps[0].episode_key);
      setError(null);
    } catch (e) {
      if (!e.message?.includes('404')) setError(e.message);
    } finally { setLoading(false); }
  }, [pid, sid]);

  React.useEffect(() => { setLoading(true); setScreenplay(null); setScenes([]); setEpisodes([]); loadScenario(); }, [loadScenario]);

  // SSE 스트리밍 — generating 진입 시 한 번만 연결, status 변경 시 재연결 방지
  const sseActiveRef = React.useRef(false);
  React.useEffect(() => {
    if (!pid || !sid || !(shortStage === 'scenario' && shortStatus === 'generating')) return;
    if (sseActiveRef.current) return;  // 이미 연결 중이면 스킵
    sseActiveRef.current = true;
    setStreaming(true); setStreamText('');
    const finish = () => {
      sseActiveRef.current = false;
      setStreaming(false);
      api.get(`/api/projects/${pid}/shorts/${sid}`).then(u => { if (onShortUpdate) onShortUpdate(u); }).catch(() => {});
      // SSE로 이미 에피소드를 받았으면 loadScenario 생략 — 깜빡임 방지
      // 에피소드가 아직 없을 때만 fallback 로드
      setEpisodes(prev => {
        if (prev.length === 0) { loadScenario(); }
        return prev;
      });
    };
    const es = api.sse(`/api/projects/${pid}/shorts/${sid}/scenario/stream`, obj => {
      if (obj.type === 'done' || obj.done) finish();
      else if (obj.type === 'episode') {
        // 에피소드 하나 완성 — 즉시 렌더링
        const ep = obj.episode;
        const epScenes = obj.scenes || [];
        setEpisodes(prev => {
          const exists = prev.find(e => e.episode_key === ep.episode_key);
          return exists ? prev.map(e => e.episode_key === ep.episode_key ? ep : e) : [...prev, ep];
        });
        setScenes(prev => {
          const filtered = prev.filter(s => s.episode_key !== ep.episode_key);
          return [...filtered, ...epScenes];
        });
        setLastProgress(`에피소드 완성: ${ep.title_ko || ep.episode_key}`);
        // 첫 에피소드 수신 시 스트리밍 오버레이 제거
        setStreaming(false);
        if (!selectedEpisodeKeyRef.current) setSelectedEpisodeKey(ep.episode_key);
      } else if (obj.type === 'progress' || obj.type === 'message') {
        const msg = obj.message || obj.text || '';
        setLastProgress(msg);
        const m = msg.match(/\(([0-9,]+)자\)/);
        if (m) setCharCount(parseInt(m[1].replace(/,/g, ''), 10));
      } else if (obj.type === 'error') { setStreaming(false); setError(obj.message || '오류'); }
    }, finish);
    const t = setTimeout(() => { es.close(); finish(); }, 180_000);
    return () => { es.close(); clearTimeout(t); sseActiveRef.current = false; };
  }, [pid, sid, shortStage, shortStatus, loadScenario, onShortUpdate]);

  /* ── 씬 편집 ── */
  const saveSceneToDB = async (updatedScene) => {
    const key = updatedScene.scene_key;
    if (!key || updatedScene._isNew) return;
    try { await api.patch(`/api/projects/${pid}/shorts/${sid}/scenario/scenes/${key}`, updatedScene); }
    catch (e) { console.warn('씬 저장 실패:', e.message); }
  };

  const saveEpisodeToDB = async (epKey, patch) => {
    try { await api.patch(`/api/projects/${pid}/shorts/${sid}/episodes/${epKey}`, patch); }
    catch (e) { console.warn('에피소드 저장 실패:', e.message); }
  };

  const updateScene = (scene, field, value) => {
    const updScene = { ...scene, [field]: value };
    setScenes(prev => prev.map(s => s === scene ? updScene : s));
    if (selectedScene === scene) setSelectedScene(updScene);
    saveSceneToDB(updScene);
  };

  const updateDialogue = (scene, idx, field, value) => {
    const newDlg = (scene.dialogue_ko || []).map((d, i) => i === idx ? { ...d, [field]: value } : d);
    const upd = { ...scene, dialogue_ko: newDlg };
    setScenes(prev => prev.map(s => s === scene ? upd : s));
    if (selectedScene === scene) setSelectedScene(upd);
    saveSceneToDB(upd);
  };

  const addDialogue = scene => updateScene(scene, 'dialogue_ko', [...(scene.dialogue_ko || []), { speaker: '', line: '' }]);
  const removeDialogue = (scene, idx) => updateScene(scene, 'dialogue_ko', (scene.dialogue_ko || []).filter((_, i) => i !== idx));

  const addScene = (episode_key = 'ep_01') => {
    const ns = newSceneTemplate(episode_key);
    setScenes(prev => [...prev, ns]);
    setSelectedScene(ns); setSelectedEpisodeKey(null);
  };

  const deleteScene = scene => {
    setScenes(prev => prev.filter(s => s !== scene));
    if (selectedScene === scene) setSelectedScene(null);
  };

  const updateEpisode = (epKey, field, value) => {
    setEpisodes(prev => prev.map(ep => ep.episode_key === epKey ? { ...ep, [field]: value } : ep));
    saveEpisodeToDB(epKey, { [field]: value });
  };

  const polishWithAI = async () => {
    setPolishing(true);
    try {
      await api.post(`/api/projects/${pid}/shorts/${sid}/scenario/regenerate`, { notes: memo, current_scenes: scenes });
      const u = await api.get(`/api/projects/${pid}/shorts/${sid}`);
      if (onShortUpdate) onShortUpdate(u);
      setMemo(''); setShowMemoPanel(false);
    } catch (e) { setError(e.message); }
    finally { setPolishing(false); }
  };

  const approve = async () => {
    setApproving(true);
    try {
      await api.post(`/api/projects/${pid}/shorts/${sid}/scenario/approve`, { image_model: 'gpt-image-1' });
      const u = await api.get(`/api/projects/${pid}/shorts/${sid}`);
      if (onShortUpdate) onShortUpdate(u);
    } catch (e) { setError(e.message); }
    finally { setApproving(false); }
  };

  const canApprove = shortStage === 'scenario' && shortStatus === 'choosing';
  const isApproved = shortStage !== 'scenario';
  React.useEffect(() => { setLocked(isApproved); }, [isApproved]);
  const confirmed = locked;

  const selectedEpisode = episodes.find(ep => ep.episode_key === selectedEpisodeKey) || null;
  const selectedEpIndex = episodes.findIndex(ep => ep.episode_key === selectedEpisodeKey);
  const totalSec = scenes.reduce((a, s) => a + (s.duration_sec || 0), 0);

  /* 스크롤 모드: 에피소드별 전체 씬 순서 */
  const scrollScenes = scrollMode
    ? (selectedEpisode
        ? scenes.filter(s => (s.episode_key || 'ep_01') === selectedEpisodeKey)
        : scenes)
    : (selectedScene ? [selectedScene] : []);

  /* ── 로딩 ── */
  if (loading && !streaming) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.08)', borderTopColor: 'var(--mint)', animation: 'spin 1s linear infinite' }} />
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>시나리오 불러오는 중...</div>
    </div>
  );

  if (streaming) {
    const stageParts = lastProgress.split('...')[0] || '시나리오 작성 중';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20, padding: 48 }}>
        <div style={{ position: 'relative', width: 56, height: 56 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)', borderTopColor: 'var(--mint)', animation: 'spin 1.2s linear infinite' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><Icon name="doc" size={18} style={{ color: 'var(--mint)' }} /></div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, fontFamily: '"Courier New", monospace' }}>{stageParts}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>약 3분 소요됩니다</div>
        </div>
        {lastProgress && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
            {lastProgress}
          </div>
        )}
      </div>
    );
  }

  if (!screenplay && scenes.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14 }}>
      <Icon name="doc" size={28} style={{ color: 'rgba(255,255,255,0.2)' }} />
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>{error || '시나리오가 없습니다'}</div>
      <button className="btn sm" onClick={loadScenario}>다시 시도</button>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '248px 1fr', height: '100%', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ══ 왼쪽 SHOT TREE ══ */}
      <div style={{ borderRight: '1px solid rgba(255,255,255,0.07)', background: 'oklch(0.08 0.004 280)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* 헤더 */}
        <div style={{ padding: '10px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
          <svg width="12" height="12" viewBox="0 0 16 16" style={{ fill: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
            <path d="M1 3.5A1.5 1.5 0 012.5 2H6l1.5 2H14a1.5 1.5 0 011.5 1.5v7A1.5 1.5 0 0114 14H2.5A1.5 1.5 0 011 12.5v-9z" />
          </svg>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.12em', flex: 1 }}>SHOT TREE</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{totalSec}S · {scenes.length}C</span>
        </div>

        {/* 트리 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 3px' }}>
          {episodes.length > 0 ? episodes.map((ep, ei) => (
            <EpisodeTreeItem
              key={ep.episode_key} episode={ep} epIndex={ei} scenes={scenes}
              selectedScene={selectedScene} selectedEpisodeKey={selectedEpisodeKey}
              onSelectScene={sc => { setSelectedScene(sc); if (sc) { setSelectedEpisodeKey(null); setScrollMode(false); } }}
              onSelectEpisode={ek => { setSelectedEpisodeKey(ek); setSelectedScene(null); setScrollMode(true); }}
              onDeleteScene={deleteScene} onAddScene={addScene}
            />
          )) : scenes.map((sc, i) => (
            <SceneTreeItem key={sc.scene_key || i} scene={sc} sceneIndex={i} epIndex={0}
              selected={selectedScene}
              onSelect={s => { setSelectedScene(s); setSelectedEpisodeKey(null); setScrollMode(false); }}
              onDelete={deleteScene} />
          ))}
        </div>
      </div>

      {/* ══ 오른쪽 파이널 드래프트 패널 ══ */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* 상단 툴바 */}
        <div style={{ padding: '9px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.015)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)', marginBottom: 1, letterSpacing: '0.06em' }}>
              {episodes.length} EP · {scenes.length} SCN · {String(Math.floor(totalSec / 60)).padStart(2, '0')}:{String(totalSec % 60).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: '"Courier New", monospace' }}>
              {screenplay?.title || short?.title || '시나리오'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'center' }}>
            {/* 스크롤/단일 토글 */}
            <button
              className="btn sm ghost"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '4px 10px', background: scrollMode ? 'rgba(0,255,180,0.07)' : 'transparent', borderColor: scrollMode ? 'rgba(0,255,180,0.3)' : undefined }}
              onClick={() => { setScrollMode(m => !m); if (selectedScene) { setSelectedEpisodeKey(selectedScene.episode_key || 'ep_01'); setSelectedScene(null); } }}>
              <Icon name="film" size={10} />{scrollMode ? 'SCROLL' : 'SINGLE'}
            </button>
            {!confirmed && (
              <button className="btn sm ghost" style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }} onClick={() => setShowMemoPanel(p => !p)} disabled={polishing}>
                <Icon name="refresh" size={10} />REWRITE
              </button>
            )}
            <a
              href={`/api/projects/${pid}/shorts/${sid}/scenario/pdf`}
              download
              className="btn sm ghost"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="download" size={10} />PDF
            </a>
            <a
              href={`/api/projects/${pid}/shorts/${sid}/scenario/export-script`}
              download
              className="btn sm ghost"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="download" size={10} />SCRIPT
            </a>
            {canApprove && !isApproved ? (
              <button className="btn sm primary" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, background: 'var(--mint)', color: '#000', border: 'none' }}
                onClick={approve} disabled={approving}>
                {approving ? <span className="spinner" style={{ width: 9, height: 9, borderWidth: 1.5 }} /> : <Icon name="check" size={10} />}LOCK
              </button>
            ) : (
              <button className="btn sm" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, background: locked ? 'rgba(0,255,180,0.08)' : 'transparent', border: `1px solid ${locked ? 'rgba(0,255,180,0.3)' : 'rgba(255,255,255,0.1)'}`, color: locked ? 'var(--mint)' : 'rgba(255,255,255,0.4)' }}
                onClick={() => setLocked(l => !l)}>
                <Icon name={locked ? 'lock' : 'unlock'} size={10} />{locked ? 'LOCKED' : 'LOCK'}
              </button>
            )}
          </div>
        </div>

        {/* REWRITE 패널 */}
        {showMemoPanel && !confirmed && (
          <div style={{ padding: '10px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(147,51,234,0.05)', flexShrink: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 5, color: 'rgba(147,51,234,0.8)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>REWRITE INSTRUCTIONS</div>
            <textarea value={memo} onChange={e => setMemo(e.target.value)}
              placeholder="예: 씬 2를 더 드라마틱하게 / 에피소드 3 삭제 후 긴장감 높이기..." rows={2}
              style={{ width: '100%', padding: '7px 10px', fontSize: 12, lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, resize: 'none', outline: 'none', color: 'rgba(255,255,255,0.7)', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <div style={{ display: 'flex', gap: 5, marginTop: 5, justifyContent: 'flex-end' }}>
              <button className="btn sm ghost" onClick={() => { setShowMemoPanel(false); setMemo(''); }}>취소</button>
              <button className="btn sm primary" onClick={polishWithAI} disabled={polishing}>
                {polishing ? <span className="spinner" style={{ width: 9, height: 9, borderWidth: 1.5 }} /> : <Icon name="wand" size={10} />}AI로 재생성
              </button>
            </div>
          </div>
        )}

        {error && <div style={{ padding: '7px 24px', background: 'rgba(239,68,68,0.08)', fontSize: 11, color: 'var(--rose)', borderBottom: '1px solid rgba(239,68,68,0.2)', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>{error}</div>}

        {/* ── 메인 콘텐츠 영역 ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px 56px 80px' }}>

          {/* 에피소드 패널 (스크롤 모드: 에피소드 선택 시 타이틀 표시 후 전체 씬) */}
          {scrollMode && selectedEpisode && (
            <>
              <EpisodePanel
                episode={selectedEpisode} epIndex={selectedEpIndex}
                sceneCount={scenes.filter(s => (s.episode_key || 'ep_01') === selectedEpisodeKey).length}
                confirmed={confirmed}
                onUpdate={(field, value) => updateEpisode(selectedEpisode.episode_key, field, value)}
              />
              <div style={{ margin: '40px 0 32px', borderTop: '1px solid rgba(255,255,255,0.07)' }} />
            </>
          )}

          {/* 씬 카드들 */}
          {scrollScenes.map((sc) => {
            const globalIdx = scenes.indexOf(sc);
            return (
              <FinalDraftScene
                key={sc.scene_key || globalIdx}
                scene={sc}
                sceneIndex={globalIdx}
                episodes={episodes}
                scenes={scenes}
                confirmed={confirmed}
                onUpdateScene={updateScene}
                onUpdateDialogue={updateDialogue}
                onAddDialogue={addDialogue}
                onRemoveDialogue={removeDialogue}
              />
            );
          })}

          {/* 에피소드 선택 시 스크롤 모드 아닌 경우 → 에피소드 패널만 */}
          {!scrollMode && !selectedScene && selectedEpisode && (
            <EpisodePanel
              episode={selectedEpisode} epIndex={selectedEpIndex}
              sceneCount={scenes.filter(s => (s.episode_key || 'ep_01') === selectedEpisodeKey).length}
              confirmed={confirmed}
              onUpdate={(field, value) => updateEpisode(selectedEpisode.episode_key, field, value)}
            />
          )}

          {/* 아무것도 선택 안 됨 */}
          {!selectedScene && !selectedEpisode && !scrollMode && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: 'rgba(255,255,255,0.2)' }}>
              <svg width="28" height="28" viewBox="0 0 16 16" style={{ fill: 'currentColor' }}>
                <path d="M1 3.5A1.5 1.5 0 012.5 2H6l1.5 2H14a1.5 1.5 0 011.5 1.5v7A1.5 1.5 0 0114 14H2.5A1.5 1.5 0 011 12.5v-9z" />
              </svg>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>왼쪽에서 에피소드 또는 씬을 선택하세요</div>
            </div>
          )}

          {/* 씬 이미지 이동 (승인 후) */}
          {isApproved && selectedScene && (
            <div style={{ maxWidth: 760, margin: '-20px auto 0', padding: '14px 18px', background: 'rgba(0,255,180,0.04)', border: '1px solid rgba(0,255,180,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--mint)', fontFamily: 'var(--font-mono)', marginBottom: 2, letterSpacing: '0.08em' }}>씬 이미지 생성 가능</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>씬 이미지 탭에서 이 씬의 이미지를 생성하세요</div>
              </div>
              <button className="btn sm" style={{ background: 'var(--mint)', color: '#000', border: 'none', fontFamily: 'var(--font-mono)', fontSize: 10 }}
                onClick={() => setView && setView('scene-image')}>
                <Icon name="film" size={10} />씬 이미지로
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
