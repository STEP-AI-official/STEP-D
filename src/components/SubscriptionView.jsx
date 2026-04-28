import React from 'react';
import { Icon } from './Icons';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '₩0',
    period: '영구 무료',
    color: 'text-3',
    accent: 'border',
    badge: null,
    features: [
      { ok: true,  text: '프로젝트 3개까지' },
      { ok: true,  text: '다큐 편당 씬 5개 제한' },
      { ok: true,  text: 'AI 시나리오 생성 월 10회' },
      { ok: true,  text: '등장인물 캐릭터 2명까지' },
      { ok: true,  text: '720p 영상 내보내기' },
      { ok: false, text: 'AI 이미지 고품질 생성' },
      { ok: false, text: '씬 영상 자동 렌더링' },
      { ok: false, text: '워터마크 제거' },
      { ok: false, text: '우선 처리 큐' },
      { ok: false, text: '팀 협업 기능' },
    ],
    cta: '현재 플랜',
    ctaDisabled: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₩29,000',
    period: '/ 월',
    color: 'mint',
    accent: 'mint',
    badge: '가장 인기',
    features: [
      { ok: true, text: '무제한 프로젝트' },
      { ok: true, text: '씬 무제한' },
      { ok: true, text: 'AI 시나리오 생성 무제한' },
      { ok: true, text: '등장인물 무제한 생성' },
      { ok: true, text: '1080p / 4K 영상 내보내기' },
      { ok: true, text: 'AI 이미지 고품질 생성 (Flux Pro)' },
      { ok: true, text: '씬 영상 자동 렌더링 (Kling AI)' },
      { ok: true, text: '워터마크 없음' },
      { ok: true, text: '우선 처리 큐' },
      { ok: true, text: '팀원 3명까지 협업' },
    ],
    cta: 'Pro 시작하기',
    ctaDisabled: false,
  },
];

const Check = ({ ok }) => (
  <div style={{
    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: ok ? 'color-mix(in oklch, var(--mint) 15%, transparent)' : 'var(--surface-2)',
  }}>
    {ok
      ? <Icon name="check" size={10} style={{ color: 'var(--mint)' }} />
      : <Icon name="x" size={10} style={{ color: 'var(--text-4)' }} />
    }
  </div>
);

export const SubscriptionView = ({ onClose }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }} onClick={onClose}>
    <div style={{
      background: 'var(--bg-2)', border: '1px solid var(--border)',
      borderRadius: 20, padding: '36px 40px', width: 760, maxWidth: '95vw',
      maxHeight: '90vh', overflowY: 'auto',
      boxShadow: 'var(--shadow-pop)',
    }} onClick={e => e.stopPropagation()}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>구독 관리</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>현재 플랜: <span style={{ color: 'var(--text)', fontWeight: 600 }}>Free</span></div>
        </div>
        <button
          onClick={onClose}
          style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-3)' }}
        >
          <Icon name="x" size={14} />
        </button>
      </div>

      {/* 플랜 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {PLANS.map(plan => (
          <div key={plan.id} style={{
            border: `1px solid ${plan.id === 'pro' ? 'var(--mint)' : 'var(--border)'}`,
            borderRadius: 14, padding: '24px 24px 28px',
            background: plan.id === 'pro' ? 'color-mix(in oklch, var(--mint) 4%, var(--surface))' : 'var(--surface)',
            display: 'flex', flexDirection: 'column', gap: 20,
            position: 'relative',
          }}>
            {plan.badge && (
              <div style={{
                position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                background: 'var(--mint)', color: '#000',
                fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20,
                whiteSpace: 'nowrap',
              }}>{plan.badge}</div>
            )}

            {/* 플랜명 + 가격 */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: plan.id === 'pro' ? 'var(--mint)' : 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                {plan.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em' }}>{plan.price}</span>
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{plan.period}</span>
              </div>
            </div>

            {/* 기능 목록 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {plan.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Check ok={f.ok} />
                  <span style={{ fontSize: 13, color: f.ok ? 'var(--text-2)' : 'var(--text-4)' }}>{f.text}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              disabled={plan.ctaDisabled}
              style={{
                marginTop: 'auto', padding: '11px 0', borderRadius: 10, border: 'none',
                fontSize: 13, fontWeight: 700, cursor: plan.ctaDisabled ? 'default' : 'pointer',
                background: plan.ctaDisabled ? 'var(--surface-2)' : 'var(--mint)',
                color: plan.ctaDisabled ? 'var(--text-4)' : '#000',
                transition: 'filter 0.12s',
              }}
              onMouseEnter={e => { if (!plan.ctaDisabled) e.currentTarget.style.filter = 'brightness(1.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* 하단 안내 */}
      <div style={{ marginTop: 24, padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--text-4)', lineHeight: 1.7, textAlign: 'center' }}>
        Pro 플랜은 언제든지 취소할 수 있습니다. 연간 결제 시 <span style={{ color: 'var(--mint)', fontWeight: 600 }}>2개월 무료</span> (₩290,000/년).
        문의: <span style={{ color: 'var(--text-3)' }}>support@step-d.ai</span>
      </div>
    </div>
  </div>
);
