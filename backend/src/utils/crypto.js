const forge = require('node-forge');

const privateKeyPem = process.env.RSA_PRIVATE_KEY;

if (!privateKeyPem) {
  throw new Error('RSA_PRIVATE_KEY environment variable not set');
}

function decryptPassword(encryptedPassword) {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const decoded = forge.util.decode64(encryptedPassword);
  const decrypted = privateKey.decrypt(decoded, 'RSA-OAEP');
  return decrypted;
}

module.exports = {
  decryptPassword,
};
