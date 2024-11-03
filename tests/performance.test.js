const request = require('supertest');
const baseUrl = process.env.API_BASE_URL || 'https://restful-booker.herokuapp.com';

describe('Performance and Health Tests', () => {
    const PERFORMANCE_THRESHOLD = 3000;
    const CONCURRENT_REQUESTS = 5;
    const RATE_LIMIT_REQUESTS = 20;
    let authToken;

    beforeAll(async () => {
        const authResponse = await request(baseUrl)
            .post('/auth')
            .set('Content-Type', 'application/json')
            .send({
                username: 'admin',
                password: 'password123'
            });
        
        authToken = authResponse.body.token;
    });

    describe('Health Checks', () => {
        test('Ping endpoint should respond quickly', async () => {
            const startTime = Date.now();
            
            const response = await request(baseUrl)
                .get('/ping')
                .set('Accept', 'application/json');
            
            const endTime = Date.now();
            
            expect(response.statusCode).toBe(201);
            expect(endTime - startTime).toBeLessThan(PERFORMANCE_THRESHOLD);
        });

        test('Booking endpoint should be available and respond quickly', async () => {
            const startTime = Date.now();
            
            const response = await request(baseUrl)
                .get('/booking')
                .set('Accept', 'application/json');
            
            const endTime = Date.now();
            
            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(endTime - startTime).toBeLessThan(PERFORMANCE_THRESHOLD);
        });

        test('Auth endpoint should be available', async () => {
            const startTime = Date.now();
            
            const response = await request(baseUrl)
                .post('/auth')
                .set('Content-Type', 'application/json')
                .send({
                    username: 'admin',
                    password: 'password123'
                });
            
            const endTime = Date.now();
            
            expect(response.statusCode).toBe(200);
            expect(endTime - startTime).toBeLessThan(5000);
        });
    });

    describe('Response Time Tests', () => {
        let testBookingId;

        beforeEach(async () => {
            const createResponse = await request(baseUrl)
                .post('/booking')
                .set('Content-Type', 'application/json')
                .send({
                    firstname: "Performance",
                    lastname: "Test",
                    totalprice: 100,
                    depositpaid: true,
                    bookingdates: {
                        checkin: "2024-01-01",
                        checkout: "2024-01-02"
                    }
                });
    
            if (createResponse.statusCode === 200) {
                testBookingId = createResponse.body.bookingid;
            }
        });

        test('Individual booking retrieval performance', async () => {
            if (!testBookingId) {
                console.log('Skipping test - no booking available');
                return;
            }
    
            const startTime = Date.now();
            
            const response = await request(baseUrl)
                .get(`/booking/${testBookingId}`)
                .set('Accept', 'application/json');
            
            const endTime = Date.now();
            
            expect([200, 404]).toContain(response.statusCode);
            expect(endTime - startTime).toBeLessThan(5000);
        });

        test('Booking creation performance', async () => {
            const startTime = Date.now();
            
            const response = await request(baseUrl)
                .post('/booking')
                .set('Content-Type', 'application/json')
                .send({
                    firstname: "Performance",
                    lastname: "Test",
                    totalprice: 100,
                    depositpaid: true,
                    bookingdates: {
                        checkin: "2024-01-01",
                        checkout: "2024-01-02"
                    }
                });
            
            const endTime = Date.now();
            
            expect([200, 418]).toContain(response.statusCode);
            expect(endTime - startTime).toBeLessThan(5000);
        });

        test('Booking update performance', async () => {
            if (!testBookingId) {
                console.log('Skipping test - no booking available');
                return;
            }
    
            const startTime = Date.now();
            
            const response = await request(baseUrl)
                .put(`/booking/${testBookingId}`)
                .set('Cookie', `token=${authToken}`)
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .send({
                    firstname: "Updated",
                    lastname: "Test",
                    totalprice: 150,
                    depositpaid: true,
                    bookingdates: {
                        checkin: "2024-01-01",
                        checkout: "2024-01-02"
                    }
                });
            
            const endTime = Date.now();
            
            expect([200, 405]).toContain(response.statusCode);
            expect(endTime - startTime).toBeLessThan(5000);
        });

        test('Booking deletion performance', async () => {
            if (!testBookingId) {
                console.log('Skipping test - no booking available');
                return;
            }
    
            const startTime = Date.now();
            
            const response = await request(baseUrl)
                .delete(`/booking/${testBookingId}`)
                .set('Cookie', `token=${authToken}`)
                .set('Content-Type', 'application/json');
            
            const endTime = Date.now();
            
            expect([201, 405]).toContain(response.statusCode);
            expect(endTime - startTime).toBeLessThan(5000);
        });
    });

    describe('Concurrent Request Tests', () => {
        test('Handle multiple simultaneous GET requests', async () => {
            const requests = Array(CONCURRENT_REQUESTS).fill().map(() => 
                request(baseUrl)
                    .get('/booking')
                    .set('Accept', 'application/json')
            );

            const startTime = Date.now();
            const responses = await Promise.all(requests);
            const endTime = Date.now();

            const totalTime = endTime - startTime;
            const averageTime = totalTime / CONCURRENT_REQUESTS;

            console.log(`Average response time for ${CONCURRENT_REQUESTS} concurrent GET requests: ${averageTime}ms`);

            responses.forEach(response => {
                expect(response.statusCode).toBe(200);
                expect(Array.isArray(response.body)).toBe(true);
            });

            expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLD);
        });

        test('Handle multiple simultaneous POST requests', async () => {
            const newBooking = {
                firstname: "Concurrent",
                lastname: "Test",
                totalprice: 100,
                depositpaid: true,
                bookingdates: {
                    checkin: "2024-01-01",
                    checkout: "2024-01-02"
                }
            };

            const requests = Array(CONCURRENT_REQUESTS).fill().map(() => 
                request(baseUrl)
                    .post('/booking')
                    .set('Content-Type', 'application/json')
                    .set('Accept', 'application/json')
                    .send(newBooking)
            );

            const startTime = Date.now();
            const responses = await Promise.all(requests);
            const endTime = Date.now();

            const totalTime = endTime - startTime;
            const averageTime = totalTime / CONCURRENT_REQUESTS;

            console.log(`Average response time for ${CONCURRENT_REQUESTS} concurrent POST requests: ${averageTime}ms`);

            responses.forEach(response => {
                expect(response.statusCode).toBe(200);
                expect(response.body).toHaveProperty('bookingid');
            });

            expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLD);
        });
    });

    describe('Rate Limiting Tests', () => {
        test('Handle rapid sequential requests', async () => {
            const requests = Array(RATE_LIMIT_REQUESTS).fill().map(() => 
                request(baseUrl)
                    .get('/booking')
                    .set('Accept', 'application/json')
            );

            const startTime = Date.now();
            const responses = await Promise.all(requests);
            const endTime = Date.now();

            const statusCodes = responses.reduce((acc, response) => {
                acc[response.statusCode] = (acc[response.statusCode] || 0) + 1;
                return acc;
            }, {});

            console.log('Response status code distribution:', statusCodes);
            console.log(`Total time for ${RATE_LIMIT_REQUESTS} rapid requests: ${endTime - startTime}ms`);

            expect(statusCodes[200]).toBeGreaterThan(0);
        });

        test('Recover from rate limiting', async () => {
            const requests = Array(RATE_LIMIT_REQUESTS).fill().map(() => 
                request(baseUrl).get('/booking')
            );
            await Promise.all(requests);

            await new Promise(resolve => setTimeout(resolve, 5000));

            const response = await request(baseUrl)
                .get('/booking')
                .set('Accept', 'application/json');

            expect(response.statusCode).toBe(200);
        }, 30000);
    });

    describe('Error Recovery Tests', () => {
        test('Recover from server errors with retry mechanism', async () => {
            const MAX_RETRIES = 3;
            const RETRY_DELAY = 1000;

            const makeRequestWithRetry = async (retryCount = 0) => {
                try {
                    const response = await request(baseUrl)
                        .get('/booking')
                        .set('Accept', 'application/json');
                    return response;
                } catch (error) {
                    if (retryCount < MAX_RETRIES) {
                        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                        return makeRequestWithRetry(retryCount + 1);
                    }
                    throw error;
                }
            };

            const response = await makeRequestWithRetry();
            expect(response.statusCode).toBe(200);
        }, 15000);

        test('Handle timeout scenarios', async () => {
            const TIMEOUT = 5000;
            const startTime = Date.now();
            
            try {
                const response = await Promise.race([
                    request(baseUrl).get('/booking'),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout')), TIMEOUT)
                    )
                ]);
                
                expect(response.statusCode).toBe(200);
            } catch (error) {
                expect(error.message).toBe('Timeout');
            }
            
            const endTime = Date.now();
            expect(endTime - startTime).toBeLessThan(TIMEOUT + 1000);
        });
    });

    describe('Load Testing', () => {
        test('Handle sustained load over time', async () => {
            const TOTAL_REQUESTS = 10;
            const DELAY_BETWEEN_REQUESTS = 500;
            const results = [];
    
            for (let i = 0; i < TOTAL_REQUESTS; i++) {
                const startTime = Date.now();
                const response = await request(baseUrl)
                    .get('/booking')
                    .set('Accept', 'application/json');
                const endTime = Date.now();
    
                results.push({
                    statusCode: response.statusCode,
                    responseTime: endTime - startTime
                });
    
                if (i < TOTAL_REQUESTS - 1) {
                    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
                }
            }
    
            const averageResponseTime = results.reduce((sum, result) => 
                sum + result.responseTime, 0) / results.length;
    
            console.log(`Average response time under sustained load: ${averageResponseTime}ms`);
            
            results.forEach(result => {
                expect([200, 418]).toContain(result.statusCode);
                expect(result.responseTime).toBeLessThan(5000);
            });
        }, 30000);
    });
});