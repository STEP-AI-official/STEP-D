import React from 'react';

const ADMIN_EMAIL = 'admin@stepd.co.kr';
const ADMIN_PW = '5174';
const SESSION_KEY = 'stepd_admin_auth';

export function useAuth() {
  return localStorage.getItem(SESSION_KEY) === 'ok';
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.reload();
}

export const Login = ({ onLogin }) => {
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [error, setError] = React.useState('');

  const submit = (e) => {
    e.preventDefault();
    if (email === ADMIN_EMAIL && pw === ADMIN_PW) {
      localStorage.setItem(SESSION_KEY, 'ok');
      onLogin();
    } else {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <form onSubmit={submit} style={{
        width: 340, background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, padding: 32, display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--mint)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 16, color: '#000', margin: '0 auto 12px' }}>S</div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>STEP D Admin</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>관리자 전용</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>이메일</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="admin@stepd.co.kr" required autoFocus />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>비밀번호</label>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)}
            placeholder="••••" required />
        </div>

        {error && (
          <div style={{ fontSize: 12, color: 'var(--rose)', background: 'var(--rose-dim)', borderRadius: 6, padding: '8px 12px' }}>
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary" style={{ marginTop: 4 }}>로그인</button>
      </form>
    </div>
  );
};
