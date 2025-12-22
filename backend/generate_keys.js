const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);
const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);

const envPath = path.join(__dirname, '.env');
const examplePath = path.join(__dirname, '.env.example');

let envContent = '';
if (fs.existsSync(examplePath)) {
    envContent = fs.readFileSync(examplePath, 'utf8');
}

envContent += `\n\n# RSA Keys\nRSA_PRIVATE_KEY="${privateKeyPem.replace(/\r\n/g, '\\n').replace(/\n/g, '\\n')}"\n`;
envContent += `RSA_PUBLIC_KEY="${publicKeyPem.replace(/\r\n/g, '\\n').replace(/\n/g, '\\n')}"\n`;

fs.writeFileSync(envPath, envContent);
console.log('.env file created/updated with RSA keys.');
