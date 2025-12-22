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

module.exports = {
  decryptPassword,
  getPublicKey,
};
