import React from 'react';
import { Icon } from './Icons';

const NODE_W = 220;
const NODE_H = 120;

const NODE_DEFS = [
  { id: 'script', type: 'script',  title: '시나리오',      x: 80,  y: 250, meta: '씬 구성 · 대사 · 캐릭터', summary: '시나리오·등장인물·배경을 작성하고 확정합니다', icon: 'doc',      accent: 'blue',   view: 'script',  stage: 'scenario' },
  { id: 'render', type: 'render',  title: '씬 영상 생성',  x: 400, y: 250, meta: '씬별 AI 렌더링',            summary: '각 씬을 AI로 영상 생성합니다',                icon: 'film',     accent: 'rose',   view: 'render',  stage: 'scene_video' },
  { id: 'export', type: 'compose', title: '합성·내보내기', x: 720, y: 250, meta: 'MP4 · 9:16',               summary: '씬을 합쳐 최종 영상을 만듭니다',              icon: 'download', accent: 'violet', view: 'export',  stage: 'done' },
];

const EDGES = [
  { from: 'script', to: 'render' },
  { from: 'render', to: 'export' },
];

// short.stage + short.status → 각 노드 상태 계산
const calcNodeStatuses = (short) => {
  if (!short) return {};
  const { stage, status } = short;
  const stageOrder = ['scenario', 'cast', 'scene_video', 'done'];
  const currentIdx = stageOrder.indexOf(stage);

  return {
    script: currentIdx < 0 ? 'pending'
            : (stage === 'scenario' && (status === 'generating' || status === 'choosing')) ? 'active'
            : currentIdx >= 1 ? 'done' : 'pending',
    render: (stage === 'scene_video' && status === 'generating') ? 'active'
            : currentIdx >= 3 ? 'done' : 'pending',
    export: stage === 'done' ? 'done' : 'pending',
  };
};

const NodeIcon = ({ name }) => <Icon name={name} size={16} />;

const WorkflowNode = ({ node, nodeStatuses, onClick }) => {
  const status = nodeStatuses[node.id] || 'pending';
  const isActive = status === 'active';

  return (
    <div
      style={{
        position: 'absolute', left: node.x, top: node.y, width: NODE_W, height: NODE_H,
        background: 'var(--surface)',
        border: `1px solid ${isActive ? `var(--${node.accent})` : 'var(--border)'}`,
        borderRadius: 'var(--r-md)', padding: 14, cursor: 'pointer',
        transition: 'all 0.15s',
        boxShadow: isActive ? `0 0 0 3px color-mix(in oklch, var(--${node.accent}) 20%, transparent)` : 'var(--shadow-1)',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
      onClick={() => onClick(node.view)}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: `color-mix(in oklch, var(--${node.accent}) 15%, transparent)`, color: `var(--${node.accent})`, display: 'grid', placeItems: 'center' }}>
          <NodeIcon name={node.icon} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{node.title}</div>
        {status === 'done' && <Icon name="check" size={13} style={{ color: 'var(--mint)', flexShrink: 0 }} />}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{node.meta}</div>
      <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4, flex: 1 }}>{node.summary}</div>
      <div style={{ position: 'absolute', left: -5, top: '50%', transform: 'translateY(-50%)', width: 10, height: 10, borderRadius: '50%', background: 'var(--bg)', border: '2px solid var(--border-strong)' }} />
      <div style={{ position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)', width: 10, height: 10, borderRadius: '50%', background: 'var(--bg)', border: `2px solid ${status === 'done' ? `var(--${node.accent})` : 'var(--border-strong)'}` }} />
    </div>
  );
};

const Edges = ({ nodeStatuses }) => {
  const byId = Object.fromEntries(NODE_DEFS.map(n => [n.id, n]));
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--border-strong)" /></marker>
        <marker id="arrow-mint" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--mint)" /></marker>
      </defs>
      {EDGES.map((e, i) => {
        const a = byId[e.from], b = byId[e.to];
        if (!a || !b) return null;
        const x1 = a.x + NODE_W, y1 = a.y + NODE_H / 2;
        const x2 = b.x,          y2 = b.y + NODE_H / 2;
        const dx = (x2 - x1) * 0.5;
        const d = `M ${x1},${y1} C ${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
        const fromDone = (nodeStatuses[e.from]) === 'done';
        return <path key={i} d={d} stroke={fromDone ? 'var(--mint)' : 'var(--border-strong)'} strokeWidth={fromDone ? 1.8 : 1.4} fill="none" markerEnd={fromDone ? 'url(#arrow-mint)' : 'url(#arrow)'} strokeDasharray={fromDone ? 'none' : '4 4'} opacity={fromDone ? 0.85 : 0.5} />;
      })}
    </svg>
  );
};


export const CanvasView = ({ short, setView }) => {
  const [zoom, setZoom] = React.useState(0.85);
  const [pan, setPan] = React.useState({ x: -20, y: -40 });
  const [dragging, setDragging] = React.useState(false);
  const dragStart = React.useRef(null);

  const nodeStatuses = calcNodeStatuses(short);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, oklch(0.3 0.015 280) 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundPosition: `${pan.x}px ${pan.y}px`, opacity: 0.6 }} />

      {/* 상단 툴바 */}
      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 5, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="panel" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="split" size={14} style={{ color: 'var(--text-3)' }} />
          <span style={{ fontSize: 13, fontWeight: 500 }}>워크플로우</span>
          {short && <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 4 }}>— {short.title || '제목 없음'}</span>}
        </div>
      </div>

      <div
        style={{ position: 'absolute', inset: 0, cursor: dragging ? 'grabbing' : 'grab' }}
        onMouseDown={e => { if (e.target.closest('[data-node]')) return; setDragging(true); dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }; }}
        onMouseMove={e => { if (!dragging) return; setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }); }}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', width: 1500, height: 700 }}>
          <Edges nodeStatuses={nodeStatuses} />
          {NODE_DEFS.map(n => (
            <div key={n.id} data-node="">
              <WorkflowNode node={n} nodeStatuses={nodeStatuses} onClick={setView} />
            </div>
          ))}
        </div>
      </div>
      <div className="panel" style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 5, display: 'flex', alignItems: 'center', padding: 4, gap: 2 }}>
        <button className="btn ghost sm" onClick={() => setZoom(z => Math.max(0.4, z - 0.1))}>−</button>
        <div style={{ fontSize: 11, color: 'var(--text-3)', padding: '0 8px', fontFamily: 'var(--font-mono)', minWidth: 44, textAlign: 'center' }}>{Math.round(zoom * 100)}%</div>
        <button className="btn ghost sm" onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}>+</button>
        <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px' }} />
        <button className="btn ghost sm" onClick={() => { setZoom(0.85); setPan({ x: -20, y: -40 }); }}>핏</button>
      </div>
    </div>
  );
};
