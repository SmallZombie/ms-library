import { getSetting } from './settings';

export async function verifyTurnstile(token: string): Promise<boolean> {
  const [turnstileEnabled, secretKey] = await Promise.all([
    getSetting('turnstileEnabled'),
    getSetting('turnstileSecretKey'),
  ]);
  if (turnstileEnabled !== 'true' || !secretKey) return true;

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: secretKey, response: token }),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}
