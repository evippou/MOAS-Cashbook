const { OAuth2Client } = require('google-auth-library');

const GOOGLE_CLIENT_ID = String(process.env.GOOGLE_CLIENT_ID || '').trim();
const ALLOWED_EMAILS = String(process.env.AUTHORIZED_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, message: 'Method not allowed.' })
    };
  }

  if (!GOOGLE_CLIENT_ID) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, message: 'Server is missing GOOGLE_CLIENT_ID configuration.' })
    };
  }

  if (!ALLOWED_EMAILS.length) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, message: 'Server is missing AUTHORIZED_EMAILS configuration.' })
    };
  }

  let credential = '';
  try {
    const payload = JSON.parse(event.body || '{}');
    credential = String(payload.credential || '').trim();
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, message: 'Invalid JSON request body.' })
    };
  }

  if (!credential) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, message: 'Missing Google credential token.' })
    };
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const email = String(payload && payload.email ? payload.email : '').toLowerCase();
    const emailVerified = Boolean(payload && payload.email_verified);

    if (!email || !emailVerified) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, message: 'Google account email is not verified.' })
      };
    }

    if (!ALLOWED_EMAILS.includes(email)) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, message: 'This Google account is not authorized for this cashbook.' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        user: {
          email,
          name: String(payload && payload.name ? payload.name : ''),
          picture: String(payload && payload.picture ? payload.picture : '')
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: false,
        message: 'Invalid or expired Google token.',
        details: process.env.NODE_ENV === 'development' ? String(error && error.message ? error.message : '') : undefined
      })
    };
  }
};
