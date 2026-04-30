import { signInWithRedirect, getRedirectResult, signOut as firebaseSignOut } from 'firebase/auth'
import { auth, googleProvider } from './firebase'

const API_BASE = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8766')

export async function signInWithGoogle() {
  await signInWithRedirect(auth, googleProvider)
  // 리다이렉트 후 페이지가 새로 로드되므로 여기는 실행 안 됨
}

export async function handleRedirectResult() {
  const result = await getRedirectResult(auth)
  if (!result) return null

  const idToken = await result.user.getIdToken()
  const res = await fetch(`${API_BASE}/auth/firebase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  })
  if (!res.ok) throw new Error('서버 인증 실패')
  return res.json() // { token, user }
}

export async function signOut() {
  await firebaseSignOut(auth)
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
}

export function saveAuth(token, user) {
  localStorage.setItem('auth_token', token)
  localStorage.setItem('auth_user', JSON.stringify(user))
}

export function loadAuth() {
  const token = localStorage.getItem('auth_token')
  const user  = JSON.parse(localStorage.getItem('auth_user') || 'null')
  return { token, user }
}
