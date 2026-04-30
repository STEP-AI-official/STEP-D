import React from 'react';
import { api } from '../api.js';

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
