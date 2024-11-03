const request = require('supertest');
const baseUrl = process.env.API_BASE_URL || 'https://restful-booker.herokuapp.com';

describe('Authentication Tests', () => {
    let validToken;

    describe('Token Generation', () => {
        test('Generate auth token with valid credentials', async () => {
            const response = await request(baseUrl)
                .post('/auth')
                .set('Content-Type', 'application/json')
                .send({
                    username: 'admin',
                    password: 'password123'
                });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(typeof response.body.token).toBe('string');
            expect(response.body.token.length).toBeGreaterThan(0);
            validToken = response.body.token;
        });

        test('Fail to generate token with invalid username', async () => {
            const response = await request(baseUrl)
                .post('/auth')
                .set('Content-Type', 'application/json')
                .send({
                    username: 'invalid_user',
                    password: 'password123'
                });
    
            expect(response.body).not.toHaveProperty('token');
        });

        test('Fail to generate token with invalid password', async () => {
            const response = await request(baseUrl)
                .post('/auth')
                .set('Content-Type', 'application/json')
                .send({
                    username: 'admin',
                    password: 'wrong_password'
                });
    
            expect(response.body).not.toHaveProperty('token');
        });

        test('Fail to generate token with missing username', async () => {
            const response = await request(baseUrl)
                .post('/auth')
                .set('Content-Type', 'application/json')
                .send({
                    password: 'password123'
                });
    
            expect(response.body).not.toHaveProperty('token');
        });

        test('Fail to generate token with missing password', async () => {
            const response = await request(baseUrl)
                .post('/auth')
                .set('Content-Type', 'application/json')
                .send({
                    username: 'admin'
                });
    
            expect(response.body).not.toHaveProperty('token');
        });

        test('Fail to generate token with empty credentials', async () => {
            const response = await request(baseUrl)
                .post('/auth')
                .set('Content-Type', 'application/json')
                .send({
                    username: '',
                    password: ''
                });
    
            expect(response.body).not.toHaveProperty('token');
        });

        test('Handle malformed JSON request', async () => {
            const response = await request(baseUrl)
                .post('/auth')
                .set('Content-Type', 'application/json')
                .send('{"username": "admin", "password": "password123"');

            expect([400, 500]).toContain(response.statusCode);
        });
    });

    describe('Protected Endpoints Access', () => {
        beforeEach(async () => {
            if (!validToken) {
                const authResponse = await request(baseUrl)
                    .post('/auth')
                    .set('Content-Type', 'application/json')
                    .send({
                        username: 'admin',
                        password: 'password123'
                    });
                validToken = authResponse.body.token;
            }
        });

        test('Access protected endpoint (PUT) with valid token', async () => {
            const createResponse = await request(baseUrl)
                .post('/booking')
                .set('Content-Type', 'application/json')
                .send({
                    firstname: "Test",
                    lastname: "User",
                    totalprice: 100,
                    depositpaid: true,
                    bookingdates: {
                        checkin: "2024-01-01",
                        checkout: "2024-01-02"
                    }
                });
    
            const bookingId = createResponse.body.bookingid;
    
            const response = await request(baseUrl)
                .put(`/booking/${bookingId}`)
                .set('Cookie', `token=${validToken}`)
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .send({
                    firstname: "Updated",
                    lastname: "User",
                    totalprice: 150,
                    depositpaid: true,
                    bookingdates: {
                        checkin: "2024-01-01",
                        checkout: "2024-01-02"
                    }
                });
    
            expect([200, 405]).toContain(response.statusCode);
        });

        test('Access protected endpoint (DELETE) with valid token', async () => {
            const createResponse = await request(baseUrl)
                .post('/booking')
                .set('Content-Type', 'application/json')
                .send({
                    firstname: "Test",
                    lastname: "User",
                    totalprice: 100,
                    depositpaid: true,
                    bookingdates: {
                        checkin: "2024-01-01",
                        checkout: "2024-01-02"
                    }
                });
    
            const bookingId = createResponse.body.bookingid;
    
            const response = await request(baseUrl)
                .delete(`/booking/${bookingId}`)
                .set('Cookie', `token=${validToken}`)
                .set('Content-Type', 'application/json');
    
            expect([201, 405]).toContain(response.statusCode);
        });

        test('Access protected endpoint with invalid token', async () => {
            const response = await request(baseUrl)
                .delete('/booking/1')
                .set('Cookie', 'token=invalid_token')
                .set('Content-Type', 'application/json');

            expect(response.statusCode).toBe(403);
        });

        test('Access protected endpoint with malformed token', async () => {
            const response = await request(baseUrl)
                .delete('/booking/1')
                .set('Cookie', 'token=!@#$%^&*()')
                .set('Content-Type', 'application/json');

            expect(response.statusCode).toBe(403);
        });

        test('Access protected endpoint without token header', async () => {
            const response = await request(baseUrl)
                .delete('/booking/1')
                .set('Content-Type', 'application/json');

            expect(response.statusCode).toBe(403);
        });

        test('Access protected endpoint with empty token', async () => {
            const response = await request(baseUrl)
                .delete('/booking/1')
                .set('Cookie', 'token=')
                .set('Content-Type', 'application/json');

            expect(response.statusCode).toBe(403);
        });
    });

    describe('Basic Authentication', () => {
        test('Access protected endpoint with valid basic auth', async () => {
            const response = await request(baseUrl)
                .delete('/booking/1')
                .set('Authorization', 'Basic YWRtaW46cGFzc3dvcmQxMjM=')
                .set('Content-Type', 'application/json');

            expect([201, 405]).toContain(response.statusCode);
        });

        test('Access protected endpoint with invalid basic auth', async () => {
            const response = await request(baseUrl)
                .delete('/booking/1')
                .set('Authorization', 'Basic invalid_base64')
                .set('Content-Type', 'application/json');

            expect(response.statusCode).toBe(403);
        });

        test('Access protected endpoint with malformed basic auth header', async () => {
            const response = await request(baseUrl)
                .delete('/booking/1')
                .set('Authorization', 'BasicYWRtaW46cGFzc3dvcmQxMjM=')
                .set('Content-Type', 'application/json');

            expect(response.statusCode).toBe(403);
        });
    });

    describe('Token Expiration and Renewal', () => {
        test('Token should work immediately after generation', async () => {
            const authResponse = await request(baseUrl)
                .post('/auth')
                .set('Content-Type', 'application/json')
                .send({
                    username: 'admin',
                    password: 'password123'
                });

            const token = authResponse.body.token;

            const response = await request(baseUrl)
                .delete('/booking/1')
                .set('Cookie', `token=${token}`)
                .set('Content-Type', 'application/json');

            expect([201, 405]).toContain(response.statusCode);
        });

        test('Generate new token when previous one expires', async () => {
            const newAuthResponse = await request(baseUrl)
                .post('/auth')
                .set('Content-Type', 'application/json')
                .send({
                    username: 'admin',
                    password: 'password123'
                });

            expect(newAuthResponse.statusCode).toBe(200);
            expect(newAuthResponse.body).toHaveProperty('token');
            expect(typeof newAuthResponse.body.token).toBe('string');
        });
    });

    describe('Cross-Origin Requests', () => {
        test('OPTIONS request should handle CORS', async () => {
            const response = await request(baseUrl)
                .options('/auth')
                .set('Origin', 'http://example.com');

            expect([200, 204, 403]).toContain(response.statusCode);
        });
    });
});