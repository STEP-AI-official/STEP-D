import React from 'react';
import { Icon } from './Icons';

const STATUS_CONFIG = {
  generating: { color: 'orange', label: '생성 중',     showSpinner: true  },
  choosing:   { color: 'mint',   label: '확인 대기',   showSpinner: false },
  done:       { color: 'mint',   label: '완료',        showSpinner: false },
  failed:     { color: 'rose',   label: '오류 발생',   showSpinner: false },
};

const STAGE_LABEL = {
  scenario:    '시나리오',
  cast:        '등장인물 / 배경',
  scene_video: '씬 영상',
  done:        '전체',
};

export const ProgressBanner = ({ short }) => {
  if (!short) return null;
  const { status, stage, progress, error } = short;
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;

  // choosing 상태는 뷰 자체에서 확정 버튼으로 처리하므로 배너 불필요
  if (status === 'choosing') return null;

  const stageLabel = STAGE_LABEL[stage] || stage;

  return (
    <div style={{
      padding: '10px 20px',
      background: `color-mix(in oklch, var(--${cfg.color}) 8%, var(--surface))`,
      borderBottom: `1px solid color-mix(in oklch, var(--${cfg.color}) 25%, transparent)`,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      {cfg.showSpinner
        ? <span className="spinner" style={{ width: 13, height: 13, borderWidth: 2, borderColor: `var(--${cfg.color})`, borderTopColor: 'transparent' }} />
        : status === 'failed'
          ? <Icon name="x" size={14} style={{ color: `var(--${cfg.color})` }} />
          : <Icon name="check" size={14} style={{ color: `var(--${cfg.color})` }} />
      }
      <span style={{ fontSize: 12, fontWeight: 600, color: `var(--${cfg.color})` }}>
        {stageLabel} {cfg.label}
      </span>
      {progress && (
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>— {progress}</span>
      )}
      {status === 'failed' && error && (
        <span style={{ fontSize: 12, color: 'var(--rose)', marginLeft: 4 }}>{error}</span>
      )}
    </div>
  );
};
