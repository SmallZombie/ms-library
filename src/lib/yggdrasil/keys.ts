import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const privateKeyPath = path.join(dataDir, 'yggdrasil-private.pem');
const publicKeyPath = path.join(dataDir, 'yggdrasil-public.pem');

let cachedPrivateKey: crypto.KeyObject | null = null;
let cachedPublicKey: crypto.KeyObject | null = null;

function ensureKeyPair() {
  if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) return;

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  fs.writeFileSync(privateKeyPath, privateKey as string);
  fs.writeFileSync(publicKeyPath, publicKey as string);
}

export function getPrivateKey(): crypto.KeyObject {
  if (cachedPrivateKey) return cachedPrivateKey;
  ensureKeyPair();
  const pem = fs.readFileSync(privateKeyPath, 'utf-8');
  cachedPrivateKey = crypto.createPrivateKey(pem);
  return cachedPrivateKey;
}

export function getPublicKey(): crypto.KeyObject {
  if (cachedPublicKey) return cachedPublicKey;
  ensureKeyPair();
  const pem = fs.readFileSync(publicKeyPath, 'utf-8');
  cachedPublicKey = crypto.createPublicKey(pem);
  return cachedPublicKey;
}

export function getPublicKeyPem(): string {
  ensureKeyPair();
  return fs.readFileSync(publicKeyPath, 'utf-8');
}

export function signData(data: string): string {
  const sign = crypto.createSign('SHA1');
  sign.update(data);
  sign.end();
  return sign.sign(getPrivateKey(), 'base64');
}
