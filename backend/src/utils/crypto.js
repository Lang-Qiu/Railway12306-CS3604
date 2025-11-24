const nodeCrypto = require('crypto');

let keyPair = null;

function ensureKeyPair() {
  if (!keyPair) {
    keyPair = nodeCrypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
    });
  }
}

function getPublicKey() {
  ensureKeyPair();
  return keyPair.publicKey;
}

function decryptPassword(input) {
  try {
    if (typeof input !== 'string' || input.trim() === '') return '';
    ensureKeyPair();

    const buffer = Buffer.from(input, 'base64');
    const decrypted = nodeCrypto.privateDecrypt({
      key: keyPair.privateKey,
      padding: nodeCrypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha1'
    }, buffer);

    return decrypted.toString('utf8');
  } catch (e) {
    throw e;
  }
}

module.exports = { decryptPassword, getPublicKey };