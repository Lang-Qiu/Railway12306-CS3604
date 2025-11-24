const forge = require('node-forge');
let runtimePrivateKeyPem = process.env.RSA_PRIVATE_KEY || '';
let runtimePublicKeyPem = '';

function ensureKeyPair() {
  try {
    if (runtimePrivateKeyPem) {
      const privateKey = forge.pki.privateKeyFromPem(runtimePrivateKeyPem);
      const publicKey = forge.pki.setRsaPublicKey(privateKey.n, privateKey.e);
      runtimePublicKeyPem = forge.pki.publicKeyToPem(publicKey);
      return;
    }
  } catch (_) {
    runtimePrivateKeyPem = '';
  }
  const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 });
  runtimePrivateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);
  runtimePublicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
}

ensureKeyPair();

function decryptPassword(encryptedPassword) {
  if (!runtimePrivateKeyPem) return encryptedPassword;
  try {
    const privateKey = forge.pki.privateKeyFromPem(runtimePrivateKeyPem);
    const decoded = forge.util.decode64(encryptedPassword);
    const decrypted = privateKey.decrypt(decoded, 'RSA-OAEP');
    return decrypted;
  } catch (_) {
    return encryptedPassword;
  }
}

function getPublicKey() {
  return runtimePublicKeyPem;
}

module.exports = {
  decryptPassword,
  getPublicKey,
};
