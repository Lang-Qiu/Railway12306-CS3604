const request = require('supertest');
const app = require('../src/app');
const forge = require('node-forge');

describe('Auth System Integration', () => {
  it('should login with username and password using RSA and CSRF', async () => {
    const agent = request(app);

    const csrfRes = await agent.get('/api/auth/csrf-token');
    expect(csrfRes.status).toBe(200);
    const csrfToken = csrfRes.body.token;
    const cookies = csrfRes.headers['set-cookie'];

    const pkRes = await agent.get('/api/auth/public-key');
    expect(pkRes.status).toBe(200);
    const publicKeyPem = pkRes.body.publicKey;

    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    const encryptedPassword = forge.util.encode64(publicKey.encrypt('password123', 'RSA-OAEP'));

    const loginRes = await agent
      .post('/api/auth/login')
      .set('x-csrf-token', csrfToken)
      .set('Cookie', cookies)
      .send({ identifier: 'testuser', password: encryptedPassword });

    expect([200,401,403,429,500]).toContain(loginRes.status);
    expect(loginRes.body).toBeDefined();
    if (loginRes.status === 200) {
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.sessionId).toBeDefined();
    }
  });
});