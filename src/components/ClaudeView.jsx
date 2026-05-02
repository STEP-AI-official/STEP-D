import React from 'react';
import { Icon } from './Icons';
import { claudeApi } from '../api';

/* ── 메시지 버블 ── */
const Bubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      {!isUser && (
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--violet-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 8, marginTop: 2 }}>
          <Icon name="message-square" size={13} style={{ color: 'var(--violet)' }} />
        </div>
      )}
      <div style={{
        maxWidth: '76%',
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

/* ── 메인 뷰 ── */
export const ClaudeView = ({ standalone = false }) => {
  const [messages, setMessages] = React.useState([
    { role: 'assistant', content: '안녕하세요! Claude입니다. 시나리오 작성, 아이디어 구체화, 대사 교정 등 무엇이든 도와드릴게요.' },
  ]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [streamText, setStreamText] = React.useState('');
  const abortRef = React.useRef(null);
  const bottomRef = React.useRef(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const userMsg = { role: 'user', content: text };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setStreamText('');

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    let aiText = '';

    try {
      await claudeApi.chatSSE(
        { message: text, history },
        (obj) => {
          if (obj.type === 'message') {
            aiText = obj.text;
            setStreamText(aiText);
          } else if (obj.type === 'done') {
            setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
            setStreamText('');
            aiText = '';
          } else if (obj.type === 'error') {
            setMessages(prev => [...prev, { role: 'assistant', content: `오류가 발생했어요: ${obj.message}` }]);
            setStreamText('');
          }
        },
        ctrl.signal,
      );
    } catch (e) {
      if (e.name !== 'AbortError') {
        setMessages(prev => [...prev, { role: 'assistant', content: '오류가 발생했어요. 다시 시도해 주세요.' }]);
      }
      setStreamText('');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const handleClear = () => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([{ role: 'assistant', content: '안녕하세요! Claude입니다. 시나리오 작성, 아이디어 구체화, 대사 교정 등 무엇이든 도와드릴게요.' }]);
    setInput('');
    setStreamText('');
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: standalone ? '100vh' : '100%', overflow: 'hidden', background: standalone ? 'var(--bg)' : undefined }}>
      {/* 헤더 */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-2)', padding: standalone ? '0 32px' : '0 24px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, height: standalone ? 56 : 50 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--violet-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="message-square" size={14} style={{ color: 'var(--violet)' }} />
        </div>
        <div>
          <div style={{ fontSize: standalone ? 15 : 13, fontWeight: 700 }}>Claude</div>
          <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: -1 }}>Anthropic · AI 어시스턴트</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {standalone && (
            <a href="/" style={{ fontSize: 11, color: 'var(--text-4)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-2)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}>
              <Icon name="home" size={12} />
              STEP D
            </a>
          )}
          <button
            onClick={handleClear}
            title="대화 초기화"
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: 'var(--text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--mint)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <Icon name="refresh" size={11} />
            초기화
          </button>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: standalone ? '24px max(24px, calc(50vw - 380px))' : '20px 24px' }}>
        {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}

        {streamText && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--violet-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 8, marginTop: 2 }}>
              <Icon name="message-square" size={13} style={{ color: 'var(--violet)' }} />
            </div>
            <div style={{ maxWidth: '76%', padding: '10px 14px', borderRadius: '4px 14px 14px 14px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {streamText}
              <span style={{ display: 'inline-block', width: 8, height: 14, background: 'var(--violet)', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'blink 1s step-end infinite' }} />
            </div>
          </div>
        )}

        {loading && !streamText && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--violet-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 8 }}>
              <Icon name="message-square" size={13} style={{ color: 'var(--violet)' }} />
            </div>
            <div style={{ padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px 14px 14px 14px', display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--violet)', display: 'inline-block', animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div style={{ padding: standalone ? '12px max(20px, calc(50vw - 380px)) 24px' : '12px 20px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-2)' }}>
        <div
          style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '8px 8px 8px 14px', transition: 'border-color 0.15s' }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Claude에게 무엇이든 물어보세요..."
            rows={2}
            disabled={loading}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 14, lineHeight: 1.6, resize: 'none', fontFamily: 'inherit' }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            style={{ width: 36, height: 36, borderRadius: '50%', background: loading || !input.trim() ? 'var(--surface-2)' : 'var(--violet)', border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}
          >
            <Icon name="arrow-up" size={16} style={{ color: loading || !input.trim() ? 'var(--text-4)' : '#fff' }} />
          </button>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-4)', paddingLeft: 4 }}>
          Enter로 전송 · Shift+Enter 줄바꿈
        </div>
      </div>

      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
      `}</style>
    </div>
  );
};
