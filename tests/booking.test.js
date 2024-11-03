const request = require('supertest');
const baseUrl = process.env.API_BASE_URL || 'https://restful-booker.herokuapp.com';

describe('Booking CRUD Operations', () => {
    let bookingId;
    let authToken;

    const validBooking = {
        firstname: "John",
        lastname: "Doe",
        totalprice: 150,
        depositpaid: true,
        bookingdates: {
            checkin: "2024-01-01",
            checkout: "2024-01-02"
        },
        additionalneeds: "Breakfast"
    };

    beforeAll(async () => {
        const authResponse = await request(baseUrl)
            .post('/auth')
            .set('Content-Type', 'application/json')
            .send({
                username: 'admin',
                password: 'password123'
            });
        
        expect(authResponse.statusCode).toBe(200);
        authToken = authResponse.body.token;
    });

    describe('Create Booking', () => {
        test('Create a new booking with valid data', async () => {
            const response = await request(baseUrl)
                .post('/booking')
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .send(validBooking);

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('bookingid');
            expect(response.body.booking).toEqual(validBooking);
            
            bookingId = response.body.bookingid;
        }, 10000);

        test('Fail to create booking with invalid data', async () => {
            const invalidBooking = {
                firstname: "John"
            };

            const response = await request(baseUrl)
                .post('/booking')
                .set('Content-Type', 'application/json')
                .send(invalidBooking);

            expect([400, 500]).toContain(response.statusCode);
        });

        test('Create booking with minimum required fields', async () => {
            const minimalBooking = {
                firstname: "Jane",
                lastname: "Smith",
                totalprice: 100,
                depositpaid: false,
                bookingdates: {
                    checkin: "2024-01-01",
                    checkout: "2024-01-02"
                }
            };

            const response = await request(baseUrl)
                .post('/booking')
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .send(minimalBooking);

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('bookingid');
        });
    });

    describe('Retrieve Booking', () => {
        test('Get booking details with valid ID', async () => {
            const response = await request(baseUrl)
                .get(`/booking/${bookingId}`)
                .set('Accept', 'application/json');

            expect(response.statusCode).toBe(200);
            expect(response.body.firstname).toBe(validBooking.firstname);
            expect(response.body.lastname).toBe(validBooking.lastname);
        });

        test('Handle non-existent booking ID', async () => {
            const response = await request(baseUrl)
                .get('/booking/999999999')
                .set('Accept', 'application/json');

            expect(response.statusCode).toBe(404);
        });

        test('Get all booking IDs', async () => {
            const response = await request(baseUrl)
                .get('/booking')
                .set('Accept', 'application/json');

            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('Filter bookings by name', async () => {
            const response = await request(baseUrl)
                .get('/booking')
                .query({
                    firstname: validBooking.firstname,
                    lastname: validBooking.lastname
                })
                .set('Accept', 'application/json');

            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('Filter bookings by date', async () => {
            const response = await request(baseUrl)
                .get('/booking')
                .query({
                    checkin: '2024-01-01',
                    checkout: '2024-01-02'
                })
                .set('Accept', 'application/json');

            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('Update Booking', () => {
        test('Full update with valid token', async () => {
            const updatedBooking = {
                ...validBooking,
                firstname: "Jane",
                lastname: "Smith",
                totalprice: 200
            };

            const response = await request(baseUrl)
                .put(`/booking/${bookingId}`)
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .set('Cookie', `token=${authToken}`)
                .send(updatedBooking);

            expect(response.statusCode).toBe(200);
            expect(response.body.firstname).toBe(updatedBooking.firstname);
            expect(response.body.lastname).toBe(updatedBooking.lastname);
            expect(response.body.totalprice).toBe(updatedBooking.totalprice);
        });

        test('Partial update with valid token', async () => {
            const partialUpdate = {
                firstname: "Jimmy",
                totalprice: 250
            };

            const response = await request(baseUrl)
                .patch(`/booking/${bookingId}`)
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .set('Cookie', `token=${authToken}`)
                .send(partialUpdate);

            expect(response.statusCode).toBe(200);
            expect(response.body.firstname).toBe(partialUpdate.firstname);
            expect(response.body.totalprice).toBe(partialUpdate.totalprice);
        });

        test('Handle concurrent updates', async () => {
            const update1 = { firstname: "Update1", totalprice: 300 };
            const update2 = { firstname: "Update2", totalprice: 400 };

            const [response1, response2] = await Promise.all([
                request(baseUrl)
                    .patch(`/booking/${bookingId}`)
                    .set('Cookie', `token=${authToken}`)
                    .set('Content-Type', 'application/json')
                    .set('Accept', 'application/json')
                    .send(update1),
                request(baseUrl)
                    .patch(`/booking/${bookingId}`)
                    .set('Cookie', `token=${authToken}`)
                    .set('Content-Type', 'application/json')
                    .set('Accept', 'application/json')
                    .send(update2)
            ]);

            expect(
                response1.statusCode === 200 || response2.statusCode === 200
            ).toBe(true);
        });

        test('Update with basic auth instead of token', async () => {
            const update = { firstname: "BasicAuth", totalprice: 500 };

            const response = await request(baseUrl)
                .put(`/booking/${bookingId}`)
                .set('Authorization', 'Basic YWRtaW46cGFzc3dvcmQxMjM=')
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .send(update);

            expect(response.statusCode).toBe(200);
            expect(response.body.firstname).toBe(update.firstname);
        });
    });

    describe('Delete Booking', () => {
        let tempBookingId;

        beforeEach(async () => {
            const response = await request(baseUrl)
                .post('/booking')
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .send(validBooking);

            tempBookingId = response.body.bookingid;
        });

        test('Delete booking with valid token', async () => {
            const response = await request(baseUrl)
                .delete(`/booking/${tempBookingId}`)
                .set('Cookie', `token=${authToken}`)
                .set('Content-Type', 'application/json');

            expect(response.statusCode).toBe(201);
        });

        test('Verify booking is deleted', async () => {
            await request(baseUrl)
                .delete(`/booking/${tempBookingId}`)
                .set('Cookie', `token=${authToken}`)
                .set('Content-Type', 'application/json');

            const response = await request(baseUrl)
                .get(`/booking/${tempBookingId}`)
                .set('Accept', 'application/json');

            expect(response.statusCode).toBe(404);
        });

        test('Delete with basic auth instead of token', async () => {
            const response = await request(baseUrl)
                .delete(`/booking/${tempBookingId}`)
                .set('Authorization', 'Basic YWRtaW46cGFzc3dvcmQxMjM=')
                .set('Content-Type', 'application/json');

            expect(response.statusCode).toBe(201);
        });
    });

    describe('Error Scenarios', () => {
        test('Update without authentication', async () => {
            const response = await request(baseUrl)
                .put(`/booking/${bookingId}`)
                .set('Content-Type', 'application/json')
                .send(validBooking);

            expect(response.statusCode).toBe(403);
        });

        test('Update with malformed data', async () => {
            const response = await request(baseUrl)
                .put(`/booking/${bookingId}`)
                .set('Cookie', `token=${authToken}`)
                .set('Content-Type', 'application/json')
                .send({ invalid: 'data' });

            expect([400, 403, 500]).toContain(response.statusCode);
        });

        test('Handle invalid date formats', async () => {
            const invalidBooking = {
                ...validBooking,
                bookingdates: {
                    checkin: "invalid-date",
                    checkout: "invalid-date"
                }
            };

            const response = await request(baseUrl)
                .post('/booking')
                .set('Content-Type', 'application/json')
                .send(invalidBooking);

            expect([400, 500]).toContain(response.statusCode);
        });

        test('Delete non-existent booking', async () => {
            const response = await request(baseUrl)
                .delete('/booking/999999999')
                .set('Cookie', `token=${authToken}`)
                .set('Content-Type', 'application/json');

            expect([404, 405]).toContain(response.statusCode);
        });

        test('Access with expired token', async () => {
            const response = await request(baseUrl)
                .put(`/booking/${bookingId}`)
                .set('Cookie', 'token=expired_token')
                .set('Content-Type', 'application/json')
                .send(validBooking);

            expect(response.statusCode).toBe(403);
        });
    });
});