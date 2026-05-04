import React from 'react';
import { api } from '../api.js';

/* ── 영상 생성 기본값 섹션 ─────────────────────────────────────────────── */
const VIDEO_MODEL_OPTS = [
  { value:'kling_v2.1_std',  label:'Kling v2.1 Standard' },
  { value:'kling_v2.1_pro',  label:'Kling v2.1 Pro' },
  { value:'kling_v3_std',    label:'Kling v3 Standard' },
  { value:'kling_v3_pro',    label:'Kling v3 Pro' },
  { value:'minimax',         label:'MiniMax' },
  { value:'runway',          label:'Runway' },
];
const SHOT_SIZE_OPTS = ['ECU','CU','MCU','MS','MLS','LS','WS','EWS'];
const SPEED_OPTS = [
  { value:'very_slow', label:'매우느림' },
  { value:'slow',      label:'느림' },
  { value:'stable',    label:'안정' },
  { value:'gradual',   label:'점진' },
  { value:'fast',      label:'빠름' },
  { value:'impact',    label:'충격' },
];
const LENS_OPTS = ['21mm','24mm','28mm','35mm','50mm','85mm','135mm'];
const COLOR_GRADE_OPTS = [
  'teal-orange','desaturated-warm','desaturated-cool','high-contrast','flat-matte',
];

const VideoDefaultsPanel = () => {
  const [cfg, setCfg]     = React.useState(null);
  const [edits, setEdits] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(null);

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const data = await api.get('/config');
      // /config 응답: { config: {...}, allowed_keys: [...] }
      // VideoDefaults는 config 객체 안에서 prefix 없이 같은 키로 저장됨
      setCfg(data.config || data); setEdits({});
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { load(); }, []);

  const save = async () => {
    if (!Object.keys(edits).length) return;
    setSaving(true); setErr(null);
    try {
      await api.patch('/config', { updates: edits });
      await load();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const val = (key, def) => edits[key] ?? cfg?.[key] ?? def;
  const set = (key, v) => setEdits(p => ({ ...p, [key]: v }));
  const changed = Object.keys(edits).length > 0;

  const SelectRow = ({ label, k, opts, def }) => (
    <tr>
      <td style={{ padding:'10px 12px', fontSize:12, color:'var(--text2)', width:200 }}>{label}</td>
      <td style={{ padding:'10px 12px' }}>
        <select value={val(k, def)} onChange={e => set(k, e.target.value)}
          style={{ padding:'5px 8px', fontSize:12, borderRadius:6, background:'var(--bg2)', border:'1px solid var(--border)', color:'var(--text1)', minWidth:180 }}>
          {opts.map(o => typeof o === 'string'
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>
          )}
        </select>
      </td>
    </tr>
  );
  const TextRow = ({ label, k, placeholder }) => (
    <tr>
      <td style={{ padding:'10px 12px', fontSize:12, color:'var(--text2)' }}>{label}</td>
      <td style={{ padding:'10px 12px' }}>
        <input value={val(k, '')} onChange={e => set(k, e.target.value)}
          placeholder={placeholder}
          style={{ padding:'5px 8px', fontSize:12, borderRadius:6, background:'var(--bg2)', border:'1px solid var(--border)', color:'var(--text1)', width:360 }} />
      </td>
    </tr>
  );
  const SliderRow = ({ label, k, def, min=0.5, max=1.0, step=0.05 }) => {
    const v = val(k, def);
    return (
      <tr>
        <td style={{ padding:'10px 12px', fontSize:12, color:'var(--text2)' }}>{label}</td>
        <td style={{ padding:'10px 12px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <input type="range" min={min} max={max} step={step} value={v}
              onChange={e => set(k, parseFloat(e.target.value))}
              style={{ width:180, accentColor:'var(--mint)' }} />
            <span style={{ fontSize:13, fontFamily:'var(--mono)', color:'var(--mint)', minWidth:36 }}>{Number(v).toFixed(2)}</span>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="card" style={{ marginBottom:28 }}>
      <div style={{ display:'flex', alignItems:'center', marginBottom:16 }}>
        <div style={{ fontWeight:600, fontSize:14 }}>영상 생성 기본값</div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button className="btn btn-ghost btn-sm" onClick={load}>새로고침</button>
          <button className="btn btn-primary btn-sm" disabled={saving || !changed} onClick={save}>
            {saving ? <><span className="spinner" style={{ width:10, height:10 }} /> 저장 중...</> : `저장${changed ? ` (${Object.keys(edits).length})` : ''}`}
          </button>
        </div>
      </div>
      {err && <div style={{ color:'var(--rose)', fontSize:12, marginBottom:12 }}>{err}</div>}
      {loading ? <div style={{ textAlign:'center', padding:40 }}><span className="spinner" /></div> : (
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign:'left', padding:'6px 12px', fontSize:11, color:'var(--text4)', borderBottom:'1px solid var(--border)', width:200 }}>항목</th>
              <th style={{ textAlign:'left', padding:'6px 12px', fontSize:11, color:'var(--text4)', borderBottom:'1px solid var(--border)' }}>값</th>
            </tr>
          </thead>
          <tbody>
            <SelectRow label="기본 샷 사이즈"     k="default_shot_size"    opts={SHOT_SIZE_OPTS}    def="MS" />
            <SelectRow label="기본 카메라 속도"   k="default_camera_speed" opts={SPEED_OPTS}         def="slow" />
            <SelectRow label="기본 렌즈"          k="default_lens_style"   opts={LENS_OPTS}          def="35mm" />
            <SelectRow label="기본 색보정"        k="default_color_grade"  opts={COLOR_GRADE_OPTS}   def="teal-orange" />
            <SelectRow label="기본 영상 모델"     k="default_video_model"  opts={VIDEO_MODEL_OPTS}   def="kling_v2.1_std" />
            <TextRow   label="기본 라이팅"        k="default_lighting"     placeholder="예) 부드러운 자연광, 오른쪽 림 라이트" />
            <tr><td colSpan={2} style={{ padding:'4px 12px', background:'var(--bg2)', fontSize:10, color:'var(--text4)', fontFamily:'var(--mono)', letterSpacing:'0.08em' }}>이미지 충실도 (cfg_scale)</td></tr>
            <SliderRow label="인물 컷 충실도"     k="cfg_scale_character"  def={0.75} />
            <SliderRow label="배경 컷 카메라 자유도" k="cfg_scale_background" def={0.65} />
          </tbody>
        </table>
      )}
    </div>
  );
};

export const Config = () => {
  const [config, setConfig] = React.useState(null);
  const [allowedKeys, setAllowedKeys] = React.useState([]);
  const [edits, setEdits] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/config');
      setConfig(data.config || {});
      setAllowedKeys(data.allowed_keys || []);
      setEdits({});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { load(); }, []);

  const save = async () => {
    if (Object.keys(edits).length === 0) return;
    setSaving(true);
    try {
      await api.patch('/config', { updates: edits });
      await load();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const reset = async (key) => {
    if (!confirm(`'${key}'를 기본값으로 초기화할까요?`)) return;
    try {
      await api.del(`/config/${key}`);
      await load();
    } catch (e) { alert(e.message); }
  };

  const current = { ...config, ...edits };

  const renderInput = (key, val) => {
    if (typeof val === 'boolean') {
      return (
        <select value={String(edits[key] ?? val)} onChange={e => setEdits(p => ({ ...p, [key]: e.target.value === 'true' }))}
          style={{ width: 100 }}>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    }
    if (typeof val === 'number') {
      return (
        <input type="number" value={edits[key] ?? val}
          onChange={e => setEdits(p => ({ ...p, [key]: Number(e.target.value) }))}
          style={{ width: 120 }} />
      );
    }
    return (
      <input type="text" value={edits[key] ?? val}
        onChange={e => setEdits(p => ({ ...p, [key]: e.target.value }))}
        style={{ width: 320 }} />
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
        <div className="page-title">설정</div>
        <div className="flex gap-8 ml-auto">
          <button className="btn btn-ghost btn-sm" onClick={load}>새로고침</button>
          <button className="btn btn-primary btn-sm" disabled={saving || Object.keys(edits).length === 0} onClick={save}>
            {saving ? <><span className="spinner" style={{ width: 10, height: 10 }} /> 저장 중...</> : `저장 (${Object.keys(edits).length}개 변경)`}
          </button>
        </div>
      </div>
      <div className="page-sub">Feature flag · Rate limit · 모델 기본값</div>

      <VideoDefaultsPanel />

      {loading ? <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner" /></div> : (
        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: 'var(--text4)', borderBottom: '1px solid var(--border)' }}>키</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: 'var(--text4)', borderBottom: '1px solid var(--border)' }}>값</th>
                <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}></th>
              </tr>
            </thead>
            <tbody>
              {allowedKeys.map(key => {
                const val = current[key];
                const changed = key in edits;
                return (
                  <tr key={key} style={{ background: changed ? 'color-mix(in srgb, var(--mint) 5%, transparent)' : 'transparent' }}>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: 12, color: changed ? 'var(--mint)' : 'var(--text2)' }}>{key}</td>
                    <td style={{ padding: '10px 12px' }}>{renderInput(key, val)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => reset(key)}>초기화</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
