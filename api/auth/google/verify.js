import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = String(process.env.GOOGLE_CLIENT_ID || '').trim();
const ALLOWED_EMAILS = String(process.env.AUTHORIZED_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed.' });
  }

  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({
      ok: false,
      message: 'Server is missing GOOGLE_CLIENT_ID configuration.'
    });
  }

  if (!ALLOWED_EMAILS.length) {
    return res.status(500).json({
      ok: false,
      message: 'Server is missing AUTHORIZED_EMAILS configuration.'
    });
  }

  const credential = String(req.body?.credential || '').trim();
  if (!credential) {
    return res.status(400).json({
      ok: false,
      message: 'Missing Google credential token.'
    });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const email = String(payload?.email || '').toLowerCase();
    const emailVerified = Boolean(payload?.email_verified);

    if (!email || !emailVerified) {
      return res.status(401).json({
        ok: false,
        message: 'Google account email is not verified.'
      });
    }

    if (!ALLOWED_EMAILS.includes(email)) {
      return res.status(403).json({
        ok: false,
        message: 'This Google account is not authorized for this cashbook.'
      });
    }

    return res.status(200).json({
      ok: true,
      user: {
        email,
        name: String(payload?.name || ''),
        picture: String(payload?.picture || '')
      }
    });
  } catch (error) {
    return res.status(401).json({
      ok: false,
      message: 'Invalid or expired Google token.',
      details:
        process.env.NODE_ENV === 'development' ? String(error?.message || '') : undefined
    });
  }
}