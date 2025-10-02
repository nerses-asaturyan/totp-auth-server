import 'dotenv/config';
import express from 'express';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';

const app = express();
app.use(express.json());

authenticator.options = { step: 30, digits: 6 };

const PORT = process.env.PORT || 3000;
const userSecrets = {};

app.post('/user/register', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  const secret = authenticator.generateSecret();
  userSecrets[email] = secret;
  const otpauth = authenticator.keyuri(email, 'TOTP-POC', secret);
  try {
    const qrCodeUrl = await toDataURL(otpauth);
    res.json({ email, qrCodeUrl, secret: process.env.NODE_ENV === 'development' ? secret : undefined });
  } catch (err) {
    res.status(500).json({ message: 'Could not generate QR code', error: String(err) });
  }
});

app.post('/user/verify', (req, res) => {
  const { email, token } = req.body;
  if (!email || !token) return res.status(400).json({ message: 'Email and token required' });
  const secret = userSecrets[email];
  if (!secret) return res.status(404).json({ message: 'User not found' });
  try {
    const isValid = authenticator.verify({ token, secret });
    if (isValid) return res.json({ verified: true });
    return res.status(400).json({ verified: false, message: 'Invalid token' });
  } catch (err) {
    return res.status(500).json({ message: 'Verification error', error: String(err) });
  }
});

app.get('/_debug/users', (req, res) => res.json(userSecrets));

app.listen(PORT, () => console.log(`TOTP POC listening on port ${PORT}`));
