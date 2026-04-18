import { AppConfig } from './config.js';

const SESSION_KEY = 'moas_auth_user';

const VERIFY_ENDPOINT = AppConfig.AUTH_VERIFY_ENDPOINT || '/api/auth/google/verify';

function setStatus(message, isError = false) {
  const statusEl = document.getElementById('auth-status');
  if (!statusEl) return;
  statusEl.textContent = message || '';
  statusEl.classList.toggle('error', Boolean(isError));
}

function showOverlay() {
  const overlay = document.getElementById('auth-overlay');
  if (overlay) overlay.classList.remove('hidden');
}

function hideOverlay() {
  const overlay = document.getElementById('auth-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function updateUserBadge(user) {
  const userEl = document.getElementById('auth-user');
  const signOutBtn = document.getElementById('btn-signout');

  if (!userEl || !signOutBtn) return;

  if (user && user.email) {
    userEl.textContent = user.email;
    userEl.style.display = 'inline';
    signOutBtn.style.display = 'inline-block';
  } else {
    userEl.textContent = '';
    userEl.style.display = 'none';
    signOutBtn.style.display = 'none';
  }
}

function persistSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function ensureGoogleScript() {
  if (window.google?.accounts?.id) return;

  await new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-identity="1"]');
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity script.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = '1';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Google Identity script.'));
    document.head.appendChild(script);
  });
}

export async function initAuth() {
  if (!AppConfig.GOOGLE_CLIENT_ID) {
    showOverlay();
    setStatus('Set GOOGLE_CLIENT_ID in js/config.js first.', true);
    return false;
  }

  const storedUser = getSession();
  if (storedUser?.email) {
    hideOverlay();
    updateUserBadge(storedUser);
    return true;
  }

  showOverlay();
  setStatus('Waiting for Google sign-in...');

  try {
    await ensureGoogleScript();
  } catch (err) {
    setStatus(err.message || 'Google sign-in is unavailable.', true);
    return false;
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };

    google.accounts.id.initialize({
      client_id: AppConfig.GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          const verifyResponse = await fetch(VERIFY_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: response.credential || '' })
          });

          if (!verifyResponse.ok) {
            let serverMessage = 'Unauthorized email address for this cashbook.';
            try {
              const errBody = await verifyResponse.json();
              if (errBody?.message) serverMessage = errBody.message;
            } catch {
              if (verifyResponse.status === 404) {
                serverMessage = 'Auth endpoint not found. Check Netlify redirects/functions deployment.';
              } else if (verifyResponse.status >= 500) {
                serverMessage = 'Auth service misconfigured. Check Netlify environment variables.';
              }
            }
            setStatus(serverMessage, true);
            google.accounts.id.prompt();
            return;
          }

          const data = await verifyResponse.json();
          const user = data.user || null;
          if (!user?.email) {
            setStatus('Sign-in failed. Missing verified user details.', true);
            google.accounts.id.prompt();
            return;
          }

          persistSession(user);
          hideOverlay();
          setStatus('');
          updateUserBadge(user);
          finish(true);
        } catch {
          setStatus('Unable to verify login with server. Please try again.', true);
          google.accounts.id.prompt();
        }
      },
      auto_select: false,
      cancel_on_tap_outside: false
    });

    google.accounts.id.renderButton(
      document.getElementById('google-signin-button'),
      { theme: 'filled_black', size: 'large', shape: 'pill', text: 'signin_with', width: 280 }
    );

    google.accounts.id.prompt();
  });
}

export function signOut() {
  clearSession();
  updateUserBadge(null);
  showOverlay();
  setStatus('Signed out. Please sign in again.');
}

export function getSignedInUser() {
  return getSession();
}

// Simple PIN check using SHA-256 subtle crypto
export async function verifyPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + AppConfig.PIN_SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Here we would compare to a stored hash.
  // For demo, if PIN is 1234, it passes
  return pin === '1234';
}
