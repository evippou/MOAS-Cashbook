import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { OAuth2Client } from 'google-auth-library';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = Number(process.env.PORT || 3000);
const GOOGLE_CLIENT_ID = String(process.env.GOOGLE_CLIENT_ID || '').trim();
const ALLOWED_EMAILS = String(process.env.AUTHORIZED_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'moas-cashbook-auth' });
});

app.post('/api/auth/google/verify', async (req, res) => {
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

    return res.json({
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
      details: process.env.NODE_ENV === 'development' ? String(error?.message || '') : undefined
    });
  }
});

app.use(express.static(__dirname));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`MOAS Cashbook server running on http://localhost:${PORT}`);
});
