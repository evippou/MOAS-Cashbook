import { AppConfig } from './config.js';

// Stub implementation of Google Auth + PIN
// Since this is a client side SPA, we normally load Google platform script
// Here we just provide a wrapper that bypasses auth if config ID is missing

export async function initAuth() {
  if (!AppConfig.GOOGLE_CLIENT_ID) {
    console.warn("No Google Client ID provided. Bypassing auth for demo purposes.");
    return true; 
  }
  
  return new Promise((resolve) => {
    // Dynamically load Google Identity library if used
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      google.accounts.id.initialize({
        client_id: AppConfig.GOOGLE_CLIENT_ID,
        callback: (response) => {
          // Decode JWT client-side
          const base64Url = response.credential.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const payload = JSON.parse(jsonPayload);
          
          if (payload.email === AppConfig.AUTHORIZED_EMAIL) {
            resolve(true);
          } else {
            alert('Unauthorized email address.');
            resolve(false);
          }
        }
      });
      google.accounts.id.prompt();
    };
    document.head.appendChild(script);
  });
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
