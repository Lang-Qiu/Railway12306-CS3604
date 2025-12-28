const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

let privateKeyPem;

// 优先从文件读取私钥
try {
  const keyPath = path.join(__dirname, '../../certs/jwtRS256.key');
  if (fs.existsSync(keyPath)) {
    privateKeyPem = fs.readFileSync(keyPath, 'utf8');
  }
} catch (error) {
  console.warn('Failed to read private key from file:', error);
}

// 如果文件读取失败，尝试从环境变量读取
if (!privateKeyPem) {
  privateKeyPem = process.env.RSA_PRIVATE_KEY;
}

if (!privateKeyPem) {
  throw new Error('RSA_PRIVATE_KEY not found in file or environment variable');
}

function decryptPassword(encryptedPassword) {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const decoded = forge.util.decode64(encryptedPassword);
  const decrypted = privateKey.decrypt(decoded, 'RSA-OAEP');
  return decrypted;
}

function getPublicKey() {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const publicKey = forge.pki.setRsaPublicKey(privateKey.n, privateKey.e);
  const publicKeyPem = forge.pki.publicKeyToPem(publicKey);
  return publicKeyPem;
}

// Symmetric encryption for database fields
const crypto = require('crypto');
const AES_SECRET = process.env.AES_SECRET || 'your-default-aes-secret-key-32chars'; // Should be 32 chars
const IV_LENGTH = 16;

function encryptData(text) {
  if (!text) return text;
  // Ensure key is 32 bytes
  const key = crypto.scryptSync(AES_SECRET, 'salt', 32);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptData(text) {
  if (!text) return text;
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) return text; // Return original if not in format
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    const key = crypto.scryptSync(AES_SECRET, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    console.error('Decryption failed:', e);
    return text; // Return original if decryption fails
  }
}

module.exports = {
  decryptPassword,
  getPublicKey,
  encryptData,
  decryptData
};
