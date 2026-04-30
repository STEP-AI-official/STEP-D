import React from 'react';

const ANIM_CSS = `
@keyframes contact-fade-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
@keyframes contact-fade-in { from{opacity:0} to{opacity:1} }
.contact-input::placeholder { color: rgba(255,255,255,0.3); }
.contact-input:focus { border-color: var(--mint) !important; background: rgba(255,255,255,0.09) !important; }
`;

const PROJECT_TYPES = ['AI SaaS', 'Automation', 'Branding', 'AI Commercial', '기타'];
const STAGES       = ['아이디어 단계', '기획 완료', '제작 중', 'PoC 필요', '운영 고도화'];
const SCHEDULES    = ['1개월 이내', '1~3개월', '3~6개월', '6개월 이상'];
const BUDGETS      = ['1천만원 미만', '1천~3천만원', '3천~1억원', '1억원 이상'];

/* ── 드롭다운 ── */
const Select = ({ label, options, value, onChange, placeholder }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} ref={ref}>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: 'relative' }}>
        <div onClick={() => setOpen(o => !o)} style={{
          ...inputStyle, cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          color: value ? '#fff' : 'rgba(255,255,255,0.35)',
        }}>
          <span>{value || placeholder}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text-4)', flexShrink: 0 }}>
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
        {open && (
          <div style={{
            position: 'absolute', left: 0, right: 0, top: 'calc(100% + 6px)',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            zIndex: 50, overflow: 'hidden',
            animation: 'contact-fade-up 0.15s ease both',
          }}>
            {options.map(opt => (
              <div key={opt} onClick={() => { onChange(opt); setOpen(false); }}
                style={{
                  padding: '11px 16px', fontSize: 13, cursor: 'pointer',
                  color: 'var(--text-2)', transition: 'background 0.12s',
                  background: value === opt ? 'color-mix(in oklch, var(--mint) 8%, transparent)' : 'transparent',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
                onMouseLeave={e => e.currentTarget.style.background = value === opt ? 'color-mix(in oklch, var(--mint) 8%, transparent)' : 'transparent'}
              >{opt}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── 스타일 상수 ── */
const labelStyle = {
  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.12em', color: 'var(--text-3)',
};
const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 8,
  padding: '10px 14px', fontSize: 13, color: '#fff',
  outline: 'none', transition: 'border-color 0.15s',
  boxSizing: 'border-box',
};
const chipBase = {
  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.1em', padding: '4px 0',
  background: 'none', border: 'none', borderBottom: '2px solid transparent',
  cursor: 'pointer', transition: 'all 0.15s',
};

export const ContactPage = ({ onClose }) => {
  const [types,    setTypes]    = React.useState([]);
  const [stage,    setStage]    = React.useState('');
  const [schedule, setSchedule] = React.useState('');
  const [budget,   setBudget]   = React.useState('');
  const [links,    setLinks]    = React.useState([]);
  const [curLink,  setCurLink]  = React.useState('');
  const [company,  setCompany]  = React.useState('');
  const [contact,  setContact]  = React.useState('');
  const [email,    setEmail]    = React.useState('');
  const [phone,    setPhone]    = React.useState('');
  const [desc,     setDesc]     = React.useState('');
  const [status,   setStatus]   = React.useState('idle'); // idle | submitting | success | error
  const [errMsg,   setErrMsg]   = React.useState('');

  const toggleType = t => setTypes(prev =>
    prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
  );

  const addLink = () => {
    if (curLink.trim() && links.length < 3) {
      setLinks(l => [...l, curLink.trim()]);
      setCurLink('');
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!company || !contact || !email) {
      alert('필수 항목(회사명, 담당자명, 이메일)을 입력해주세요.');
      return;
    }
    setStatus('submitting');
    setErrMsg('');
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: company, contactName: contact,
          email, phone, projectTypes: types, stage, schedule, budget, description: desc, links,
        }),
      });
      setStatus('success');
      setCompany(''); setContact(''); setEmail(''); setPhone('');
      setDesc(''); setTypes([]); setStage(''); setSchedule(''); setBudget(''); setLinks([]);
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err) {
      setStatus('error');
      setErrMsg(err.message || '오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'var(--bg)', overflowY: 'auto',
      animation: 'contact-fade-in 0.25s ease both',
    }}>
      <style>{ANIM_CSS}</style>

      {/* 닫기 버튼 */}
      <button onClick={onClose} style={{
        position: 'fixed', top: 20, right: 24, zIndex: 201,
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
        fontSize: 12, fontWeight: 600, color: 'var(--text-3)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
        닫기
      </button>

      <section style={{ padding: '80px 24px 80px', maxWidth: 1100, margin: '0 auto' }}>

        {/* 헤더 */}
        <div style={{ marginBottom: 64, animation: 'contact-fade-up 0.5s ease both' }}>
          <h1 style={{
            fontSize: 'clamp(2.8rem, 6vw, 4.5rem)', fontWeight: 900,
            letterSpacing: '-0.04em', lineHeight: 1, margin: '0 0 16px',
            color: 'var(--text)',
          }}>Contact Us</h1>
          <p style={{ fontSize: 16, color: 'var(--text-4)', margin: 0 }}>새로운 가능성을 함께 실행합니다.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'clamp(180px, 25%, 300px) 1fr',
          gap: 'clamp(32px, 6vw, 96px)',
          alignItems: 'start',
        }}>

          {/* 왼쪽 안내 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48, animation: 'contact-fade-up 0.5s 0.1s ease both', opacity: 0, animationFillMode: 'forwards' }}>
            <div>
              <h3 style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 16 }}>프로젝트 문의</h3>
              <p style={{ fontSize: 13, color: 'var(--text-4)', lineHeight: 1.8, margin: 0 }}>
                간단한 정보만 남겨주시면<br />
                검토 후 개별적으로 회신드립니다.<br /><br />
                제공해주신 정보와 자료는<br />
                문의 응대 목적 외 사용하지 않습니다.
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 16 }}>이메일 문의</h3>
              <p style={{ fontSize: 13, color: 'var(--text-4)', lineHeight: 1.8, margin: 0 }}>
                이메일이 편하시다면<br />
                <a href="mailto:contact@stepai.kr" style={{ color: 'var(--mint)', fontWeight: 700, textDecoration: 'none' }}>
                  contact@stepai.kr
                </a>로 문의주세요.
              </p>
            </div>
          </div>

          {/* 오른쪽 폼 */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 40, animation: 'contact-fade-up 0.5s 0.2s ease both', opacity: 0, animationFillMode: 'forwards' }}>

            {/* 회사명 / 담당자명 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={labelStyle}>회사명 (필수)</label>
                <input value={company} onChange={e => setCompany(e.target.value)} required
                  placeholder="Company Name" className="contact-input" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={labelStyle}>담당자명 (필수)</label>
                <input value={contact} onChange={e => setContact(e.target.value)} required
                  placeholder="Contact Name" className="contact-input" style={inputStyle} />
              </div>
            </div>

            {/* 이메일 / 연락처 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={labelStyle}>이메일 (필수)</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="Email Address" className="contact-input" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={labelStyle}>연락처 (선택)</label>
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="Phone Number" className="contact-input" style={inputStyle} />
              </div>
            </div>

            {/* 프로젝트 유형 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={labelStyle}>프로젝트 유형 (복수 선택)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 32px' }}>
                {PROJECT_TYPES.map(t => (
                  <button key={t} type="button" onClick={() => toggleType(t)} style={{
                    ...chipBase,
                    borderBottomColor: types.includes(t) ? 'var(--mint)' : 'transparent',
                    color: types.includes(t) ? 'var(--text)' : 'var(--text-4)',
                  }}
                    onMouseEnter={e => { if (!types.includes(t)) e.currentTarget.style.color = 'var(--text-3)'; }}
                    onMouseLeave={e => { if (!types.includes(t)) e.currentTarget.style.color = 'var(--text-4)'; }}
                  >{t}</button>
                ))}
              </div>
            </div>

            {/* 진행 단계 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={labelStyle}>현재 진행 단계</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 32px' }}>
                {STAGES.map(s => (
                  <button key={s} type="button" onClick={() => setStage(s)} style={{
                    ...chipBase,
                    borderBottomColor: stage === s ? 'var(--mint)' : 'transparent',
                    color: stage === s ? 'var(--text)' : 'var(--text-4)',
                  }}
                    onMouseEnter={e => { if (stage !== s) e.currentTarget.style.color = 'var(--text-3)'; }}
                    onMouseLeave={e => { if (stage !== s) e.currentTarget.style.color = 'var(--text-4)'; }}
                  >{s}</button>
                ))}
              </div>
            </div>

            {/* 일정 / 예산 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
              <Select label="프로젝트 예상 일정" options={SCHEDULES} value={schedule} onChange={setSchedule} placeholder="일정 선택" />
              <Select label="예산 범위" options={BUDGETS} value={budget} onChange={setBudget} placeholder="예산 선택" />
            </div>

            {/* 문의 내용 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={labelStyle}>문의 내용</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)}
                placeholder="Project description"
                rows={4}
                className="contact-input"
                style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }} />
            </div>

            {/* 참고 링크 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
                <span>참고 링크 (최대 3개)</span>
                <span style={{ color: 'var(--text-4)' }}>{links.length}/3</span>
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="url" placeholder="https://..." value={curLink}
                  onChange={e => setCurLink(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }}
                  disabled={links.length >= 3}
                  className="contact-input"
                  style={{ ...inputStyle, flex: 1, opacity: links.length >= 3 ? 0.4 : 1 }} />
                <button type="button" onClick={addLink} disabled={!curLink.trim() || links.length >= 3}
                  style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: '0 4px', whiteSpace: 'nowrap', opacity: (!curLink.trim() || links.length >= 3) ? 0.3 : 1 }}>
                  Add
                </button>
              </div>
              {links.map((link, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface)', borderRadius: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{link}</span>
                  <button type="button" onClick={() => setLinks(l => l.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 4, flexShrink: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              ))}
            </div>

            {/* 제출 버튼 */}
            <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <button type="submit" disabled={status === 'submitting'} style={{
                background: status === 'submitting' ? 'var(--surface-2)' : 'var(--text)',
                color: 'var(--bg)', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.12em',
                borderRadius: 999, padding: '14px 48px', border: 'none',
                cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
                opacity: status === 'submitting' ? 0.7 : 1,
                transition: 'background 0.2s',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
                onMouseEnter={e => { if (status !== 'submitting') e.currentTarget.style.background = 'var(--mint)'; }}
                onMouseLeave={e => { if (status !== 'submitting') e.currentTarget.style.background = 'var(--text)'; }}
              >
                {status === 'submitting' ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin-anim 0.6s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    Submitting...
                  </>
                ) : 'Submit'}
              </button>

              {status === 'success' && (
                <p style={{ fontSize: 13, color: 'var(--mint)', fontWeight: 500, margin: 0 }}>
                  성공적으로 제출되었습니다. 검토 후 연락드리겠습니다.
                </p>
              )}
              {status === 'error' && (
                <p style={{ fontSize: 13, color: 'var(--rose)', fontWeight: 500, margin: 0 }}>
                  {errMsg}
                </p>
              )}
            </div>

          </form>
        </div>
      </section>
    </div>
  );
};
