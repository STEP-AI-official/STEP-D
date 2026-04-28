import React from 'react';
export const Icon = ({ name, size = 18, className = '', style = {} }) => {
  const s = { width: size, height: size, flexShrink: 0, ...style };
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', className, style: s };
  switch (name) {
    case 'home':       return <svg {...common}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>;
    case 'folder':     return <svg {...common}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>;
    case 'sparkles':   return <svg {...common}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>;
    case 'doc':        return <svg {...common}><path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4h4M8 12h8M8 16h6"/></svg>;
    case 'user':       return <svg {...common}><circle cx="12" cy="8" r="3.5"/><path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5"/></svg>;
    case 'image':      return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m3 17 5-4 4 3 3-2 6 4"/></svg>;
    case 'video':      return <svg {...common}><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3z"/></svg>;
    case 'film':       return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 8h18M3 16h18M7 4v16M17 4v16"/></svg>;
    case 'layers':     return <svg {...common}><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5M3 18l9 5 9-5"/></svg>;
    case 'play':       return <svg {...common} fill="currentColor" stroke="none"><path d="M7 4v16l13-8z"/></svg>;
    case 'pause':      return <svg {...common} fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>;
    case 'plus':       return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case 'search':     return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.5-4.5"/></svg>;
    case 'settings':   return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>;
    case 'download':   return <svg {...common}><path d="M12 3v12M6 11l6 6 6-6M4 21h16"/></svg>;
    case 'check':      return <svg {...common}><path d="m5 12 5 5 9-11"/></svg>;
    case 'x':          return <svg {...common}><path d="M6 6l12 12M18 6 6 18"/></svg>;
    case 'chevron-right': return <svg {...common}><path d="m9 6 6 6-6 6"/></svg>;
    case 'chevron-down':  return <svg {...common}><path d="m6 9 6 6 6-6"/></svg>;
    case 'chevron-left':  return <svg {...common}><path d="m15 6-6 6 6 6"/></svg>;
    case 'more':       return <svg {...common}><circle cx="5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="19" cy="12" r="1.2" fill="currentColor"/></svg>;
    case 'refresh':    return <svg {...common}><path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5"/></svg>;
    case 'wand':       return <svg {...common}><path d="m15 4 2 2-11 11-2-2zM13 6l2 2M18 3v4M16 5h4M19 14v2M18 15h2"/></svg>;
    case 'zap':        return <svg {...common}><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>;
    case 'clock':      return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'type':       return <svg {...common}><path d="M4 7V5h16v2M9 5v14M15 5v14M7 19h4M13 19h4"/></svg>;
    case 'camera':     return <svg {...common}><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l1.5-3h5L16 7"/></svg>;
    case 'music':      return <svg {...common}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
    case 'grid':       return <svg {...common}><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>;
    case 'eye':        return <svg {...common}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'edit':       return <svg {...common}><path d="m4 20 4-1 11-11-3-3L5 16l-1 4z"/></svg>;
    case 'lock':       return <svg {...common}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>;
    case 'unlock':     return <svg {...common}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.75-1"/></svg>;
    case 'circle':     return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
    case 'cube':       return <svg {...common}><path d="M12 3 3 7.5v9L12 21l9-4.5v-9zM3 7.5 12 12l9-4.5M12 12v9"/></svg>;
    case 'split':      return <svg {...common}><path d="M16 3h5v5M21 3l-7 7M8 21H3v-5M3 21l7-7M14 14l7 7M10 10 3 3"/></svg>;
    case 'bell':       return <svg {...common}><path d="M6 9a6 6 0 1 1 12 0v4l2 3H4l2-3z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>;
    case 'mic':        return <svg {...common}><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>;
    case 'arrow-up':   return <svg {...common}><path d="M12 19V5M5 12l7-7 7 7"/></svg>;
    case 'log-in':     return <svg {...common}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>;
    case 'log-out':    return <svg {...common}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>;
    default:           return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="2"/></svg>;
  }
};

export const Avatar = ({ name, chip = 'mint', size = 40 }) => {
  const initial = name ? name.charAt(0) : '?';
  const bg = {
    mint:   'linear-gradient(135deg, oklch(0.55 0.12 160), oklch(0.35 0.08 170))',
    blue:   'linear-gradient(135deg, oklch(0.55 0.12 240), oklch(0.32 0.08 260))',
    orange: 'linear-gradient(135deg, oklch(0.55 0.12 45),  oklch(0.35 0.08 30))',
    violet: 'linear-gradient(135deg, oklch(0.55 0.12 285), oklch(0.32 0.08 300))',
    rose:   'linear-gradient(135deg, oklch(0.55 0.12 15),  oklch(0.35 0.08 0))',
  }[chip] || 'linear-gradient(135deg, oklch(0.5 0.02 280), oklch(0.3 0.02 280))';
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,0.95)', fontWeight: 700, fontSize: size * 0.42, flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }}>
      {initial}
    </div>
  );
};
