import React from 'react';
import { Icon } from './Icons';
import { api } from '../api';

/* ── SSE POST ── */
const postSSE = async (url, body, onChunk, signal) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
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

/* ── 메시지 버블 ── */
const Bubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      <div style={{
        maxWidth: '78%',
        padding: '10px 14px',
        borderRadius: isUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
        background: isUser ? 'var(--mint)' : 'var(--surface)',
        border: isUser ? 'none' : '1px solid var(--border)',
        color: isUser ? '#0d1a14' : 'var(--text)',
        fontSize: 14, lineHeight: 1.7,
        whiteSpace: 'pre-wrap',
      }}>
        {msg.content}
      </div>
    </div>
  );
};

/* ── 이미지 결과 카드 ── */
const ImageResultCard = ({ item, pid }) => {
  const url = item.url?.startsWith('/api') ? item.url : api.mediaUrl(pid, item.url);
  return (
    <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-start' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', width: 220 }}>
        <img src={url} alt={item.name_ko} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
        <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="check" size={11} style={{ color: 'var(--mint)' }} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>{item.name_ko || '생성 완료'}</span>
          <span style={{ fontSize: 10, color: 'var(--text-4)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>저장됨</span>
        </div>
      </div>
    </div>
  );
};

/* ── 생성 중 인디케이터 ── */
const GeneratingCard = () => (
  <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderColor: 'var(--violet)', borderTopColor: 'transparent' }} />
      <span style={{ fontSize: 13, color: 'var(--text-3)' }}>이미지 생성 중...</span>
    </div>
  </div>
);

/* ── 채팅 패널 ── */
const ChatPanel = ({ pid, type }) => {
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [streamText, setStreamText] = React.useState('');
  const abortRef = React.useRef(null);
  const bottomRef = React.useRef(null);

  const endpoint = `/api/projects/${pid}/imagechat/${type}`;

  const placeholders = {
    character: '예: 30대 남성 직장인, 약간 지쳐 보이는 표정, 정장 차림',
    location: '예: 도심 카페, 저녁 시간, 따뜻한 조명, 아늑한 분위기',
  };

  const welcomes = {
    character: '안녕하세요! 어떤 캐릭터를 만들어 드릴까요?\n성별, 나이, 외모 특징을 편하게 말씀해 주세요.',
    location: '안녕하세요! 어떤 배경을 만들어 드릴까요?\n장소, 시간대, 분위기를 편하게 말씀해 주세요.',
  };

  // 탭 변경 시 초기화
  React.useEffect(() => {
    setMessages([{ role: 'assistant', content: welcomes[type], _welcome: true }]);
    setInput('');
    setStreamText('');
    setGenerating(false);
  }, [type]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText, generating]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const history = messages
      .filter(m => !m._welcome && !m._image)
      .map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setStreamText('');

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    let aiText = '';
    let gotImage = null;

    try {
      await postSSE(endpoint, { message: text, history, model: 'gpt-image-1' }, (obj) => {
        if (obj.type === 'message') {
          aiText = obj.text;
          setStreamText(aiText);
        } else if (obj.type === 'generating') {
          setGenerating(true);
          setStreamText('');
          if (aiText) {
            setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
            aiText = '';
          }
        } else if (obj.type === 'image_done') {
          gotImage = obj;
          setGenerating(false);
        } else if (obj.type === 'error') {
          setGenerating(false);
          setMessages(prev => [...prev,
            { role: 'assistant', content: `오류가 발생했어요: ${obj.message}` }
          ]);
        } else if (obj.type === 'done') {
          setGenerating(false);
          if (aiText) {
            setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
            aiText = '';
          }
          if (gotImage) {
            setMessages(prev => [...prev, { role: 'assistant', _image: true, ...gotImage }]);
          }
          setStreamText('');
        }
      }, ctrl.signal);
    } catch (e) {
      if (e.name !== 'AbortError') {
        setMessages(prev => [...prev, { role: 'assistant', content: '오류가 발생했어요. 다시 시도해 주세요.' }]);
      }
      setGenerating(false);
      setStreamText('');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 메시지 목록 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {messages.map((msg, i) => (
          msg._image
            ? <ImageResultCard key={i} item={msg} pid={pid} />
            : <Bubble key={i} msg={msg} />
        ))}
        {streamText && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
            <div style={{ maxWidth: '78%', padding: '10px 14px', borderRadius: '4px 14px 14px 14px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {streamText}
              <span style={{ display: 'inline-block', width: 8, height: 14, background: 'var(--mint)', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'blink 1s step-end infinite' }} />
            </div>
          </div>
        )}
        {generating && <GeneratingCard />}
        {loading && !streamText && !generating && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
            <div style={{ padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px 14px 14px 14px', display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--mint)', display: 'inline-block', animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div style={{ padding: '12px 20px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-2)' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '8px 8px 8px 14px', transition: 'border-color 0.15s' }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(0,212,160,0.5)'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={placeholders[type]}
            rows={2}
            disabled={loading}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 14, lineHeight: 1.6, resize: 'none', fontFamily: 'inherit' }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            style={{ width: 36, height: 36, borderRadius: '50%', background: loading || !input.trim() ? 'var(--surface-2)' : 'var(--mint)', border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
            <Icon name="arrow-up" size={16} style={{ color: loading || !input.trim() ? 'var(--text-4)' : '#0d1a14' }} />
          </button>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-4)', paddingLeft: 4 }}>
          Enter로 전송 · Shift+Enter 줄바꿈 · 생성된 이미지는 자동 저장됩니다
        </div>
      </div>
    </div>
  );
};

/* ── 메인 뷰 ── */
export const ImageGenChatView = ({ project }) => {
  const [tab, setTab] = React.useState('character');
  const pid = project?.id;

  const tabs = [
    { id: 'character', icon: 'user', label: '캐릭터' },
    { id: 'location', icon: 'camera', label: '배경' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* 탭 헤더 */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-2)', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '14px 20px', fontSize: 13, fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? 'var(--mint)' : 'var(--text-3)', background: 'transparent', border: 'none', borderBottom: tab === t.id ? '2px solid var(--mint)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, transition: 'color 0.15s', marginBottom: -1 }}>
            <Icon name={t.icon} size={14} />
            {t.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', padding: '0 4px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="sparkles" size={11} style={{ color: 'var(--violet)' }} />
            LLM 대화로 이미지 생성
          </div>
        </div>
      </div>

      {/* 채팅 영역 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ChatPanel key={tab} pid={pid} type={tab} />
      </div>

      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
      `}</style>
    </div>
  );
};
