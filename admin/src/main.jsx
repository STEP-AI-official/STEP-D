import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { Login, useAuth, logout } from './Login.jsx';
import './style.css';

const SESSION_KEY = 'stepd_admin_auth';

const Root = () => {
  const [authed, setAuthed] = React.useState(localStorage.getItem(SESSION_KEY) === 'ok');
  if (!authed) return <Login onLogin={() => setAuthed(true)} />;
  return <App onLogout={logout} />;
};

createRoot(document.getElementById('root')).render(<Root />);
