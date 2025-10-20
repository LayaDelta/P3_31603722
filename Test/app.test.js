const request = require('supertest');
const app = require('../app');

describe('Pruebas de endpoints', () => {
  
  test('GET /ping', async () => {
    const res = await request(app).get('/ping');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe(''); 
  });

  test('GET /about ', async () => {
    const res = await request(app).get('/about');
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'success');
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('nombreCompleto');
    expect(res.body.data).toHaveProperty('cedula');
    expect(res.body.data).toHaveProperty('seccion');
  });

});
