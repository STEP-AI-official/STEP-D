import React from 'react';
import { Icon } from './Icons';
import { api } from '../api';

/* ── SSE POST ── */
const postSSE = async (url, body, onChunk) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const parts = buf.split('\n\n');
    buf = parts.pop();
    for (const part of parts) {
      const line = part.replace(/^data:\s*/, '').trim();
      if (!line) continue;
      try { onChunk(JSON.parse(line)); } catch {}
    }
  }
};

/* ── WebSocket 훅 ── */
const useChatWS = (pid) => {
  const wsRef = React.useRef(null);
  const listenerRef = React.useRef(null);

  const connect = React.useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/api/projects/${pid}/preproduction/chat/ws`);
    ws.onmessage = (e) => { try { listenerRef.current?.(JSON.parse(e.data)); } catch {} };
    ws.onerror = () => {};
    wsRef.current = ws;
  }, [pid]);

  React.useEffect(() => { connect(); return () => wsRef.current?.close(); }, [connect]);

  const send = React.useCallback((body, onEvent) => new Promise((resolve, reject) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) { reject(new Error('WS not open')); return; }
    listenerRef.current = (obj) => {
      onEvent(obj);
      if (obj.type === 'done' || obj.type === 'error') { listenerRef.current = null; resolve(); }
    };
    ws.send(JSON.stringify(body));
  }), []);

  return { send };
};

/* ── 메시지 버블 ── */
const Bubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 10,
    }}>
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginRight: 8, marginTop: 2,
          background: 'linear-gradient(135deg, #00d4a0, #7c6ff7)',
          display: 'grid', placeItems: 'center',
        }}>
          <Icon name="sparkles" size={12} style={{ color: '#fff' }} />
        </div>
      )}
      <div style={{
        maxWidth: '72%',
        padding: '10px 14px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
        background: isUser ? '#00d4a0' : 'rgba(255,255,255,0.06)',
        border: isUser ? 'none' : '1px solid rgba(255,255,255,0.08)',
        color: isUser ? '#0a1a13' : 'rgba(255,255,255,0.88)',
        fontSize: 14,
        lineHeight: 1.7,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {msg.content}
        {msg._streaming && (
          <span style={{ display: 'inline-block', width: 8, height: 14, background: '#00d4a0', borderRadius: 1, marginLeft: 3, verticalAlign: 'text-bottom', animation: 'blink 0.8s step-end infinite' }} />
        )}
      </div>
    </div>
  );
};

/* ── 기획 완료 카드 ── */
const DocCard = ({ doc, shortTitle, setShortTitle, onConfirm, creating }) => (
  <div style={{
    border: '1px solid rgba(0,212,160,0.3)',
    borderRadius: 14,
    background: 'rgba(0,212,160,0.05)',
    overflow: 'hidden',
    margin: '4px 0 8px',
  }}>
    <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(0,212,160,0.15)', display: 'flex', alignItems: 'center', gap: 7 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,212,160,0.2)', display: 'grid', placeItems: 'center' }}>
        <Icon name="check" size={10} style={{ color: '#00d4a0' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#00d4a0', letterSpacing: '0.04em' }}>기획 완료</span>
    </div>
    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[['제목', doc.title], ['장르', doc.genre], ['톤', doc.tone], ['주제', doc.theme], ['로그라인', doc.logline]].filter(([, v]) => v).map(([label, val]) => (
        <div key={label}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 3 }}>{label}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 }}>{val}</div>
        </div>
      ))}
      {doc.characters?.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 6 }}>등장인물</div>
          {doc.characters.map((c, i) => (
            <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 4, display: 'flex', gap: 6, alignItems: 'baseline' }}>
              <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{c.name}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>·</span>
              <span style={{ color: 'rgba(255,255,255,0.55)' }}>{c.role}</span>
              {c.want && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>— {c.want}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
    <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(0,212,160,0.12)', display: 'flex', gap: 8 }}>
      <input
        value={shortTitle}
        onChange={e => setShortTitle(e.target.value)}
        placeholder={doc.title || '다큐 제목...'}
        style={{
          flex: 1, padding: '8px 12px', fontSize: 13,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, outline: 'none',
          color: 'rgba(255,255,255,0.88)',
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(0,212,160,0.5)'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
      />
      <button className="btn primary" style={{ borderRadius: 8, whiteSpace: 'nowrap', flexShrink: 0 }} onClick={onConfirm} disabled={creating}>
        {creating
          ? <><span className="spinner" style={{ width: 11, height: 11, borderWidth: 1.5 }} />생성 중</>
          : <><Icon name="sparkles" size={13} />시나리오 생성</>}
      </button>
    </div>
  </div>
);

/* ── 추천 칩 ── */
const Chips = ({ items, onSelect, disabled }) => (
  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '8px 16px 4px' }}>
    {items.map((s, i) => (
      <button
        key={i}
        disabled={disabled}
        onClick={() => onSelect(s)}
        style={{
          padding: '5px 13px', fontSize: 12,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 20, cursor: 'pointer',
          color: 'rgba(255,255,255,0.6)',
          transition: 'all 0.12s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,160,0.5)'; e.currentTarget.style.color = '#00d4a0'; e.currentTarget.style.background = 'rgba(0,212,160,0.07)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
      >
        {s}
      </button>
    ))}
  </div>
);

/* ── 입력창 ── */
const ChatInput = ({ onSend, disabled }) => {
  const [text, setText] = React.useState('');
  const ref = React.useRef(null);

  const submit = () => {
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t);
    setText('');
    if (ref.current) ref.current.style.height = '42px';
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const onInput = (e) => {
    const el = e.currentTarget;
    el.style.height = '42px';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
    setText(el.value);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', gap: 8,
      padding: '10px 14px',
      background: 'rgba(255,255,255,0.03)',
      borderTop: '1px solid rgba(255,255,255,0.07)',
    }}>
      <textarea
        ref={ref}
        value={text}
        onInput={onInput}
        onChange={e => setText(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        placeholder={disabled ? '대기 중...' : '메시지를 입력하세요... (Shift+Enter로 줄바꿈)'}
        rows={1}
        style={{
          flex: 1, resize: 'none', outline: 'none',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          color: 'rgba(255,255,255,0.88)',
          fontSize: 14, lineHeight: 1.5,
          padding: '10px 14px',
          height: 42, minHeight: 42, maxHeight: 140,
          fontFamily: 'inherit',
          caretColor: '#00d4a0',
          transition: 'border-color 0.15s',
          boxSizing: 'border-box',
          overflowY: 'auto',
          opacity: disabled ? 0.5 : 1,
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(0,212,160,0.45)'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
      />
      <button
        onClick={submit}
        disabled={disabled || !text.trim()}
        style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: text.trim() && !disabled ? '#00d4a0' : 'rgba(255,255,255,0.07)',
          border: 'none', cursor: text.trim() && !disabled ? 'pointer' : 'default',
          display: 'grid', placeItems: 'center',
          color: text.trim() && !disabled ? '#0a1a13' : 'rgba(255,255,255,0.25)',
          transition: 'background 0.15s, color 0.15s',
          marginBottom: 1,
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  );
};

/* ── 채팅 ── */
const ChatArea = ({ pid, sources, onShortCreated }) => {
  const [messages, setMessages]       = React.useState([]);
  const [suggestions, setSuggestions] = React.useState([]);
  const [typing, setTyping]           = React.useState(false);
  const [streamText, setStreamText]   = React.useState('');
  const [doc, setDoc]                 = React.useState(null);
  const [shortTitle, setShortTitle]   = React.useState('');
  const [creating, setCreating]       = React.useState(false);
  const [error, setError]             = React.useState(null);
  const initCalled = React.useRef(false);
  const bottomRef = React.useRef(null);
  const { send: wsSend } = useChatWS(pid);

  const displayMessages = React.useMemo(() => {
    if (!streamText) return messages;
    return [...messages, { role: 'assistant', content: streamText, _streaming: true }];
  }, [messages, streamText]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages, suggestions, doc]);

  React.useEffect(() => {
    if (initCalled.current) return;
    initCalled.current = true;
    sendMessage('__init__', true);
  }, []);

  const sendMessage = React.useCallback(async (text, isInit = false) => {
    if (typing) return;
    if (!isInit) {
      setMessages(prev => [...prev, { role: 'user', content: text }]);
      setSuggestions([]);
    }
    setTyping(true);
    setStreamText('');
    setError(null);

    let full = '', finalDoc = null, finalSugg = [];
    const urls = sources.map(s => s.url);
    const body = { message: isInit ? '__init__' : text, ...(urls.length ? { urls } : {}) };

    const onEvent = (obj) => {
      if (obj.type === 'message')     { full += obj.text || ''; setStreamText(full); }
      if (obj.type === 'suggestions') { finalSugg = obj.items || []; }
      if (obj.type === 'doc_ready')   { finalDoc = obj.doc; }
    };

    try {
      await wsSend(body, onEvent);
    } catch {
      try { await postSSE(`/api/projects/${pid}/preproduction/chat`, body, onEvent); }
      catch (e) { setError(e.message); }
    }

    setStreamText('');
    setTyping(false);
    if (full) setMessages(prev => [...prev, { role: 'assistant', content: full }]);
    if (finalSugg.length) setSuggestions(finalSugg);
    if (finalDoc) { setDoc(finalDoc); setShortTitle(finalDoc.title || ''); }
  }, [pid, typing, sources, wsSend]);

  const createShort = async () => {
    setCreating(true);
    try {
      const short = await api.post(`/api/projects/${pid}/shorts`, {
        title: shortTitle.trim() || doc?.title || '새 다큐',
        preproduction_doc: {
          ...doc,
          chat_history: messages.map(m => ({ role: m.role, content: m.content })),
        },
      });
      onShortCreated(short);
    } catch (e) { setError(e.message); setCreating(false); }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {sources.length > 0 && (
        <div style={{ padding: '5px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 5, flexWrap: 'wrap', flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', alignSelf: 'center' }}>참고:</span>
          {sources.map(s => (
            <span key={s.url} style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, color: 'rgba(255,255,255,0.45)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.url.replace(/^https?:\/\/(www\.)?/, '')}
            </span>
          ))}
        </div>
      )}

      {/* 메시지 목록 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
        {displayMessages.map((m, i) => (
          <Bubble key={i} msg={m} />
        ))}

        {/* 타이핑 인디케이터 */}
        {typing && !streamText && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #00d4a0, #7c6ff7)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name="sparkles" size={12} style={{ color: '#fff' }} />
            </div>
            <div style={{ display: 'flex', gap: 4, padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px 18px 18px 18px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4a0', animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {/* 기획 완료 카드 */}
        {doc && (
          <div style={{ marginLeft: 36 }}>
            <DocCard doc={doc} shortTitle={shortTitle} setShortTitle={setShortTitle} onConfirm={createShort} creating={creating} />
          </div>
        )}

        {/* 에러 */}
        {error && (
          <div style={{ padding: '8px 12px', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 10, fontSize: 12, color: '#ff7070', marginBottom: 8 }}>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 추천 칩 */}
      {suggestions.length > 0 && !doc && (
        <Chips items={suggestions} onSelect={sendMessage} disabled={typing} />
      )}

      {/* 입력창 */}
      {!doc && <ChatInput onSend={sendMessage} disabled={typing} />}
    </div>
  );
};

/* ── 소스 패널 ── */
const SourcePanel = ({ pid, sources, setSources, onStartChat }) => {
  const [urlInput, setUrlInput] = React.useState('');
  const [error, setError] = React.useState(null);

  const addSource = async () => {
    const url = urlInput.trim();
    if (!url || sources.find(s => s.url === url)) { setUrlInput(''); return; }
    const isYt = url.includes('youtube.com') || url.includes('youtu.be');
    setSources(prev => [...prev, { url, type: isYt ? 'youtube' : 'webpage', analyzing: true, analysis: null }]);
    setUrlInput(''); setError(null);
    try {
      let text = '';
      await postSSE(`/api/projects/${pid}/preproduction/analyze-url/stream`, { url }, (obj) => {
        if (obj.type === 'analysis') text = obj.text || '';
        if (obj.type === 'error') throw new Error(obj.message);
      });
      setSources(prev => prev.map(s => s.url === url ? { ...s, analyzing: false, analysis: text } : s));
    } catch {
      setError(`분석 실패: ${url}`);
      setSources(prev => prev.map(s => s.url === url ? { ...s, analyzing: false, error: true } : s));
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px' }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: 'rgba(255,255,255,0.9)' }}>참고 소스 추가</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16, lineHeight: 1.6 }}>유튜브 영상이나 기사 URL을 붙여넣으면 AI가 분석해 기획에 반영합니다.</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addSource(); }}
          placeholder="https://youtube.com/watch?v=..."
          style={{ flex: 1, padding: '9px 14px', fontSize: 13, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, outline: 'none', color: 'rgba(255,255,255,0.88)' }}
          onFocus={e => e.target.style.borderColor = 'rgba(0,212,160,0.45)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <button className="btn sm" onClick={addSource} disabled={!urlInput.trim()}>추가</button>
      </div>
      {sources.map(s => (
        <div key={s.url} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12, marginBottom: 6 }}>
          <Icon name={s.type === 'youtube' ? 'video' : 'doc'} size={12} style={{ color: '#00d4a0', flexShrink: 0 }} />
          <span style={{ flex: 1, color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.url}</span>
          {s.analyzing && <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />}
          {s.analysis && <Icon name="check" size={11} style={{ color: '#00d4a0' }} />}
          {!s.analyzing && <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.3)' }} onClick={() => setSources(p => p.filter(x => x.url !== s.url))}><Icon name="x" size={11} /></button>}
        </div>
      ))}
      {error && <div style={{ fontSize: 12, color: '#ff7070', marginBottom: 8 }}>{error}</div>}
      <div style={{ marginTop: 'auto' }}>
        <button
          className="btn primary"
          style={{ width: '100%', justifyContent: 'center' }}
          disabled={!(sources.length > 0 && sources.every(s => !s.analyzing))}
          onClick={onStartChat}
        >
          <Icon name="sparkles" size={14} />
          {sources.some(s => s.analyzing) ? '분석 중...' : '이 소스로 기획 시작'}
        </button>
      </div>
    </div>
  );
};

/* ── 모드 선택 ── */
const ModeSelect = ({ onSelect }) => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #00d4a0, #7c6ff7)', display: 'grid', placeItems: 'center', marginBottom: 18, boxShadow: '0 4px 24px rgba(0,212,160,0.25)' }}>
      <Icon name="sparkles" size={22} style={{ color: '#fff' }} />
    </div>
    <div style={{ fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.92)', marginBottom: 6 }}>어떻게 시작할까요?</div>
    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>AI와 대화하거나 참고 자료를 가져오세요</div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 400 }}>
      {[
        { mode: 'chat',   icon: 'sparkles', accent: '#00d4a0', title: 'AI와 대화',     desc: '장르·캐릭터·플롯을 단계별로 설계' },
        { mode: 'source', icon: 'layers',   accent: '#7c6ff7', title: '소스 가져오기', desc: 'YouTube·기사 URL 기반으로 기획' },
      ].map(({ mode, icon, accent, title, desc }) => (
        <button
          key={mode}
          onClick={() => onSelect(mode)}
          style={{ padding: '18px 16px', textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, cursor: 'pointer', transition: 'all 0.12s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = accent + '60'; e.currentTarget.style.background = `${accent}10`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'none'; }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}18`, display: 'grid', placeItems: 'center', marginBottom: 10 }}>
            <Icon name={icon} size={17} style={{ color: accent }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.88)', marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{desc}</div>
        </button>
      ))}
    </div>
  </div>
);

/* ── CSS 애니메이션 주입 ── */
const injectStyles = () => {
  if (document.getElementById('ppc-styles')) return;
  const el = document.createElement('style');
  el.id = 'ppc-styles';
  el.textContent = `
    @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
    @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }
  `;
  document.head.appendChild(el);
};

/* ── 메인 ── */
export const PreProductionChat = ({ project, onShortCreated, onClose }) => {
  const [mode, setMode]               = React.useState(null);
  const [sources, setSources]         = React.useState([]);
  const [chatStarted, setChatStarted] = React.useState(false);

  React.useEffect(() => { injectStyles(); }, []);

  const pid = project?.id;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(680px, 96vw)', height: 'min(740px, 92vh)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          background: 'oklch(0.1 0.005 260)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 20,
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* 헤더 */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {mode && (
            <button
              className="btn ghost icon sm"
              onClick={() => { setMode(null); setChatStarted(false); setSources([]); }}
              style={{ marginRight: 2 }}
            >
              <Icon name="chevron-left" size={15} />
            </button>
          )}
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #00d4a0, #7c6ff7)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icon name="sparkles" size={13} style={{ color: '#fff' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>AI 기획 어시스턴트</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project?.title}</div>
          </div>
          <button className="btn ghost icon sm" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>

        {!mode && <ModeSelect onSelect={setMode} />}
        {mode === 'source' && !chatStarted && (
          <SourcePanel pid={pid} sources={sources} setSources={setSources} onStartChat={() => { setChatStarted(true); setMode('chat'); }} />
        )}
        {mode === 'chat' && (
          <ChatArea key="chat" pid={pid} sources={sources} onShortCreated={onShortCreated} />
        )}
      </div>
    </div>
  );
};
