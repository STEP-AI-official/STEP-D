/* Workflow canvas — node graph showing entire pipeline */

const NODE_W = 220;
const NODE_H = 120;

const NodeIcon = ({ type }) => {
  const map = {
    prompt: 'sparkles',
    script: 'doc',
    character: 'user',
    background: 'camera',
    render: 'film',
    compose: 'download'
  };
  return <Icon name={map[type] || 'cube'} size={16} />;
};

const NodeAccent = {
  prompt: 'violet', script: 'blue', character: 'mint',
  background: 'orange', render: 'rose', compose: 'mint'
};

const WorkflowNode = ({ node, onClick, isActive, nodeStatuses }) => {
  const status = nodeStatuses[node.id] || node.status;
  const accent = NodeAccent[node.type];

  const statusMeta = {
    done: { color: 'var(--mint)', label: '완료', icon: 'check' },
    active: { color: 'var(--orange)', label: '진행 중', icon: 'refresh' },
    pending: { color: 'var(--text-4)', label: '대기', icon: 'clock' },
    locked: { color: 'var(--text-4)', label: '잠김', icon: 'lock' }
  }[status];

  return (
    <div
      style={{
        position: 'absolute',
        left: node.x, top: node.y,
        width: NODE_W, height: NODE_H,
        background: 'var(--surface)',
        border: `1px solid ${isActive ? `var(--${accent})` : 'var(--border)'}`,
        borderRadius: 'var(--r-md)',
        padding: 14,
        cursor: 'pointer',
        transition: 'all 0.15s',
        boxShadow: isActive ? `0 0 0 3px color-mix(in oklch, var(--${accent}) 20%, transparent)` : 'var(--shadow-1)',
        display: 'flex', flexDirection: 'column', gap: 8
      }}
      onClick={() => onClick(node)}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: `color-mix(in oklch, var(--${accent}) 15%, transparent)`,
          color: `var(--${accent})`,
          display: 'grid', placeItems: 'center'
        }}><NodeIcon type={node.type} /></div>
        <div style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{node.title}</div>
        <div style={{
          fontSize: 10, color: statusMeta.color,
          display: 'flex', alignItems: 'center', gap: 3
        }}>
          {status === 'active'
            ? <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
            : <Icon name={statusMeta.icon} size={11} />
          }
          <span>{statusMeta.label}</span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{node.meta}</div>
      <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4, flex: 1 }}>{node.summary}</div>

      {/* ports */}
      <div style={{
        position: 'absolute', left: -5, top: '50%', transform: 'translateY(-50%)',
        width: 10, height: 10, borderRadius: '50%',
        background: 'var(--bg)', border: '2px solid var(--border-strong)'
      }} />
      <div style={{
        position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)',
        width: 10, height: 10, borderRadius: '50%',
        background: 'var(--bg)',
        border: `2px solid ${status === 'done' ? `var(--${accent})` : 'var(--border-strong)'}`
      }} />
    </div>
  );
};

const Edges = ({ nodes, edges, nodeStatuses }) => {
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--border-strong)" />
        </marker>
        <marker id="arrow-mint" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--mint)" />
        </marker>
      </defs>
      {edges.map((e, i) => {
        const a = byId[e.from], b = byId[e.to];
        if (!a || !b) return null;
        const x1 = a.x + NODE_W, y1 = a.y + NODE_H / 2;
        const x2 = b.x, y2 = b.y + NODE_H / 2;
        const dx = (x2 - x1) * 0.5;
        const d = `M ${x1},${y1} C ${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
        const fromDone = (nodeStatuses[e.from] || byId[e.from].status) === 'done';
        return (
          <path key={i}
            d={d}
            stroke={fromDone ? 'var(--mint)' : 'var(--border-strong)'}
            strokeWidth={fromDone ? 1.8 : 1.4}
            fill="none"
            markerEnd={fromDone ? 'url(#arrow-mint)' : 'url(#arrow)'}
            strokeDasharray={fromDone ? 'none' : '4 4'}
            opacity={fromDone ? 0.85 : 0.5}
          />
        );
      })}
    </svg>
  );
};

const CanvasView = ({ nodes, edges, activeNodeId, setView, nodeStatuses }) => {
  const [zoom, setZoom] = React.useState(0.85);
  const [pan, setPan] = React.useState({ x: -20, y: -40 });
  const [dragging, setDragging] = React.useState(false);
  const dragStart = React.useRef(null);

  const nodeTypeToView = {
    prompt: 'canvas', script: 'script', character: 'characters',
    background: 'background', render: 'render', compose: 'export'
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('[data-node]')) return;
    setDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const handleMouseMove = (e) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Grid bg */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, oklch(0.3 0.015 280) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        backgroundPosition: `${pan.x}px ${pan.y}px`,
        opacity: 0.6
      }} />

      {/* canvas header */}
      <div style={{
        position: 'absolute', top: 16, left: 16, right: 16, zIndex: 5,
        display: 'flex', alignItems: 'center', gap: 12
      }}>
        <div className="panel" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="split" size={14} style={{ color: 'var(--text-3)' }} />
          <span style={{ fontSize: 13, fontWeight: 500 }}>비 오는 날의 편의점</span>
          <span className="chip orange"><span className="dot orange" style={{ width: 5, height: 5 }}/>렌더링 중</span>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className="btn sm"><Icon name="eye" size={13} />미리보기</button>
          <button className="btn sm primary"><Icon name="play" size={11} />전체 실행</button>
        </div>
      </div>

      {/* canvas */}
      <div
        style={{
          position: 'absolute', inset: 0,
          cursor: dragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
      >
        <div style={{
          position: 'absolute', left: 0, top: 0,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: 1500, height: 700
        }}>
          <Edges nodes={nodes} edges={edges} nodeStatuses={nodeStatuses} />
          {nodes.map(n => (
            <div key={n.id} data-node>
              <WorkflowNode
                node={n}
                isActive={n.id === activeNodeId}
                nodeStatuses={nodeStatuses}
                onClick={(node) => setView(nodeTypeToView[node.type])}
              />
            </div>
          ))}
        </div>
      </div>

      {/* zoom control */}
      <div className="panel" style={{
        position: 'absolute', bottom: 16, right: 16, zIndex: 5,
        display: 'flex', alignItems: 'center', padding: 4, gap: 2
      }}>
        <button className="btn ghost sm" onClick={() => setZoom(z => Math.max(0.4, z - 0.1))}>−</button>
        <div style={{ fontSize: 11, color: 'var(--text-3)', padding: '0 8px', fontFamily: 'var(--font-mono)', minWidth: 44, textAlign: 'center' }}>{Math.round(zoom * 100)}%</div>
        <button className="btn ghost sm" onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}>+</button>
        <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px' }} />
        <button className="btn ghost sm" onClick={() => { setZoom(0.85); setPan({ x: -20, y: -40 }); }}>핏</button>
      </div>

      {/* mini legend */}
      <div className="panel" style={{
        position: 'absolute', bottom: 16, left: 16, zIndex: 5,
        padding: '10px 12px', fontSize: 11, color: 'var(--text-3)',
        display: 'flex', alignItems: 'center', gap: 14
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span className="dot mint"/>완료</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span className="dot orange"/>진행 중</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span className="dot" style={{ background: 'var(--text-4)'}}/>대기</span>
        <div style={{ width: 1, height: 12, background: 'var(--border)' }} />
        <span>노드 클릭 → 상세 편집</span>
      </div>
    </div>
  );
};

Object.assign(window, { CanvasView });
